/* Read models for every screen. All scoped to a context unless stated. */
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, sql, ilike, ne } from 'drizzle-orm'
import { getDb, schema } from './db'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { allTagsOf, hasTagSql } from './tags'
import type { Commitment, Decision, Entity, EntityType, Fact, Meeting, Note, Task, TimelineEvent, Insight, Change, ResearchProject } from './db/schema'
import { addDays, startOfDay } from './util'
import { cosineDistance } from 'drizzle-orm'
import { embedQueryWith, localEmbeddingProvider } from './ai/embeddings'
import { inNotebook } from './tenant'

/** One context id, or several (the "All" view). */
export type Ctx = string | string[]
/** `contextId = ?` or `contextId in (...)`, whichever the scope needs. */
export function inCtx(col: PgColumn, ids: Ctx) {
  if (typeof ids === 'string') return eq(col, ids)
  if (ids.length === 1) return eq(col, ids[0]!)
  if (ids.length === 0) return sql`false`
  return inArray(col, ids)
}

const live = isNull(schema.notes.deletedAt)

/* --------------------------------------------------------------- notes */

export interface NoteListItem { id: string; contextId: string; title: string; kind: Note['kind']; status: Note['status']; updatedAt: Date; createdAt: Date; favorite: boolean; preview: string; wordCount: number; entities: { id: string; name: string; type: EntityType }[]; source: string; summary: Note['summary']; tags: string[] }

export async function listNotes(contextId: Ctx, opts: { limit?: number; kind?: string; favorite?: boolean; q?: string; researchProjectId?: string; inbox?: boolean; tag?: string } = {}): Promise<NoteListItem[]> {
  const db = await getDb()
  const conds = [inCtx(schema.notes.contextId, contextId), live]
  if (opts.tag) conds.push(hasTagSql(opts.tag))
  if (opts.kind) conds.push(eq(schema.notes.kind, opts.kind as Note['kind']))
  if (opts.favorite) conds.push(eq(schema.notes.favorite, true))
  if (opts.researchProjectId) conds.push(eq(schema.notes.researchProjectId, opts.researchProjectId))
  if (opts.q) conds.push(or(ilike(schema.notes.title, `%${opts.q}%`), ilike(schema.notes.contentText, `%${opts.q}%`))!)
  if (opts.inbox) conds.push(or(ne(schema.notes.source, 'editor'), eq(schema.notes.status, 'inbox'), eq(schema.notes.status, 'processing'))!)
  const rows = await db
    .select()
    .from(schema.notes)
    .where(and(...conds))
    .orderBy(desc(opts.inbox ? schema.notes.createdAt : schema.notes.updatedAt))
    .limit(opts.limit ?? 100)
  return attachEntities(rows)
}

async function attachEntities(rows: Note[]): Promise<NoteListItem[]> {
  const db = await getDb()
  const ids = rows.map((r) => r.id)
  const mentions = ids.length
    ? await db
        .select({ noteId: schema.noteEntities.noteId, id: schema.entities.id, name: schema.entities.name, type: schema.entities.type, m: schema.entities.mentionCount })
        .from(schema.noteEntities)
        .innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId))
        .where(inArray(schema.noteEntities.noteId, ids))
    : []
  const byNote = new Map<string, { id: string; name: string; type: EntityType; m: number }[]>()
  for (const m of mentions) byNote.set(m.noteId, [...(byNote.get(m.noteId) ?? []), m])
  return rows.map((r) => ({
    id: r.id, contextId: r.contextId, title: r.title, kind: r.kind, status: r.status, updatedAt: r.updatedAt, createdAt: r.createdAt, favorite: r.favorite, wordCount: r.wordCount, source: r.source, summary: r.summary, tags: allTagsOf(r),
    preview: (r.summary?.summary[0] ?? r.contentText.replace(/\s+/g, ' ')).slice(0, 180),
    entities: (byNote.get(r.id) ?? []).sort((a, b) => order(a.type) - order(b.type) || b.m - a.m).slice(0, 4).map(({ id, name, type }) => ({ id, name, type })),
  }))
}

function order(t: EntityType) {
  return t === 'company' ? 0 : t === 'person' ? 1 : t === 'project' ? 2 : 3
}

export interface NoteDetail {
  note: Note
  entities: (Entity & { excerpt: string | null })[]
  tasks: Task[]
  decisions: Decision[]
  commitments: Commitment[]
  facts: (Fact & { entityName: string })[]
  changes: Change[]
  related: { id: string; title: string; updatedAt: Date; kind: Note['kind']; reason: string }[]
  meeting: Meeting | null
  attachments: { id: string; name: string; mime: string; size: number; durationSeconds: number | null }[]
  sources: { id: string; kind: string; title: string | null; url: string | null; domain: string | null }[]
  research: ResearchProject | null
}

