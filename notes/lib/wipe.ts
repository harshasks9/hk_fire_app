/*
  The master delete. Two shapes:
  - wipeAll: every piece of content in a notebook (notes, meetings, people,
    numbers, decisions, loops, research, insights, attachments…). Contexts,
    members, tokens and templates stay, so the notebook keeps working, empty.
  - wipeRange: the same, restricted to rows created inside a date window
    (from / to, either open-ended). People and companies that end up mentioned
    nowhere are removed with them.
  Both are irreversible; the routes demand the password and a typed DELETE.
*/
import { and, eq, gte, inArray, lte, sql, count, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { getDb, schema } from './db'
import { deleteTaskExtras } from './tasks'
import { wipeNotebookData } from './seed/run'
import { removeOrphanEntities } from './seed/remove'
import { purgeNote } from './trash'

export interface WipeCounts { notes: number; meetings: number; entities: number; tasks: number; decisions: number; loops: number; facts: number; research: number; attachments: number }
export interface WipeRange { since?: Date | null; until?: Date | null }

async function contextIds(notebookId: string): Promise<string[]> {
  const db = await getDb()
  return (await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId))).map((r) => r.id)
}

function within(col: PgColumn, range: WipeRange): SQL | undefined {
  const parts: SQL[] = []
  if (range.since) parts.push(gte(col, range.since))
  if (range.until) parts.push(lte(col, range.until))
  return parts.length ? and(...parts) : undefined
}

/** What a wipe would remove, for the confirmation screen. */
export async function wipeCounts(notebookId: string, range: WipeRange = {}): Promise<WipeCounts> {
  const db = await getDb()
  const ids = await contextIds(notebookId)
  if (!ids.length) return { notes: 0, meetings: 0, entities: 0, tasks: 0, decisions: 0, loops: 0, facts: 0, research: 0, attachments: 0 }
  const n = async (t: PgTable, ctx: PgColumn, col: PgColumn) => Number((await db.select({ n: count() }).from(t).where(and(inArray(ctx, ids), within(col, range))))[0]?.n ?? 0)
  const noteIds = (await db.select({ id: schema.notes.id }).from(schema.notes).where(and(inArray(schema.notes.contextId, ids), within(schema.notes.createdAt, range)))).map((r) => r.id)
  const attachments = noteIds.length ? Number((await db.select({ n: count() }).from(schema.attachments).where(inArray(schema.attachments.noteId, noteIds)))[0]?.n ?? 0) : 0
  return {
    notes: noteIds.length,
    meetings: await n(schema.meetings, schema.meetings.contextId, schema.meetings.createdAt),
    entities: await orphanCandidates(ids, range),
    tasks: await n(schema.tasks, schema.tasks.contextId, schema.tasks.createdAt),
    decisions: await n(schema.decisions, schema.decisions.contextId, schema.decisions.createdAt),
    loops: await n(schema.commitments, schema.commitments.contextId, schema.commitments.detectedAt),
    facts: await n(schema.facts, schema.facts.contextId, schema.facts.createdAt),
    research: await n(schema.researchProjects, schema.researchProjects.contextId, schema.researchProjects.createdAt),
    attachments,
  }
}


/** People, companies and topics that would end up mentioned nowhere once the notes in the window are gone. */
async function orphanCandidates(ids: string[], range: WipeRange): Promise<number> {
  const db = await getDb()
  if (!range.since && !range.until) return Number((await db.select({ n: count() }).from(schema.entities).where(inArray(schema.entities.contextId, ids)))[0]?.n ?? 0)
  const keep = within(schema.notes.createdAt, range)
  // An entity survives when at least one note outside the window mentions it.
  const survivors = db.select({ id: schema.noteEntities.entityId }).from(schema.noteEntities).innerJoin(schema.notes, eq(schema.notes.id, schema.noteEntities.noteId)).where(and(inArray(schema.notes.contextId, ids), sql`not (${keep})`))
  return Number((await db.select({ n: count() }).from(schema.entities).where(and(inArray(schema.entities.contextId, ids), sql`${schema.entities.id} not in (${survivors})`)))[0]?.n ?? 0)
}

/** Everything in the notebook. Contexts, people (accounts), tokens and templates are kept. */
export async function wipeAll(notebookId: string): Promise<WipeCounts> {
  const counts = await wipeCounts(notebookId)
  await wipeNotebookData(notebookId, { keepContexts: true })
  await clearCaches(notebookId)
  return counts
}

