'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ArrowUp, RotateCcw } from 'lucide-react'
import { ndjson } from '@/lib/client'
import type { AskEvent, Citation } from '@/lib/ask'
import { Markdown, AiMark, Spinner } from '@/components/ui'
import { formatDate } from '@/lib/util'

interface Turn { q: string; answer: string; citations: Citation[]; provider?: string; done: boolean }

export function AskClient({ contextName, isLLM, examples }: { contextName: string; isLLM: boolean; examples: string[] }) {
  const params = useSearchParams()
  const router = useRouter()
  const [q, setQ] = React.useState('')
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [busy, setBusy] = React.useState(false)
  const [all, setAll] = React.useState(false)
  const bottom = React.useRef<HTMLDivElement>(null)
  const started = React.useRef(false)

  const run = React.useCallback(async (question: string) => {
    if (!question.trim() || busy) return
    setBusy(true)
    setTurns((t) => [...t, { q: question, answer: '', citations: [], done: false }])
    setQ('')
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, all }) })
      for await (const ev of ndjson<AskEvent>(res)) {
        setTurns((t) => {
          const last = { ...t[t.length - 1]! }
          if (ev.type === 'citations') last.citations = ev.citations
          else if (ev.type === 'token') last.answer += ev.text
          else if (ev.type === 'done') { last.done = true; last.provider = ev.provider }
          else if (ev.type === 'error') last.answer += `\n\n_${ev.message}_`
          return [...t.slice(0, -1), last]
        })
      }
    } finally {
      setBusy(false)
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, done: true } : x)))
    }
  }, [all, busy])

  React.useEffect(() => {
    const initial = params.get('q')
    if (initial && !started.current) { started.current = true; run(initial); router.replace('/ask') }
  }, [params, run, router])
  React.useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [turns])

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[760px] flex-col px-5 md:min-h-dvh sm:px-8">
      <div className="flex-1 py-8">
        {turns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center pt-[12vh] text-center">
            <Sparkles className="mb-4 h-7 w-7 text-accent" />
            <h1 className="text-[30px] font-semibold tracking-[-0.02em]">Ask anything about your notes</h1>
            <p className="mt-2 max-w-md text-[14.5px] text-fg-2">Answers are built only from what you have written, and every statement cites the note it came from.{!isLLM ? ' No model key is configured, so answers are extractive — add one in Settings for synthesis.' : ''}</p>
            <ul className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {examples.map((e) => <li key={e}><button onClick={() => run(e)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[13.5px] text-fg-2 transition hover:border-border-2 hover:bg-surface-2 hover:text-fg">{e}</button></li>)}
            </ul>
          </div>
        ) : (
          <div className="space-y-8">
            {turns.map((t, i) => (
              <div key={i} className="animate-up">
                <div className="mb-3 text-[18px] font-semibold tracking-[-0.01em]">{t.q}</div>
                <div className="rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/30 p-4">
                  <div className="mb-2 flex items-center justify-between"><AiMark label={t.provider ? `Answer · ${t.provider === 'local' ? 'extractive' : t.provider}` : 'Answer'} />{!t.done ? <Spinner className="h-3.5 w-3.5 text-accent" /> : null}</div>
                  {t.answer ? <Markdown text={t.answer} className="text-[15px] [&_.cite]:ml-0.5 [&_.cite]:rounded [&_.cite]:bg-accent-soft-2 [&_.cite]:px-1 [&_.cite]:text-[11px] [&_.cite]:font-medium [&_.cite]:text-accent [&_.cite]:no-underline" /> : <div className="text-[13.5px] text-fg-3">Retrieving relevant notes…</div>}
                </div>
                {t.citations.length ? (
                  <div className="mt-3">
                    <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Sources</div>
                    <ol className="grid gap-1 sm:grid-cols-2">
                      {t.citations.map((c) => (
                        <li key={c.n} id={`cite-${c.n}`}>
                          <Link href={`${c.href}${c.href.startsWith('/notes/') ? `?highlight=${encodeURIComponent(c.excerpt.slice(0, 100))}` : ''}`} className="flex gap-2 rounded-lg border border-border px-3 py-2 text-[12.5px] transition hover:bg-surface-2">
                            <span className="shrink-0 font-medium text-accent">[{c.n}]</span>
                            <span className="min-w-0"><span className="block truncate font-medium">{c.title}</span><span className="block truncate text-fg-3">{formatDate(c.date)} · “{c.excerpt.slice(0, 80)}…”</span></span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={bottom} />
          </div>
        )}
      </div>
      <div className="sticky bottom-20 pb-4 pt-2 md:bottom-0 md:pb-6">
        <form onSubmit={(e) => { e.preventDefault(); run(q) }} className="flex items-center gap-2 rounded-2xl border border-border-2 bg-surface px-4 shadow-soft focus-within:border-accent">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={turns.length ? 'Ask a follow-up…' : 'What are the biggest recurring issues across my customer conversations?'} className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-3" />
          {turns.length ? <button type="button" onClick={() => setTurns([])} className="rounded-md p-1.5 text-fg-3 hover:text-fg" title="Clear"><RotateCcw className="h-4 w-4" /></button> : null}
          <button type="submit" disabled={busy || !q.trim()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg disabled:opacity-30" aria-label="Ask">{busy ? <Spinner className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}</button>
        </form>
        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[12px] text-fg-3"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="h-3.5 w-3.5" /> Include all contexts (default: {contextName} only)</label>
      </div>
    </div>
  )
}
