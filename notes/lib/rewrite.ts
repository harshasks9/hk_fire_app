/* Inline AI on a selection: rewrite, shorten, clarify, summarize, extract tasks/decisions, ask. */
import { getProvider } from './ai/provider'
import { localExtract } from './ai/local'
import type { RewriteMode } from './ai/types'
import { sentences, truncate } from './util'

export async function rewrite(mode: RewriteMode, text: string, opts: { question?: string; noteTitle?: string; context?: string; userName?: string } = {}): Promise<{ text: string; provider: string }> {
  const provider = getProvider()
  const instructions: Record<RewriteMode, string> = {
    rewrite: 'Rewrite the passage so it reads cleanly and professionally. Keep every fact. Return only the rewritten passage.',
    shorten: 'Shorten the passage to roughly half its length without losing any fact, name or number. Return only the shortened passage.',
    clearer: 'Make the passage clearer: simpler sentences, concrete wording, same facts. Return only the improved passage.',
    summarize: 'Summarize the passage in 2-4 bullet points. Return only the bullets.',
    extract_tasks: 'Extract every action item from the passage as a Markdown task list ("- [ ] Owner: task (due)"). Return only the list.',
    extract_decisions: 'Extract every decision from the passage as a Markdown list, one decision per line, each starting with "Decision:". Return only the list.',
    ask: `Answer the question about the passage using only the passage and the note context. Be concise. Question: ${opts.question ?? ''}`,
  }
  if (provider.isLLM) {
    try {
      const out = await provider.complete(`${instructions[mode]}\n\nNote title: ${opts.noteTitle ?? ''}\n${opts.context ? `Note context (for reference only):\n${truncate(opts.context, 4000)}\n\n` : ''}Passage:\n"""\n${text}\n"""`, { purpose: `rewrite:${mode}`, maxTokens: 1500 })
      return { text: out.trim(), provider: provider.name }
    } catch {
      /* fall back */
    }
  }
  return { text: localRewrite(mode, text, opts), provider: 'local' }
}

function localRewrite(mode: RewriteMode, text: string, opts: { question?: string; userName?: string }): string {
  const ex = localExtract(text, { knownEntities: [], userName: opts.userName ?? 'Harsha' })
  const sents = sentences(text)
  switch (mode) {
    case 'summarize':
      return (ex.summary.length ? ex.summary : sents.slice(0, 3)).map((s) => `- ${s.replace(/[.]+$/, '')}`).join('\n')
    case 'extract_tasks':
      return ex.actions.length ? ex.actions.map((a) => `- [ ] ${a.owner ? a.owner + ': ' : ''}${a.title}${a.due ? ` (${a.due})` : ''}`).join('\n') : '- [ ] No actions detected in this passage'
    case 'extract_decisions':
      return ex.decisions.length ? ex.decisions.map((d) => `- Decision: ${d.statement}`).join('\n') : '- No decisions detected in this passage'
    case 'shorten':
      return sents
        .filter((_, i) => i % 2 === 0 || sents.length <= 2)
        .map((s) => s.replace(/\b(really|very|quite|basically|actually|just|in order to|that is to say|it is worth noting that)\b\s?/gi, ''))
        .join(' ')
    case 'clearer':
      return sents.map((s) => s.replace(/\b(in order to)\b/gi, 'to').replace(/\b(utilise|utilize)\b/gi, 'use').replace(/\b(at this point in time)\b/gi, 'now').replace(/\s{2,}/g, ' ')).join(' ')
    case 'rewrite':
      return sents.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/\s{2,}/g, ' ')).join(' ')
    case 'ask': {
      const q = (opts.question ?? '').toLowerCase().split(/\s+/).filter((t) => t.length > 3)
      const hit = sents.filter((s) => q.some((t) => s.toLowerCase().includes(t))).slice(0, 3)
      return hit.length ? hit.join(' ') : 'The passage does not address that directly. Add an API key in Settings for model-backed answers.'
    }
  }
}
