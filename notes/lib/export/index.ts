/*
  Note and context exports (server only): loads a note with its attachments and
  renders it as Markdown (front matter the importer understands), standalone
  HTML (also the print-to-PDF path), Word, or a zip with the attachments. A
  context export is one zip with every note of the context as Markdown, the
  attachments beside them, and the structured data as JSON.
*/
import JSZip from 'jszip'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { getDb, schema } from '../db'
import type { Attachment, Context, Note } from '../db/schema'
import { docToMarkdown } from '../markdown'
import { docToHtml, noteToHtmlDocument, attachmentIdFromUrl, type HtmlOptions } from './html'
import { noteToDocx, type DocxImage } from './docx'

export type ExportFormat = 'md' | 'html' | 'docx' | 'zip' | 'json'
export const EXPORT_FORMATS: ExportFormat[] = ['md', 'html', 'docx', 'zip', 'json']

export interface ExportNote {
  note: Note
  context: Context | null
  attachments: Attachment[]
  tags: string[]
}

/** A file name that is safe on every platform, keeping the title readable. */
export function safeFilename(title: string, fallback = 'Untitled'): string {
  const s = title.trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').replace(/^\.+/, '').trim().slice(0, 100)
  return s || fallback
}

export function noteTags(n: Pick<Note, 'tags' | 'manualTags'>): string[] {
  return Array.from(new Set([...(n.manualTags ?? []), ...(n.tags ?? [])]))
}

export async function loadExportNote(id: string): Promise<ExportNote | null> {
  const db = await getDb()
  const note = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, id), isNull(schema.notes.deletedAt))))[0]
  if (!note) return null
  const [context, attachments] = await Promise.all([
    db.select().from(schema.contexts).where(eq(schema.contexts.id, note.contextId)).then((r) => r[0] ?? null),
    db.select().from(schema.attachments).where(eq(schema.attachments.noteId, id)).orderBy(asc(schema.attachments.createdAt)),
  ])
  return { note, context, attachments, tags: noteTags(note) }
}

/* ------------------------------------------------------------ helpers */

function attachmentBytes(a: Attachment): Uint8Array | null {
  return a.data ? new Uint8Array(Buffer.from(a.data, 'base64')) : null
}

/** Unique, safe file names for a note's attachments (two "image.png" become image.png and image-2.png). */
export function attachmentFilenames(attachments: Attachment[]): Map<string, string> {
  const used = new Map<string, number>()
  const out = new Map<string, string>()
  for (const a of attachments) {
    const base = safeFilename(a.name, 'file')
    const n = (used.get(base.toLowerCase()) ?? 0) + 1
    used.set(base.toLowerCase(), n)
    if (n === 1) out.set(a.id, base)
    else {
      const dot = base.lastIndexOf('.')
      out.set(a.id, dot > 0 ? `${base.slice(0, dot)}-${n}${base.slice(dot)}` : `${base}-${n}`)
    }
  }
  return out
}

function isInlineImage(a: Attachment): boolean {
  return a.mime.startsWith('image/')
}

/** Attachment ids the document actually embeds as images; the rest are listed as files. */
function embeddedIds(doc: unknown): Set<string> {
  const ids = new Set<string>()
  const walk = (n: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] } | null | undefined) => {
    if (!n) return
    if (n.type === 'image') { const id = attachmentIdFromUrl(String(n.attrs?.src ?? '')); if (id) ids.add(id) }
    for (const c of n.content ?? []) walk(c as never)
  }
  walk(doc as never)
  return ids
}

function frontMatter(e: ExportNote): string {
  const n = e.note
  const lines = [`title: "${n.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`, `created: ${n.createdAt.toISOString()}`, `updated: ${n.updatedAt.toISOString()}`]
  if (e.context) lines.push(`context: ${e.context.slug}`)
  if (n.kind !== 'note') lines.push(`type: ${n.kind}`)
  if (e.tags.length) lines.push(`tags: ${e.tags.join(', ')}`)
  if (n.sourceUrl) lines.push(`source: ${n.sourceUrl}`)
  lines.push(`id: ${n.id}`)
  return `---\n${lines.join('\n')}\n---\n\n`
}

/* ------------------------------------------------------------ formats */

