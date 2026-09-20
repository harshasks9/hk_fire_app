/*
  Ask-your-notes: retrieval-augmented answers with citations. With an LLM the
  answer is generated from the retrieved passages only; without one, the answer
  is composed extractively from the same passages. Either way every claim is
  traceable to a note.
*/
import { getProvider } from './ai/provider'
import { retrievePassages, type Passage } from './retrieval'
import { sentences, truncate, formatDate } from './util'
import { tokenize } from './ai/embeddings'
import { getDb, schema } from './db'
import { and, eq, inArray, isNull } from 'drizzle-orm'

export interface Citation { n: number; noteId: string; title: string; date: string; excerpt: string; href: string }

export type AskEvent = { type: 'citations'; citations: Citation[] } | { type: 'token'; text: string } | { type: 'done'; provider: string } | { type: 'error'; message: string }

function citationsFrom(passages: Passage[]): Citation[] {
  return passages.map((p, i) => ({ n: i + 1, noteId: p.noteId, title: p.title, date: p.date.toISOString(), excerpt: truncate(p.text.replace(/\s+/g, ' '), 260), href: p.kind === 'meeting' && p.meetingId ? `/meetings/${p.meetingId}` : `/notes/${p.noteId}` }))
}

export async function* ask(contextIds: string[], question: string, opts: { entityId?: string; noteIds?: string[]; userName?: string } = {}): AsyncGenerator<AskEvent> {
  const passages = await retrievePassages(contextIds, question, { limit: 8, entityId: opts.entityId, noteIds: opts.noteIds })
  const citations = citationsFrom(passages)
  yield { type: 'citations', citations }
  const provider = getProvider()
  if (!passages.length) {
    yield { type: 'token', text: "I couldn't find anything in your notes that addresses this. Try different words, or widen the context scope in Settings." }
    yield { type: 'done', provider: provider.name }
    return
  }
  // Structured context helps both paths: open tasks and decisions tied to the retrieved notes.
  const db = await getDb()
  const noteIds = passages.map((p) => p.noteId)
  const [tasks, decisions] = await Promise.all([
    db.select().from(schema.tasks).where(and(inArray(schema.tasks.sourceNoteId, noteIds), inArray(schema.tasks.status, ['open', 'waiting', 'delegated']))),
    db.select().from(schema.decisions).where(inArray(schema.decisions.sourceNoteId, noteIds)),
  ])
  void isNull
  if (provider.isLLM) {
    const context = passages.map((p, i) => `[${i + 1}] "${p.title}" (${formatDate(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}, ${p.kind})\n${p.text}`).join('\n\n---\n\n')
    const structured = [
      tasks.length ? `Open tasks from these notes:\n${tasks.map((t) => `- ${t.owner}: ${t.title}${t.dueAt ? ` (due ${formatDate(t.dueAt)})` : ''}`).join('\n')}` : '',
      decisions.length ? `Decisions from these notes:\n${decisions.map((d) => `- ${d.statement} (${formatDate(d.decidedAt)}, ${d.status})`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n')
    const prompt = `Answer the question using ONLY the notes below. Cite sources inline as [n] after each claim, using the bracket numbers. If the notes do not contain the answer, say so plainly and do not invent anything. Be concise and concrete: names, numbers, dates. Use short paragraphs or bullets. The user is ${opts.userName ?? 'Harsha'}; "I" in the notes is them.

Question: ${question}

Notes:
${context}

${structured}`
    try {
      for await (const t of provider.stream(prompt, { purpose: 'ask', maxTokens: 2000 })) yield { type: 'token', text: t }
      yield { type: 'done', provider: provider.name }
      return
    } catch (err) {
      yield { type: 'token', text: `\n\n_(The ${provider.name} model was unavailable: ${String(err).slice(0, 120)}. Showing an extractive answer instead.)_\n\n` }
    }
  }
  // Extractive answer: pick the sentences most related to the question, grouped by source.
  const terms = new Set(tokenize(question).map((t) => t.replace(/(ings?|ed|es|s)$/, '')))
  const picks: { n: number; text: string; score: number }[] = []
  passages.forEach((p, i) => {
    for (const s of sentences(p.text)) {
      const toks = tokenize(s).map((t) => t.replace(/(ings?|ed|es|s)$/, ''))
      let overlap = 0
      for (const t of toks) if (terms.has(t)) overlap++
      const score = overlap / Math.max(3, Math.sqrt(toks.length)) + p.score * 0.3
      if (overlap > 0 && s.length > 20 && s.length < 320) picks.push({ n: i + 1, text: s.replace(/^[-•*]\s*/, ''), score })
    }
  })
  picks.sort((a, b) => b.score - a.score)
  const chosen: typeof picks = []
  for (const p of picks) {
    if (chosen.length >= 6) break
    if (chosen.some((c) => c.text.toLowerCase() === p.text.toLowerCase())) continue
    chosen.push(p)
  }
  const lines: string[] = []
  if (!chosen.length) lines.push(`The most related notes are listed below, but none of them states this directly. [1]`)
  else {
    lines.push(`Here is what your notes say about this:`)
    lines.push('')
    for (const c of chosen) lines.push(`- ${c.text.replace(/[.]+$/, '')}. [${c.n}]`)
  }
  if (tasks.length) {
    lines.push('')
    lines.push('Open actions tied to these notes:')
    for (const t of tasks.slice(0, 5)) {
      const n = passages.findIndex((p) => p.noteId === t.sourceNoteId) + 1
      lines.push(`- ${t.owner}: ${t.title}${t.dueAt ? ` (due ${formatDate(t.dueAt)})` : ''} [${n || 1}]`)
    }
  }
  if (decisions.length) {
    lines.push('')
    lines.push('Decisions recorded:')
    for (const d of decisions.slice(0, 4)) {
      const n = passages.findIndex((p) => p.noteId === d.sourceNoteId) + 1
      lines.push(`- ${d.statement} (${formatDate(d.decidedAt)}) [${n || 1}]`)
    }
  }
  lines.push('')
  lines.push(`_Composed from your notes without a language model. Add an API key in Settings for synthesized answers._`)
  const text = lines.join('\n')
  // Stream in small pieces so the UI feels alive.
  for (let i = 0; i < text.length; i += 24) {
    yield { type: 'token', text: text.slice(i, i + 24) }
    await new Promise((r) => setTimeout(r, 6))
  }
  yield { type: 'done', provider: 'local' }
}
