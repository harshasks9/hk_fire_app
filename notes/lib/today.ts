/*
  The Today page: one day of the notebook. The daily note (journal) is a plain
  note marked `source: 'daily'` with `sourceUrl: 'daily:YYYY-MM-DD'`, so it needs
  no schema change and survives export/import as an ordinary note. Day bounds
  are computed in the reader's time zone (cookie set by the browser), which is
  what "today" means to a person, not to the server.
*/
import { and, asc, desc, eq, gte, inArray, isNull, lt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getDb, schema } from './db'
import { inCtx, hydrateMeetings, listOpenLoops, attachEntities, type Ctx, type NoteListItem, type LoopItem, type MeetingListItem, type TaskItem } from './queries'
import { createNote } from './notes'
import { getTemplate, listTemplates, renderTemplate } from './templates'
import { markdownToDoc } from './markdown'

export const TZ_COOKIE = 'hkn_tz'
export const DAILY_SOURCE = 'daily'
export const dailyKey = (day: string) => `daily:${day}`

/* ------------------------------------------------------------ dates */

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidTimeZone(tz: string | undefined): tz is string {
  if (!tz) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

/** The reader's time zone: the cookie the browser sets, else the server's. */
export async function readerTimeZone(): Promise<string> {
  try {
    const jar = await cookies()
    const tz = jar.get(TZ_COOKIE)?.value
    if (isValidTimeZone(tz)) return tz
  } catch { /* outside a request */ }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function parts(d: Date, tz: string): { y: number; m: number; d: number; h: number; mi: number; s: number } {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const p: Record<string, number> = {}
  for (const x of f.formatToParts(d)) if (x.type !== 'literal') p[x.type] = Number(x.value)
  return { y: p.year!, m: p.month!, d: p.day!, h: p.hour! % 24, mi: p.minute!, s: p.second! }
}

/** 'YYYY-MM-DD' of an instant in a time zone. */
export function dayKey(d: Date, tz: string): string {
  const p = parts(d, tz)
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

/** The instant a calendar day starts in a time zone. */
export function dayStart(key: string, tz: string): Date {
  const m = DAY_RE.exec(key)
  if (!m) throw new Error(`bad day ${key}`)
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  // Guess local midnight as UTC midnight, then correct by the zone offset at that instant (twice, for DST edges).
  let guess = Date.UTC(y, mo - 1, d)
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess), tz)
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
    guess -= asUtc - Date.UTC(y, mo - 1, d)
  }
  return new Date(guess)
}

export function shiftDay(key: string, n: number): string {
  const m = DAY_RE.exec(key)
  if (!m) throw new Error(`bad day ${key}`)
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n))
  return d.toISOString().slice(0, 10)
}

export function parseDayKey(key: string | undefined, tz: string): string {
  return key && DAY_RE.test(key) && !Number.isNaN(Date.parse(key)) ? key : dayKey(new Date(), tz)
}

export function dayLabel(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }): string {
  const m = DAY_RE.exec(key)!
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
}

/** Monday-first week around a day, as keys. */
export function weekOf(key: string): string[] {
  const m = DAY_RE.exec(key)!
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  const dow = (d.getUTCDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => shiftDay(key, i - dow))
}

/* ------------------------------------------------------------ daily note */

export async function findDailyNote(contextIds: Ctx, day: string, preferContextId?: string) {
  const db = await getDb()
  const rows = await db.select().from(schema.notes).where(and(inCtx(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), eq(schema.notes.source, DAILY_SOURCE), eq(schema.notes.sourceUrl, dailyKey(day)))).orderBy(asc(schema.notes.createdAt))
  return rows.find((r) => r.contextId === preferContextId) ?? rows[0] ?? null
}

/** The body a new daily note starts with: a custom template called “Daily…” or “Journal…” if the notebook has one, else a light default. */
async function dailyBody(notebookId: string | undefined, date: Date, vars: { notebook?: string; name?: string }) {
  if (notebookId) {
    const custom = (await listTemplates(notebookId)).find((t) => !t.builtIn && /^(daily|journal|today)/i.test(t.name))
    if (custom) {
      const t = await getTemplate(notebookId, custom.id)
      if (t) return renderTemplate(t.body, { date, ...vars })
    }
  }
  return { title: '', doc: markdownToDoc('## Notes\n\n\n\n## Tomorrow\n\n- [ ] ') }
}