/** Markdown with front matter. Attachment links point at `attachments/<file>` (which the zip export provides). */
export function noteMarkdown(e: ExportNote, opts: { assetDir?: string } = {}): string {
  const names = attachmentFilenames(e.attachments)
  const dir = opts.assetDir ?? 'attachments'
  const body = docToMarkdown(e.note.contentJson).replace(/\/api\/attachments\/([A-Za-z0-9_-]+)/g, (m, id: string) => (names.has(id) ? `${dir}/${encodeURI(names.get(id)!)}` : m))
  const embedded = embeddedIds(e.note.contentJson)
  const files = e.attachments.filter((a) => !embedded.has(a.id))
  const list = files.length ? `\n## Attachments\n\n${files.map((a) => `- [${names.get(a.id)}](${dir}/${encodeURI(names.get(a.id)!)})`).join('\n')}\n` : ''
  return `${frontMatter(e)}# ${e.note.title || 'Untitled'}\n\n${body}${list}`
}

/** Self-contained HTML: images become data URIs so the file opens anywhere. */
export function noteHtml(e: ExportNote, opts: { print?: boolean } = {}): string {
  const byId = new Map(e.attachments.map((a) => [a.id, a]))
  const o: HtmlOptions = {
    resolveAsset: (src) => {
      const id = attachmentIdFromUrl(src)
      const a = id ? byId.get(id) : undefined
      if (!a) return src
      if (a.storageUrl) return a.storageUrl
      return a.data ? `data:${a.mime};base64,${a.data}` : src
    },
  }
  const embedded = embeddedIds(e.note.contentJson)
  const files = e.attachments.filter((a) => !embedded.has(a.id)).map((a) => ({ name: a.name, size: a.size, href: a.storageUrl ?? (a.data ? `data:${a.mime};base64,${a.data}` : '#') }))
  return noteToHtmlDocument({ title: e.note.title, doc: e.note.contentJson, createdAt: e.note.createdAt, updatedAt: e.note.updatedAt, tags: e.tags, context: e.context?.name, attachments: files, print: opts.print }, o)
}

export async function noteDocx(e: ExportNote): Promise<Buffer> {
  const images = new Map<string, DocxImage>()
  for (const a of e.attachments) {
    if (!isInlineImage(a)) continue
    const bytes = attachmentBytes(a)
    if (bytes) images.set(a.id, { bytes, mime: a.mime })
  }
  const embedded = embeddedIds(e.note.contentJson)
  return noteToDocx({ title: e.note.title, doc: e.note.contentJson, createdAt: e.note.createdAt, updatedAt: e.note.updatedAt, tags: e.tags, context: e.context?.name, images, attachments: e.attachments.filter((a) => !embedded.has(a.id)).map((a) => ({ name: a.name, size: a.size })) })
}

/** Writes one note into a zip folder: Markdown plus its attachments. Returns the Markdown file name used. */
function addNoteToZip(zip: JSZip, e: ExportNote, opts: { prefixDate?: boolean; used: Set<string> }): string {
  const names = attachmentFilenames(e.attachments)
  let base = safeFilename(e.note.title)
  if (opts.prefixDate) base = `${e.note.createdAt.toISOString().slice(0, 10)} ${base}`
  let file = `${base}.md`
  for (let i = 2; opts.used.has(file.toLowerCase()); i++) file = `${base} (${i}).md`
  opts.used.add(file.toLowerCase())
  zip.file(file, noteMarkdown(e))
  const dir = zip.folder('attachments')!
  for (const a of e.attachments) {
    const bytes = attachmentBytes(a)
    if (bytes) dir.file(names.get(a.id)!, bytes, { date: a.createdAt })
  }
  return file
}

