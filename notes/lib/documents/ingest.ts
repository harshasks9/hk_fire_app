/*
  Uploaded documents become notes. The note exists the moment the upload
  starts (so it can be opened and watched), the file is stored against it,
  and a background job extracts the text, writes it into the note and hands
  it to the understanding pipeline like any other capture.

  Stages the UI follows (derived, no extra columns):
    uploading → extracting → filing → done | failed
*/
import { asc, eq } from 'drizzle-orm'
import { after } from 'next/server'
import { getDb, schema } from '../db'
import { createNote, addSource } from '../notes'
import { docToText, markdownToDoc } from '../markdown'
import { uid, wordCount } from '../util'
import { processNote } from '../pipeline'
import { notebookOfContext, notebookOwnerName } from '../tenant'
import { notebookAiScope } from '../ai/notebook-config'
import { runWithAiScope } from '../ai/scope'
import { appendAttachmentChunk } from '../uploads'
import { detectKind, extractDocument, titleFromFilename, MAX_DOCUMENT_BYTES, type Extracted } from './extract'

export { MAX_DOCUMENT_BYTES }
export type DocumentStage = 'uploading' | 'extracting' | 'filing' | 'done' | 'failed'
export interface DocumentStatus { noteId: string; title: string; stage: DocumentStage; error: string | null; words: number; contextId: string; method: string | null }

const PLACEHOLDER = 'Extracting text from'

export interface StartDocumentInput {
  contextId: string
  file: { name: string; mime: string; size: number }
  /** Provide the bytes to store and process now, or omit them to reserve a chunked upload. */
  bytes?: Buffer
  source?: 'upload' | 'api'
  createdAt?: Date
}
export interface StartDocumentResult { noteId: string; attachmentId: string }

function sourceKind(name: string, mime: string): 'pdf' | 'image' | 'file' {
  const k = detectKind(name, mime)
  return k === 'pdf' ? 'pdf' : k === 'image' ? 'image' : 'file'
}

/** Create the note and its attachment. With bytes, extraction starts right away. */
export async function startDocument(input: StartDocumentInput): Promise<StartDocumentResult> {
  if (input.file.size > MAX_DOCUMENT_BYTES) throw Object.assign(new Error(`Files are limited to ${Math.round(MAX_DOCUMENT_BYTES / 1048576)} MB`), { status: 413 })
  const db = await getDb()
  const name = input.file.name || 'document'
  const mime = input.file.mime || 'application/octet-stream'
  const noteId = await createNote({ contextId: input.contextId, title: titleFromFilename(name), markdown: `_${PLACEHOLDER} **${name}**… the note fills in when extraction finishes._`, kind: 'document', source: input.source ?? 'upload', status: 'processed', createdAt: input.createdAt })
  await db.update(schema.notes).set({ status: 'processing' }).where(eq(schema.notes.id, noteId))
  const attachmentId = uid('att')
  await db.insert(schema.attachments).values({ id: attachmentId, noteId, name, mime, size: input.bytes ? input.bytes.length : 0, data: input.bytes ? input.bytes.toString('base64') : '' })
  await addSource(noteId, { kind: sourceKind(name, mime), title: name })
  if (input.bytes) scheduleDocument(noteId)
  return { noteId, attachmentId }
}

export async function appendDocumentChunk(attachmentId: string, bytes: Buffer, last: boolean) {
  return appendAttachmentChunk(attachmentId, bytes, last, { maxBytes: MAX_DOCUMENT_BYTES, label: 'Document' })
}

/** Every chunk has landed: start extraction. */
export async function finishDocumentUpload(noteId: string): Promise<void> {
  const db = await getDb()
  const a = (await db.select({ size: schema.attachments.size }).from(schema.attachments).where(eq(schema.attachments.noteId, noteId)).orderBy(asc(schema.attachments.createdAt)))[0]
  if (!a || a.size === 0) throw Object.assign(new Error('The upload is empty'), { status: 400 })
  scheduleDocument(noteId)
}

export function scheduleDocument(noteId: string) {
  try {
    after(async () => {
      await processDocument(noteId).catch((err) => console.error('[document]', noteId, err))
    })
  } catch {
    void processDocument(noteId).catch(() => undefined)
  }
}

