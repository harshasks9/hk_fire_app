/* Write-side helpers for notes, captures, meetings and attachments. */
import { and, eq, sql } from 'drizzle-orm'
import { after } from 'next/server'
import { getDb, schema } from './db'
import { docToText, markdownToDoc } from './markdown'
import { uid, wordCount } from './util'
import { processNote, deleteDerived } from './pipeline'
import type { NoteKind } from './db/schema'
import { normalizeTags } from './tags'
import { extractNoteLinks, syncNoteLinks } from './links'

export interface CreateNoteInput { contextId: string; title?: string; markdown?: string; contentJson?: unknown; kind?: NoteKind; source?: string; sourceUrl?: string; meetingId?: string; researchProjectId?: string; status?: 'inbox' | 'processed'; createdAt?: Date }

export async function createNote(input: CreateNoteInput): Promise<string> {
  const db = await getDb()
  const id = uid('note')
  let doc = input.contentJson ?? markdownToDoc(input.markdown ?? '')
  // [[Links]] typed or imported by title get their ids now; the link table mirrors the document.
  if (extractNoteLinks(doc).length) doc = (await syncNoteLinks(id, input.contextId, doc)).doc as object
  const text = docToText(doc)
  const now = input.createdAt ?? new Date()
  await db.insert(schema.notes).values({ id, contextId: input.contextId, title: input.title ?? '', kind: input.kind ?? 'note', status: input.status ?? 'processed', contentJson: doc, contentText: text, wordCount: wordCount(text), source: input.source ?? 'editor', sourceUrl: input.sourceUrl, meetingId: input.meetingId, researchProjectId: input.researchProjectId, createdAt: now, updatedAt: now })
  return id
}

export function scheduleProcessing(noteId: string) {
  try {
    after(async () => {
      await processNote(noteId).catch((err) => console.error('[pipeline]', noteId, err))
    })
  } catch {
    // Outside a request scope (scripts): run inline.
    void processNote(noteId).catch(() => undefined)
  }
}

export async function updateNote(id: string, patch: { title?: string; contentJson?: unknown; favorite?: boolean; privacy?: 'normal' | 'private' | 'ai_excluded'; researchProjectId?: string | null; kind?: NoteKind; status?: 'inbox' | 'processed' | 'archived'; manualTags?: string[]; tags?: string[] }, opts: { process?: boolean } = {}) {
  const db = await getDb()
  if (opts.process && patch.contentJson !== undefined) {
    // Version history: the state before the first processed edit is kept as the original.
    const { ensureOriginalVersion } = await import('./versions')
    await ensureOriginalVersion(id).catch(() => undefined)
  }
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.title !== undefined) set.title = patch.title
  if (patch.contentJson !== undefined) {
    let doc = patch.contentJson
    if (extractNoteLinks(doc).length || (await hasLinkRows(id))) {
      const ctx = (await db.select({ contextId: schema.notes.contextId }).from(schema.notes).where(eq(schema.notes.id, id)))[0]
      if (ctx) doc = (await syncNoteLinks(id, ctx.contextId, doc)).doc as object
    }
    const text = docToText(doc)
    set.contentJson = doc
    set.contentText = text
    set.wordCount = wordCount(text)
  }
  if (patch.favorite !== undefined) set.favorite = patch.favorite
  if (patch.privacy !== undefined) set.privacy = patch.privacy
  if (patch.researchProjectId !== undefined) set.researchProjectId = patch.researchProjectId
  if (patch.kind !== undefined) set.kind = patch.kind
  if (patch.status !== undefined) set.status = patch.status
  if (patch.manualTags !== undefined) set.manualTags = normalizeTags(patch.manualTags).slice(0, 30)
  if (patch.tags !== undefined) set.tags = normalizeTags(patch.tags).slice(0, 30)
  await db.update(schema.notes).set(set).where(eq(schema.notes.id, id))
  if (opts.process && patch.contentJson !== undefined) {
    // Version history: a processed save is a natural checkpoint.
    const { snapshotNote } = await import('./versions')
    await snapshotNote(id, 'save').catch(() => undefined)
  }
  if (opts.process) {
    const row = (await db.select({ aiProcessedAt: schema.notes.aiProcessedAt, contentText: schema.notes.contentText }).from(schema.notes).where(eq(schema.notes.id, id)))[0]
    const recent = row?.aiProcessedAt && Date.now() - row.aiProcessedAt.getTime() < 8000
    if (!recent && (row?.contentText.trim().length ?? 0) > 0) {
      await deleteDerived(id)
      scheduleProcessing(id)
    }
  }
}

async function hasLinkRows(noteId: string): Promise<boolean> {
  const db = await getDb()
  return (await db.select({ id: schema.noteLinks.id }).from(schema.noteLinks).where(eq(schema.noteLinks.fromNoteId, noteId)).limit(1)).length > 0
}

