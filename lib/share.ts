/* Public read-only links to a note. Tokens are random; the hash is what we look up by. */
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import { randomToken, sha256 } from './crypto'
import { uid } from './util'

export interface ShareLinkItem { id: string; token: string; url: string; expiresAt: string | null; revokedAt: string | null; views: number; createdAt: string; lastViewedAt: string | null; active: boolean }

function toItem(l: typeof schema.shareLinks.$inferSelect, origin: string): ShareLinkItem {
  const active = !l.revokedAt && (!l.expiresAt || l.expiresAt.getTime() > Date.now())
  return { id: l.id, token: l.token, url: `${origin}/s/${l.token}`, expiresAt: l.expiresAt?.toISOString() ?? null, revokedAt: l.revokedAt?.toISOString() ?? null, views: l.views, createdAt: l.createdAt.toISOString(), lastViewedAt: l.lastViewedAt?.toISOString() ?? null, active }
}

export async function listShareLinks(noteId: string, origin: string): Promise<ShareLinkItem[]> {
  const db = await getDb()
  const rows = await db.select().from(schema.shareLinks).where(eq(schema.shareLinks.noteId, noteId)).orderBy(desc(schema.shareLinks.createdAt))
  return rows.map((l) => toItem(l, origin))
}

export async function createShareLink(input: { noteId: string; notebookId: string; userId: string; expiresDays: number | null; origin: string }): Promise<ShareLinkItem> {
  const db = await getDb()
  const token = randomToken(24)
  const id = uid('shr')
  await db.insert(schema.shareLinks).values({ id, notebookId: input.notebookId, noteId: input.noteId, token, tokenHash: sha256(token), createdBy: input.userId, expiresAt: input.expiresDays ? new Date(Date.now() + input.expiresDays * 86400 * 1000) : null })
  const row = (await db.select().from(schema.shareLinks).where(eq(schema.shareLinks.id, id)))[0]!
  return toItem(row, input.origin)
}

export async function revokeShareLink(notebookId: string, id: string) {
  const db = await getDb()
  await db.update(schema.shareLinks).set({ revokedAt: new Date() }).where(and(eq(schema.shareLinks.id, id), eq(schema.shareLinks.notebookId, notebookId), isNull(schema.shareLinks.revokedAt)))
}

/** Resolve a public token to a live note; counts the view. Null when missing, revoked, expired, sharing disabled or the notebook is off. */
export async function resolveShareToken(token: string) {
  const db = await getDb()
  const link = (await db.select().from(schema.shareLinks).where(eq(schema.shareLinks.tokenHash, sha256(token))))[0]
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt.getTime() < Date.now())) return null
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, link.notebookId)))[0]
  if (!nb || nb.status !== 'active' || nb.settings?.allowShareLinks === false) return null
  const note = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, link.noteId), isNull(schema.notes.deletedAt))))[0]
  if (!note) return null
  await db.update(schema.shareLinks).set({ views: link.views + 1, lastViewedAt: new Date() }).where(eq(schema.shareLinks.id, link.id))
  const owner = nb.ownerUserId ? (await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, nb.ownerUserId)))[0] : undefined
  return { note, notebookName: nb.name, ownerName: owner?.name ?? null, link }
}