export async function getNote(id: string): Promise<NoteDetail | null> {
  const db = await getDb()
  const note = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, id), live)))[0]
  if (!note || !(await inNotebook(note.contextId))) return null
  const entities = await db
    .select({ e: schema.entities, excerpt: schema.noteEntities.excerpt })
    .from(schema.noteEntities)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId))
    .where(eq(schema.noteEntities.noteId, id))
  const [tasks, decisions, commitments, facts, changes, attachments, sources] = await Promise.all([
    db.select().from(schema.tasks).where(eq(schema.tasks.sourceNoteId, id)).orderBy(asc(schema.tasks.createdAt)),
    db.select().from(schema.decisions).where(eq(schema.decisions.sourceNoteId, id)),
    db.select().from(schema.commitments).where(eq(schema.commitments.sourceNoteId, id)),
    db.select({ f: schema.facts, entityName: schema.entities.name }).from(schema.facts).innerJoin(schema.entities, eq(schema.entities.id, schema.facts.entityId)).where(eq(schema.facts.sourceNoteId, id)),
    db.select().from(schema.changes).where(eq(schema.changes.sourceNoteId, id)),
    db.select({ id: schema.attachments.id, name: schema.attachments.name, mime: schema.attachments.mime, size: schema.attachments.size, durationSeconds: schema.attachments.durationSeconds }).from(schema.attachments).where(eq(schema.attachments.noteId, id)),
    db.select({ id: schema.sources.id, kind: schema.sources.kind, title: schema.sources.title, url: schema.sources.url, domain: schema.sources.domain }).from(schema.sources).where(eq(schema.sources.noteId, id)),
  ])
  // Decisions revised by this note (not originally made here).
  const revised = await db
    .select({ d: schema.decisions })
    .from(schema.decisionRevisions)
    .innerJoin(schema.decisions, eq(schema.decisions.id, schema.decisionRevisions.decisionId))
    .where(and(eq(schema.decisionRevisions.sourceNoteId, id), ne(schema.decisions.sourceNoteId, id)))
  const allDecisions = [...decisions, ...revised.map((r) => r.d).filter((d) => !decisions.some((x) => x.id === d.id))]
  const meeting = note.meetingId ? ((await db.select().from(schema.meetings).where(eq(schema.meetings.id, note.meetingId)))[0] ?? null) : null
  const research = note.researchProjectId ? ((await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, note.researchProjectId)))[0] ?? null) : null
  const related = await relatedNotes(note, entities.map((e) => e.e.id))
  const titleLower = note.title.toLowerCase()
  const inTitle = (e: Entity) => (titleLower.includes(e.name.toLowerCase()) || e.aliases.some((a) => titleLower.includes(a.toLowerCase())) ? 1 : 0)
  return {
    note,
    entities: entities.map((r) => ({ ...r.e, excerpt: r.excerpt })).sort((a, b) => order(a.type) - order(b.type) || inTitle(b) - inTitle(a) || b.mentionCount - a.mentionCount),
    tasks, decisions: allDecisions, commitments,
    facts: facts.map((r) => ({ ...r.f, entityName: r.entityName })),
    changes, related, meeting, attachments, sources, research,
  }
}

export async function relatedNotes(note: Note, entityIds: string[], limit = 6) {
  const db = await getDb()
  const out = new Map<string, { id: string; title: string; updatedAt: Date; kind: Note['kind']; reason: string; score: number }>()
  if (entityIds.length) {
    const shared = await db
      .select({ noteId: schema.noteEntities.noteId, n: sql<number>`count(*)`, name: sql<string>`min(${schema.entities.name})` })
      .from(schema.noteEntities)
      .innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId))
      .where(and(inArray(schema.noteEntities.entityId, entityIds), ne(schema.noteEntities.noteId, note.id)))
      .groupBy(schema.noteEntities.noteId)
      .orderBy(desc(sql`count(*)`))
      .limit(12)
    const ids = shared.map((s) => s.noteId)
    if (ids.length) {
      const rows = await db.select({ id: schema.notes.id, title: schema.notes.title, updatedAt: schema.notes.updatedAt, kind: schema.notes.kind }).from(schema.notes).where(and(inArray(schema.notes.id, ids), live, eq(schema.notes.contextId, note.contextId)))
      for (const r of rows) {
        const s = shared.find((x) => x.noteId === r.id)!
        out.set(r.id, { ...r, reason: Number(s.n) > 1 ? `${s.n} shared entities` : `Mentions ${s.name}`, score: Number(s.n) })
      }
    }
  }
  // Semantic neighbours
  const mine = (await db.select({ embedding: schema.embeddings.embedding, provider: schema.embeddings.provider }).from(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'note'), eq(schema.embeddings.ownerId, note.id))).limit(1))[0]
  if (mine) {
    const dist = cosineDistance(schema.embeddings.embedding, mine.embedding)
    const sem = await db
      .select({ ownerId: schema.embeddings.ownerId, d: dist })
      .from(schema.embeddings)
      .where(and(eq(schema.embeddings.contextId, note.contextId), eq(schema.embeddings.ownerType, 'note'), eq(schema.embeddings.provider, mine.provider), ne(schema.embeddings.ownerId, note.id)))
      .orderBy(dist)
      .limit(8)
    const ids = [...new Set(sem.map((s) => s.ownerId))]
    if (ids.length) {
      const rows = await db.select({ id: schema.notes.id, title: schema.notes.title, updatedAt: schema.notes.updatedAt, kind: schema.notes.kind }).from(schema.notes).where(and(inArray(schema.notes.id, ids), live))
      for (const r of rows) {
        const d = Number(sem.find((s) => s.ownerId === r.id)?.d ?? 1)
        const score = (1 - d) * 3
        const existing = out.get(r.id)
        if (existing) existing.score += score
        else if (d < 0.75) out.set(r.id, { ...r, reason: 'Similar content', score })
      }
    }
  }
  return [...out.values()].sort((a, b) => b.score - a.score).slice(0, limit)
}

