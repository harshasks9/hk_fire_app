/* Generated outputs (email, Slack, brief, memo…) from any note, meeting, company or topic. */
import { getProvider } from './ai/provider'
import type { OutputType } from './ai/types'
import { OUTPUT_TYPES } from './ai/types'
import { getNote, getEntity, getMeeting, getDecision } from './queries'
import { formatDate, truncate } from './util'

export interface GenerateTarget { type: 'note' | 'meeting' | 'entity' | 'decision'; id: string }

interface Material { title: string; kind: string; date: string; summary: string[]; decisions: string[]; actions: string[]; risks: string[]; numbers: string[]; people: string[]; companies: string[]; body: string; loops: string[]; changes: string[] }

async function material(t: GenerateTarget): Promise<Material | null> {
  if (t.type === 'note') {
    const d = await getNote(t.id)
    if (!d) return null
    const s = d.note.summary
    return { title: d.note.title || 'Untitled', kind: d.note.kind, date: formatDate(d.note.createdAt, { month: 'long', day: 'numeric', year: 'numeric' }), summary: s?.summary ?? [], decisions: d.decisions.map((x) => x.statement), actions: d.tasks.map((x) => `${x.owner}: ${x.title}${x.dueAt ? ` (due ${formatDate(x.dueAt)})` : ''}`), risks: s?.risks ?? [], numbers: d.facts.map((f) => `${f.entityName} ${f.label.toLowerCase()}: ${f.value}`), people: d.entities.filter((e) => e.type === 'person').map((e) => e.name), companies: d.entities.filter((e) => e.type === 'company').map((e) => e.name), body: d.note.contentText, loops: d.commitments.filter((c) => c.status === 'open').map((c) => c.text), changes: d.changes.map((c) => c.description) }
  }
  if (t.type === 'meeting') {
    const d = await getMeeting(t.id)
    if (!d) return null
    const s = d.meeting.summary ?? d.note?.note.summary
    return { title: d.meeting.title, kind: 'meeting', date: formatDate(d.meeting.startsAt, { month: 'long', day: 'numeric', year: 'numeric' }), summary: s?.summary ?? [], decisions: d.note?.decisions.map((x) => x.statement) ?? s?.decisions ?? [], actions: d.note?.tasks.map((x) => `${x.owner}: ${x.title}${x.dueAt ? ` (due ${formatDate(x.dueAt)})` : ''}`) ?? s?.actions ?? [], risks: s?.risks ?? [], numbers: d.note?.facts.map((f) => `${f.entityName} ${f.label.toLowerCase()}: ${f.value}`) ?? [], people: d.meeting.participants.map((p) => p.name), companies: d.meeting.company ? [d.meeting.company.name] : [], body: d.note?.note.contentText ?? d.transcript?.text ?? '', loops: d.note?.commitments.filter((c) => c.status === 'open').map((c) => c.text) ?? [], changes: [] }
  }
  if (t.type === 'decision') {
    const d = await getDecision(t.id)
    if (!d) return null
    return { title: d.decision.title, kind: 'decision', date: formatDate(d.decision.decidedAt, { month: 'long', day: 'numeric', year: 'numeric' }), summary: [d.decision.statement, d.decision.context ?? '', d.decision.reasoning ?? ''].filter(Boolean), decisions: d.revisions.map((r) => `${formatDate(r.occurredAt)} · ${r.kind}: ${r.statement}`), actions: [], risks: [], numbers: [], people: d.people.map((p) => p.name), companies: d.company ? [d.company.name] : [], body: `Alternatives considered: ${d.decision.alternatives.join('; ') || 'none recorded'}`, loops: [], changes: [] }
  }
  const d = await getEntity(t.id)
  if (!d) return null
  return { title: d.entity.name, kind: d.entity.type, date: formatDate(new Date(), { month: 'long', day: 'numeric', year: 'numeric' }), summary: [d.entity.summary ?? '', ...d.notes.slice(0, 4).map((n) => `${formatDate(n.createdAt)} — ${n.title}: ${n.preview}`)].filter(Boolean), decisions: d.decisions.map((x) => `${x.statement} (${formatDate(x.decidedAt)})`), actions: d.tasks.map((x) => `${x.owner}: ${x.title}${x.dueAt ? ` (due ${formatDate(x.dueAt)})` : ''}`), risks: d.insights.map((i) => i.text), numbers: d.facts.map((f) => `${f.label}: ${f.value}`), people: d.people.map((p) => `${p.name}${p.attributes.role ? ` (${p.attributes.role})` : ''}`), companies: d.companies.map((c) => c.name), body: d.notes.slice(0, 6).map((n) => `## ${n.title}\n${n.preview}`).join('\n\n'), loops: d.loops.map((l) => l.text), changes: d.changes.map((c) => c.description) }
}