/** Everything created inside the window. Open-ended on either side. */
export async function wipeRange(notebookId: string, range: WipeRange): Promise<WipeCounts> {
  if (!range.since && !range.until) return wipeAll(notebookId)
  const db = await getDb()
  const ids = await contextIds(notebookId)
  const counts = await wipeCounts(notebookId, range)
  if (!ids.length) return counts

  // Notes (with everything derived from them, attachments, versions, links).
  const noteIds = (await db.select({ id: schema.notes.id }).from(schema.notes).where(and(inArray(schema.notes.contextId, ids), within(schema.notes.createdAt, range)))).map((r) => r.id)
  for (const id of noteIds) await purgeNote(id)

  // Meetings and their transcripts.
  const mIds = (await db.select({ id: schema.meetings.id }).from(schema.meetings).where(and(inArray(schema.meetings.contextId, ids), within(schema.meetings.createdAt, range)))).map((r) => r.id)
  if (mIds.length) {
    await db.delete(schema.transcripts).where(inArray(schema.transcripts.meetingId, mIds))
    await db.delete(schema.timelineEvents).where(inArray(schema.timelineEvents.meetingId, mIds))
    await db.delete(schema.entityRelations).where(and(eq(schema.entityRelations.toType, 'meeting'), inArray(schema.entityRelations.toId, mIds)))
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'meeting'), inArray(schema.embeddings.ownerId, mIds)))
    await db.update(schema.notes).set({ meetingId: null }).where(inArray(schema.notes.meetingId, mIds))
    await db.delete(schema.meetings).where(inArray(schema.meetings.id, mIds))
  }

  // Extracted rows created in the window, whatever note they came from.
  const taskIds = (await db.select({ id: schema.tasks.id }).from(schema.tasks).where(and(inArray(schema.tasks.contextId, ids), within(schema.tasks.createdAt, range)))).map((r) => r.id)
  await deleteTaskExtras(taskIds)
  await db.delete(schema.tasks).where(and(inArray(schema.tasks.contextId, ids), within(schema.tasks.createdAt, range)))
  await db.delete(schema.commitments).where(and(inArray(schema.commitments.contextId, ids), within(schema.commitments.detectedAt, range)))
  const decIds = (await db.select({ id: schema.decisions.id }).from(schema.decisions).where(and(inArray(schema.decisions.contextId, ids), within(schema.decisions.createdAt, range)))).map((r) => r.id)
  if (decIds.length) {
    await db.delete(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decIds))
    await db.delete(schema.entityRelations).where(and(eq(schema.entityRelations.toType, 'decision'), inArray(schema.entityRelations.toId, decIds)))
    await db.delete(schema.decisions).where(inArray(schema.decisions.id, decIds))
  }
  const factIds = (await db.select({ id: schema.facts.id }).from(schema.facts).where(and(inArray(schema.facts.contextId, ids), within(schema.facts.createdAt, range)))).map((r) => r.id)
  if (factIds.length) {
    await db.update(schema.facts).set({ supersededById: null }).where(inArray(schema.facts.supersededById, factIds))
    await db.delete(schema.facts).where(inArray(schema.facts.id, factIds))
  }
  await db.delete(schema.changes).where(and(inArray(schema.changes.contextId, ids), within(schema.changes.detectedAt, range)))
  await db.delete(schema.timelineEvents).where(and(inArray(schema.timelineEvents.contextId, ids), within(schema.timelineEvents.createdAt, range)))
  const rIds = (await db.select({ id: schema.researchProjects.id }).from(schema.researchProjects).where(and(inArray(schema.researchProjects.contextId, ids), within(schema.researchProjects.createdAt, range)))).map((r) => r.id)
  if (rIds.length) {
    await db.update(schema.notes).set({ researchProjectId: null }).where(inArray(schema.notes.researchProjectId, rIds))
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'research'), inArray(schema.embeddings.ownerId, rIds)))
    await db.delete(schema.researchProjects).where(inArray(schema.researchProjects.id, rIds))
  }
  // People, companies and topics that nothing mentions any more go with the notes.
  await removeOrphanEntities(ids)
  // Computed views rebuild from what is left.
  await db.delete(schema.insights).where(inArray(schema.insights.contextId, ids))
  await db.delete(schema.weeklyReviews).where(inArray(schema.weeklyReviews.contextId, ids))
  await clearCaches(notebookId)
  return counts
}

/** Remove specific entities and every reference to them. Facts about them go; tasks, loops, decisions and meetings just lose the link. */
export async function deleteEntities(entityIds: string[]): Promise<void> {
  const db = await getDb()
  if (!entityIds.length) return
  await db.delete(schema.noteEntities).where(inArray(schema.noteEntities.entityId, entityIds))
  await db.delete(schema.entityRelations).where(sql`${schema.entityRelations.fromId} in ${entityIds} or ${schema.entityRelations.toId} in ${entityIds}`)
  await db.delete(schema.facts).where(inArray(schema.facts.entityId, entityIds))
  await db.delete(schema.changes).where(inArray(schema.changes.entityId, entityIds))
  await db.delete(schema.timelineEvents).where(inArray(schema.timelineEvents.entityId, entityIds))
  await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'entity'), inArray(schema.embeddings.ownerId, entityIds)))
  await db.update(schema.tasks).set({ entityId: null }).where(inArray(schema.tasks.entityId, entityIds))
  await db.update(schema.tasks).set({ ownerEntityId: null }).where(inArray(schema.tasks.ownerEntityId, entityIds))
  await db.update(schema.commitments).set({ counterpartyEntityId: null }).where(inArray(schema.commitments.counterpartyEntityId, entityIds))
  await db.update(schema.commitments).set({ companyEntityId: null }).where(inArray(schema.commitments.companyEntityId, entityIds))
  await db.update(schema.decisions).set({ topicEntityId: null }).where(inArray(schema.decisions.topicEntityId, entityIds))
  await db.update(schema.decisions).set({ companyEntityId: null }).where(inArray(schema.decisions.companyEntityId, entityIds))
  await db.update(schema.meetings).set({ companyEntityId: null }).where(inArray(schema.meetings.companyEntityId, entityIds))
  await db.update(schema.insights).set({ entityId: null }).where(inArray(schema.insights.entityId, entityIds))
  await db.delete(schema.entities).where(inArray(schema.entities.id, entityIds))
}

/** Cached briefs are computed over the content; drop them so Home does not show ghosts. */
async function clearCaches(notebookId: string) {
  const db = await getDb()
  const ids = await contextIds(notebookId)
  if (ids.length) await db.delete(schema.appMeta).where(inArray(schema.appMeta.key, ids.map((id) => `brief:${id}`)))
}