/* ------------------------------------------------------------ meetings */

export interface MeetingListItem extends Meeting { participants: { id: string; name: string }[]; company: { id: string; name: string } | null; noteSummary: string | null }

export async function listMeetings(contextId: Ctx): Promise<{ upcoming: MeetingListItem[]; past: MeetingListItem[] }> {
  const db = await getDb()
  const rows = await db.select().from(schema.meetings).where(inCtx(schema.meetings.contextId, contextId)).orderBy(desc(schema.meetings.startsAt))
  const items = await hydrateMeetings(rows)
  const now = new Date()
  return {
    upcoming: items.filter((m) => m.status !== 'completed' && (m.endsAt ?? m.startsAt) >= addDays(now, -0.5)).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
    past: items.filter((m) => m.status === 'completed' || (m.endsAt ?? m.startsAt) < addDays(now, -0.5)),
  }
}

export async function hydrateMeetings(rows: Meeting[]): Promise<MeetingListItem[]> {
  const db = await getDb()
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const parts = await db
    .select({ meetingId: schema.entityRelations.toId, id: schema.entities.id, name: schema.entities.name })
    .from(schema.entityRelations)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.entityRelations.fromId))
    .where(and(eq(schema.entityRelations.toType, 'meeting'), inArray(schema.entityRelations.toId, ids), eq(schema.entityRelations.relation, 'attended')))
  const companyIds = rows.map((r) => r.companyEntityId).filter((x): x is string => Boolean(x))
  const companies = companyIds.length ? await db.select({ id: schema.entities.id, name: schema.entities.name }).from(schema.entities).where(inArray(schema.entities.id, companyIds)) : []
  return rows.map((m) => ({
    ...m,
    participants: parts.filter((p) => p.meetingId === m.id).map(({ id, name }) => ({ id, name })),
    company: companies.find((c) => c.id === m.companyEntityId) ?? null,
    noteSummary: m.summary?.summary[0] ?? null,
  }))
}

export async function getMeeting(id: string) {
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, id)))[0]
  if (!m || !(await inNotebook(m.contextId))) return null
  const [item] = await hydrateMeetings([m])
  const note = m.noteId ? await getNote(m.noteId) : null
  const transcript = (await db.select().from(schema.transcripts).where(eq(schema.transcripts.meetingId, id)))[0] ?? null
  const history = m.companyEntityId
    ? await hydrateMeetings(await db.select().from(schema.meetings).where(and(eq(schema.meetings.companyEntityId, m.companyEntityId), ne(schema.meetings.id, id), eq(schema.meetings.status, 'completed'))).orderBy(desc(schema.meetings.startsAt)).limit(6))
    : []
  return { meeting: item!, note, transcript, history }
}

/* --------------------------------------------------------------- tasks */

export type TaskView = 'today' | 'week' | 'overdue' | 'waiting' | 'delegated' | 'completed' | 'all'

export interface TaskItem extends Task { entityName: string | null; entityType: EntityType | null; sourceTitle: string | null; hasPublicLink: boolean }