/** Re-run extraction and filing for a document note (after a failure, or to pick up a new AI key). */
export async function retryDocument(noteId: string): Promise<void> {
  const db = await getDb()
  await db.update(schema.notes).set({ status: 'processing', processingError: null }).where(eq(schema.notes.id, noteId))
  scheduleDocument(noteId)
}

/** The whole job for one note: read the file, write the text into the note, run the pipeline. Safe to call again. */
export async function processDocument(noteId: string): Promise<void> {
  const db = await getDb()
  const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!note) return
  const notebookId = await notebookOfContext(note.contextId)
  const ownerName = notebookId ? await notebookOwnerName(notebookId) : undefined
  const scope = notebookId ? await notebookAiScope(notebookId, ownerName) : { mode: 'shared' as const, ownerName }
  await runWithAiScope(scope, async () => {
    try {
      await db.update(schema.notes).set({ status: 'processing', processingError: null }).where(eq(schema.notes.id, noteId))
      const a = (await db.select().from(schema.attachments).where(eq(schema.attachments.noteId, noteId)).orderBy(asc(schema.attachments.createdAt)))[0]
      if (!a?.data) throw new Error('The uploaded file has no data')
      const bytes = Buffer.from(a.data, 'base64')
      const ex = await extractDocument({ name: a.name, mime: a.mime, bytes })
      await writeExtraction(noteId, a.name, ex)
      const src = (await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.noteId, noteId)))[0]
      if (src) await db.update(schema.sources).set({ extractedText: ex.markdown.slice(0, 100_000) || null, title: `${a.name} · ${ex.method}` }).where(eq(schema.sources.id, src.id))
      if (ex.empty) {
        await db.update(schema.notes).set({ status: 'processed', updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
        return
      }
      await processNote(noteId)
    } catch (err) {
      console.error('[document]', noteId, err)
      await db.update(schema.notes).set({ status: 'processed', processingError: String((err as Error).message ?? err).slice(0, 400), updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
    }
  })
}

/** Put the extracted Markdown into the note, unless someone has already started editing it. */
async function writeExtraction(noteId: string, fileName: string, ex: Extracted) {
  const db = await getDb()
  const current = (await db.select({ title: schema.notes.title, contentText: schema.notes.contentText }).from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!current) return
  const untouched = current.contentText.includes(PLACEHOLDER) || !current.contentText.trim()
  if (!untouched) return
  const head: string[] = []
  if (ex.warnings.length) head.push(`:::warning ${ex.warnings.join(' · ')}`)
  const body = ex.empty ? `_No text could be extracted from **${fileName}**. The file is attached below._` : ex.markdown
  const doc = markdownToDoc([...head, body].join('\n\n'))
  const text = docToText(doc)
  const title = ex.title?.trim() || current.title || titleFromFilename(fileName)
  await db.update(schema.notes).set({ title, contentJson: doc, contentText: text, wordCount: wordCount(text), kind: 'document', status: 'inbox', updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
}

export async function documentStatus(noteId: string): Promise<DocumentStatus | null> {
  const db = await getDb()
  const n = (await db.select({ id: schema.notes.id, title: schema.notes.title, status: schema.notes.status, error: schema.notes.processingError, text: schema.notes.contentText, words: schema.notes.wordCount, contextId: schema.notes.contextId }).from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!n) return null
  const a = (await db.select({ size: schema.attachments.size }).from(schema.attachments).where(eq(schema.attachments.noteId, noteId)).orderBy(asc(schema.attachments.createdAt)))[0]
  const src = (await db.select({ title: schema.sources.title }).from(schema.sources).where(eq(schema.sources.noteId, noteId)))[0]
  const method = src?.title?.split(' · ')[1] ?? null
  let stage: DocumentStage
  if (n.error) stage = 'failed'
  else if (a && a.size === 0) stage = 'uploading'
  else if (n.status === 'processing' && n.text.includes(PLACEHOLDER)) stage = 'extracting'
  else if (n.status === 'processing' || n.status === 'inbox') stage = 'filing'
  else stage = 'done'
  return { noteId: n.id, title: n.title, stage, error: n.error, words: n.words, contextId: n.contextId, method }
}
