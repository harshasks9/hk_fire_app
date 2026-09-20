/* Version history: snapshots of a note's content, written on processed saves and before restores. */
import { desc, eq, and, lt, sql, inArray } from 'drizzle-orm'
import { getDb, schema } from './db'
import { uid, wordCount } from './util'
import { docToText } from './markdown'
import { deleteDerived } from './pipeline'
import { scheduleProcessing } from './notes'
import type { NoteVersion } from './db/schema'

export const MAX_VERSIONS = 200

/** Before the first processed edit, keep what the note looked like until now. */
export async function ensureOriginalVersion(noteId: string): Promise<void> {
  const db = await getDb()
  const any = (await db.select({ id: schema.noteVersions.id }).from(schema.noteVersions).where(eq(schema.noteVersions.noteId, noteId)).limit(1))[0]
  if (any) return
  const note = (await db.select({ contentText: schema.notes.contentText }).from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!note || !note.contentText.trim()) return
  await snapshotNote(noteId, 'original')
}
const MIN_GAP_MS = 60_000

/** Write a snapshot unless the content is unchanged or the last snapshot is younger than a minute (restores and imports always snapshot). */
export async function snapshotNote(noteId: string, reason: NoteVersion['reason'] = 'save'): Promise<boolean> {
  const db = await getDb()
  const note = (await db.select({ title: schema.notes.title, contentJson: schema.notes.contentJson, contentText: schema.notes.contentText, wordCount: schema.notes.wordCount }).from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!note) return false
  const latest = (await db.select().from(schema.noteVersions).where(eq(schema.noteVersions.noteId, noteId)).orderBy(desc(schema.noteVersions.createdAt)).limit(1))[0]
  if (latest && latest.title === note.title && latest.contentText === note.contentText) return false
  if (reason === 'save' && latest && latest.reason === 'save' && Date.now() - latest.createdAt.getTime() < MIN_GAP_MS) {
    // Coalesce rapid saves into the latest snapshot.
    await db.update(schema.noteVersions).set({ title: note.title, contentJson: note.contentJson, contentText: note.contentText, wordCount: note.wordCount, createdAt: new Date() }).where(eq(schema.noteVersions.id, latest.id))
    return true
  }
  await db.insert(schema.noteVersions).values({ id: uid('ver'), noteId, title: note.title, contentJson: note.contentJson, contentText: note.contentText, wordCount: note.wordCount, reason })
  const n = Number((await db.select({ n: sql<number>`count(*)` }).from(schema.noteVersions).where(eq(schema.noteVersions.noteId, noteId)))[0]?.n ?? 0)
  if (n > MAX_VERSIONS) {
    const cutoff = (await db.select({ createdAt: schema.noteVersions.createdAt }).from(schema.noteVersions).where(eq(schema.noteVersions.noteId, noteId)).orderBy(desc(schema.noteVersions.createdAt)).offset(MAX_VERSIONS).limit(1))[0]
    if (cutoff) await db.delete(schema.noteVersions).where(and(eq(schema.noteVersions.noteId, noteId), lt(schema.noteVersions.createdAt, cutoff.createdAt)))
  }
  return true
}

export interface VersionItem { id: string; title: string; wordCount: number; reason: string; createdAt: string; preview: string; delta: number }

export async function listVersions(noteId: string): Promise<VersionItem[]> {
  const db = await getDb()
  const rows = await db.select({ id: schema.noteVersions.id, title: schema.noteVersions.title, wordCount: schema.noteVersions.wordCount, reason: schema.noteVersions.reason, createdAt: schema.noteVersions.createdAt, contentText: schema.noteVersions.contentText }).from(schema.noteVersions).where(eq(schema.noteVersions.noteId, noteId)).orderBy(desc(schema.noteVersions.createdAt)).limit(MAX_VERSIONS)
  return rows.map((r, i) => ({ id: r.id, title: r.title, wordCount: r.wordCount, reason: r.reason, createdAt: r.createdAt.toISOString(), preview: r.contentText.slice(0, 240), delta: r.wordCount - (rows[i + 1]?.wordCount ?? 0) }))
}

export async function getVersion(noteId: string, versionId: string) {
  const db = await getDb()
  return (await db.select().from(schema.noteVersions).where(and(eq(schema.noteVersions.id, versionId), eq(schema.noteVersions.noteId, noteId))))[0] ?? null
}

/** Put a version's content back into the note (after snapshotting the current state) and reprocess. */
export async function restoreVersion(noteId: string, versionId: string): Promise<boolean> {
  const db = await getDb()
  const v = await getVersion(noteId, versionId)
  if (!v) return false
  await snapshotNote(noteId, 'restore')
  const text = docToText(v.contentJson)
  await db.update(schema.notes).set({ title: v.title, contentJson: v.contentJson, contentText: text, wordCount: wordCount(text), updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
  await deleteDerived(noteId)
  scheduleProcessing(noteId)
  return true
}

export { inArray }
