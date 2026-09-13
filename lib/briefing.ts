/* The daily brief: a short narrative composed from the day's graph state. */
import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { getHomeData } from './queries'
import { getProvider } from './ai/provider'
import { withNotebookAi } from './session'
import { sha256 } from './crypto'
import { formatDate, formatTime, isToday, pluralize } from './util'

export interface Brief { lines: string[]; narrative: string | null; generatedAt: string }

/** How long a narrative stays valid when the facts behind it have not changed. */
const NARRATIVE_TTL_MS = 6 * 60 * 60_000

export async function dailyBrief(contextIds: string | string[], cacheKey: string, userName = 'Harsha'): Promise<Brief> {
  return withNotebookAi(() => dailyBriefInner(contextIds, cacheKey, userName))
}

/** The factual lines only — no model call, so pages can render them instantly. */
export function briefLines(h: Awaited<ReturnType<typeof getHomeData>>): string[] {
  const lines: string[] = []
  const todays = h.meetings.filter((m) => isToday(m.startsAt))
  const next = h.meetings[0]
  if (todays.length) lines.push(`${pluralize(todays.length, 'meeting')} today: ${todays.map((m) => `${m.title} at ${formatTime(m.startsAt)}`).join(', ')}.`)
  else if (next) lines.push(`No meetings today. Next up: ${next.title}, ${formatDate(next.startsAt, { weekday: 'long' })} ${formatTime(next.startsAt)}.`)
  else lines.push('No meetings scheduled this week.')
  if (h.overdue.length) lines.push(`${pluralize(h.overdue.length, 'action is', 'actions are')} overdue, oldest: "${h.overdue[0]!.title}".`)
  if (h.dueSoon.length) lines.push(`${pluralize(h.dueSoon.length, 'action')} due this week.`)
  const promised = h.loops.filter((l) => l.kind === 'promised')
  if (promised.length) lines.push(`You still owe ${pluralize(promised.length, 'thing')} you promised, including "${promised[0]!.text.replace(/^(I'll|I will|Team to|We'll)\s+/i, '')}".`)
  if (h.changes.length) lines.push(`Changed recently: ${h.changes.slice(0, 2).map((c) => c.description).join('; ')}.`)
  if (h.insights.length) lines.push(h.insights[0]!.text)
  return lines
}

async function dailyBriefInner(contextIds: string | string[], cacheKey: string, userName: string): Promise<Brief> {
  const h = await getHomeData(contextIds)
  const lines = briefLines(h)
  const provider = getProvider()
  let narrative: string | null = null
  // The narrative is cached per context while the facts behind it stay the same.
  const key = `brief:${cacheKey}`
  const fingerprint = sha256(lines.join('|') + provider.name).slice(0, 16)
  const db = await getDb()
  const cached = (await db.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)))[0]
  const c = cached?.value as { fingerprint?: string; narrative?: string | null; at?: string } | undefined
  if (c && c.fingerprint === fingerprint && c.at && Date.now() - new Date(c.at).getTime() < NARRATIVE_TTL_MS) return { lines, narrative: c.narrative ?? null, generatedAt: c.at }
  if (provider.isLLM) {
    try {
      narrative = await provider.complete(
        `Write a calm, private morning briefing for ${userName} in 3-5 sentences, second person, no headings, no bullet points, no greeting. Only use these facts:\n${lines.join('\n')}\nMeetings this week: ${h.meetings.map((m) => `${m.title} (${formatDate(m.startsAt, { weekday: 'short' })})`).join(', ') || 'none'}.\nOpen loops: ${h.loops.map((l) => l.text).join('; ') || 'none'}.`,
        { purpose: 'daily-brief', maxTokens: 400 },
      )
    } catch {
      narrative = null
    }
  }
  const generatedAt = new Date().toISOString()
  await db.insert(schema.appMeta).values({ key, value: { fingerprint, narrative, at: generatedAt } }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: { fingerprint, narrative, at: generatedAt }, updatedAt: new Date() } }).catch(() => undefined)
  return { lines, narrative, generatedAt }
}