export async function listTasks(contextId: Ctx, view: TaskView = 'all'): Promise<TaskItem[]> {
  const db = await getDb()
  const today = startOfDay()
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)
  const conds = [inCtx(schema.tasks.contextId, contextId)]
  const openStatuses: Task['status'][] = ['open', 'waiting', 'delegated']
  switch (view) {
    case 'today':
      conds.push(inArray(schema.tasks.status, openStatuses), or(and(gte(schema.tasks.dueAt, today), lt(schema.tasks.dueAt, tomorrow)), lt(schema.tasks.dueAt, today), eq(schema.tasks.priority, 'urgent'))!)
      break
    case 'week':
      conds.push(inArray(schema.tasks.status, openStatuses), lte(schema.tasks.dueAt, weekEnd))
      break
    case 'overdue':
      conds.push(inArray(schema.tasks.status, openStatuses), lt(schema.tasks.dueAt, today))
      break
    case 'waiting':
      conds.push(eq(schema.tasks.status, 'waiting'))
      break
    case 'delegated':
      conds.push(eq(schema.tasks.status, 'delegated'))
      break
    case 'completed':
      conds.push(eq(schema.tasks.status, 'done'))
      break
    default:
      conds.push(inArray(schema.tasks.status, openStatuses))
  }
  const rows = await db
    .select({ t: schema.tasks, entityName: schema.entities.name, entityType: schema.entities.type, sourceTitle: schema.notes.title, hasPublicLink: sql<boolean>`exists (select 1 from share_links l where l.task_id = ${schema.tasks.id} and l.revoked_at is null and (l.expires_at is null or l.expires_at > now()))` })
    .from(schema.tasks)
    .leftJoin(schema.entities, eq(schema.entities.id, schema.tasks.entityId))
    .leftJoin(schema.notes, eq(schema.notes.id, schema.tasks.sourceNoteId))
    .where(and(...conds))
    .orderBy(view === 'completed' ? desc(schema.tasks.completedAt) : sql`${schema.tasks.dueAt} asc nulls last`, desc(schema.tasks.priority), desc(schema.tasks.createdAt))
    .limit(300)
  return rows.map((r) => ({ ...r.t, entityName: r.entityName, entityType: r.entityType, sourceTitle: r.sourceTitle, hasPublicLink: Boolean(r.hasPublicLink) }))
}

export async function taskCounts(contextId: Ctx) {
  const db = await getDb()
  const today = startOfDay()
  const open = await db.select({ status: schema.tasks.status, dueAt: schema.tasks.dueAt, priority: schema.tasks.priority }).from(schema.tasks).where(inCtx(schema.tasks.contextId, contextId))
  const isOpen = (s: string) => s === 'open' || s === 'waiting' || s === 'delegated'
  return {
    today: open.filter((t) => isOpen(t.status) && ((t.dueAt && t.dueAt < addDays(today, 1)) || t.priority === 'urgent')).length,
    week: open.filter((t) => isOpen(t.status) && t.dueAt && t.dueAt <= addDays(today, 7)).length,
    overdue: open.filter((t) => isOpen(t.status) && t.dueAt && t.dueAt < today).length,
    waiting: open.filter((t) => t.status === 'waiting').length,
    delegated: open.filter((t) => t.status === 'delegated').length,
    completed: open.filter((t) => t.status === 'done').length,
    all: open.filter((t) => isOpen(t.status)).length,
  }
}

/* --------------------------------------------------------- commitments */

export interface LoopItem extends Commitment { counterpartyName: string | null; companyName: string | null; sourceTitle: string | null; ageDays: number }

export async function listOpenLoops(contextId: Ctx, opts: { limit?: number; includeResolved?: boolean } = {}): Promise<LoopItem[]> {
  const db = await getDb()
  const cp = schema.entities
  const rows = await db
    .select({ c: schema.commitments, counterpartyName: sql<string | null>`(select name from entities where id = ${schema.commitments.counterpartyEntityId})`, companyName: sql<string | null>`(select name from entities where id = ${schema.commitments.companyEntityId})`, sourceTitle: schema.notes.title })
    .from(schema.commitments)
    .leftJoin(schema.notes, eq(schema.notes.id, schema.commitments.sourceNoteId))
    .where(and(inCtx(schema.commitments.contextId, contextId), opts.includeResolved ? sql`true` : eq(schema.commitments.status, 'open')))
    .orderBy(desc(schema.commitments.status), asc(schema.commitments.detectedAt))
    .limit(opts.limit ?? 100)
  void cp
  const now = Date.now()
  return rows.map((r) => ({ ...r.c, counterpartyName: r.counterpartyName, companyName: r.companyName, sourceTitle: r.sourceTitle, ageDays: Math.floor((now - r.c.detectedAt.getTime()) / 86400000) })).sort((a, b) => (a.status === b.status ? rank(b) - rank(a) : a.status === 'open' ? -1 : 1))
}

function rank(l: LoopItem) {
  return (l.kind === 'promised' ? 3 : l.kind === 'waiting' ? 2 : 1) + Math.min(l.ageDays, 30) / 10 + (l.priority === 'high' ? 2 : 0)
}

/* ------------------------------------------------------------ entities */

export interface EntityListItem extends Entity { noteCount: number; openTasks: number; company?: string; lastNoteTitle?: string }

