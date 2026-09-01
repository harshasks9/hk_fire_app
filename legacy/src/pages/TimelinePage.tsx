import React, { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { TIMELINE } from '@/data/timeline'
import { netWorthHistory } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Segmented } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { TimelineKind } from '@/data/types'

const KIND_META: Record<TimelineKind, { icon: IconName; label: string; tone: string }> = {
  market: { icon: 'trendUp', label: 'Market', tone: 'bg-brand-soft text-brand' },
  contribution: { icon: 'plus', label: 'Contribution', tone: 'bg-gain-soft text-gain' },
  withdrawal: { icon: 'download', label: 'Withdrawal', tone: 'bg-warn-soft text-warn' },
  income: { icon: 'coins', label: 'Income', tone: 'bg-brass-soft text-brass' },
  debt: { icon: 'scale', label: 'Debt', tone: 'bg-info-soft text-info' },
  valuation: { icon: 'building', label: 'Valuation', tone: 'bg-violet-soft text-violet' },
  document: { icon: 'file', label: 'Document', tone: 'bg-surface2 text-ink2' },
  correction: { icon: 'refresh', label: 'Correction', tone: 'bg-warn-soft text-warn' },
  decision: { icon: 'check', label: 'Decision', tone: 'bg-gain-soft text-gain' },
  recommendation: { icon: 'sparkles', label: 'Suggestion', tone: 'bg-brand-soft text-brand' },
}

export default function TimelinePage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const [filter, setFilter] = useState<TimelineKind | ''>('')
  const [compareA, setCompareA] = useState('2026-01-20')
  const [compareB, setCompareB] = useState('2026-07-20')

  const events = filter ? TIMELINE.filter((e) => e.kind === filter) : TIMELINE
  const history = useMemo(() => netWorthHistory(c, 380), [c])
  const ptA = history.find((p) => p.date >= compareA) ?? history[0]
  const ptB = [...history].reverse().find((p) => p.date <= compareB) ?? history[history.length - 1]
  const diff = ptB.total - ptA.total

  return (
    <div className="fade-up space-y-5">
      {/* Compare any two dates */}
      <Card pad>
        <SectionHead title="Compare two dates" sub="How did your position change between any two points?" />
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={compareA} min="2025-07-10" max="2026-07-20" onChange={(e) => setCompareA(e.target.value)} className="h-9 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] tnum outline-none focus:border-brand" aria-label="From date" />
          <Icon name="chevronRight" size={14} className="text-ink3" />
          <input type="date" value={compareB} min="2025-07-10" max="2026-07-20" onChange={(e) => setCompareB(e.target.value)} className="h-9 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] tnum outline-none focus:border-brand" aria-label="To date" />
          <div className="ml-auto text-right">
            <div className="flex items-center gap-2">
              <span className="tnum text-[13px] text-ink2">{fmtMoney(ptA.total, c, { compact: true })}</span>
              <Icon name="chevronRight" size={13} className="text-ink3" />
              <span className="tnum text-[15px] font-semibold text-ink">{fmtMoney(ptB.total, c, { compact: true })}</span>
              <Delta value={diff} currency={c} pct={(diff / ptA.total) * 100} />
            </div>
          </div>
        </div>
        {pro && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-4">
          {[
            { label: 'Market movement', v: diff * 0.72 },
            { label: 'Contributions', v: diff * 0.18 },
            { label: 'Income & debt paydown', v: diff * 0.12 },
            { label: 'Currency impact (INR)', v: diff * -0.02 },
          ].map((x) => (
            <div key={x.label} className="rounded-lg bg-surface2/70 p-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink3">{x.label}</div>
              <Delta value={x.v} currency={c} arrow={false} className="text-[13px] font-semibold" />
            </div>
          ))}
          </div>
        )}
        {pro && <p className="mt-2 text-[10.5px] text-ink3">The split shown is a fixed illustrative ratio over the sample series — real attribution needs monthly transaction records.</p>}
      </Card>

      {/* Filter chips */}
      <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1">
        <Chip active={filter === ''} onClick={() => setFilter('')}>All events</Chip>
        {(Object.keys(KIND_META) as TimelineKind[]).filter((k) => TIMELINE.some((e) => e.kind === k)).map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(filter === k ? '' : k)}>{KIND_META[k].label}</Chip>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-5">
        <span className="absolute bottom-2 left-[9px] top-2 w-0.5 rounded bg-line" aria-hidden />
        {events.map((e) => {
          const meta = KIND_META[e.kind]
          return (
            <div key={e.id} className="relative mb-3">
              <span className={cn('absolute -left-5 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg', meta.tone)}>
                <Icon name={meta.icon} size={10} />
              </span>
              <Card pad className="ml-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tnum text-[11px] font-semibold text-ink3">{fmtDate(e.date, 'medium')}</span>
                  <Badge tone="neutral">{meta.label}</Badge>
                  {e.amount !== undefined && <Delta value={convert(e.amount, e.currency ?? 'USD', c)} currency={c} className="ml-auto text-[12.5px]" arrow={false} />}
                </div>
                <h3 className="mt-1.5 text-[13.5px] font-semibold text-ink">{e.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{e.narrative}</p>
                {pro && e.attribution && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.attribution.account && <Badge tone="info">{e.attribution.account}</Badge>}
                    {e.attribution.asset && <Badge tone="violet">{e.attribution.asset}</Badge>}
                    {e.attribution.currencyImpact !== undefined && <Badge tone="warn">FX {fmtMoney(convert(e.attribution.currencyImpact, 'USD', c), c, { sign: true })}</Badge>}
                  </div>
                )}
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', active ? 'border-brand bg-brand text-invert' : 'border-line bg-surface text-ink2 hover:border-brand')}>
      {children}
    </button>
  )
}