export async function softDeleteNote(id: string) {
  const db = await getDb()
  await db.update(schema.notes).set({ deletedAt: new Date() }).where(eq(schema.notes.id, id))
  await deleteDerived(id)
}

/** Store a file against a note (string id) or a task ({ taskId }). */
export async function addAttachment(owner: string | { noteId?: string; taskId?: string }, file: { name: string; mime: string; bytes: Buffer; durationSeconds?: number }): Promise<string> {
  const db = await getDb()
  const id = uid('att')
  const o = typeof owner === 'string' ? { noteId: owner } : owner
  const data = file.bytes.length <= 6 * 1024 * 1024 ? file.bytes.toString('base64') : null
  await db.insert(schema.attachments).values({ id, noteId: o.noteId ?? null, taskId: o.taskId ?? null, name: file.name, mime: file.mime, size: file.bytes.length, data, durationSeconds: file.durationSeconds })
  return id
}

export async function addSource(noteId: string, s: { kind: 'url' | 'file' | 'image' | 'audio' | 'email' | 'screenshot' | 'pdf'; title?: string; url?: string; extractedText?: string }) {
  const db = await getDb()
  let domain: string | undefined
  try {
    domain = s.url ? new URL(s.url).hostname : undefined
  } catch {
    domain = undefined
  }
  await db.insert(schema.sources).values({ id: uid('src'), noteId, kind: s.kind, title: s.title, url: s.url, domain, extractedText: s.extractedText })
}

export async function createMeetingWithNote(input: { contextId: string; title: string; startsAt: Date; endsAt?: Date; location?: string; notesMarkdown?: string; transcript?: { t: number; speaker: string; text: string }[]; participants?: string[]; status?: 'upcoming' | 'live' | 'completed'; meetingId?: string }) {
  const db = await getDb()
  const status = input.status ?? 'completed'
  let meetingId = input.meetingId
  const existing = meetingId ? (await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0] : undefined
  if (existing) {
    await db.update(schema.meetings).set({ status, endsAt: input.endsAt ?? new Date(), title: input.title || existing.title, updatedAt: new Date() }).where(eq(schema.meetings.id, existing.id))
    if (existing.noteId) {
      // Fold the live capture into the meeting's existing note.
      const transcriptText0 = input.transcript?.map((s) => `${s.speaker}: ${s.text}`).join('\n') ?? ''
      const md0 = [input.notesMarkdown?.trim(), transcriptText0 ? `## Transcript\n\n${transcriptText0}` : ''].filter(Boolean).join('\n\n')
      const prev = (await db.select().from(schema.notes).where(eq(schema.notes.id, existing.noteId)))[0]
      const merged = [prev?.contentText ? docToText(prev.contentJson) : '', md0].filter(Boolean).join('\n\n')
      const doc = markdownToDoc(merged)
      const text = docToText(doc)
      await db.update(schema.notes).set({ contentJson: doc, contentText: text, wordCount: wordCount(text), updatedAt: new Date() }).where(eq(schema.notes.id, existing.noteId))
      if (input.transcript?.length) await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId: existing.id, segments: input.transcript, text: transcriptText0, source: 'live' })
      return { meetingId: existing.id, noteId: existing.noteId }
    }
  } else {
    meetingId = uid('mtg')
    await db.insert(schema.meetings).values({ id: meetingId, contextId: input.contextId, title: input.title, startsAt: input.startsAt, endsAt: input.endsAt, status, location: input.location })
  }
  meetingId = meetingId!
  const transcriptText = input.transcript?.map((s) => `${s.speaker}: ${s.text}`).join('\n') ?? ''
  const md = [input.notesMarkdown?.trim(), transcriptText ? `## Transcript\n\n${transcriptText}` : ''].filter(Boolean).join('\n\n')
  const noteId = await createNote({ contextId: input.contextId, title: input.title, markdown: md, kind: 'meeting', source: 'transcript', meetingId, createdAt: input.startsAt })
  await db.update(schema.meetings).set({ noteId }).where(eq(schema.meetings.id, meetingId))
  if (input.transcript?.length) await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId, segments: input.transcript, text: transcriptText, source: 'live' })
  for (const name of input.participants ?? []) {
    const e = (await db.select().from(schema.entities).where(and(eq(schema.entities.contextId, input.contextId), eq(schema.entities.type, 'person'), sql`lower(${schema.entities.name}) = ${name.toLowerCase()}`)))[0]
    if (e) await db.insert(schema.entityRelations).values({ id: uid('rel'), contextId: input.contextId, fromType: 'person', fromId: e.id, toType: 'meeting', toId: meetingId, relation: 'attended' }).onConflictDoNothing()
  }
  return { meetingId, noteId }
}
