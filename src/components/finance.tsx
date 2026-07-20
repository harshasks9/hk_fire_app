import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { fmtMoney, fmtPct, fmtDate, relDate, daysUntil } from '@/lib/format'
import type { CurrencyCode, Suggestion, SuggestionCategory } from '@/data/types'
import { Icon, type IconName } from './icons'
import { Badge, Button, Card, ConfidenceMeter, type BadgeTone } from './ui'
import { useApp } from '@/state/AppContext'
import { convert } from '@/data/fx'

/* -- Stat card ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: IconName
  tone?: 'gain' | 'loss' | 'warn' | 'neutral'
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col gap-1', className)} pad>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-ink3">{label}</span>
        {icon && <Icon name={icon} size={15} className="text-ink3" />}
      </div>
      <div className="tnum font-display text-[22px] font-semibold tracking-tight text-ink">{value}</div>
      {sub && <div className={cn('text-[12px]', tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : tone === 'warn' ? 'text-warn' : 'text-ink2')}>{sub}</div>}
    </Card>
  )
}

/* -- Suggestion / recommendation card --------------------------------------------- */

export const CATEGORY_META: Record<SuggestionCategory, { label: string; tone: BadgeTone; icon: IconName }> = {
  observation: { label: 'Observation', tone: 'neutral', icon: 'eye' },
  alert: { label: 'Alert', tone: 'loss', icon: 'alert' },
  opportunity: { label: 'Opportunity', tone: 'brass', icon: 'bulb' },
  recommendation: { label: 'Recommendation', tone: 'brand', icon: 'sparkles' },
}

