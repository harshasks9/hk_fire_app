/* Meeting prep: everything you need before walking in, assembled from the graph. */
import { and, desc, eq, inArray, lt, ne, or, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { getMeeting, hydrateMeetings, listOpenLoops, type LoopItem, type MeetingListItem } from './queries'
import { getProvider } from './ai/provider'
import type { Entity, Task, Change, Decision } from './db/schema'
import { formatDate } from './util'

export interface MeetingPrep {
  meeting: MeetingListItem
  people: Entity[]
  company: Entity | null
  lastMeeting: MeetingListItem | null
  lastSummary: string[]
  theyAsked: LoopItem[]
  iPromised: LoopItem[]
  unresolved: Task[]
  decisions: Decision[]
  changes: Change[]
  questions: string[]
  narrative: string | null
  numbers: { label: string; value: string }[]
}

export async function meetingPrep(meetingId: string): Promise<MeetingPrep | null> {
  const db = await getDb()
  const d = await getMeeting(meetingId)
  if (!d) return null
  const m = d.meeting
  const participantIds = m.participants.map((p) => p.id)
  const people = participantIds.length ? await db.select().from(schema.entities).where(inArray(schema.entities.id, participantIds)) : []
  const company = m.companyEntityId ? ((await db.select().from(schema.entities).where(eq(schema.entities.id, m.companyEntityId)))[0] ?? null) : null
  const scopeIds = [...participantIds, ...(company ? [company.id] : [])]
  const noteIds = scopeIds.length ? (await db.select({ noteId: schema.noteEntities.noteId }).from(schema.noteEntities).where(inArray(schema.noteEntities.entityId, scopeIds))).map((r) => r.noteId) : []
  const lastRows = await db
    .select()
    .from(schema.meetings)
    .where(and(eq(schema.meetings.contextId, m.contextId), ne(schema.meetings.id, m.id), eq(schema.meetings.status, 'completed'), lt(schema.meetings.startsAt, m.startsAt), or(company ? eq(schema.meetings.companyEntityId, company.id) : sql`false`, noteIds.length ? inArray(schema.meetings.noteId, noteIds) : sql`false`)))
    .orderBy(desc(schema.meetings.startsAt))
    .limit(1)
  const lastMeeting = (await hydrateMeetings(lastRows))[0] ?? null
  const loops = (await listOpenLoops(m.contextId, { limit: 200 })).filter((l) => (l.companyEntityId && scopeIds.includes(l.companyEntityId)) || (l.counterpartyEntityId && scopeIds.includes(l.counterpartyEntityId)) || (l.sourceNoteId && noteIds.includes(l.sourceNoteId)))
  const theyAsked = loops.filter((l) => l.kind === 'waiting' || l.kind === 'question')
  const iPromised = loops.filter((l) => l.kind === 'promised' || l.kind === 'follow_up')
  const unresolved = scopeIds.length
    ? await db.select().from(schema.tasks).where(and(inArray(schema.tasks.status, ['open', 'waiting', 'delegated']), or(inArray(schema.tasks.entityId, scopeIds), inArray(schema.tasks.ownerEntityId, scopeIds), noteIds.length ? inArray(schema.tasks.sourceNoteId, noteIds) : sql`false`))).orderBy(sql`${schema.tasks.dueAt} asc nulls last`).limit(10)
    : []
  const decisions = scopeIds.length ? await db.select().from(schema.decisions).where(or(inArray(schema.decisions.companyEntityId, scopeIds), noteIds.length ? inArray(schema.decisions.sourceNoteId, noteIds) : sql`false`)).orderBy(desc(schema.decisions.decidedAt)).limit(5) : []
  const since = lastMeeting?.startsAt ?? new Date(Date.now() - 30 * 86400000)
  const changes = scopeIds.length ? await db.select().from(schema.changes).where(and(inArray(schema.changes.entityId, scopeIds), sql`${schema.changes.detectedAt} >= ${since}`)).orderBy(desc(schema.changes.detectedAt)).limit(5) : []
  const facts = company ? await db.select().from(schema.facts).where(and(eq(schema.facts.entityId, company.id), sql`${schema.facts.supersededById} is null`)).orderBy(desc(schema.facts.observedAt)).limit(6) : []
  const questions: string[] = []
  for (const l of theyAsked.slice(0, 2)) questions.push(`Do we have an answer on: ${l.text.replace(/^Waiting on /i, '').replace(/[.]$/, '')}?`)
  for (const t of unresolved.filter((t) => t.owner !== 'Harsha' && t.owner !== 'Me').slice(0, 2)) questions.push(`Where does ${t.owner} stand on "${t.title}"?`)
  for (const c of changes.slice(0, 1)) questions.push(`What drove the change: ${c.description}?`)
  for (const dcs of decisions.filter((x) => x.status === 'revisited' || x.status === 'proposed').slice(0, 1)) questions.push(`Can we close the open decision on ${dcs.title.toLowerCase()}?`)
  if (!questions.length && lastMeeting) questions.push(`What has moved since ${formatDate(lastMeeting.startsAt)}?`)
  let narrative: string | null = null
  const provider = getProvider()
  if (provider.isLLM) {
    try {
      narrative = await provider.complete(
        `Write a 4-6 sentence pre-meeting brief for Harsha. Meeting: "${m.title}" on ${formatDate(m.startsAt, { weekday: 'long', month: 'long', day: 'numeric' })} with ${people.map((p) => `${p.name}${p.attributes.role ? ` (${p.attributes.role})` : ''}`).join(', ') || 'no listed participants'}${company ? ` at ${company.name}` : ''}.
Last meeting: ${lastMeeting ? `${lastMeeting.title} (${formatDate(lastMeeting.startsAt)}): ${(lastMeeting.summary?.summary ?? []).join(' ')}` : 'none recorded'}.
They are waiting on: ${theyAsked.map((l) => l.text).join('; ') || 'nothing recorded'}.
Harsha promised: ${iPromised.map((l) => l.text).join('; ') || 'nothing recorded'}.
Unresolved actions: ${unresolved.map((t) => `${t.owner}: ${t.title}`).join('; ') || 'none'}.
Changes since last meeting: ${changes.map((c) => c.description).join('; ') || 'none'}.
Decisions: ${decisions.map((x) => `${x.statement} (${x.status})`).join('; ') || 'none'}.
Be factual, direct, second person. No headings.`,
        { purpose: 'meeting-prep', maxTokens: 600 },
      )
    } catch {
      narrative = null
    }
  }
  return { meeting: m, people, company, lastMeeting, lastSummary: lastMeeting?.summary?.summary ?? [], theyAsked, iPromised, unresolved, decisions, changes, questions, narrative, numbers: facts.map((f) => ({ label: f.label, value: f.value })) }
}
