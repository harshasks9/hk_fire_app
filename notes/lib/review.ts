/*
  Weekly review: what happened in a context during a Monday–Sunday week,
  computed from the graph, plus an optional AI narrative stored per week.
*/
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte } from 'drizzle-orm'
import { getDb, schema } from './db'
import { inCtx } from './queries'
import { getProvider } from './ai/provider'
import { withNotebookAi } from './session'
import { uid, formatDate, startOfDay, addDays } from './util'

export function weekStartOf(d: Date): Date {
  const s = startOfDay(d)
  const day = (s.getDay() + 6) % 7 // Monday = 0
  return addDays(s, -day)
}

export function weekKey(d: Date): string {
  const s = weekStartOf(d)
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
}

export function parseWeekKey(key: string | undefined): Date {
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, m, d] = key.split('-').map(Number)
    return weekStartOf(new Date(y!, m! - 1, d!))
  }
  return weekStartOf(new Date())
}

export interface WeekReview {
  weekStart: string
  label: string
  range: { from: Date; to: Date }
  notes: { id: string; title: string; kind: string; createdAt: Date; wordCount: number }[]
  meetings: { id: string; title: string; startsAt: Date; status: string }[]
  decisions: { id: string; decisionId: string; title: string; statement: string; kind: string; occurredAt: Date }[]
  changes: { id: string; description: string; detectedAt: Date; entityName: string | null }[]
  tasksDone: { id: string; title: string; owner: string; completedAt: Date | null }[]
  tasksAdded: { id: string; title: string; owner: string; status: string }[]
  overdue: { id: string; title: string; owner: string; dueAt: Date | null }[]
  newPeople: { id: string; name: string; type: string }[]
  newCompanies: { id: string; name: string; type: string }[]
  agingLoops: { id: string; text: string; kind: string; createdAt: Date; noteId: string | null }[]
  narrative: { text: string; provider: string | null; updatedAt: Date } | null
}