export function SuggestionCard({ s, compact }: { s: Suggestion; compact?: boolean }) {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const meta = CATEGORY_META[s.category]
  const status = app.suggestionStatus[s.id] ?? s.status
  const pro = app.mode === 'pro'

  if (status !== 'open') {
    return (
      <Card className="flex items-center gap-3 opacity-70" pad>
        <Icon name={status === 'accepted' ? 'check' : status === 'snoozed' ? 'clock' : 'x'} size={16} className="shrink-0 text-ink3" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink2 line-through decoration-ink3/50">{s.title}</div>
          <div className="text-[11px] capitalize text-ink3">{status === 'done_externally' ? 'Recorded as done outside Meridian' : status}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => app.setSuggestionStatus(s.id, 'open')}>Undo</Button>
      </Card>
    )
  }

  return (
    <Card pad className="transition-shadow hover:shadow-pop">
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          meta.tone === 'loss' ? 'bg-loss-soft text-loss' : meta.tone === 'brass' ? 'bg-brass-soft text-brass' : meta.tone === 'brand' ? 'bg-brand-soft text-brand' : 'bg-surface2 text-ink2')}>
          <Icon name={meta.icon} size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {s.urgency === 'today' && <Badge tone="loss" icon="clock">Decide today</Badge>}
            {s.urgency === 'this_week' && <Badge tone="warn" icon="clock">This week</Badge>}
            {s.missingData && s.missingData.length > 0 && <Badge tone="warn" icon="alert">Incomplete data</Badge>}
          </div>
          <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-ink">{s.title}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{s.what}</p>

          {!compact && (
            <button onClick={() => setOpen((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">
              {open ? 'Hide details' : 'Why this matters'}
              <Icon name="chevronDown" size={12} className={cn('transition-transform', open && 'rotate-180')} />
            </button>
          )}

          {open && (
            <div className="fade-up mt-3 space-y-3 border-t border-line pt-3">
              <DetailBlock label="Why it matters" text={s.why} />
              {s.action && <DetailBlock label="Suggested action" text={s.action} />}
              {s.impact && <DetailBlock label="Estimated impact" text={s.impact} />}
              {s.risks && s.risks.length > 0 && (
                <div>
                  <DetailLabel>Risks</DetailLabel>
                  {s.risks.map((r, i) => <p key={i} className="text-[12px] leading-relaxed text-ink2">· {r}</p>)}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {s.taxNote && <DetailBlock label="Tax" text={s.taxNote} small />}
                {s.liquidityNote && <DetailBlock label="Liquidity" text={s.liquidityNote} small />}
              </div>
              {pro && s.calculations && (
                <div className="rounded-lg bg-surface2 p-3">
                  <DetailLabel>Calculations</DetailLabel>
                  {s.calculations.map((cx, i) => (
                    <div key={i} className="flex justify-between py-0.5 text-[12px]">
                      <span className="text-ink2">{cx.label}</span>
                      <span className="tnum font-medium text-ink">{cx.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {pro && s.assumptions && (
                <div>
                  <DetailLabel>Assumptions</DetailLabel>
                  {s.assumptions.map((a, i) => <p key={i} className="text-[12px] text-ink2">· {a}</p>)}
                </div>
              )}
              {s.alternatives && s.alternatives.length > 0 && (
                <div>
                  <DetailLabel>Alternatives</DetailLabel>
                  {s.alternatives.map((a, i) => <p key={i} className="text-[12px] text-ink2">· {a}</p>)}
                </div>
              )}
              {s.missingData && s.missingData.length > 0 && (
                <div className="rounded-lg bg-warn-soft p-3">
                  <DetailLabel className="text-warn">Missing data</DetailLabel>
                  {s.missingData.map((m, i) => <p key={i} className="text-[12px] text-ink2">· {m}</p>)}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10.5px] uppercase tracking-wide text-ink3">Supported by</span>
                {s.supportingRecords.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10.5px] text-info">
                    <Icon name="file" size={10} />{r.label}
                  </span>
                ))}
                <span className="ml-auto"><ConfidenceMeter value={s.confidence} /></span>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" variant="primary" icon="check" onClick={() => app.setSuggestionStatus(s.id, 'accepted')}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => app.setSuggestionStatus(s.id, 'dismissed')}>Dismiss</Button>
            <Button size="sm" variant="ghost" icon="clock" onClick={() => app.setSuggestionStatus(s.id, 'snoozed')}>Snooze</Button>
            {pro && (
              <>
                <Button size="sm" variant="ghost" icon="send" onClick={() => app.setSuggestionStatus(s.id, 'sent_to_advisor')}>Send to advisor</Button>
                <Button size="sm" variant="ghost" onClick={() => app.setSuggestionStatus(s.id, 'done_externally')}>Did it elsewhere</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function DetailLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3', className)}>{children}</div>
}

function DetailBlock({ label, text, small }: { label: string; text: string; small?: boolean }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <p className={cn('leading-relaxed text-ink2', small ? 'text-[12px]' : 'text-[12.5px]')}>{text}</p>
    </div>
  )
}

/* -- Obligations list -------------------------------------------------------------- */

export function ObligationRow({
  date,
  label,
  amount,
  currency,
  displayCurrency,
}: {
  date: string
  label: string
  amount: number
  currency: CurrencyCode
  displayCurrency: CurrencyCode
}) {
  const d = daysUntil(date)
  const urgentTone = d <= 5 ? 'text-loss' : d <= 14 ? 'text-warn' : 'text-ink2'
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
      <div className={cn('flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface2/60')}>
        <span className="text-[8.5px] font-semibold uppercase text-ink3">{fmtDate(date, 'short').split(' ')[0]}</span>
        <span className="tnum text-[13px] font-bold leading-none text-ink">{fmtDate(date, 'short').split(' ')[1]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-ink">{label}</div>
        <div className={cn('text-[11px]', urgentTone)}>{d === 0 ? 'Due today' : d < 0 ? 'Overdue' : `in ${d} day${d === 1 ? '' : 's'}`}</div>
      </div>
      <div className="tnum text-[13px] font-semibold text-ink">
        {amount > 0 ? fmtMoney(convert(amount, currency, displayCurrency), displayCurrency, { compact: true }) : '—'}
      </div>
    </div>
  )
}

/* -- Freshness pill for asset values ------------------------------------------------ */

export function Freshness({ asOf, stale }: { asOf: string; stale?: boolean }) {
  const days = -daysUntil(asOf)
  const isStale = stale || days > 90
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10.5px]', isStale ? 'text-warn' : 'text-ink3')} title={`Data as of ${fmtDate(asOf)}`}>
      <Icon name={isStale ? 'alert' : 'refresh'} size={10} />
      {relDate(asOf)}
    </span>
  )
}