export async function listEntities(contextId: Ctx, type: EntityType): Promise<EntityListItem[]> {
  const db = await getDb()
  const rows = await db.select().from(schema.entities).where(and(inCtx(schema.entities.contextId, contextId), eq(schema.entities.type, type))).orderBy(desc(schema.entities.pinned), desc(schema.entities.lastSeenAt))
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const counts = await db.select({ entityId: schema.noteEntities.entityId, n: sql<number>`count(*)` }).from(schema.noteEntities).where(inArray(schema.noteEntities.entityId, ids)).groupBy(schema.noteEntities.entityId)
  const open = await db.select({ entityId: schema.tasks.entityId, n: sql<number>`count(*)` }).from(schema.tasks).where(and(inArray(schema.tasks.entityId, ids), inArray(schema.tasks.status, ['open', 'waiting', 'delegated']))).groupBy(schema.tasks.entityId)
  return rows
    .map((r) => ({ ...r, noteCount: Number(counts.find((c) => c.entityId === r.id)?.n ?? 0), openTasks: Number(open.find((c) => c.entityId === r.id)?.n ?? 0), company: r.attributes.company }))
    .filter((r) => r.noteCount > 0 || r.pinned || type !== 'topic')
}

export interface EntityDetail {
  entity: Entity
  notes: NoteListItem[]
  timeline: TimelineEvent[]
  tasks: TaskItem[]
  decisions: (Decision & { revisions: number })[]
  loops: LoopItem[]
  facts: (Fact & { sourceTitle: string | null })[]
  changes: Change[]
  people: Entity[]
  companies: Entity[]
  topics: Entity[]
  projects: Entity[]
  meetings: MeetingListItem[]
  insights: Insight[]
}

export async function getEntity(id: string): Promise<EntityDetail | null> {
  const db = await getDb()
  const entity = (await db.select().from(schema.entities).where(eq(schema.entities.id, id)))[0]
  if (!entity || !(await inNotebook(entity.contextId))) return null
  const noteIds = (await db.select({ noteId: schema.noteEntities.noteId }).from(schema.noteEntities).where(eq(schema.noteEntities.entityId, id))).map((r) => r.noteId)
  const noteRows = noteIds.length ? await db.select().from(schema.notes).where(and(inArray(schema.notes.id, noteIds), live)).orderBy(desc(schema.notes.updatedAt)) : []
  const [notes, timeline, taskRows, decisionRows, allLoops, factRows, changes, rels, co] = await Promise.all([
    attachEntities(noteRows),
    db.select().from(schema.timelineEvents).where(eq(schema.timelineEvents.entityId, id)).orderBy(desc(schema.timelineEvents.occurredAt)).limit(60),
    db
      .select({ t: schema.tasks, entityName: schema.entities.name, entityType: schema.entities.type, sourceTitle: schema.notes.title })
      .from(schema.tasks)
      .leftJoin(schema.entities, eq(schema.entities.id, schema.tasks.entityId))
      .leftJoin(schema.notes, eq(schema.notes.id, schema.tasks.sourceNoteId))
      .where(and(or(eq(schema.tasks.entityId, id), eq(schema.tasks.ownerEntityId, id), noteIds.length ? inArray(schema.tasks.sourceNoteId, noteIds) : sql`false`), inArray(schema.tasks.status, ['open', 'waiting', 'delegated'])))
      .orderBy(sql`${schema.tasks.dueAt} asc nulls last`),
    db
      .select({ d: schema.decisions, revisions: sql<number>`(select count(*) from decision_revisions r where r.decision_id = ${schema.decisions.id})` })
      .from(schema.decisions)
      .where(or(eq(schema.decisions.topicEntityId, id), eq(schema.decisions.companyEntityId, id), noteIds.length ? inArray(schema.decisions.sourceNoteId, noteIds) : sql`false`, sql`${schema.decisions.id} in (select to_id from entity_relations where from_type = 'person' and from_id = ${id} and to_type = 'decision')`))
      .orderBy(desc(schema.decisions.decidedAt)),
    listOpenLoops(entity.contextId, { limit: 200 }),
    db.select({ f: schema.facts, sourceTitle: schema.notes.title }).from(schema.facts).leftJoin(schema.notes, eq(schema.notes.id, schema.facts.sourceNoteId)).where(and(eq(schema.facts.entityId, id), isNull(schema.facts.supersededById))).orderBy(desc(schema.facts.observedAt)),
    db.select().from(schema.changes).where(eq(schema.changes.entityId, id)).orderBy(desc(schema.changes.detectedAt)).limit(10),
    db.select().from(schema.entityRelations).where(or(eq(schema.entityRelations.fromId, id), eq(schema.entityRelations.toId, id))),
    noteIds.length
      ? db.select({ entityId: schema.noteEntities.entityId, n: sql<number>`count(*)` }).from(schema.noteEntities).where(and(inArray(schema.noteEntities.noteId, noteIds), ne(schema.noteEntities.entityId, id))).groupBy(schema.noteEntities.entityId).orderBy(desc(sql`count(*)`)).limit(40)
      : Promise.resolve([] as { entityId: string; n: number }[]),
  ])
  const tasks = taskRows.map((r) => ({ ...r.t, entityName: r.entityName, entityType: r.entityType, sourceTitle: r.sourceTitle, hasPublicLink: false }))
  const decisions = decisionRows.map((r) => ({ ...r.d, revisions: Number(r.revisions) }))
  const loops = allLoops.filter((l) => l.companyEntityId === id || l.counterpartyEntityId === id || (l.sourceNoteId && noteIds.includes(l.sourceNoteId)))
  const facts = factRows.map((r) => ({ ...r.f, sourceTitle: r.sourceTitle }))
  const relatedIds = [...new Set(rels.flatMap((r) => [r.fromId, r.toId]).filter((x) => x !== id))]
  const allIds = [...new Set([...relatedIds, ...co.map((c) => c.entityId)])]
  const relatedEntities = allIds.length ? await db.select().from(schema.entities).where(inArray(schema.entities.id, allIds)) : []
  const weight = (e: Entity) => Number(co.find((c) => c.entityId === e.id)?.n ?? 0) + (relatedIds.includes(e.id) ? 5 : 0)
  const sorted = relatedEntities.sort((a, b) => weight(b) - weight(a))
  const people = sorted.filter((e) => e.type === 'person' && (entity.type !== 'company' || e.attributes.company?.toLowerCase() === entity.name.toLowerCase() || relatedIds.includes(e.id) || weight(e) >= 2)).slice(0, 10)
  const companies = sorted.filter((e) => e.type === 'company').slice(0, 8)
  const topics = sorted.filter((e) => e.type === 'topic').slice(0, 10)
  const projects = sorted.filter((e) => e.type === 'project').slice(0, 6)
  const meetingIds = new Set<string>()
  for (const r of rels) if (r.toType === 'meeting') meetingIds.add(r.toId)
  const meetingRows = await db
    .select()
    .from(schema.meetings)
    .where(or(eq(schema.meetings.companyEntityId, id), meetingIds.size ? inArray(schema.meetings.id, [...meetingIds]) : sql`false`, noteIds.length ? inArray(schema.meetings.noteId, noteIds) : sql`false`))
    .orderBy(desc(schema.meetings.startsAt))
    .limit(12)
  const meetings = await hydrateMeetings(meetingRows)
  const insights = await db.select().from(schema.insights).where(and(eq(schema.insights.entityId, id), isNull(schema.insights.dismissedAt))).orderBy(desc(schema.insights.score)).limit(4)
  return { entity, notes, timeline, tasks, decisions, loops, facts, changes, people, companies, topics, projects, meetings, insights }
}