export async function buildWeekReview(contextIds: string | string[], weekStart: Date, reviewKey?: string): Promise<WeekReview> {
  const contextId = reviewKey ?? (typeof contextIds === 'string' ? contextIds : contextIds[0] ?? '')
  const db = await getDb()
  const from = weekStart
  const to = addDays(weekStart, 7)
  const inWeek = (col: import('drizzle-orm').Column) => and(gte(col, from), lt(col, to))
  const [notes, meetings, revisions, changes, tasksDone, tasksAdded, overdue, entities, loops, narr] = await Promise.all([
    db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind, createdAt: schema.notes.createdAt, wordCount: schema.notes.wordCount }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), inWeek(schema.notes.createdAt))).orderBy(asc(schema.notes.createdAt)),
    db.select({ id: schema.meetings.id, title: schema.meetings.title, startsAt: schema.meetings.startsAt, status: schema.meetings.status }).from(schema.meetings).where(and(inCtx(schema.meetings.contextId, contextIds), inWeek(schema.meetings.startsAt))).orderBy(asc(schema.meetings.startsAt)),
    db.select({ id: schema.decisionRevisions.id, decisionId: schema.decisions.id, title: schema.decisions.title, statement: schema.decisionRevisions.statement, kind: schema.decisionRevisions.kind, occurredAt: schema.decisionRevisions.occurredAt }).from(schema.decisionRevisions).innerJoin(schema.decisions, eq(schema.decisions.id, schema.decisionRevisions.decisionId)).where(and(inCtx(schema.decisions.contextId, contextIds), inWeek(schema.decisionRevisions.occurredAt))).orderBy(asc(schema.decisionRevisions.occurredAt)),
    db.select({ id: schema.changes.id, description: schema.changes.description, detectedAt: schema.changes.detectedAt, entityName: schema.entities.name }).from(schema.changes).leftJoin(schema.entities, eq(schema.entities.id, schema.changes.entityId)).where(and(inCtx(schema.changes.contextId, contextIds), inWeek(schema.changes.detectedAt))).orderBy(asc(schema.changes.detectedAt)),
    db.select({ id: schema.tasks.id, title: schema.tasks.title, owner: schema.tasks.owner, completedAt: schema.tasks.completedAt }).from(schema.tasks).where(and(inCtx(schema.tasks.contextId, contextIds), eq(schema.tasks.status, 'done'), inWeek(schema.tasks.completedAt))),
    db.select({ id: schema.tasks.id, title: schema.tasks.title, owner: schema.tasks.owner, status: schema.tasks.status }).from(schema.tasks).where(and(inCtx(schema.tasks.contextId, contextIds), inWeek(schema.tasks.createdAt))),
    db.select({ id: schema.tasks.id, title: schema.tasks.title, owner: schema.tasks.owner, dueAt: schema.tasks.dueAt }).from(schema.tasks).where(and(inCtx(schema.tasks.contextId, contextIds), inArray(schema.tasks.status, ['open', 'waiting', 'delegated']), lte(schema.tasks.dueAt, new Date(Math.min(Date.now(), to.getTime()))))).orderBy(asc(schema.tasks.dueAt)).limit(30),
    db.select({ id: schema.entities.id, name: schema.entities.name, type: schema.entities.type }).from(schema.entities).where(and(inCtx(schema.entities.contextId, contextIds), inArray(schema.entities.type, ['person', 'company']), inWeek(schema.entities.createdAt))),
    db.select({ id: schema.commitments.id, text: schema.commitments.text, kind: schema.commitments.kind, createdAt: schema.commitments.detectedAt, noteId: schema.commitments.sourceNoteId }).from(schema.commitments).where(and(inCtx(schema.commitments.contextId, contextIds), eq(schema.commitments.status, 'open'), lt(schema.commitments.detectedAt, addDays(to, -7)))).orderBy(asc(schema.commitments.detectedAt)).limit(20),
    db.select().from(schema.weeklyReviews).where(and(eq(schema.weeklyReviews.contextId, contextId), eq(schema.weeklyReviews.weekStart, weekKey(weekStart)))),
  ])
  const n = narr[0]
  return {
    weekStart: weekKey(weekStart),
    label: `${formatDate(from, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(to, -1), { month: 'short', day: 'numeric', year: 'numeric' })}`,
    range: { from, to },
    notes, meetings, decisions: revisions, changes, tasksDone, tasksAdded, overdue,
    newPeople: entities.filter((e) => e.type === 'person'),
    newCompanies: entities.filter((e) => e.type === 'company'),
    agingLoops: loops,
    narrative: n?.narrative ? { text: n.narrative, provider: n.provider, updatedAt: n.updatedAt } : null,
  }
}

export function reviewFacts(r: WeekReview): string[] {
  const f: string[] = []
  f.push(`${r.notes.length} notes captured (${r.notes.reduce((a, n) => a + n.wordCount, 0)} words).`)
  if (r.meetings.length) f.push(`Meetings: ${r.meetings.map((m) => m.title).join('; ')}.`)
  if (r.decisions.length) f.push(`Decisions: ${r.decisions.map((d) => `${d.kind}: ${d.statement}`).join('; ')}.`)
  if (r.changes.length) f.push(`Numbers that changed: ${r.changes.map((c) => c.description).join('; ')}.`)
  if (r.tasksDone.length) f.push(`Completed: ${r.tasksDone.map((t) => t.title).join('; ')}.`)
  if (r.tasksAdded.length) f.push(`${r.tasksAdded.length} new actions were added.`)
  if (r.overdue.length) f.push(`Still overdue: ${r.overdue.slice(0, 6).map((t) => `${t.title} (${t.owner})`).join('; ')}.`)
  if (r.newPeople.length) f.push(`New people: ${r.newPeople.map((p) => p.name).join(', ')}.`)
  if (r.newCompanies.length) f.push(`New companies: ${r.newCompanies.map((p) => p.name).join(', ')}.`)
  if (r.agingLoops.length) f.push(`Open loops older than a week: ${r.agingLoops.slice(0, 6).map((l) => l.text).join('; ')}.`)
  return f
}

