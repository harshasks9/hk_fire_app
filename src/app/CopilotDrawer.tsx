import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Drawer, Badge } from '@/components/ui'
import { Icon } from '@/components/icons'
import { COPILOT_INTENTS, matchIntent, type CopilotAnswer } from './copilotEngine'

interface Turn {
  q: string
  a: CopilotAnswer | null // null = no match
}

export function CopilotDrawer() {
  const app = useApp()
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const ask = (q: string) => {
    const intent = matchIntent(q, app.mode)
    setThinking(true)
    setTurns((t) => [...t, { q, a: null }])
    setTimeout(() => {
      setTurns((t) => {
        const copy = [...t]
        copy[copy.length - 1] = { q, a: intent ? intent.answer(app.currency) : null }
        return copy
      })
      setThinking(false)
      setTimeout(() => bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }), 60)
    }, 650)
    setTimeout(() => bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }), 60)
  }

  const suggestions = COPILOT_INTENTS.filter((i) => i.mode === 'both' || i.mode === app.mode).slice(0, app.mode === 'simple' ? 6 : 9)

  return (
    <Drawer
      open={app.copilotOpen}
      onClose={() => app.setCopilotOpen(false)}
      width="max-w-lg"
      title={
        <span className="flex items-center gap-2">
          <Icon name="sparkles" size={16} className="text-brass" />
          Financial Copilot
          <Badge tone="brass">Answers from your records</Badge>
        </span>
      }
    >
      <div ref={bodyRef} className="scroll-thin flex h-full flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 p-4">
          {turns.length === 0 && (
            <div>
              <p className="mb-1 text-[13px] leading-relaxed text-ink2">
                Ask about your finances. Every answer cites the underlying records and separates facts from estimates — nothing is invented.
              </p>
              <div className="mt-4 space-y-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => ask(s.question)}
                    className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[13px] text-ink transition-colors hover:border-brand hover:bg-brand-soft"
                  >
                    <Icon name="chevronRight" size={13} className="shrink-0 text-ink3" />
                    {s.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i}>
              <div className="mb-2 flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-[13px] text-invert">{t.q}</div>
              </div>
              {t.a === null && !thinking && (
                <AnswerShell>
                  <p className="text-[13px] leading-relaxed text-ink2">
                    I can only answer from your recorded data, and I couldn’t match that question to your records. Try one of the suggested questions, or rephrase using an account, position or topic name.
                  </p>
                </AnswerShell>
              )}
              {t.a === null && thinking && i === turns.length - 1 && (
                <AnswerShell>
                  <div className="flex items-center gap-2 text-[12.5px] text-ink3">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
                    Reading your records…
                  </div>
                </AnswerShell>
              )}
              {t.a && (
                <AnswerShell>
                  <p className="text-[13.5px] font-medium leading-relaxed text-ink">{t.a.headline}</p>
                  {t.a.facts.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-gain">Facts — from records</div>
                      {t.a.facts.map((f, j) => (
                        <div key={j} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
                          <span className="text-[12px] text-ink2">{f.label}</span>
                          <span className="tnum text-right text-[12px] font-medium text-ink">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {t.a.estimates && t.a.estimates.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-warn">Estimates & forecasts</div>
                      {t.a.estimates.map((f, j) => (
                        <div key={j} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
                          <span className="text-[12px] text-ink2">{f.label}</span>
                          <span className="tnum text-right text-[12px] font-medium text-ink">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {t.a.assumptions && (
                    <div className="mt-3 rounded-lg bg-surface2 p-2.5">
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Assumptions</div>
                      {t.a.assumptions.map((a, j) => (
                        <div key={j} className="text-[11.5px] leading-relaxed text-ink2">· {a}</div>
                      ))}
                    </div>
                  )}
                  {t.a.missing && t.a.missing.length > 0 && (
                    <div className="mt-2 rounded-lg bg-warn-soft p-2.5">
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-warn">Missing data</div>
                      {t.a.missing.map((m, j) => (
                        <div key={j} className="text-[11.5px] leading-relaxed text-ink2">· {m}</div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.a.citations.map((cit, j) =>
                      cit.to ? (
                        <Link key={j} to={cit.to} onClick={() => app.setCopilotOpen(false)} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[10.5px] text-info hover:border-info">
                          <Icon name="file" size={10} />
                          {cit.label}
                        </Link>
                      ) : (
                        <span key={j} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink2">
                          <Icon name="file" size={10} />
                          {cit.label}
                        </span>
                      ),
                    )}
                  </div>
                  {t.a.followups && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.a.followups.map((f) => (
                        <button key={f} onClick={() => ask(f)} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand hover:opacity-80">
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </AnswerShell>
              )}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 border-t border-line bg-surface p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (input.trim() && !thinking) {
                ask(input.trim())
                setInput('')
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={app.mode === 'simple' ? 'e.g. What changed this month?' : 'e.g. Show the tax impact of selling 20% of NVDA'}
              className="h-10 flex-1 rounded-ctl border border-line bg-bg px-3 text-[13px] text-ink outline-none placeholder:text-ink3 focus:border-brand"
            />
            <button type="submit" disabled={thinking || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-ctl bg-brand text-invert disabled:opacity-40" aria-label="Ask">
              <Icon name="send" size={16} />
            </button>
          </form>
        </div>
      </div>
    </Drawer>
  )
}

function AnswerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-up rounded-2xl rounded-tl-md border border-line bg-surface p-3.5 shadow-card">
      {children}
    </div>
  )
}
