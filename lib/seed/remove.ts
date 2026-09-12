/*
  Take the sample dataset back out of a notebook without touching anything the
  owner wrote. Sample rows are recognised by the ids the seed assigned (notes,
  meetings, research, decisions) and by what was derived from them; entities
  that end up mentioned nowhere are removed too. The seed marker stays so the
  bootstrap never loads the samples again.
*/
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { NOTES, RESEARCH, UPCOMING } from './data'
import { seedIdMapper } from './run'

export interface RemoveResult { notes: number; meetings: number; entities: number; research: number; decisions: number }

/** How much sample content is still in the notebook. */
export async function sampleCounts(notebookId: string): Promise<RemoveResult> {
  const db = await getDb()
  const mapId = seedIdMapper(notebookId)
  const noteIds = NOTES.map((n) => mapId(n.id))
  const notes = await db.select({ id: schema.notes.id, meetingId: schema.notes.meetingId }).from(schema.notes).where(inArray(schema.notes.id, noteIds))
  const meetings = await db.select({ id: schema.meetings.id }).from(schema.meetings).where(inArray(schema.meetings.id, [...UPCOMING.map((m) => mapId(m.id)), ...notes.map((n) => n.meetingId).filter((x): x is string => Boolean(x))]))
  const research = await db.select({ id: schema.researchProjects.id }).from(schema.researchProjects).where(inArray(schema.researchProjects.id, RESEARCH.map((r) => mapId(r.id))))
  const decisions = noteIds.length ? await db.select({ id: schema.decisions.id }).from(schema.decisions).where(inArray(schema.decisions.sourceNoteId, noteIds)) : []
  return { notes: notes.length, meetings: meetings.length, entities: 0, research: research.length, decisions: decisions.length }
}

