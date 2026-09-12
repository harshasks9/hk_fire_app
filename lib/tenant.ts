/*
  Tenancy guards. Every row in the system hangs off a context, and every
  context belongs to a notebook, so "does this session own this row" reduces to
  "is the row's context one of the session's notebook's contexts".
  Query helpers return null / not-found for foreign rows; mutation routes call
  assertOwned* and get a 404 for anything outside the notebook.
*/
import { cache } from 'react'
import { eq, inArray, and } from 'drizzle-orm'
import { getDb, schema } from './db'
import { getSession, AuthError } from './session'

/** Context ids of the session's notebook (empty when signed out). Cached per request. */
export const sessionContextIds = cache(async (): Promise<string[]> => {
  const s = await getSession()
  if (!s) return []
  return contextIdsForNotebook(s.notebookId)
})

export async function contextIdsForNotebook(notebookId: string): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId))
  return rows.map((r) => r.id)
}

/** True when the context is inside the session's notebook. Platform admins acting in a notebook are scoped to it as well. */
export async function inNotebook(contextId: string | null | undefined): Promise<boolean> {
  if (!contextId) return false
  return (await sessionContextIds()).includes(contextId)
}

export async function assertContext(contextId: string | null | undefined): Promise<void> {
  if (!(await inNotebook(contextId))) throw new AuthError('Not found', 404)
}

type Scoped = 'note' | 'meeting' | 'entity' | 'task' | 'decision' | 'commitment' | 'insight' | 'research' | 'fact' | 'attachment' | 'template' | 'shareLink' | 'apiToken'

/** Look up the context a row belongs to, or null when it does not exist. */
export async function contextOf(kind: Scoped, id: string): Promise<string | null> {
  const db = await getDb()
  const pick = async <T extends { contextId: string }>(rows: T[]) => rows[0]?.contextId ?? null
  switch (kind) {
    case 'note': return pick(await db.select({ contextId: schema.notes.contextId }).from(schema.notes).where(eq(schema.notes.id, id)))
    case 'meeting': return pick(await db.select({ contextId: schema.meetings.contextId }).from(schema.meetings).where(eq(schema.meetings.id, id)))
    case 'entity': return pick(await db.select({ contextId: schema.entities.contextId }).from(schema.entities).where(eq(schema.entities.id, id)))
    case 'task': return pick(await db.select({ contextId: schema.tasks.contextId }).from(schema.tasks).where(eq(schema.tasks.id, id)))
    case 'decision': return pick(await db.select({ contextId: schema.decisions.contextId }).from(schema.decisions).where(eq(schema.decisions.id, id)))
    case 'commitment': return pick(await db.select({ contextId: schema.commitments.contextId }).from(schema.commitments).where(eq(schema.commitments.id, id)))
    case 'insight': return pick(await db.select({ contextId: schema.insights.contextId }).from(schema.insights).where(eq(schema.insights.id, id)))
    case 'research': return pick(await db.select({ contextId: schema.researchProjects.contextId }).from(schema.researchProjects).where(eq(schema.researchProjects.id, id)))
    case 'fact': return pick(await db.select({ contextId: schema.facts.contextId }).from(schema.facts).where(eq(schema.facts.id, id)))
    case 'attachment': {
      const r = (await db.select({ contextId: schema.notes.contextId }).from(schema.attachments).innerJoin(schema.notes, eq(schema.notes.id, schema.attachments.noteId)).where(eq(schema.attachments.id, id)))[0]
      return r?.contextId ?? null
    }
    case 'template':
    case 'shareLink':
    case 'apiToken':
      return null
  }
}

/** Throw a 404 unless the row exists inside the session's notebook. */
export async function assertOwned(kind: Scoped, id: string): Promise<void> {
  const ctx = await contextOf(kind, id)
  if (!ctx || !(await inNotebook(ctx))) throw new AuthError('Not found', 404)
}

export async function ownsNotebookRow(kind: 'template' | 'shareLink' | 'apiToken' | 'invite', id: string): Promise<boolean> {
  const s = await getSession()
  if (!s) return false
  const db = await getDb()
  if (kind === 'template') {
    const r = (await db.select({ nb: schema.templates.notebookId }).from(schema.templates).where(eq(schema.templates.id, id)))[0]
    return r?.nb === s.notebookId
  }
  if (kind === 'shareLink') {
    const r = (await db.select({ nb: schema.shareLinks.notebookId }).from(schema.shareLinks).where(eq(schema.shareLinks.id, id)))[0]
    return r?.nb === s.notebookId
  }
  if (kind === 'apiToken') {
    const r = (await db.select({ nb: schema.apiTokens.notebookId }).from(schema.apiTokens).where(eq(schema.apiTokens.id, id)))[0]
    return r?.nb === s.notebookId
  }
  const r = (await db.select({ nb: schema.invites.notebookId }).from(schema.invites).where(eq(schema.invites.id, id)))[0]
  return r?.nb === s.notebookId
}

/** Notebook of a context (used by background work that has no session). */
export async function notebookOfContext(contextId: string): Promise<string | null> {
  const db = await getDb()
  const r = (await db.select({ nb: schema.contexts.notebookId }).from(schema.contexts).where(eq(schema.contexts.id, contextId)))[0]
  return r?.nb ?? null
}

/** The display name the AI should use for "you" in a notebook: its owner's name. */
export async function notebookOwnerName(notebookId: string): Promise<string> {
  const db = await getDb()
  const nb = (await db.select({ owner: schema.notebooks.ownerUserId }).from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  if (nb?.owner) {
    const u = (await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, nb.owner)))[0]
    if (u?.name) return u.name
  }
  const any = (await db.select({ name: schema.users.name }).from(schema.users).where(and(eq(schema.users.notebookId, notebookId))).limit(1))[0]
  return any?.name ?? process.env.USER_NAME ?? 'You'
}

/** Rows of a table restricted to the session's contexts: a reusable where-clause fragment. */
export async function scopedContexts() {
  const ids = await sessionContextIds()
  return ids.length ? ids : ['__none__']
}

export { inArray }