/* ----------------------------------------------------------- decisions */

export interface DecisionListItem extends Decision { topicName: string | null; companyName: string | null; revisions: number; sourceTitle: string | null }

export async function listDecisions(contextId: Ctx): Promise<DecisionListItem[]> {
  const db = await getDb()
  const rows = await db
    .select({ d: schema.decisions, topicName: sql<string | null>`(select name from entities where id = ${schema.decisions.topicEntityId})`, companyName: sql<string | null>`(select name from entities where id = ${schema.decisions.companyEntityId})`, revisions: sql<number>`(select count(*) from decision_revisions r where r.decision_id = ${schema.decisions.id})`, sourceTitle: schema.notes.title })
    .from(schema.decisions)
    .leftJoin(schema.notes, eq(schema.notes.id, schema.decisions.sourceNoteId))
    .where(inCtx(schema.decisions.contextId, contextId))
    .orderBy(desc(schema.decisions.updatedAt))
  return rows.map((r) => ({ ...r.d, topicName: r.topicName, companyName: r.companyName, revisions: Number(r.revisions), sourceTitle: r.sourceTitle }))
}

export async function getDecision(id: string) {
  const db = await getDb()
  const d = (await db.select().from(schema.decisions).where(eq(schema.decisions.id, id)))[0]
  if (!d || !(await inNotebook(d.contextId))) return null
  const revisions = await db
    .select({ r: schema.decisionRevisions, sourceTitle: schema.notes.title })
    .from(schema.decisionRevisions)
    .leftJoin(schema.notes, eq(schema.notes.id, schema.decisionRevisions.sourceNoteId))
    .where(eq(schema.decisionRevisions.decisionId, id))
    .orderBy(asc(schema.decisionRevisions.occurredAt))
  const people = await db
    .select({ e: schema.entities })
    .from(schema.entityRelations)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.entityRelations.fromId))
    .where(and(eq(schema.entityRelations.toType, 'decision'), eq(schema.entityRelations.toId, id)))
  const topic = d.topicEntityId ? (await db.select().from(schema.entities).where(eq(schema.entities.id, d.topicEntityId)))[0] : undefined
  const company = d.companyEntityId ? (await db.select().from(schema.entities).where(eq(schema.entities.id, d.companyEntityId)))[0] : undefined
  const noteIds = [...new Set([d.sourceNoteId, ...revisions.map((r) => r.r.sourceNoteId)].filter((x): x is string => Boolean(x)))]
  const notes = noteIds.length ? await attachEntities(await db.select().from(schema.notes).where(and(inArray(schema.notes.id, noteIds), live))) : []
  // People mentioned in the source notes
  const mentioned = noteIds.length
    ? await db.select({ e: schema.entities }).from(schema.noteEntities).innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId)).where(and(inArray(schema.noteEntities.noteId, noteIds), eq(schema.entities.type, 'person')))
    : []
  const uniq = new Map<string, Entity>()
  for (const p of [...people, ...mentioned]) uniq.set(p.e.id, p.e)
  return { decision: d, revisions: revisions.map((r) => ({ ...r.r, sourceTitle: r.sourceTitle })), people: [...uniq.values()], topic, company, notes }
}

