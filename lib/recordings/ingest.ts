/*
  Getting a recording or transcript into the system: from the app, from an
  iPhone Shortcut (capture token) or from a script. Creates the meeting and
  its note immediately so the caller has something to open, stores what was
  sent, and hands off to the background job in ./process.
*/
import { and, asc, eq, sql } from 'drizzle-orm'
import { assertQuota } from '../plans'
import { after, NextResponse, type NextRequest } from 'next/server'
import { getSession } from '../session'
import { resolveToken } from '../tokens'
import { getDb, schema } from '../db'
import type { Context } from '../db/schema'
import { createNote } from '../notes'
import { uid } from '../util'
import { parseTranscript, transcriptStats, transcriptToText } from './transcript'
import { processRecording, setStage } from './process'

/** Client-side chunk size for large audio. A multiple of 3 so base64 pieces concatenate cleanly. */
export const CHUNK_SIZE = 3 * 1024 * 1024
/** Inline storage ceiling for a single recording (base64 in Postgres). */
export const MAX_AUDIO_BYTES = 80 * 1024 * 1024
export const AUDIO_MIMES = /^audio\/|^video\/(mp4|quicktime|x-m4a)|^application\/ogg/
export const TRANSCRIPT_EXT = /\.(txt|md|vtt|srt|json|text)$/i

export interface IngestActor { notebookId: string; userId?: string; via: 'session' | 'token' }

/** Who is posting: the app (session cookie) or an automation (capture token). */
export async function actorFromRequest(req: NextRequest): Promise<IngestActor | NextResponse> {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer) {
    const t = await resolveToken(bearer)
    if (!t) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 })
    return { notebookId: t.notebook.id, userId: t.token.userId ?? undefined, via: 'token' }
  }
  const s = await getSession()
  if (!s) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  return { notebookId: s.notebookId, userId: s.userId, via: 'session' }
}

export interface StartInput {
  actor: IngestActor
  /** A context id or slug; omitted/'auto' lets the job decide from the transcript. */
  context?: string | null
  title?: string
  recordedAt?: Date
  participants?: string[]
  notes?: string
  transcript?: { text: string; filename?: string; mime?: string }
  audio?: { name: string; mime: string; bytes: Buffer; durationSeconds?: number }
  /** Reserve an attachment for chunked upload instead of storing bytes now. */
  audioPlaceholder?: { name: string; mime: string; size: number }
}

export interface StartResult { meetingId: string; noteId: string; attachmentId: string | null; contextId: string; auto: boolean }

export async function notebookContexts(notebookId: string): Promise<Context[]> {
  const db = await getDb()
  return db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId)).orderBy(asc(schema.contexts.position))
}

export function chooseContext(all: Context[], wanted?: string | null): { context: Context | null; auto: boolean } {
  const w = (wanted ?? '').trim().toLowerCase()
  if (w && w !== 'auto') {
    const c = all.find((c) => c.id === wanted || c.slug === w)
    if (c) return { context: c, auto: false }
  }
  return { context: all.find((c) => c.slug === 'work') ?? all[0] ?? null, auto: true }
}

