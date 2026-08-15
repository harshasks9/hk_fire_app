import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Drawer, Badge } from '@/components/ui'
import { Icon } from '@/components/icons'
import { COPILOT_INTENTS, type CopilotAnswer, type CopilotIntent } from './copilotEngine'
import { PERSONAL_INTENTS } from './personalCopilot'

interface Turn {
  q: string
  a: CopilotAnswer | null // null = no match
}

function bestIntent(intents: CopilotIntent[], query: string, mode: 'simple' | 'pro'): CopilotIntent | null {
  const q = query.toLowerCase()
  let best: { intent: CopilotIntent; score: number } | null = null
  for (const intent of intents) {
    if (intent.mode !== 'both' && intent.mode !== mode) continue
    const score = intent.keywords.reduce((s, k) => s + (q.includes(k) ? 1 : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { intent, score }
  }
  return best?.intent ?? null
}

export function CopilotDrawer() {
  const app = useApp()
  const personal = app.dataMode === 'personal'
  const intents = personal ? PERSONAL_INTENTS : COPILOT_INTENTS
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  /* Answers are computed synchronously from records — no simulated latency. */
  const ask = (q: string) => {
    const intent = bestIntent(intents, q, app.mode)
    setTurns((t) => [...t, { q, a: intent ? intent.answer(app.currency) : null }])
    setTimeout(() => bodyRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }), 60)
  }

  const suggestions = intents.filter((i) => i.mode === 'both' || i.mode === app.mode).slice(0, app.mode === 'simple' ? 6 : 9)

  return (
    <Drawer
      open={app.copilotOpen}
      onClose={() => app.setCopilotOpen(false)}
      width="max-w-lg"
      title={
        <span className="flex items-center gap-2">
          <Icon name="sparkles" size={16} className="text-brass" />
          Financial Copilot
          {personal
            ? <Badge tone="brass">Computed from your records</Badge>
            : <Badge tone="warn">Demo data — sample answers</Badge>}
        </span>
      }
    >
      <div ref={bodyRef} className="scroll-thin flex h-full flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 p-4">
          {turns.length === 0 && (
            <div>
              <p className="mb-1 text-[13px] leading-relaxed text-ink2">
                {personal
                  ? 'Deterministic answers computed from your records at the moment you ask — not an AI model. If data is missing, the answer says so instead of guessing.'
                  : 'Sample answers over the fictional demo household. Some figures are authored narrative, not live computation.'}
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
              {t.a === null && (
                <AnswerShell>
                  <p className="text-[13px] leading-relaxed text-ink2">
                    I can only answer from recorded data, and I couldn’t match that question. Try one of the suggested questions — they cover everything this copilot can compute.
                  </p>
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
              if (input.trim()) {
                ask(input.trim())
                setInput('')
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={personal ? 'e.g. What income have I collected?' : app.mode === 'simple' ? 'e.g. What changed this month?' : 'e.g. Show the tax impact of selling 20% of NVDA'}
              className="h-10 flex-1 rounded-ctl border border-line bg-bg px-3 text-[13px] text-ink outline-none placeholder:text-ink3 focus:border-brand"
            />
            <button type="submit" disabled={!input.trim()} className="flex h-10 w-10 items-center justify-center rounded-ctl bg-brand text-invert disabled:opacity-40" aria-label="Ask">
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