/** One note as a zip: `<title>.md`, `<title>.html`, `attachments/…` and `note.json`. */
export async function noteZip(e: ExportNote): Promise<Buffer> {
  const zip = new JSZip()
  const used = new Set<string>()
  const md = addNoteToZip(zip, e, { used })
  zip.file(md.replace(/\.md$/, '.html'), noteHtml(e))
  zip.file('note.json', JSON.stringify({ id: e.note.id, title: e.note.title, kind: e.note.kind, context: e.context?.slug, tags: e.tags, createdAt: e.note.createdAt, updatedAt: e.note.updatedAt, sourceUrl: e.note.sourceUrl, summary: e.note.summary, content: e.note.contentJson, markdown: docToMarkdown(e.note.contentJson), html: docToHtml(e.note.contentJson) }, null, 2))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

/* ------------------------------------------------------------ context export */

export interface ContextExportInput { contexts: Context[]; label: string }

/**
 * Every note in the given contexts as `<Context>/<date> <title>.md` with attachments beside them, plus
 * `data.json` with the structured layer (tasks, decisions, people, companies, facts, meetings) and a README.
 */
export async function contextZip(input: ContextExportInput): Promise<Buffer> {
  const db = await getDb()
  const ids = input.contexts.map((c) => c.id)
  if (!ids.length) throw new Error('Nothing to export')
  const zip = new JSZip()
  const notes = await db.select().from(schema.notes).where(and(isNull(schema.notes.deletedAt), inArray(schema.notes.contextId, ids))).orderBy(asc(schema.notes.createdAt))
  const noteIds = notes.map((n) => n.id)
  const attachments = noteIds.length ? await db.select().from(schema.attachments).where(inArray(schema.attachments.noteId, noteIds)).orderBy(asc(schema.attachments.createdAt)) : []
  const byNote = new Map<string, Attachment[]>()
  for (const a of attachments) if (a.noteId) byNote.set(a.noteId, [...(byNote.get(a.noteId) ?? []), a])
  const ctxById = new Map(input.contexts.map((c) => [c.id, c]))
  const folders = new Map<string, JSZip>()
  const used = new Map<string, Set<string>>()
  const usedFolderNames = new Set<string>()
  for (const c of input.contexts) {
    let name = safeFilename(c.name, c.slug)
    for (let i = 2; usedFolderNames.has(name.toLowerCase()); i++) name = `${safeFilename(c.name, c.slug)} (${i})`
    usedFolderNames.add(name.toLowerCase())
    folders.set(c.id, zip.folder(name)!)
    used.set(c.id, new Set())
  }
  for (const n of notes) {
    const folder = folders.get(n.contextId)
    if (!folder) continue
    addNoteToZip(folder, { note: n, context: ctxById.get(n.contextId) ?? null, attachments: byNote.get(n.id) ?? [], tags: noteTags(n) }, { prefixDate: true, used: used.get(n.contextId)! })
  }
  const decisions = await db.select().from(schema.decisions).where(inArray(schema.decisions.contextId, ids))
  const decisionIds = decisions.map((d) => d.id)
  const [entities, tasks, revisions, commitments, facts, changes, meetings, research] = await Promise.all([
    db.select().from(schema.entities).where(inArray(schema.entities.contextId, ids)),
    db.select().from(schema.tasks).where(inArray(schema.tasks.contextId, ids)),
    decisionIds.length ? db.select().from(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decisionIds)) : Promise.resolve([]),
    db.select().from(schema.commitments).where(inArray(schema.commitments.contextId, ids)),
    db.select().from(schema.facts).where(inArray(schema.facts.contextId, ids)),
    db.select().from(schema.changes).where(inArray(schema.changes.contextId, ids)),
    db.select().from(schema.meetings).where(inArray(schema.meetings.contextId, ids)),
    db.select().from(schema.researchProjects).where(inArray(schema.researchProjects.contextId, ids)),
  ])
  const payload = {
    exportedAt: new Date().toISOString(),
    contexts: input.contexts.map((c) => ({ id: c.id, slug: c.slug, name: c.name, kind: c.kind, description: c.description })),
    notes: notes.map((n) => ({ id: n.id, contextId: n.contextId, title: n.title, kind: n.kind, tags: noteTags(n), createdAt: n.createdAt, updatedAt: n.updatedAt, sourceUrl: n.sourceUrl, markdown: docToMarkdown(n.contentJson), summary: n.summary, attachments: (byNote.get(n.id) ?? []).map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })) })),
    entities, tasks, decisions, decisionRevisions: revisions, commitments, facts, changes, meetings, research,
  }
  zip.file('data.json', JSON.stringify(payload, null, 2))
  zip.file('README.txt', [
    `Notes export · ${input.label} · ${new Date().toISOString()}`,
    '',
    'Each folder is a context. Every note is a Markdown file with front matter (title, created, updated, context, tags)',
    'and its attachments sit in the folder\'s attachments/ directory, linked relatively from the note.',
    'data.json holds the structured layer the AI extracted: people, companies, topics, tasks, decisions with their',
    'history, commitments, numbers, changes, meetings and research projects, all pointing back at note ids.',
    '',
    'To bring the notes back: Settings → Import, and drop the .md files (or data.json) in.',
    '',
  ].join('\n'))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