export async function removeSampleData(notebookId: string): Promise<RemoveResult> {
  const db = await getDb()
  const mapId = seedIdMapper(notebookId)
  const ctxIds = (await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId))).map((r) => r.id)
  const out: RemoveResult = { notes: 0, meetings: 0, entities: 0, research: 0, decisions: 0 }
  if (!ctxIds.length) return out

  // 1. Sample notes (by seeded id) and the meetings/transcripts that came with them.
  const seedNoteIds = NOTES.map((n) => mapId(n.id))
  const notes = await db.select({ id: schema.notes.id, meetingId: schema.notes.meetingId }).from(schema.notes).where(and(inArray(schema.notes.id, seedNoteIds), inArray(schema.notes.contextId, ctxIds)))
  const noteIds = notes.map((n) => n.id)
  const meetingIds = new Set<string>(notes.map((n) => n.meetingId).filter((x): x is string => Boolean(x)))
  for (const m of UPCOMING) meetingIds.add(mapId(m.id))
  const seededMeetings = meetingIds.size ? await db.select({ id: schema.meetings.id }).from(schema.meetings).where(and(inArray(schema.meetings.id, [...meetingIds]), inArray(schema.meetings.contextId, ctxIds))) : []
  const mIds = seededMeetings.map((m) => m.id)

  // 2. Everything derived from those notes.
  if (noteIds.length) {
    const decs = await db.select({ id: schema.decisions.id }).from(schema.decisions).where(inArray(schema.decisions.sourceNoteId, noteIds))
    const decIds = decs.map((d) => d.id)
    if (decIds.length) {
      await db.delete(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decIds))
      await db.delete(schema.entityRelations).where(and(eq(schema.entityRelations.toType, 'decision'), inArray(schema.entityRelations.toId, decIds)))
      const r = await db.delete(schema.decisions).where(and(inArray(schema.decisions.id, decIds), inArray(schema.decisions.contextId, ctxIds))).returning({ id: schema.decisions.id })
      out.decisions = r.length
    }
    await db.delete(schema.decisionRevisions).where(inArray(schema.decisionRevisions.sourceNoteId, noteIds))
    await db.delete(schema.tasks).where(inArray(schema.tasks.sourceNoteId, noteIds))
    await db.delete(schema.commitments).where(inArray(schema.commitments.sourceNoteId, noteIds))
    const facts = await db.select({ id: schema.facts.id }).from(schema.facts).where(inArray(schema.facts.sourceNoteId, noteIds))
    if (facts.length) {
      const fIds = facts.map((f) => f.id)
      await db.update(schema.facts).set({ supersededById: null }).where(inArray(schema.facts.supersededById, fIds))
      await db.delete(schema.facts).where(inArray(schema.facts.id, fIds))
    }
    await db.delete(schema.changes).where(inArray(schema.changes.sourceNoteId, noteIds))
    await db.delete(schema.timelineEvents).where(inArray(schema.timelineEvents.noteId, noteIds))
    await db.delete(schema.entityRelations).where(inArray(schema.entityRelations.sourceNoteId, noteIds))
    await db.delete(schema.noteEntities).where(inArray(schema.noteEntities.noteId, noteIds))
    await db.delete(schema.attachments).where(inArray(schema.attachments.noteId, noteIds))
    await db.delete(schema.sources).where(inArray(schema.sources.noteId, noteIds))
    await db.delete(schema.noteVersions).where(inArray(schema.noteVersions.noteId, noteIds))
    await db.delete(schema.shareLinks).where(inArray(schema.shareLinks.noteId, noteIds))
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'note'), inArray(schema.embeddings.ownerId, noteIds)))
    const r = await db.delete(schema.notes).where(inArray(schema.notes.id, noteIds)).returning({ id: schema.notes.id })
    out.notes = r.length
  }
  if (mIds.length) {
    await db.delete(schema.transcripts).where(inArray(schema.transcripts.meetingId, mIds))
    await db.delete(schema.timelineEvents).where(inArray(schema.timelineEvents.meetingId, mIds))
    await db.delete(schema.entityRelations).where(and(eq(schema.entityRelations.toType, 'meeting'), inArray(schema.entityRelations.toId, mIds)))
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'meeting'), inArray(schema.embeddings.ownerId, mIds)))
    // Notes the owner attached to a sample meeting keep existing; they just lose the link.
    await db.update(schema.notes).set({ meetingId: null }).where(inArray(schema.notes.meetingId, mIds))
    const r = await db.delete(schema.meetings).where(inArray(schema.meetings.id, mIds)).returning({ id: schema.meetings.id })
    out.meetings = r.length
  }

  // 3. Sample research projects (owner notes filed under them are kept, unfiled).
  const researchIds = RESEARCH.map((r) => mapId(r.id))
  await db.update(schema.notes).set({ researchProjectId: null }).where(inArray(schema.notes.researchProjectId, researchIds))
  await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'research'), inArray(schema.embeddings.ownerId, researchIds)))
  const rr = await db.delete(schema.researchProjects).where(and(inArray(schema.researchProjects.id, researchIds), inArray(schema.researchProjects.contextId, ctxIds))).returning({ id: schema.researchProjects.id })
  out.research = rr.length

  // 4. Entities nothing refers to any more (people/companies/topics only ever come from notes).
  const referenced = new Set<string>()
  for (const r of await db.select({ id: schema.noteEntities.entityId }).from(schema.noteEntities).innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId)).where(inArray(schema.entities.contextId, ctxIds))) referenced.add(r.id)
  for (const r of await db.select({ a: schema.tasks.entityId, b: schema.tasks.ownerEntityId }).from(schema.tasks).where(inArray(schema.tasks.contextId, ctxIds))) { if (r.a) referenced.add(r.a); if (r.b) referenced.add(r.b) }
  for (const r of await db.select({ a: schema.facts.entityId }).from(schema.facts).where(inArray(schema.facts.contextId, ctxIds))) referenced.add(r.a)
  for (const r of await db.select({ a: schema.commitments.counterpartyEntityId, b: schema.commitments.companyEntityId }).from(schema.commitments).where(inArray(schema.commitments.contextId, ctxIds))) { if (r.a) referenced.add(r.a); if (r.b) referenced.add(r.b) }
  for (const r of await db.select({ a: schema.decisions.topicEntityId, b: schema.decisions.companyEntityId }).from(schema.decisions).where(inArray(schema.decisions.contextId, ctxIds))) { if (r.a) referenced.add(r.a); if (r.b) referenced.add(r.b) }
  for (const r of await db.select({ a: schema.meetings.companyEntityId }).from(schema.meetings).where(inArray(schema.meetings.contextId, ctxIds))) if (r.a) referenced.add(r.a)
  const orphanRows = referenced.size
    ? await db.select({ id: schema.entities.id }).from(schema.entities).where(and(inArray(schema.entities.contextId, ctxIds), notInArray(schema.entities.id, [...referenced])))
    : await db.select({ id: schema.entities.id }).from(schema.entities).where(inArray(schema.entities.contextId, ctxIds))
  const orphans = orphanRows.map((r) => r.id)
  if (orphans.length) {
    await db.delete(schema.entityRelations).where(sql`${schema.entityRelations.fromId} in ${orphans} or ${schema.entityRelations.toId} in ${orphans}`)
    await db.delete(schema.timelineEvents).where(inArray(schema.timelineEvents.entityId, orphans))
    await db.delete(schema.changes).where(inArray(schema.changes.entityId, orphans))
    await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'entity'), inArray(schema.embeddings.ownerId, orphans)))
    const r = await db.delete(schema.entities).where(inArray(schema.entities.id, orphans)).returning({ id: schema.entities.id })
    out.entities = r.length
  }

  // 5. Observations were computed over the samples; they rebuild from real notes.
  await db.delete(schema.insights).where(inArray(schema.insights.contextId, ctxIds))
  await db.delete(schema.weeklyReviews).where(inArray(schema.weeklyReviews.contextId, ctxIds))

  // 6. Remember that the owner chose real data over samples.
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  if (nb) await db.update(schema.notebooks).set({ settings: { ...(nb.settings ?? {}), sampleData: false }, updatedAt: new Date() }).where(eq(schema.notebooks.id, notebookId))
  return out
}
