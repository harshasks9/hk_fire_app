import { withNotebookAi } from './session'
/* Entity overviews / relationship summaries, regenerated when the entity has new information. */
import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { getProvider } from './ai/provider'
import type { EntityDetail } from './queries'
import { formatDate, pluralize } from './util'

export async function ensureEntitySummary(d: EntityDetail, userName = 'Harsha'): Promise<string> {
  return withNotebookAi(() => ensureEntitySummaryInner(d, userName))
}

async function ensureEntitySummaryInner(d: EntityDetail, userName: string): Promise<string> {
  const { entity } = d
  const stale = !entity.summary || !entity.summaryUpdatedAt || (entity.lastSeenAt && entity.lastSeenAt > entity.summaryUpdatedAt)
  if (!stale) return entity.summary!
  const text = await composeSummary(d, userName)
  const db = await getDb()
  await db.update(schema.entities).set({ summary: text, summaryUpdatedAt: new Date() }).where(eq(schema.entities.id, entity.id))
  return text
}

async function composeSummary(d: EntityDetail, userName: string): Promise<string> {
  const { entity } = d
  const provider = getProvider()
  const recent = d.notes.slice(0, 6)
  if (provider.isLLM && recent.length) {
    try {
      const prompt = `Write a ${entity.type === 'person' ? 'relationship summary' : 'executive overview'} of "${entity.name}" (${entity.type}${entity.attributes.role ? `, ${entity.attributes.role}` : ''}${entity.attributes.company ? ` at ${entity.attributes.company}` : ''}) for ${userName}, in 3-5 sentences, second person where natural ("You last met…"). Use only the material below. No headings, no bullets, no invented facts.

Recent notes:
${recent.map((n) => `- ${formatDate(n.createdAt)} ${n.title}: ${n.preview}`).join('\n')}
Open actions: ${d.tasks.slice(0, 6).map((t) => `${t.owner}: ${t.title}`).join('; ') || 'none'}
Open loops: ${d.loops.slice(0, 5).map((l) => l.text).join('; ') || 'none'}
Decisions: ${d.decisions.slice(0, 4).map((x) => x.statement).join('; ') || 'none'}
Numbers: ${d.facts.slice(0, 6).map((f) => `${f.label} ${f.value}`).join('; ') || 'none'}
Changes: ${d.changes.slice(0, 3).map((c) => c.description).join('; ') || 'none'}`
      return (await provider.complete(prompt, { purpose: 'entity-summary', maxTokens: 500 })).trim()
    } catch {
      /* fall through */
    }
  }
  const parts: string[] = []
  const first = d.notes[d.notes.length - 1]
  const last = d.notes[0]
  if (entity.type === 'person') {
    parts.push(`${entity.name}${entity.attributes.role ? ` is ${entity.attributes.role}` : ''}${entity.attributes.company ? ` at ${entity.attributes.company}` : ''}.`)
    if (first && last) parts.push(`You have ${pluralize(d.notes.length, 'note')} involving them, from ${formatDate(first.createdAt)} to ${formatDate(last.createdAt)}${d.meetings.length ? `, including ${pluralize(d.meetings.length, 'meeting')}` : ''}.`)
  } else if (entity.type === 'company') {
    parts.push(`${entity.name}${entity.attributes.status ? ` — ${entity.attributes.status.toLowerCase()}` : ''}${entity.attributes.stage ? `, currently at ${entity.attributes.stage.toLowerCase()}` : ''}.`)
    if (first && last) parts.push(`${pluralize(d.notes.length, 'note')} and ${pluralize(d.meetings.length, 'meeting')} since ${formatDate(first.createdAt)}, most recently “${last.title.length > 60 ? last.title.slice(0, 58).trimEnd() + '…' : last.title}” on ${formatDate(last.createdAt)}.`)
    if (d.people.length) parts.push(`Key people: ${d.people.slice(0, 4).map((p) => p.name).join(', ')}.`)
  } else {
    parts.push(`${entity.name} appears in ${pluralize(d.notes.length, 'note')}${d.companies.length ? ` across ${d.companies.slice(0, 4).map((c) => c.name).join(', ')}` : ''}.`)
    if (last) parts.push(`Latest: ${last.title} (${formatDate(last.createdAt)}).`)
  }
  if (d.decisions.length) parts.push(`Latest decision: ${d.decisions[0]!.statement}`)
  if (d.tasks.length) parts.push(`${pluralize(d.tasks.length, 'action remains', 'actions remain')} open.`)
  if (d.loops.filter((l) => l.kind === 'promised').length) parts.push(`You owe ${pluralize(d.loops.filter((l) => l.kind === 'promised').length, 'follow-up')}.`)
  if (d.changes[0]) parts.push(`Changed: ${d.changes[0].description}.`)
  return parts.join(' ')
}
