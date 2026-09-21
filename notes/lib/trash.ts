/* Trash: soft-deleted notes stay 30 days, can be restored, or purged with everything derived from them. */
import { and, eq, inArray, isNotNull, lt } from 'drizzle-orm'
import { getDb, schema } from './db'
import { deleteDerived } from './pipeline'
import { scheduleProcessing } from './notes'
import { deleteLinksOf } from './links'

export const TRASH_DAYS = 30

export async function listTrash(contextIds: string[]) {
  const db = await getDb()
  if (!contextIds.length) return []
  const rows = await db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind, contentText: schema.notes.contentText, deletedAt: schema.notes.deletedAt, wordCount: schema.notes.wordCount, contextId: schema.notes.contextId }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNotNull(schema.notes.deletedAt)))
  return rows.sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0)).map((r) => ({ ...r, deletedAt: r.deletedAt!, purgeAt: new Date(r.deletedAt!.getTime() + TRASH_DAYS * 86400 * 1000), excerpt: r.contentText.slice(0, 200) }))
}

export async function restoreNote(id: string) {
  const db = await getDb()
  await db.update(schema.notes).set({ deletedAt: null, updatedAt: new Date() }).where(eq(schema.notes.id, id))
  scheduleProcessing(id)
}

/** Remove a note and every row derived from it. */
export async function purgeNote(id: string) {
  const db = await getDb()
  await deleteDerived(id)
  await db.delete(schema.attachments).where(eq(schema.attachments.noteId, id))
  await db.delete(schema.sources).where(eq(schema.sources.noteId, id))
  await db.delete(schema.noteVersions).where(eq(schema.noteVersions.noteId, id))
  await db.delete(schema.shareLinks).where(eq(schema.shareLinks.noteId, id))
  await deleteLinksOf([id])
  await db.delete(schema.tasks).where(eq(schema.tasks.sourceNoteId, id))
  await db.delete(schema.commitments).where(eq(schema.commitments.sourceNoteId, id))
  await db.delete(schema.facts).where(eq(schema.facts.sourceNoteId, id))
  await db.delete(schema.changes).where(eq(schema.changes.sourceNoteId, id))
  await db.update(schema.meetings).set({ noteId: null }).where(eq(schema.meetings.noteId, id))
  await db.delete(schema.notes).where(eq(schema.notes.id, id))
}

export async function purgeExpiredTrash(): Promise<number> {
  const db = await getDb()
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86400 * 1000)
  const rows = await db.select({ id: schema.notes.id }).from(schema.notes).where(and(isNotNull(schema.notes.deletedAt), lt(schema.notes.deletedAt, cutoff)))
  for (const r of rows) await purgeNote(r.id)
  return rows.length
}
