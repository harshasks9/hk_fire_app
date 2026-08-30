import React, { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { incomeAgg } from '@/data/selectors'
import { INCOME_EVENTS, INCOME_TYPE_LABELS } from '@/data/income'
import { INSTRUMENTS } from '@/data/instruments'
import { POSITIONS } from '@/data/portfolio'
import { accountById, memberById } from '@/data/household'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button } from '@/components/ui'
import { MonthBars, CHART_COLORS } from '@/components/charts'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { IncomeEvent } from '@/data/types'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function IncomePage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const agg = useMemo(() => incomeAgg(c, { memberId: app.memberId }), [c, app.memberId])
  const [month, setMonth] = useState(6) // July (0-indexed)
  const [selDay, setSelDay] = useState<string | null>(null)

  const monthEvents = useMemo(
    () => INCOME_EVENTS.filter((e) => Number(e.date.slice(5, 7)) === month + 1 && (!e.accountId || !app.memberId || accountById(e.accountId)?.ownerId === app.memberId)),
    [month, app.memberId],
  )

  const typeSlices = agg.byType.map((t, i) => ({
    label: INCOME_TYPE_LABELS[t.type as keyof typeof INCOME_TYPE_LABELS] ?? t.type,
    value: t.total,
    color: CHART_COLORS[i % 8],
  }))
  const typeTotal = typeSlices.reduce((s, t) => s + t.value, 0)

  return (
    <div className="fade-up space-y-5">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="July income" value={fmtMoney(agg.monthReceived + agg.monthExpected, c, { compact: true })} sub={`${fmtMoney(agg.monthReceived, c, { compact: true })} received · ${fmtMoney(agg.monthExpected, c, { compact: true })} expected`} icon="coins" />
        <StatCard label="Received in 2026" value={fmtMoney(agg.ytdReceived, c, { compact: true })} sub="Jan 1 – Jul 20 · from your records" icon="check" tone="gain" />
        <StatCard label="Full-year run rate" value={fmtMoney(agg.forwardAnnual, c, { compact: true })} sub="Projection — assumes current rates hold" icon="trendUp" tone="warn" />
        <StatCard
          label="Next payment"
          value={agg.next ? fmtMoney(convert(agg.next.amount, agg.next.currency, c), c, { compact: true }) : '—'}
          sub={agg.next ? `${agg.next.sourceLabel} · ${fmtDate(agg.next.date, 'short')}` : 'No scheduled payments'}
          icon="calendar"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Calendar */}
        <Card className="lg:col-span-3" pad>
          <SectionHead
            title="Income calendar"
            sub="When money actually lands — solid dots are received, hollow are expected"
            right={
              <div className="flex items-center gap-1">
                <button onClick={() => { setMonth((m) => Math.max(0, m - 1)); setSelDay(null) }} disabled={month === 0} className="rounded-md p-1.5 text-ink2 hover:bg-surface2 disabled:opacity-30" aria-label="Previous month"><Icon name="chevronLeft" size={14} /></button>
                <span className="tnum w-20 text-center text-[12.5px] font-semibold text-ink">{MONTH_LABELS[month]} 2026</span>
                <button onClick={() => { setMonth((m) => Math.min(11, m + 1)); setSelDay(null) }} disabled={month === 11} className="rounded-md p-1.5 text-ink2 hover:bg-surface2 disabled:opacity-30" aria-label="Next month"><Icon name="chevronRight" size={14} /></button>
              </div>
            }
          />
          <MonthCalendar month={month} events={monthEvents} currency={c} selDay={selDay} onSelect={setSelDay} />
          {/* Day / month detail */}
          <div className="mt-3 border-t border-line pt-3">
            {(selDay ? monthEvents.filter((e) => e.date === selDay) : monthEvents).slice(0, 8).map((e) => (
              <EventRow key={e.id} e={e} c={c} pro={pro} />
            ))}
            {monthEvents.length === 0 && <p className="py-4 text-center text-[12.5px] text-ink2">No income events in {MONTH_LABELS[month]}.</p>}
            {!selDay && monthEvents.length > 8 && <p className="pt-2 text-center text-[11px] text-ink3">+{monthEvents.length - 8} more — select a day to focus</p>}
          </div>
        </Card>

        {/* Streams + monthly bars */}
        <div className="space-y-5 lg:col-span-2">
          <Card pad>
            <SectionHead title="Income streams" sub="Share of 2026 income by source type" />
            <div className="space-y-2.5">
              {typeSlices.map((t, i) => (
                <div key={t.label}>
                  <div className="mb-0.5 flex justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-ink2"><span className="h-2 w-2 rounded-[3px]" style={{ background: t.color }} />{t.label}</span>
                    <span className="tnum font-medium text-ink">{fmtMoney(t.value, c, { compact: true })}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${(t.value / typeTotal) * 100}%`, background: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card pad>
            <SectionHead title="Expected vs received" sub="Is income arriving as planned?" />
            <MonthBars months={agg.byMonth.map((m, i) => ({ label: MONTH_LABELS[i][0], a: m.received, b: m.expected }))} currency={c} height={140} highlightMonth={month} />
          </Card>
        </div>
      </div>

      {/* Pro analytics */}
      {pro && <ProIncomeAnalytics currency={c} />}
      {!pro && (
        <p className="px-1 text-[11px] text-ink3">
          Switch to Pro Mode for yield-on-cost, dividend growth, tax treatment, withholding and sustainability analysis on every stream.
        </p>
      )}
    </div>
  )
}

function EventRow({ e, c, pro }: { e: IncomeEvent; c: 'USD' | 'INR'; pro: boolean }) {
  const owner = e.accountId ? memberById(accountById(e.accountId)?.ownerId ?? '') : undefined
  return (
    <div className="flex items-center gap-3 border-b border-line py-2 last:border-0">
      <span className={cn('flex h-2.5 w-2.5 shrink-0 rounded-full border-2', e.status === 'received' ? 'border-gain bg-gain' : 'border-ink3 bg-transparent')} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-ink">{e.sourceLabel}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-ink3">
          {fmtDate(e.date)} · {INCOME_TYPE_LABELS[e.type]}
          {pro && e.taxTreatment && <Badge tone={e.taxTreatment === 'qualified' || e.taxTreatment === 'tax_free' ? 'gain' : 'neutral'}>{e.taxTreatment.replace('_', ' ')}</Badge>}
          {pro && owner && <span>· {owner.name}</span>}
          {pro && e.currency !== c && <span>· {e.currency}</span>}
        </span>
      </span>
      <span className="text-right">
        <span className={cn('tnum block text-[13px] font-semibold', e.status === 'received' ? 'text-ink' : 'text-ink3')}>
          {fmtMoney(convert(e.amount, e.currency, c), c)}
        </span>
        {pro && e.withholding ? <span className="text-[10px] text-warn">−{fmtMoney(convert(e.withholding, e.currency, c), c)} withheld</span> : null}
      </span>
    </div>
  )
}

function MonthCalendar({ month, events, currency, selDay, onSelect }: {
  month: number
  events: IncomeEvent[]
  currency: 'USD' | 'INR'
  selDay: string | null
  onSelect: (d: string | null) => void
}) {
  const first = new Date(2026, month, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(2026, month + 1, 0).getDate()
  const byDay = new Map<string, IncomeEvent[]>()
  for (const e of events) {
    const arr = byDay.get(e.date) ?? []
    arr.push(e)
    byDay.set(e.date, arr)
  }
  const today = month === 6 ? 20 : -1
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const iso = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const evts = byDay.get(iso) ?? []
          const total = evts.reduce((s, e) => s + convert(e.amount, e.currency, currency), 0)
          const isSel = selDay === iso
          return (
            <button
              key={i}
              onClick={() => onSelect(isSel ? null : evts.length ? iso : null)}
              className={cn(
                'relative flex min-h-[46px] flex-col items-center rounded-lg border p-1 transition-colors sm:min-h-[54px]',
                isSel ? 'border-brand bg-brand-soft' : evts.length ? 'border-line bg-surface2/50 hover:border-brand' : 'border-transparent',
                day === today && 'ring-1 ring-brass',
              )}
              aria-label={evts.length ? `${iso}: ${evts.length} payments totaling ${fmtMoney(total, currency)}` : iso}
            >
              <span className={cn('tnum text-[11px]', day === today ? 'font-bold text-brass' : evts.length ? 'font-medium text-ink' : 'text-ink3')}>{day}</span>
              {evts.length > 0 && (
                <>
                  <span className="mt-0.5 flex gap-0.5">
                    {evts.slice(0, 3).map((e, j) => (
                      <span key={j} className={cn('h-1.5 w-1.5 rounded-full border', e.status === 'received' ? 'border-gain bg-gain' : 'border-ink3')} />
                    ))}
                  </span>
                  <span className="tnum mt-0.5 hidden text-[9px] text-ink2 sm:block">{fmtMoney(total, currency, { compact: true })}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -- Pro analytics: per-holding yield table --------------------------------------- */

function ProIncomeAnalytics({ currency }: { currency: 'USD' | 'INR' }) {
  const rows = useMemo(() => {
    const out: { symbol: string; name: string; yoc: number; cur: number; growth?: number; annual: number; treatment: string; sustainability: 'strong' | 'stable' | 'watch'; confidence: number }[] = []
    const seen = new Set<string>()
    for (const p of POSITIONS) {
      const inst = INSTRUMENTS[p.symbol]
      if (!inst?.divPerShare || !inst.yieldPct || seen.has(p.symbol)) continue
      seen.add(p.symbol)
      const allQty = POSITIONS.filter((x) => x.symbol === p.symbol).reduce((s, x) => s + x.qty, 0)
      const allCost = POSITIONS.filter((x) => x.symbol === p.symbol).reduce((s, x) => s + x.lots.reduce((y, l) => y + l.qty * l.costPerUnit, 0), 0)
      const perYear = inst.divPerShare * (inst.divFrequency === 'monthly' ? 12 : inst.divFrequency === 'quarterly' ? 4 : inst.divFrequency === 'semiannual' ? 2 : 1)
      const annualNative = allQty * perYear
      out.push({
        symbol: p.symbol,
        name: inst.name,
        yoc: (annualNative / allCost) * 100,
        cur: inst.yieldPct,
        growth: inst.divGrowth5y,
        annual: convert(annualNative, inst.currency, currency),
        treatment: inst.assetClass === 'reit' ? 'Ordinary' : inst.currency === 'INR' ? 'Ordinary + 10% TDS' : 'Qualified',
        sustainability: (inst.divGrowth5y ?? 0) > 8 ? 'strong' : (inst.divGrowth5y ?? 0) > 3 ? 'stable' : 'watch',
        confidence: inst.divFrequency === 'monthly' || inst.divFrequency === 'quarterly' ? 0.92 : 0.75,
      })
    }
    return out.sort((a, b) => b.annual - a.annual)
  }, [currency])

  return (
    <Card pad={false} className="overflow-hidden">
      <div className="px-5 pt-4">
        <SectionHead title="Stream analytics" sub="Yield on cost vs current yield, growth, tax treatment and projection confidence" />
      </div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[760px] text-[12.5px]">
          <thead className="border-b border-line bg-surface2/60 text-[10.5px] uppercase tracking-wide text-ink3">
            <tr>
              <th className="px-5 py-2 text-left font-semibold">Source</th>
              <th className="px-3 py-2 text-right font-semibold">Annual income</th>
              <th className="px-3 py-2 text-right font-semibold">Yield on cost</th>
              <th className="px-3 py-2 text-right font-semibold">Current yield</th>
              <th className="px-3 py-2 text-right font-semibold">5y growth</th>
              <th className="px-3 py-2 text-left font-semibold">Tax treatment</th>
              <th className="px-3 py-2 text-left font-semibold">Sustainability</th>
              <th className="px-3 py-2 text-right font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-line last:border-0 hover:bg-surface2/50">
                <td className="px-5 py-2.5"><span className="font-semibold text-ink">{r.symbol}</span> <span className="hidden text-[11px] text-ink3 md:inline">{r.name}</span></td>
                <td className="tnum px-3 py-2.5 text-right font-medium">{fmtMoney(r.annual, currency, { compact: true })}</td>
                <td className="tnum px-3 py-2.5 text-right text-gain">{fmtPct(r.yoc)}</td>
                <td className="tnum px-3 py-2.5 text-right">{fmtPct(r.cur)}</td>
                <td className="tnum px-3 py-2.5 text-right">{r.growth ? fmtPct(r.growth) : '—'}</td>
                <td className="px-3 py-2.5 text-ink2">{r.treatment}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={r.sustainability === 'strong' ? 'gain' : r.sustainability === 'stable' ? 'neutral' : 'warn'}>
                    {r.sustainability === 'strong' ? 'Growing' : r.sustainability === 'stable' ? 'Stable' : 'Watch'}
                  </Badge>
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink2">{Math.round(r.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-[11px] text-ink3">
        Rent, syndication distributions and option premium are shown in the streams panel above; their projections carry lower confidence than declared dividends.
      </p>
    </Card>
  )
}