/** Find or create the day's note in a context. Returns the id and whether it was created now. */
export async function ensureDailyNote(input: { contextId: string; day: string; tz: string; notebookId?: string; notebookName?: string; userName?: string }): Promise<{ id: string; created: boolean }> {
  const existing = await findDailyNote(input.contextId, input.day, input.contextId)
  if (existing) return { id: existing.id, created: false }
  const noon = new Date(dayStart(input.day, input.tz).getTime() + 12 * 3600_000)
  const body = await dailyBody(input.notebookId, noon, { notebook: input.notebookName, name: input.userName })
  const title = body.title || dayLabel(input.day, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  const now = new Date()
  // Past days get the day's date as created-at so lists and exports sort them where they belong; today keeps "now".
  const createdAt = dayKey(now, input.tz) === input.day ? now : noon
  const id = await createNote({ contextId: input.contextId, title, contentJson: body.doc, kind: 'note', source: DAILY_SOURCE, sourceUrl: dailyKey(input.day), status: 'processed', createdAt })
  return { id, created: true }
}

/* ------------------------------------------------------------ the day */

export interface DayData {
  day: string
  tz: string
  isToday: boolean
  journal: (typeof schema.notes.$inferSelect) | null
  meetings: MeetingListItem[]
  tasksDue: TaskItem[]
  overdue: TaskItem[]
  completed: TaskItem[]
  captured: NoteListItem[]
  decisions: { id: string; title: string; status: string; decidedAt: Date; topicName: string | null; companyName: string | null }[]
  changes: { id: string; description: string; sourceNoteId: string | null; detectedAt: Date }[]
  loops: LoopItem[]
  /** Notes captured per day for the week strip. */
  week: { day: string; notes: number }[]
}

export async function getDayData(contextIds: Ctx, day: string, tz: string, preferContextId?: string): Promise<DayData> {
  const db = await getDb()
  const start = dayStart(day, tz)
  const end = dayStart(shiftDay(day, 1), tz)
  const today = dayKey(new Date(), tz) === day
  const week = weekOf(day)
  const weekStart = dayStart(week[0]!, tz)
  const weekEnd = dayStart(shiftDay(week[6]!, 1), tz)
  const live = isNull(schema.notes.deletedAt)
  const openStatuses: (typeof schema.tasks.$inferSelect)['status'][] = ['open', 'waiting', 'delegated']
  const taskSelect = () => db.select({ t: schema.tasks, entityName: schema.entities.name, entityType: schema.entities.type, sourceTitle: schema.notes.title }).from(schema.tasks).leftJoin(schema.entities, eq(schema.entities.id, schema.tasks.entityId)).leftJoin(schema.notes, eq(schema.notes.id, schema.tasks.sourceNoteId))
  const toTask = (r: { t: typeof schema.tasks.$inferSelect; entityName: string | null; entityType: TaskItem['entityType']; sourceTitle: string | null }): TaskItem => ({ ...r.t, entityName: r.entityName, entityType: r.entityType, sourceTitle: r.sourceTitle, hasPublicLink: false })
  const [journal, meetingRows, dueRows, overdueRows, completedRows, capturedRows, decisionRows, changeRows, weekRows, loopsAll] = await Promise.all([
    findDailyNote(contextIds, day, preferContextId),
    db.select().from(schema.meetings).where(and(inCtx(schema.meetings.contextId, contextIds), gte(schema.meetings.startsAt, start), lt(schema.meetings.startsAt, end))).orderBy(asc(schema.meetings.startsAt)),
    taskSelect().where(and(inCtx(schema.tasks.contextId, contextIds), inArray(schema.tasks.status, openStatuses), gte(schema.tasks.dueAt, start), lt(schema.tasks.dueAt, end))).orderBy(desc(schema.tasks.priority), asc(schema.tasks.createdAt)),
    today ? taskSelect().where(and(inCtx(schema.tasks.contextId, contextIds), inArray(schema.tasks.status, openStatuses), lt(schema.tasks.dueAt, start))).orderBy(asc(schema.tasks.dueAt)).limit(20) : Promise.resolve([]),
    taskSelect().where(and(inCtx(schema.tasks.contextId, contextIds), eq(schema.tasks.status, 'done'), gte(schema.tasks.completedAt, start), lt(schema.tasks.completedAt, end))).orderBy(desc(schema.tasks.completedAt)).limit(30),
    db.select().from(schema.notes).where(and(inCtx(schema.notes.contextId, contextIds), live, gte(schema.notes.createdAt, start), lt(schema.notes.createdAt, end))).orderBy(desc(schema.notes.createdAt)).limit(60),
    db.select({ id: schema.decisions.id, title: schema.decisions.title, status: schema.decisions.status, decidedAt: schema.decisions.decidedAt, topicName: schema.entities.name }).from(schema.decisions).leftJoin(schema.entities, eq(schema.entities.id, schema.decisions.topicEntityId)).where(and(inCtx(schema.decisions.contextId, contextIds), gte(schema.decisions.decidedAt, start), lt(schema.decisions.decidedAt, end))).orderBy(desc(schema.decisions.decidedAt)).limit(20),
    db.select({ id: schema.changes.id, description: schema.changes.description, sourceNoteId: schema.changes.sourceNoteId, detectedAt: schema.changes.detectedAt }).from(schema.changes).where(and(inCtx(schema.changes.contextId, contextIds), gte(schema.changes.detectedAt, start), lt(schema.changes.detectedAt, end))).orderBy(desc(schema.changes.detectedAt)).limit(20),
    db.select({ createdAt: schema.notes.createdAt }).from(schema.notes).where(and(inCtx(schema.notes.contextId, contextIds), live, gte(schema.notes.createdAt, weekStart), lt(schema.notes.createdAt, weekEnd))),
    listOpenLoops(contextIds, { limit: 60 }),
  ])
  const captured = await attachEntities(capturedRows.filter((n) => n.id !== journal?.id))
  const counts = new Map<string, number>(week.map((d) => [d, 0]))
  for (const r of weekRows) { const k = dayKey(r.createdAt, tz); counts.set(k, (counts.get(k) ?? 0) + 1) }
  const loops = today ? loopsAll.filter((l) => l.ageDays >= 7).slice(0, 5) : loopsAll.filter((l) => l.detectedAt >= start && l.detectedAt < end).slice(0, 10)
  return {
    day, tz, isToday: today, journal,
    meetings: await hydrateMeetings(meetingRows),
    tasksDue: dueRows.map(toTask), overdue: overdueRows.map(toTask), completed: completedRows.map(toTask),
    captured,
    decisions: decisionRows.map((d) => ({ ...d, companyName: null })),
    changes: changeRows,
    loops,
    week: week.map((d) => ({ day: d, notes: counts.get(d) ?? 0 })),
  }
}