export async function generateOutput(type: OutputType, target: GenerateTarget): Promise<{ text: string; provider: string; label: string }> {
  const m = await material(target)
  const label = OUTPUT_TYPES.find((o) => o.id === type)?.label ?? type
  if (!m) return { text: 'Nothing to generate from.', provider: 'none', label }
  const provider = getProvider()
  if (provider.isLLM) {
    const prompt = `Write a ${label.toLowerCase()} based strictly on the material below. Tone: concise, factual, no filler, no invented facts. Use plain text with light Markdown. Title the piece appropriately. Keep it under 250 words unless the format needs more.

Material about "${m.title}" (${m.kind}, ${m.date}):
Summary: ${m.summary.join(' | ') || '—'}
Decisions: ${m.decisions.join(' | ') || '—'}
Actions: ${m.actions.join(' | ') || '—'}
Open loops: ${m.loops.join(' | ') || '—'}
Risks: ${m.risks.join(' | ') || '—'}
Numbers: ${m.numbers.join(' | ') || '—'}
People: ${m.people.join(', ') || '—'}
Companies: ${m.companies.join(', ') || '—'}
Changes: ${m.changes.join(' | ') || '—'}

Source text:
${truncate(m.body, 12000)}`
    try {
      const text = await provider.complete(prompt, { purpose: `generate:${type}`, maxTokens: 1500 })
      return { text: text.trim(), provider: provider.name, label }
    } catch {
      /* fall through to template */
    }
  }
  return { text: template(type, m), provider: 'local', label }
}

const bullets = (xs: string[], empty = '—') => (xs.length ? xs.map((x) => `- ${x}`).join('\n') : `- ${empty}`)

