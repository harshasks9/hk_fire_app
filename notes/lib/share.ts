/* Public read-only links to a note or a task. Tokens are random; the hash is what we look up by. */
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import { randomToken, sha256 } from './crypto'
import { uid } from './util'

export interface ShareLinkItem { id: string; token: string; url: string; expiresAt: string | null; revokedAt: string | null; views: number; createdAt: string; lastViewedAt: string | null; active: boolean }
/** What a link points at. */
export type ShareOwner = { noteId: string; taskId?: undefined } | { taskId: string; noteId?: undefined }

function toItem(l: typeof schema.shareLinks.$inferSelect, origin: string): ShareLinkItem {
  const active = !l.revokedAt && (!l.expiresAt || l.expiresAt.getTime() > Date.now())
  return { id: l.id, token: l.token, url: `${origin}/s/${l.token}`, expiresAt: l.expiresAt?.toISOString() ?? null, revokedAt: l.revokedAt?.toISOString() ?? null, views: l.views, createdAt: l.createdAt.toISOString(), lastViewedAt: l.lastViewedAt?.toISOString() ?? null, active }
}

const ownerWhere = (o: ShareOwner) => (o.taskId ? eq(schema.shareLinks.taskId, o.taskId) : eq(schema.shareLinks.noteId, o.noteId!))

export async function listShareLinks(owner: ShareOwner | string, origin: string): Promise<ShareLinkItem[]> {
  const o: ShareOwner = typeof owner === 'string' ? { noteId: owner } : owner
  const db = await getDb()
  const rows = await db.select().from(schema.shareLinks).where(ownerWhere(o)).orderBy(desc(schema.shareLinks.createdAt))
  return rows.map((l) => toItem(l, origin))
}

/** The newest live link for an owner, if any (what "make public" reuses). */
export async function activeShareLink(owner: ShareOwner, origin: string): Promise<ShareLinkItem | null> {
  return (await listShareLinks(owner, origin)).find((l) => l.active) ?? null
}

export async function createShareLink(input: { noteId?: string; taskId?: string; notebookId: string; userId: string; expiresDays: number | null; origin: string }): Promise<ShareLinkItem> {
  const db = await getDb()
  const token = randomToken(24)
  const id = uid('shr')
  await db.insert(schema.shareLinks).values({ id, notebookId: input.notebookId, noteId: input.noteId ?? null, taskId: input.taskId ?? null, token, tokenHash: sha256(token), createdBy: input.userId, expiresAt: input.expiresDays ? new Date(Date.now() + input.expiresDays * 86400 * 1000) : null })
  const row = (await db.select().from(schema.shareLinks).where(eq(schema.shareLinks.id, id)))[0]!
  return toItem(row, input.origin)
}

export async function revokeShareLink(notebookId: string, id: string) {
  const db = await getDb()
  await db.update(schema.shareLinks).set({ revokedAt: new Date() }).where(and(eq(schema.shareLinks.id, id), eq(schema.shareLinks.notebookId, notebookId), isNull(schema.shareLinks.revokedAt)))
}

export type SharedAttachment = { id: string; name: string; mime: string; size: number; durationSeconds: number | null }
export type Resolved =
  | { kind: 'note'; note: typeof schema.notes.$inferSelect; notebookName: string; ownerName: string | null; link: typeof schema.shareLinks.$inferSelect; attachments: SharedAttachment[] }
  | { kind: 'task'; task: typeof schema.tasks.$inferSelect; notebookName: string; ownerName: string | null; link: typeof schema.shareLinks.$inferSelect; attachments: SharedAttachment[]; entityName: string | null }

/** Resolve a public token to a live note or task; counts the view unless told not to. Null when missing, revoked, expired, sharing disabled or the notebook is off. */
export async function resolveShareToken(token: string, opts: { countView?: boolean } = {}): Promise<Resolved | null> {
  const db = await getDb()
  const link = (await db.select().from(schema.shareLinks).where(eq(schema.shareLinks.tokenHash, sha256(token))))[0]
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt.getTime() < Date.now())) return null
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, link.notebookId)))[0]
  if (!nb || nb.status !== 'active' || nb.settings?.allowShareLinks === false) return null
  const owner = nb.ownerUserId ? (await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, nb.ownerUserId)))[0] : undefined
  const attCols = { id: schema.attachments.id, name: schema.attachments.name, mime: schema.attachments.mime, size: schema.attachments.size, durationSeconds: schema.attachments.durationSeconds }
  const count = async () => { if (opts.countView !== false) await db.update(schema.shareLinks).set({ views: link.views + 1, lastViewedAt: new Date() }).where(eq(schema.shareLinks.id, link.id)) }
  if (link.taskId) {
    const task = (await db.select().from(schema.tasks).where(eq(schema.tasks.id, link.taskId)))[0]
    if (!task) return null
    const attachments = await db.select(attCols).from(schema.attachments).where(eq(schema.attachments.taskId, task.id)).orderBy(schema.attachments.createdAt)
    const ent = task.entityId ? (await db.select({ name: schema.entities.name }).from(schema.entities).where(eq(schema.entities.id, task.entityId)))[0] : undefined
    await count()
    return { kind: 'task', task, notebookName: nb.name, ownerName: owner?.name ?? null, link, attachments, entityName: ent?.name ?? null }
  }
  if (!link.noteId) return null
  const note = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, link.noteId), isNull(schema.notes.deletedAt))))[0]
  if (!note) return null
  const attachments = await db.select(attCols).from(schema.attachments).where(eq(schema.attachments.noteId, note.id)).orderBy(schema.attachments.createdAt)
  await count()
  return { kind: 'note', note, notebookName: nb.name, ownerName: owner?.name ?? null, link, attachments }
}
