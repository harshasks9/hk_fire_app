/* Chunked uploads: a file arrives in pieces and is appended to an attachment row (base64 in Postgres). */
import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from './db'

/** Client-side chunk size. A multiple of 3 so base64 pieces concatenate cleanly. */
export const CHUNK_SIZE = 3 * 1024 * 1024

/** Append one piece; pieces before the last must be a multiple of 3 bytes so the base64 joins without padding. */
export async function appendAttachmentChunk(attachmentId: string, bytes: Buffer, last: boolean, opts: { maxBytes: number; label?: string }): Promise<{ size: number }> {
  if (!last && bytes.length % 3 !== 0) throw Object.assign(new Error('Chunk size must be a multiple of 3 bytes'), { status: 400 })
  const db = await getDb()
  const a = (await db.select({ size: schema.attachments.size }).from(schema.attachments).where(eq(schema.attachments.id, attachmentId)))[0]
  if (!a) throw Object.assign(new Error('Upload not found'), { status: 404 })
  if (a.size + bytes.length > opts.maxBytes) throw Object.assign(new Error(`${opts.label ?? 'File'} too large`), { status: 413 })
  await db.update(schema.attachments).set({ data: sql`coalesce(${schema.attachments.data}, '') || ${bytes.toString('base64')}`, size: sql`${schema.attachments.size} + ${bytes.length}` }).where(eq(schema.attachments.id, attachmentId))
  return { size: a.size + bytes.length }
}