/* ------------------------------------------------------------ research */

export async function listResearch(contextId?: string) {
  const db = await getDb()
  const rows = await db.select().from(schema.researchProjects).where(contextId ? eq(schema.researchProjects.contextId, contextId) : sql`true`).orderBy(desc(schema.researchProjects.updatedAt))
  const counts = await db.select({ id: schema.notes.researchProjectId, n: sql<number>`count(*)` }).from(schema.notes).where(and(sql`${schema.notes.researchProjectId} is not null`, live)).groupBy(schema.notes.researchProjectId)
  return rows.map((r) => ({ ...r, noteCount: Number(counts.find((c) => c.id === r.id)?.n ?? 0) }))
}

export async function getResearch(id: string) {
  const db = await getDb()
  const project = (await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, id)))[0]
  if (!project || !(await inNotebook(project.contextId))) return null
  const notes = await listNotes(project.contextId, { researchProjectId: id, limit: 100 })
  const noteIds = notes.map((n) => n.id)
  const sources = noteIds.length ? await db.select().from(schema.sources).where(inArray(schema.sources.noteId, noteIds)) : []
  const facts = noteIds.length ? await db.select({ f: schema.facts, entityName: schema.entities.name }).from(schema.facts).innerJoin(schema.entities, eq(schema.entities.id, schema.facts.entityId)).where(inArray(schema.facts.sourceNoteId, noteIds)) : []
  const decisions = noteIds.length ? await db.select().from(schema.decisions).where(inArray(schema.decisions.sourceNoteId, noteIds)) : []
  const tasks = noteIds.length ? await db.select().from(schema.tasks).where(and(inArray(schema.tasks.sourceNoteId, noteIds), inArray(schema.tasks.status, ['open', 'waiting', 'delegated']))) : []
  return { project, notes, sources, facts: facts.map((f) => ({ ...f.f, entityName: f.entityName })), decisions, tasks }
}

/* ---------------------------------------------------------------- home */

export async function getHomeData(contextId: Ctx) {
  const db = await getDb()
  const now = new Date()
  const [meetingRows, tasks, loops, changes, insightRows, recentRows, favorites, activeEntities, recentNotesAll] = await Promise.all([
    db.select().from(schema.meetings).where(and(inCtx(schema.meetings.contextId, contextId), gte(schema.meetings.startsAt, addDays(now, -0.2)), lte(schema.meetings.startsAt, addDays(now, 7)), ne(schema.meetings.status, 'completed'))).orderBy(asc(schema.meetings.startsAt)).limit(5),
    listTasks(contextId, 'week'),
    listOpenLoops(contextId, { limit: 40 }),
    db.select().from(schema.changes).where(and(inCtx(schema.changes.contextId, contextId), gte(schema.changes.detectedAt, addDays(now, -14)))).orderBy(desc(schema.changes.detectedAt)).limit(5),
    db.select().from(schema.insights).where(and(inCtx(schema.insights.contextId, contextId), isNull(schema.insights.dismissedAt))).orderBy(desc(schema.insights.score), desc(schema.insights.createdAt)).limit(4),
    db.select().from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live, gte(schema.notes.updatedAt, addDays(now, -14)))).orderBy(desc(schema.notes.updatedAt)).limit(12),
    db.select().from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live, eq(schema.notes.favorite, true))).orderBy(desc(schema.notes.updatedAt)).limit(5),
    db.select().from(schema.entities).where(and(inCtx(schema.entities.contextId, contextId), sql`${schema.entities.lastSeenAt} is not null`)).orderBy(desc(schema.entities.lastSeenAt), desc(schema.entities.mentionCount)).limit(30),
    db.select({ id: schema.notes.id }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live)),
  ])
  const meetings = await hydrateMeetings(meetingRows)
  const recent = (await attachEntities(recentRows)).sort((a, b) => (Number(b.favorite) + (b.summary ? 1 : 0) + b.wordCount / 800) - (Number(a.favorite) + (a.summary ? 1 : 0) + a.wordCount / 800)).slice(0, 5)
  const recentEntities = activeEntities.filter((e) => e.type !== 'topic' || e.mentionCount > 1).slice(0, 8)
  const overdue = tasks.filter((t) => t.dueAt && t.dueAt < startOfDay())
  const dueSoon = tasks.filter((t) => t.dueAt && t.dueAt >= startOfDay())
  return { meetings, tasks, overdue, dueSoon, loops: loops.slice(0, 6), changes, insights: insightRows, recent, favorites, recentEntities, noteCount: recentNotesAll.length }
}

