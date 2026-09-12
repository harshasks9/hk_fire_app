/* The daily brief: a short narrative composed from the day's graph state. */
import { getHomeData } from './queries'
import { getProvider } from './ai/provider'
import { formatDate, formatTime, isToday, pluralize } from './util'

export interface Brief { lines: string[]; narrative: string | null; generatedAt: string }

export async function dailyBrief(contextId: string, userName = 'Harsha'): Promise<Brief> {
  const h = await getHomeData(contextId)
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
  const provider = getProvider()
  let narrative: string | null = null
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
  return { lines, narrative, generatedAt: new Date().toISOString() }
}
