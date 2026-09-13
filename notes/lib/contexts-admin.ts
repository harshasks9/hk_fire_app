/*
  Contexts (the categories a notebook is split into): create, rename, delete.
  Deleting either moves everything into another context or removes it all.
*/
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { deleteTaskExtras } from './tasks'
import type { Context, ContextKind } from './db/schema'
import { slugify, uid } from './util'

export const CONTEXT_KINDS: ContextKind[] = ['work', 'personal', 'finance', 'family', 'research']

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status })
}

export async function listContexts(notebookId: string): Promise<Context[]> {
  const db = await getDb()
  return db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId)).orderBy(asc(schema.contexts.position))
}

export async function createContext(input: { notebookId: string; name: string; kind?: ContextKind; description?: string }): Promise<Context> {
  const db = await getDb()
  const name = input.name.trim()
  if (name.length < 2) fail('Give the context a name')
  const all = await listContexts(input.notebookId)
  if (all.length >= 24) fail('A notebook can have up to 24 contexts')
  let slug = slugify(name) || 'context'
  if (all.some((c) => c.slug === slug)) slug = `${slug}-${all.length + 1}`
  const id = uid('ctx')
  await db.insert(schema.contexts).values({ id, notebookId: input.notebookId, slug, name, kind: input.kind && CONTEXT_KINDS.includes(input.kind) ? input.kind : 'personal', description: input.description?.trim() || null, position: (all[all.length - 1]?.position ?? -1) + 1 })
  return (await db.select().from(schema.contexts).where(eq(schema.contexts.id, id)))[0]!
}

export async function updateContext(notebookId: string, id: string, patch: { name?: string; description?: string | null; kind?: ContextKind; position?: number }): Promise<Context> {
  const db = await getDb()
  const c = (await db.select().from(schema.contexts).where(and(eq(schema.contexts.id, id), eq(schema.contexts.notebookId, notebookId))))[0]
  if (!c) fail('Not found', 404)
  const set: Partial<typeof schema.contexts.$inferInsert> = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (name.length < 2) fail('Give the context a name')
    set.name = name
  }
  if (patch.description !== undefined) set.description = patch.description?.trim() || null
  if (patch.kind && CONTEXT_KINDS.includes(patch.kind)) set.kind = patch.kind
  if (typeof patch.position === 'number') set.position = patch.position
  if (Object.keys(set).length) await db.update(schema.contexts).set(set).where(eq(schema.contexts.id, id))
  return (await db.select().from(schema.contexts).where(eq(schema.contexts.id, id)))[0]!
}

/** Tables scoped by context_id (everything a context owns). */
const SCOPED = [schema.notes, schema.meetings, schema.entities, schema.entityRelations, schema.tasks, schema.decisions, schema.commitments, schema.facts, schema.changes, schema.researchProjects, schema.timelineEvents, schema.embeddings, schema.insights, schema.weeklyReviews] as const

export interface DeleteContextResult { deleted: string; movedTo: string | null; notes: number }

/**
 * Delete a context. With `moveTo`, its notes, meetings, entities and everything
 * derived move into another context of the same notebook (entities with the same
 * name there are merged). Without it, all of it is removed.
 */