/* ------------------------------------------------------------- sidebar */

export async function sidebarData(contextId: Ctx) {
  const db = await getDb()
  const [favorites, pinned, recents, inboxCount] = await Promise.all([
    db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live, eq(schema.notes.favorite, true))).orderBy(desc(schema.notes.updatedAt)).limit(6),
    db.select({ id: schema.entities.id, name: schema.entities.name, type: schema.entities.type }).from(schema.entities).where(and(inCtx(schema.entities.contextId, contextId), eq(schema.entities.pinned, true))).limit(6),
    db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live)).orderBy(desc(schema.notes.updatedAt)).limit(6),
    db.select({ n: sql<number>`count(*)` }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextId), live, or(eq(schema.notes.status, 'inbox'), eq(schema.notes.status, 'processing'))!)),
  ])
  return { favorites, pinned, recents, inboxCount: Number(inboxCount[0]?.n ?? 0) }
}

/* ------------------------------------------------------------- settings */

export async function settingsData(contextIds: string[], notebookId: string, user: import('./db/schema').User | undefined) {
  const db = await getDb()
  const ids = contextIds.length ? contextIds : ['__none__']
  const [notes, entities, tasks, decisions, commitments, facts, embeddings, calls] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(schema.notes).where(and(live, inArray(schema.notes.contextId, ids))),
    db.select({ n: sql<number>`count(*)` }).from(schema.entities).where(inArray(schema.entities.contextId, ids)),
    db.select({ n: sql<number>`count(*)` }).from(schema.tasks).where(inArray(schema.tasks.contextId, ids)),
    db.select({ n: sql<number>`count(*)` }).from(schema.decisions).where(inArray(schema.decisions.contextId, ids)),
    db.select({ n: sql<number>`count(*)` }).from(schema.commitments).where(inArray(schema.commitments.contextId, ids)),
    db.select({ n: sql<number>`count(*)` }).from(schema.facts).where(inArray(schema.facts.contextId, ids)),
    db.select({ n: sql<number>`count(*)` }).from(schema.embeddings).where(inArray(schema.embeddings.contextId, ids)),
    db.select().from(schema.aiCalls).where(eq(schema.aiCalls.notebookId, notebookId)).orderBy(desc(schema.aiCalls.createdAt)).limit(20),
  ])
  const meta = await db.select().from(schema.appMeta)
  return {
    user,
    counts: { notes: Number(notes[0]?.n), entities: Number(entities[0]?.n), tasks: Number(tasks[0]?.n), decisions: Number(decisions[0]?.n), commitments: Number(commitments[0]?.n), facts: Number(facts[0]?.n), embeddings: Number(embeddings[0]?.n) },
    calls,
    seeded: meta.find((m) => m.key === 'seeded')?.value as { at: string; notes: number } | undefined,
  }
}

export async function searchEntitiesByName(contextId: Ctx, q: string, limit = 8) {
  const db = await getDb()
  return db.select({ id: schema.entities.id, name: schema.entities.name, type: schema.entities.type, attributes: schema.entities.attributes }).from(schema.entities).where(and(inCtx(schema.entities.contextId, contextId), q ? or(ilike(schema.entities.name, `%${q}%`), sql`exists (select 1 from jsonb_array_elements_text(${schema.entities.aliases}) a where a ilike ${'%' + q + '%'})`)! : sql`true`)).orderBy(desc(schema.entities.mentionCount)).limit(limit)
}

/**
 * Embed a query in the same vector space as the stored note embeddings for these
 * contexts (the dominant provider), so similarity is meaningful. Returns null when
 * no comparable vector can be produced; callers then skip semantic matching.
 */
export async function queryVector(contextIds: string[], q: string): Promise<{ vector: number[]; provider: string } | null> {
  const db = await getDb()
  const rows = await db
    .select({ provider: schema.embeddings.provider, n: sql<number>`count(*)` })
    .from(schema.embeddings)
    .where(and(inArray(schema.embeddings.contextId, contextIds), eq(schema.embeddings.ownerType, 'note')))
    .groupBy(schema.embeddings.provider)
    .orderBy(desc(sql`count(*)`))
  const candidates = rows.length ? rows.map((r) => r.provider) : [localEmbeddingProvider.name]
  for (const provider of candidates) {
    const vector = await embedQueryWith(provider, q)
    if (vector) return { vector, provider }
  }
  return null
}
