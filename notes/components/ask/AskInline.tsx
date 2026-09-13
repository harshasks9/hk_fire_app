'use client'
import * as React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowUp } from 'lucide-react'
import { ndjson } from '@/lib/client'
import type { AskEvent, Citation } from '@/lib/ask'
import { Markdown, AiMark, Spinner } from '@/components/ui'
import { cx, formatDate } from '@/lib/util'

export function AskInline({ entityId, noteIds, placeholder, compact, suggestions }: { entityId?: string; noteIds?: string[]; placeholder?: string; compact?: boolean; suggestions?: string[] }) {
  const [q, setQ] = React.useState('')
  const [answer, setAnswer] = React.useState('')
  const [citations, setCitations] = React.useState<Citation[]>([])
  const [busy, setBusy] = React.useState(false)
  const [asked, setAsked] = React.useState('')
  const run = async (question: string) => {
    if (!question.trim() || busy) return
    setBusy(true); setAnswer(''); setCitations([]); setAsked(question)
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, entityId, noteIds }) })
      for await (const ev of ndjson<AskEvent>(res)) {
        if (ev.type === 'citations') setCitations(ev.citations)
        else if (ev.type === 'token') setAnswer((a) => a + ev.text)
        else if (ev.type === 'error') setAnswer((a) => a + `\n\n_${ev.message}_`)
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); run(q) }} className={cx('flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent', compact ? 'h-9' : 'h-11')}>
        <Sparkles className="h-4 w-4 shrink-0 text-accent" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder ?? 'Ask anything…'} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-fg-3" />
        <button type="submit" disabled={busy || !q.trim()} className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-fg disabled:opacity-30" aria-label="Ask">{busy ? <Spinner className="h-3 w-3" /> : <ArrowUp className="h-3.5 w-3.5" />}</button>
      </form>
      {suggestions?.length && !asked ? (
        <div className="mt-2 flex flex-wrap gap-1.5">{suggestions.map((s) => <button key={s} onClick={() => { setQ(s); run(s) }} className="rounded-md border border-border px-2 py-1 text-[12px] text-fg-2 hover:bg-surface-2 hover:text-fg">{s}</button>)}</div>
      ) : null}
      {asked ? (
        <div className="animate-in mt-3 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/30 p-3">
          <div className="mb-1.5 flex items-center justify-between"><AiMark label="Answer" /><span className="text-[11.5px] text-fg-3">{asked}</span></div>
          {answer ? <Markdown text={answer} className="[&_.cite]:ml-0.5 [&_.cite]:rounded [&_.cite]:bg-accent-soft-2 [&_.cite]:px-1 [&_.cite]:text-[11px] [&_.cite]:font-medium [&_.cite]:text-accent [&_.cite]:no-underline" /> : <div className="text-[13px] text-fg-3">Thinking…</div>}
          {citations.length ? (
            <ol className="mt-3 space-y-1 border-t border-border pt-2 text-[12px]">
              {citations.map((c) => (
                <li key={c.n} id={`cite-${c.n}`} className="flex gap-2">
                  <span className="shrink-0 font-medium text-accent">[{c.n}]</span>
                  <Link href={`${c.href}${c.href.startsWith('/notes/') ? `?highlight=${encodeURIComponent(c.excerpt.slice(0, 100))}` : ''}`} className="min-w-0 hover:text-accent">
                    <span className="block truncate font-medium">{c.title}</span>
                    <span className="block text-fg-3">{formatDate(c.date)} · “{c.excerpt.slice(0, 90)}…”</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
