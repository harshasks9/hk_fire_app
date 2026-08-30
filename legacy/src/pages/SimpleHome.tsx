import React, { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import {
  netWorthSnapshot,
  netWorthHistory,
  incomeAgg,
  groupedPositions,
  upcomingObligations,
  dataCompleteness,
} from '@/data/selectors'
import { SUGGESTIONS } from '@/data/suggestions'
import { INBOX_ITEMS } from '@/data/inbox'
import { WATCHLIST, anyInstrument } from '@/data/watchlist'
import { fmtMoney, fmtPct, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, ProgressBar, Skeleton } from '@/components/ui'
import { AreaChart, HBarStack, Sparkline, ProgressRing } from '@/components/charts'
import { SuggestionCard, ObligationRow, Freshness } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { allocationBy } from '@/data/selectors'
import { convert } from '@/data/fx'
import { priceHistory } from '@/data/instruments'

export default function SimpleHome() {
  const app = useApp()
  const c = app.currency
  const f = { memberId: app.memberId }
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [])

  const snap = useMemo(() => netWorthSnapshot(c, f), [c, app.memberId])
  const history = useMemo(() => netWorthHistory(c, 380), [c])
  const income = useMemo(() => incomeAgg(c, f), [c, app.memberId])
  const positions = useMemo(() => groupedPositions(c, f), [c, app.memberId])
  const alloc = useMemo(() => allocationBy('assetClass', c, f), [c, app.memberId])
  const obligations = useMemo(() => upcomingObligations().slice(0, 5), [])
  const dq = dataCompleteness()

  const attention = useMemo(() => {
    const items: { icon: any; tone: string; title: string; to: string; sub?: string }[] = []
    for (const s of SUGGESTIONS) {
      const st = app.suggestionStatus[s.id] ?? s.status
      if (s.category === 'alert' && st === 'open')
        items.push({ icon: 'alert', tone: 'loss', title: s.title, to: '/inbox', sub: s.urgency === 'today' ? 'Decide today' : 'This week' })
    }
    for (const i of INBOX_ITEMS) {
      const st = app.inboxStatus[i.id] ?? i.status
      if (i.severity === 'high' && st === 'open')
        items.push({ icon: 'inbox', tone: 'warn', title: i.simpleTitle, to: '/inbox', sub: 'Needs review' })
    }
    items.push({ icon: 'file', tone: 'info', title: 'A new Fidelity statement is ready to review', to: '/documents/review/doc-fid-jul', sub: 'Adds $126,500 if approved' })
    return items.slice(0, 5)
  }, [app.suggestionStatus, app.inboxStatus])

  const recommendations = useMemo(
    () =>
      SUGGESTIONS.filter(
        (s) => (app.suggestionStatus[s.id] ?? s.status) === 'open' && (s.category === 'recommendation' || s.category === 'opportunity'),
      ).slice(0, 3),
    [app.suggestionStatus],
  )

  const rangeDays = { '1M': 30, '3M': 92, YTD: 200, '1Y': 366, ALL: 380 }[app.dateRange]
  const series = history.slice(-rangeDays)

  if (loading) return <HomeSkeleton />

  return (
    <div className="fade-up space-y-5">
      {/* ---- Where do I stand ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" pad>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-wide text-ink3">
                Net worth
                <Badge tone="neutral">{app.memberId ? 'Filtered' : 'Household'}</Badge>
              </div>
              <div className="tnum font-display mt-1 text-[34px] font-semibold leading-none tracking-tight text-ink">
                {fmtMoney(snap.total, c)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px]">
                <span className="flex items-center gap-1"><span className="text-ink3">Today</span><Delta value={snap.dayChange} currency={c} /></span>
                <span className="flex items-center gap-1"><span className="text-ink3">This month</span><Delta value={snap.monthChange} currency={c} pct={snap.monthChangePct} /></span>
              </div>
            </div>
            <div className="flex gap-1 rounded-ctl border border-line bg-surface2 p-0.5">
              {(['1M', '3M', 'YTD', '1Y', 'ALL'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => app.setDateRange(r)}
                  className={cn('rounded-[7px] px-2 py-1 text-[11px] font-medium', app.dateRange === r ? 'bg-surface text-ink shadow-card' : 'text-ink3 hover:text-ink')}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <AreaChart
            data={series.map((p) => p.total)}
            labels={series.map((p) => fmtDate(p.date, 'short'))}
            height={190}
            currency={c}
            className="mt-3"
            summary={`Net worth over ${app.dateRange}: from ${fmtMoney(series[0].total, c, { compact: true })} to ${fmtMoney(series[series.length - 1].total, c, { compact: true })}`}
          />
          {/* Plain-language change explanation */}
          <div className="mt-3 rounded-xl bg-surface2/70 p-3.5 text-[12.5px] leading-relaxed text-ink2">
            <span className="font-semibold text-ink">Why it changed: </span>
            the past month moved {fmtMoney(snap.monthChange, c, { compact: true })} — the same figure as the chart above, taken
            from its last 30 points. A true source-by-source attribution (market vs contributions vs FX) needs
            transaction-level records, which this sample household illustrates rather than computes.
            <Link to="/timeline" className="ml-1 font-medium text-brand hover:underline">See the story →</Link>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card pad>
            <SectionHead title="Assets vs. liabilities" />
            <div className="space-y-3">
              <BarRow label="What you own" value={snap.assets} max={snap.assets} currency={c} tone="bg-brand" />
              <BarRow label="What you owe" value={snap.liabilities} max={snap.assets} currency={c} tone="bg-loss/70" />
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1.5 flex justify-between text-[11.5px] text-ink2">
                <span>Liquid {fmtMoney(snap.liquid, c, { compact: true })}</span>
                <span>Illiquid {fmtMoney(snap.illiquid, c, { compact: true })}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full">
                <div className="bg-chart-3" style={{ width: `${(snap.liquid / (snap.liquid + snap.illiquid)) * 100}%` }} />
                <div className="bg-chart-2" style={{ width: `${(snap.illiquid / (snap.liquid + snap.illiquid)) * 100}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink3">
                {Math.round((snap.liquid / (snap.liquid + snap.illiquid)) * 100)}% of your wealth could be turned into cash within a week.
              </p>
            </div>
          </Card>

          <Card pad className="flex items-center gap-4">
            <ProgressRing pct={dq.pct} size={58} tone="var(--m-chart-1)" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">Data completeness</div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-ink2">{dq.issues} items need review — mostly one stale property value and a cost-basis check.</p>
              <Link to="/inbox" className="mt-1 inline-block text-[12px] font-medium text-brand hover:underline">Review now →</Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ---- What needs attention / recommended actions ---- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Needs your attention" sub={`${attention.length} items — never more than five`} right={<Link to="/inbox" className="text-[12px] font-medium text-brand hover:underline">All →</Link>} />
          <div>
            {attention.map((a, i) => (
              <Link key={i} to={a.to} className="group flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  a.tone === 'loss' ? 'bg-loss-soft text-loss' : a.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info')}>
                  <Icon name={a.icon} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink group-hover:text-brand">{a.title}</span>
                  {a.sub && <span className="text-[11px] text-ink3">{a.sub}</span>}
                </span>
                <Icon name="chevronRight" size={14} className="shrink-0 text-ink3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <SectionHead title="Consider doing" sub="Up to three suggested actions, each fully explained" className="mb-0 px-1" />
          {recommendations.length === 0 && (
            <Card pad className="py-8 text-center text-[12.5px] text-ink2">Nothing suggested right now — you're all caught up.</Card>
          )}
          {recommendations.map((s) => (
            <SuggestionCard key={s.id} s={s} compact />
          ))}
        </div>
      </div>

      {/* ---- Portfolio + income ---- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" pad>
          <SectionHead
            title="Portfolio"
            sub={`${fmtMoney(snap.investable, c, { compact: true })} across ${positions.length} investments`}
            right={<Link to="/portfolio" className="text-[12px] font-medium text-brand hover:underline">Open →</Link>}
          />
          <HBarStack slices={alloc.slice(0, 6).map((a) => ({ label: a.label, value: a.value }))} currency={c} />
          <div className="mt-4">
            <div className="mb-1 grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3 sm:grid-cols-[1fr_90px_110px_90px]">
              <span>Top positions</span>
              <span className="hidden text-right sm:block">Today</span>
              <span className="text-right">Value</span>
              <span className="text-right">Total gain</span>
            </div>
            {positions.slice(0, 5).map((p) => (
              <Link key={p.symbol} to={`/position/${p.symbol}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface2 sm:grid-cols-[1fr_90px_110px_90px]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{p.symbol.slice(0, 4)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-ink">{p.name}</span>
                    <span className="text-[10.5px] text-ink3">{p.weightPct.toFixed(1)}% of portfolio</span>
                  </span>
                </span>
                <span className="hidden justify-end sm:flex"><Delta pct={p.dayChangePct} /></span>
                <span className="tnum text-right text-[13px] font-semibold text-ink">{fmtMoney(p.value, c, { compact: true })}</span>
                <span className="flex justify-end"><Delta value={p.unrealized} currency={c} arrow={false} /></span>
              </Link>
            ))}
          </div>
        </Card>

        <Card pad>
          <SectionHead title="Passive income" right={<Link to="/income" className="text-[12px] font-medium text-brand hover:underline">Open →</Link>} />
          <div className="tnum font-display text-[26px] font-semibold text-ink">{fmtMoney(income.monthReceived + income.monthExpected, c, { compact: true })}</div>
          <div className="text-[11.5px] text-ink2">expected in July · {fmtMoney(income.monthReceived, c, { compact: true })} already received</div>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <KVRow k="This year so far" v={fmtMoney(income.ytdReceived, c, { compact: true })} />
            <KVRow k="Full-year run rate" v={fmtMoney(income.forwardAnnual, c, { compact: true })} />
            {income.next && (
              <KVRow
                k="Next payment"
                v={`${income.next.sourceLabel} · ${fmtMoney(convert(income.next.amount, income.next.currency, c), c, { compact: true })} · ${fmtDate(income.next.date, 'short')}`}
              />
            )}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <SectionHead title="Coming up" className="mb-1" />
            {obligations.slice(0, 4).map((o, i) => (
              <ObligationRow key={i} date={o.date} label={o.label} amount={o.amount} currency={o.currency} displayCurrency={c} />
            ))}
          </div>
        </Card>
      </div>

      {/* ---- Watchlist strip ---- */}
      <Card pad>
        <SectionHead title="Watchlist" sub="Sample prices and series — no market-data feed is connected" right={<Link to="/watchlist" className="text-[12px] font-medium text-brand hover:underline">Manage →</Link>} />
        <div className="scroll-thin -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {WATCHLIST.filter((w) => !app.removedWatch.includes(w.id)).map((w) => {
            const inst = anyInstrument(w.symbol)
            if (!inst) return null
            const chg = ((inst.price - inst.prevClose) / inst.prevClose) * 100
            const nearTarget = inst.price <= w.targetPrice * 1.03
            return (
              <Link key={w.id} to="/watchlist" className="min-w-[168px] shrink-0 rounded-xl border border-line bg-surface2/50 p-3 transition-colors hover:border-brand">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-ink">{w.symbol}</span>
                  <Delta pct={chg} />
                </div>
                <div className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                  {inst.currency === 'INR' ? '₹' : '$'}{inst.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <Sparkline data={priceHistory(w.symbol, 60)} width={140} height={26} className="mt-1" />
                <div className={cn('mt-1 text-[10.5px]', nearTarget ? 'font-medium text-brass' : 'text-ink3')}>
                  {nearTarget ? '● Near your target' : `Target ${inst.currency === 'INR' ? '₹' : '$'}${w.targetPrice.toLocaleString()}`}
                </div>
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function BarRow({ label, value, max, currency, tone }: { label: string; value: number; max: number; currency: any; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-ink2">{label}</span>
        <span className="tnum font-semibold text-ink">{fmtMoney(value, currency, { compact: true })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function KVRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12px]">
      <span className="text-ink2">{k}</span>
      <span className="tnum text-right font-medium text-ink">{v}</span>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading your financial briefing">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-9 w-52" />
          <Skeleton className="mt-4 h-[190px] w-full" />
        </div>
        <div className="space-y-5">
          <div className="rounded-card border border-line bg-surface p-5"><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-24 w-full" /></div>
          <div className="rounded-card border border-line bg-surface p-5"><Skeleton className="h-16 w-full" /></div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-5"><Skeleton className="h-40 w-full" /></div>
        <div className="rounded-card border border-line bg-surface p-5"><Skeleton className="h-40 w-full" /></div>
      </div>
    </div>
  )
}