/** Local narrative when no model is available: a plain, factual paragraph. */
export function localNarrative(r: WeekReview, userName: string): string {
  const parts: string[] = []
  parts.push(`${userName}, the week of ${r.label.split(' – ')[0]} produced ${r.notes.length} ${r.notes.length === 1 ? 'note' : 'notes'}${r.meetings.length ? ` across ${r.meetings.length} ${r.meetings.length === 1 ? 'meeting' : 'meetings'}` : ''}.`)
  if (r.decisions.length) parts.push(`${r.decisions.length === 1 ? 'One decision moved' : `${r.decisions.length} decisions moved`}: ${r.decisions.slice(0, 2).map((d) => d.statement).join('; ')}.`)
  if (r.changes.length) parts.push(`Numbers shifted: ${r.changes.slice(0, 2).map((c) => c.description).join('; ')}.`)
  if (r.tasksDone.length || r.tasksAdded.length) parts.push(`You closed ${r.tasksDone.length} ${r.tasksDone.length === 1 ? 'action' : 'actions'} and added ${r.tasksAdded.length}.`)
  if (r.overdue.length) parts.push(`${r.overdue.length} ${r.overdue.length === 1 ? 'action is' : 'actions are'} overdue, starting with "${r.overdue[0]!.title}".`)
  if (r.agingLoops.length) parts.push(`${r.agingLoops.length} open ${r.agingLoops.length === 1 ? 'loop has' : 'loops have'} waited more than a week.`)
  if (r.newPeople.length) parts.push(`New in your world: ${r.newPeople.slice(0, 4).map((p) => p.name).join(', ')}.`)
  return parts.join(' ')
}

export async function generateNarrative(contextId: string, weekStart: Date, userName: string, contextIds?: string[]): Promise<{ text: string; provider: string }> {
  return withNotebookAi(() => generateNarrativeInner(contextId, weekStart, userName, contextIds))
}

async function generateNarrativeInner(contextId: string, weekStart: Date, userName: string, contextIds?: string[]): Promise<{ text: string; provider: string }> {
  const r = await buildWeekReview(contextIds ?? contextId, weekStart, contextId)
  const provider = getProvider()
  let text: string | null = null
  let used = provider.name
  if (provider.isLLM) {
    try {
      text = await provider.complete(
        `Write a reflective weekly review for ${userName} covering ${r.label}. 5-8 sentences, second person, calm and specific, no headings, no bullet points, no greeting, no invented facts. Mention what moved, what slipped, who mattered, and the one thing to carry into next week. Use only these facts:\n${reviewFacts(r).join('\n')}`,
        { purpose: 'weekly-review', maxTokens: 500 },
      )
    } catch {
      text = null
    }
  }
  if (!text || !text.trim()) {
    text = localNarrative(r, userName)
    used = 'local'
  }
  const db = await getDb()
  const key = weekKey(weekStart)
  const existing = (await db.select({ id: schema.weeklyReviews.id }).from(schema.weeklyReviews).where(and(eq(schema.weeklyReviews.contextId, contextId), eq(schema.weeklyReviews.weekStart, key))))[0]
  if (existing) await db.update(schema.weeklyReviews).set({ narrative: text.trim(), provider: used, facts: reviewFacts(r), updatedAt: new Date() }).where(eq(schema.weeklyReviews.id, existing.id))
  else await db.insert(schema.weeklyReviews).values({ id: uid('wr'), contextId, weekStart: key, narrative: text.trim(), provider: used, facts: reviewFacts(r) })
  return { text: text.trim(), provider: used }
}

export { desc }