export async function deleteContext(notebookId: string, id: string, opts: { moveTo?: string | null } = {}): Promise<DeleteContextResult> {
  const db = await getDb()
  const all = await listContexts(notebookId)
  const c = all.find((x) => x.id === id)
  if (!c) fail('Not found', 404)
  if (all.length <= 1) fail('A notebook needs at least one context')
  const notesCount = Number((await db.select({ n: sql<number>`count(*)` }).from(schema.notes).where(eq(schema.notes.contextId, id)))[0]?.n ?? 0)
  if (opts.moveTo) {
    const target = all.find((x) => x.id === opts.moveTo && x.id !== id)
    if (!target) fail('Choose another context of this notebook to move into')
    await mergeEntities(id, target.id)
    for (const t of SCOPED) {
      if (t === schema.insights || t === schema.weeklyReviews) {
        await db.delete(t).where(eq((t as unknown as { contextId: typeof schema.notes.contextId }).contextId, id))
        continue
      }
      await db.update(t).set({ contextId: target.id } as never).where(eq((t as unknown as { contextId: typeof schema.notes.contextId }).contextId, id))
    }
    await db.delete(schema.contexts).where(eq(schema.contexts.id, id))
    return { deleted: id, movedTo: target.id, notes: notesCount }
  }
  const noteIds = (await db.select({ id: schema.notes.id }).from(schema.notes).where(eq(schema.notes.contextId, id))).map((r) => r.id)
  await deleteTaskExtras((await db.select({ id: schema.tasks.id }).from(schema.tasks).where(eq(schema.tasks.contextId, id))).map((r) => r.id))
  const meetingIds = (await db.select({ id: schema.meetings.id }).from(schema.meetings).where(eq(schema.meetings.contextId, id))).map((r) => r.id)
  const decisionIds = (await db.select({ id: schema.decisions.id }).from(schema.decisions).where(eq(schema.decisions.contextId, id))).map((r) => r.id)
  if (noteIds.length) {
    await db.delete(schema.attachments).where(inArray(schema.attachments.noteId, noteIds))
    await db.delete(schema.sources).where(inArray(schema.sources.noteId, noteIds))
    await db.delete(schema.noteEntities).where(inArray(schema.noteEntities.noteId, noteIds))
    await db.delete(schema.noteVersions).where(inArray(schema.noteVersions.noteId, noteIds))
    await db.delete(schema.shareLinks).where(inArray(schema.shareLinks.noteId, noteIds))
  }
  if (meetingIds.length) await db.delete(schema.transcripts).where(inArray(schema.transcripts.meetingId, meetingIds))
  if (decisionIds.length) await db.delete(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decisionIds))
  for (const t of SCOPED) await db.delete(t).where(eq((t as unknown as { contextId: typeof schema.notes.contextId }).contextId, id))
  await db.delete(schema.contexts).where(eq(schema.contexts.id, id))
  return { deleted: id, movedTo: null, notes: notesCount }
}

/** Before moving a context's rows: fold entities that already exist in the target (same type + slug) into the target's row. */
async function mergeEntities(fromCtx: string, toCtx: string) {
  const db = await getDb()
  const src = await db.select().from(schema.entities).where(eq(schema.entities.contextId, fromCtx))
  if (!src.length) return
  const dst = await db.select().from(schema.entities).where(eq(schema.entities.contextId, toCtx))
  for (const e of src) {
    const match = dst.find((d) => d.type === e.type && d.slug === e.slug)
    if (!match) continue
    // Re-point every reference, then drop the duplicate.
    await db.update(schema.noteEntities).set({ entityId: match.id }).where(eq(schema.noteEntities.entityId, e.id)).catch(() => undefined)
    await db.delete(schema.noteEntities).where(eq(schema.noteEntities.entityId, e.id))
    await db.update(schema.tasks).set({ entityId: match.id }).where(eq(schema.tasks.entityId, e.id))
    await db.update(schema.tasks).set({ ownerEntityId: match.id }).where(eq(schema.tasks.ownerEntityId, e.id))
    await db.update(schema.facts).set({ entityId: match.id }).where(eq(schema.facts.entityId, e.id))
    await db.update(schema.changes).set({ entityId: match.id }).where(eq(schema.changes.entityId, e.id))
    await db.update(schema.commitments).set({ counterpartyEntityId: match.id }).where(eq(schema.commitments.counterpartyEntityId, e.id))
    await db.update(schema.commitments).set({ companyEntityId: match.id }).where(eq(schema.commitments.companyEntityId, e.id))
    await db.update(schema.decisions).set({ topicEntityId: match.id }).where(eq(schema.decisions.topicEntityId, e.id))
    await db.update(schema.decisions).set({ companyEntityId: match.id }).where(eq(schema.decisions.companyEntityId, e.id))
    await db.update(schema.meetings).set({ companyEntityId: match.id }).where(eq(schema.meetings.companyEntityId, e.id))
    await db.delete(schema.timelineEvents).where(eq(schema.timelineEvents.entityId, e.id))
    await db.delete(schema.entityRelations).where(sql`${schema.entityRelations.fromId} = ${e.id} or ${schema.entityRelations.toId} = ${e.id}`)
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'entity'), eq(schema.embeddings.ownerId, e.id)))
    await db.update(schema.entities).set({ mentionCount: sql`${schema.entities.mentionCount} + ${e.mentionCount}` }).where(eq(schema.entities.id, match.id))
    await db.delete(schema.entities).where(eq(schema.entities.id, e.id))
  }
}