export function defaultTitle(when: Date): string {
  return `Recording ${when.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
}

export async function startRecording(input: StartInput): Promise<StartResult> {
  const db = await getDb()
  // Plan quotas: one recording and one note per ingest.
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, input.actor.notebookId)))[0]
  if (nb) {
    await assertQuota(nb, 'recordingsMonth')
    await assertQuota(nb, 'notes')
    if (input.audio) await assertQuota(nb, 'storageMB', input.audio.bytes.length / 1048576)
    if (input.audioPlaceholder) await assertQuota(nb, 'storageMB', input.audioPlaceholder.size / 1048576)
  }
  const all = await notebookContexts(input.actor.notebookId)
  const { context, auto } = chooseContext(all, input.context)
  if (!context) throw Object.assign(new Error('This notebook has no contexts'), { status: 400 })
  const when = input.recordedAt && !Number.isNaN(input.recordedAt.getTime()) ? input.recordedAt : new Date()
  const title = input.title?.trim() || defaultTitle(when)
  const meetingId = uid('mtg')
  const chunked = Boolean(input.audioPlaceholder)
  await db.insert(schema.meetings).values({ id: meetingId, contextId: context.id, title, startsAt: when, status: 'completed', ingestStatus: chunked ? 'uploading' : 'queued', ingestStageAt: new Date(), durationSeconds: input.audio?.durationSeconds })
  const lines = [input.participants?.length ? `Participants: ${input.participants.join(', ')}` : '', input.notes?.trim() ?? '', '_Structuring this recording… the note fills in when the job finishes._']
  const noteId = await createNote({ contextId: context.id, title, markdown: lines.filter(Boolean).join('\n\n'), kind: 'meeting', source: auto && all.length > 1 ? 'recording:auto' : 'recording', meetingId, createdAt: when, status: 'processed' })
  await db.update(schema.notes).set({ status: 'processing' }).where(eq(schema.notes.id, noteId))
  await db.update(schema.meetings).set({ noteId }).where(eq(schema.meetings.id, meetingId))

  let attachmentId: string | null = null
  if (input.audio) {
    if (input.audio.bytes.length > MAX_AUDIO_BYTES) throw Object.assign(new Error(`Recording is larger than ${Math.round(MAX_AUDIO_BYTES / 1048576)} MB`), { status: 413 })
    attachmentId = uid('att')
    await db.insert(schema.attachments).values({ id: attachmentId, noteId, name: input.audio.name, mime: input.audio.mime, size: input.audio.bytes.length, data: input.audio.bytes.toString('base64'), durationSeconds: input.audio.durationSeconds })
    await db.insert(schema.sources).values({ id: uid('src'), noteId, kind: 'audio', title: input.audio.name })
  } else if (input.audioPlaceholder) {
    if (input.audioPlaceholder.size > MAX_AUDIO_BYTES) throw Object.assign(new Error(`Recording is larger than ${Math.round(MAX_AUDIO_BYTES / 1048576)} MB`), { status: 413 })
    attachmentId = uid('att')
    await db.insert(schema.attachments).values({ id: attachmentId, noteId, name: input.audioPlaceholder.name, mime: input.audioPlaceholder.mime, size: 0, data: '' })
    await db.insert(schema.sources).values({ id: uid('src'), noteId, kind: 'audio', title: input.audioPlaceholder.name })
  }
  if (attachmentId) await db.update(schema.meetings).set({ recordingAttachmentId: attachmentId }).where(eq(schema.meetings.id, meetingId))

  if (input.transcript?.text.trim()) {
    const parsed = parseTranscript(input.transcript.text, { filename: input.transcript.filename, mime: input.transcript.mime })
    if (!parsed.segments.length) throw Object.assign(new Error('The transcript is empty'), { status: 400 })
    const stats = transcriptStats(parsed.segments)
    await db.insert(schema.transcripts).values({ id: uid('tr'), meetingId, segments: parsed.segments, text: transcriptToText(parsed.segments), source: input.actor.via === 'token' ? 'api' : 'upload', attachmentId: attachmentId ?? undefined, durationSeconds: stats.durationHint })
    if (stats.durationHint) await db.update(schema.meetings).set({ durationSeconds: stats.durationHint }).where(eq(schema.meetings.id, meetingId))
  } else if (!attachmentId) {
    throw Object.assign(new Error('Send a transcript or an audio recording'), { status: 400 })
  }
  if (!chunked) scheduleRecording(meetingId)
  return { meetingId, noteId, attachmentId, contextId: context.id, auto }
}

/** Append one base64 piece of a chunked upload. Pieces before the last must be a multiple of 3 bytes. */
export async function appendChunk(attachmentId: string, bytes: Buffer, last: boolean): Promise<{ size: number }> {
  if (!last && bytes.length % 3 !== 0) throw Object.assign(new Error('Chunk size must be a multiple of 3 bytes'), { status: 400 })
  const db = await getDb()
  const a = (await db.select({ size: schema.attachments.size }).from(schema.attachments).where(eq(schema.attachments.id, attachmentId)))[0]
  if (!a) throw Object.assign(new Error('Upload not found'), { status: 404 })
  if (a.size + bytes.length > MAX_AUDIO_BYTES) throw Object.assign(new Error('Recording too large'), { status: 413 })
  await db.update(schema.attachments).set({ data: sql`coalesce(${schema.attachments.data}, '') || ${bytes.toString('base64')}`, size: sql`${schema.attachments.size} + ${bytes.length}` }).where(eq(schema.attachments.id, attachmentId))
  return { size: a.size + bytes.length }
}

export async function finishUpload(meetingId: string, opts: { durationSeconds?: number } = {}): Promise<void> {
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0]
  if (!m?.recordingAttachmentId) throw Object.assign(new Error('Nothing was uploaded'), { status: 400 })
  const a = (await db.select({ size: schema.attachments.size }).from(schema.attachments).where(eq(schema.attachments.id, m.recordingAttachmentId)))[0]
  if (!a || a.size === 0) throw Object.assign(new Error('The upload is empty'), { status: 400 })
  if (opts.durationSeconds) await db.update(schema.attachments).set({ durationSeconds: opts.durationSeconds }).where(and(eq(schema.attachments.id, m.recordingAttachmentId), sql`${schema.attachments.durationSeconds} is null`))
  await db.update(schema.meetings).set({ durationSeconds: m.durationSeconds ?? opts.durationSeconds ?? null }).where(eq(schema.meetings.id, meetingId))
  await setStage(meetingId, 'queued')
  scheduleRecording(meetingId)
}

/** Re-run a failed (or stuck) job. Keeps the transcript if one exists. */
export async function retryRecording(meetingId: string): Promise<void> {
  await setStage(meetingId, 'queued')
  scheduleRecording(meetingId)
}

export function scheduleRecording(meetingId: string) {
  try {
    after(async () => {
      await processRecording(meetingId).catch((err) => console.error('[recording]', meetingId, err))
    })
  } catch {
    void processRecording(meetingId).catch(() => undefined)
  }
}

export interface IngestStatusView { meetingId: string; noteId: string | null; title: string; contextId: string; status: string | null; error: string | null; stageAt: string | null; durationSeconds: number | null; hasRecording: boolean }

export async function ingestStatus(meetingId: string): Promise<IngestStatusView | null> {
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0]
  if (!m) return null
  return { meetingId: m.id, noteId: m.noteId, title: m.title, contextId: m.contextId, status: m.ingestStatus, error: m.ingestError, stageAt: m.ingestStageAt?.toISOString() ?? null, durationSeconds: m.durationSeconds, hasRecording: Boolean(m.recordingAttachmentId) }
}