function template(type: OutputType, m: Material): string {
  const who = m.companies[0] ?? m.people[0] ?? m.title
  switch (type) {
    case 'executive_summary':
      return `**${m.title}** — ${m.date}\n\n${bullets(m.summary.slice(0, 5), 'No summary yet.')}\n\n**Decisions**\n${bullets(m.decisions.slice(0, 4), 'None recorded.')}\n\n**Next**\n${bullets(m.actions.slice(0, 5), 'No open actions.')}`
    case 'email':
      return `Subject: ${m.title} — recap and next steps\n\nHi ${m.people[0]?.split(' ')[0] ?? 'team'},\n\nThanks for the time on ${m.date}. A short recap so we stay aligned.\n\nWhat we covered:\n${bullets(m.summary.slice(0, 4))}\n\n${m.decisions.length ? `What we agreed:\n${bullets(m.decisions.slice(0, 3))}\n\n` : ''}Next steps:\n${bullets(m.actions.slice(0, 5), 'None yet.')}\n\nShout if I have missed anything.\n\nBest,\nHarsha`
    case 'slack':
      return `*${m.title}* (${m.date})\n${m.summary.slice(0, 3).map((s) => `• ${s}`).join('\n')}\n${m.decisions.length ? `\n*Decided:* ${m.decisions[0]}` : ''}\n${m.actions.length ? `\n*Actions:*\n${m.actions.slice(0, 4).map((a) => `• ${a}`).join('\n')}` : ''}`
    case 'customer_follow_up':
      return `Subject: Follow-up — ${m.title}\n\nHi ${m.people[0]?.split(' ')[0] ?? 'there'},\n\nThank you for the discussion on ${m.date}. Summarising where we landed:\n\n${bullets(m.summary.slice(0, 4))}\n\nOn our side we will:\n${bullets(m.actions.filter((a) => /^(Harsha|Team|Me)/i.test(a)).slice(0, 4), 'Confirm next steps this week.')}\n\n${m.loops.length ? `Still open between us:\n${bullets(m.loops.slice(0, 3))}\n\n` : ''}Looking forward to the next step.\n\nBest regards,\nHarsha`
    case 'meeting_brief':
      return `**Brief: ${m.title}**\n\n**Who**\n${bullets(m.people, 'Participants not recorded.')}\n\n**Where things stand**\n${bullets(m.summary.slice(0, 4))}\n\n**Decisions so far**\n${bullets(m.decisions.slice(0, 4), 'None recorded.')}\n\n**Open loops**\n${bullets(m.loops.slice(0, 5), 'None.')}\n\n**Numbers to have in hand**\n${bullets(m.numbers.slice(0, 6), 'None captured.')}\n\n**Recently changed**\n${bullets(m.changes.slice(0, 3), 'Nothing changed recently.')}`
    case 'weekly_update':
      return `**Weekly update — ${who}**\n\n**Progress**\n${bullets(m.summary.slice(0, 4))}\n\n**Decisions**\n${bullets(m.decisions.slice(0, 3), 'None this week.')}\n\n**Risks**\n${bullets(m.risks.slice(0, 3), 'None flagged.')}\n\n**Asks / open**\n${bullets(m.loops.slice(0, 4), 'None.')}\n\n**Next week**\n${bullets(m.actions.slice(0, 5))}`
    case 'account_summary':
      return `**${m.title} — account summary** (${m.date})\n\n**Status**\n${bullets(m.summary.slice(0, 4))}\n\n**Key people**\n${bullets(m.people.slice(0, 6))}\n\n**Numbers**\n${bullets(m.numbers.slice(0, 8), 'None captured.')}\n\n**Decisions**\n${bullets(m.decisions.slice(0, 4), 'None recorded.')}\n\n**Open actions**\n${bullets(m.actions.slice(0, 6), 'None open.')}\n\n**Open loops**\n${bullets(m.loops.slice(0, 4), 'None.')}`
    case 'decision_memo':
      return `**Decision memo — ${m.title}**\n${m.date}\n\n**Decision**\n${m.decisions[0] ?? m.summary[0] ?? '—'}\n\n**Context**\n${bullets(m.summary.slice(0, 4))}\n\n**Reasoning**\n${m.summary[2] ?? bullets(m.risks.slice(0, 2), 'See source notes.')}\n\n**People involved**\n${bullets(m.people)}\n\n**History**\n${bullets(m.decisions.slice(0, 6))}\n\n**Follow-ups**\n${bullets(m.actions.slice(0, 4), 'None.')}`
    case 'talking_points':
      return `**Talking points — ${m.title}**\n\n1. Open with where we are: ${m.summary[0] ?? '—'}\n2. Confirm what was agreed: ${m.decisions[0] ?? 'nothing recorded yet'}\n3. Close the open loops: ${m.loops.slice(0, 2).join('; ') || 'none'}\n4. Numbers to anchor on: ${m.numbers.slice(0, 3).join('; ') || 'none captured'}\n5. Ask: ${m.actions.find((a) => !/^(Harsha|Team|Me)/i.test(a)) ?? 'agree next step and owner'}\n${m.risks.length ? `6. Name the risk: ${m.risks[0]}` : ''}`
    case 'action_list':
      return `**Actions — ${m.title}**\n\n| Owner | Task | Due |\n| --- | --- | --- |\n${m.actions.map((a) => {
        const [owner, ...rest] = a.split(': ')
        const task = rest.join(': ')
        const due = task.match(/\(due ([^)]+)\)/)?.[1] ?? ''
        return `| ${owner} | ${task.replace(/\s*\(due [^)]+\)/, '')} | ${due} |`
      }).join('\n') || '| — | No open actions | |'}`
  }
}
