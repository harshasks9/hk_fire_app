import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import {
  netWorthSnapshot,
  netWorthHistory,
  incomeAgg,
  positionMetrics,
  allocationBy,
  liabilityTotals,
  allStrategyMetrics,
  optionsPremiumYtd,
  propertyMetrics,
  dataCompleteness,
  portfolioHistory,
} from '@/data/selectors'
import { PROPERTIES, SYNDICATIONS } from '@/data/realestate'
import { GOALS } from '@/data/goals'
import { SUGGESTIONS } from '@/data/suggestions'
import { TAX_SUMMARIES } from '@/data/tax'
import { BENCHMARKS } from '@/data/instruments'
import { walkTo } from '@/data/rng'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Button, ProgressBar, Modal, Toggle } from '@/components/ui'
import { AreaChart, Waterfall, DonutRing, HBarStack, MonthBars, ProgressRing, CHART_COLORS } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { CATEGORY_META } from '@/components/finance'
import { ACCOUNTS } from '@/data/household'

interface ModuleDef {
  id: string
  title: string
  question: string // the financial question this module answers
  defaultSize: 1 | 2
  render: (ctx: Ctx) => React.ReactNode
}

interface Ctx {
  c: 'USD' | 'INR'
  memberId?: string
  accountId?: string
  rangeDays: number
}

const MODULES: ModuleDef[] = [
  {
    id: 'networth',
    title: 'Net worth',
    question: 'How is total wealth trending?',
    defaultSize: 2,
    render: ({ c, rangeDays }) => {
      const hist = netWorthHistory(c).slice(-rangeDays)
      const snap = netWorthSnapshot(c)
      return (
        <>
          <div className="flex items-baseline gap-3">
            <span className="tnum font-display text-[24px] font-semibold text-ink">{fmtMoney(snap.total, c, { compact: true })}</span>
            <Delta value={snap.monthChange} currency={c} pct={snap.monthChangePct} />
          </div>
          <AreaChart data={hist.map((p) => p.total)} labels={hist.map((p) => fmtDate(p.date, 'short'))} height={150} currency={c} className="mt-2" />
        </>
      )
    },
  },
  {
    id: 'performance',
    title: 'Performance vs benchmark',
    question: 'Am I beating my benchmark?',
    defaultSize: 2,
    render: ({ c, rangeDays }) => {
      const port = portfolioHistory(c).slice(-rangeDays)
      const base = port[0]
      // Normalize, then scale to a realistic cumulative TWR for the window
      const targetReturn = rangeDays > 300 ? 14.6 : rangeDays > 150 ? 9.8 : rangeDays > 60 ? 4.1 : 1.9
      const raw = port.map((v) => (v / base - 1) * 100)
      const scale = raw[raw.length - 1] !== 0 ? targetReturn / raw[raw.length - 1] : 1
      const normPort = raw.map((v) => v * scale)
      const benchTarget = rangeDays > 300 ? BENCHMARKS.SP500.oneYearPct * 0.75 : BENCHMARKS.SP500.ytdPct
      const bench = walkTo(benchTarget, rangeDays, BENCHMARKS.SP500.seed, 0.006, 0.0004)
      return (
        <>
          <div className="mb-1 flex gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-1" />Portfolio TWR <b className="tnum">+{normPort[normPort.length - 1].toFixed(1)}%</b></span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-2" />{BENCHMARKS.SP500.label} <b className="tnum">+{bench[bench.length - 1].toFixed(1)}%</b></span>
          </div>
          <PerfChart a={normPort} b={bench} />
          <p className="mt-1 text-[11px] text-ink3">Time-weighted, net of fees, in {c}. MWR (money-weighted): +11.2% — differs due to contribution timing.</p>
        </>
      )
    },
  },
  {
    id: 'attribution',
    title: 'This month, explained',
    question: 'What drove the change?',
    defaultSize: 2,
    render: ({ c }) => (
      <>
        <Waterfall
          currency={c}
          height={180}
          items={[
            { label: 'Market', value: convert(31_900, 'USD', c) },
            { label: 'Contrib.', value: convert(4_800, 'USD', c) },
            { label: 'Income', value: convert(3_050, 'USD', c) },
            { label: 'Debt paid', value: convert(1_500, 'USD', c) },
            { label: 'Spending', value: convert(-2_450, 'USD', c) },
            { label: 'FX (INR)', value: convert(-600, 'USD', c) },
            { label: 'Net change', value: convert(38_200, 'USD', c), isTotal: true },
          ]}
          summary="Net-worth bridge from June 1 to July 20: +$38,200"
        />
        <p className="mt-1 text-[11px] text-ink3">
          {fmtMoney(convert(2_501_800, 'USD', c), c, { compact: true })} on Jun 1 → {fmtMoney(convert(2_540_000, 'USD', c), c, { compact: true })} on Jul 20.
        </p>
      </>
    ),
  },
  {
    id: 'allocation',
    title: 'Asset allocation',
    question: 'Where is my wealth concentrated?',
    defaultSize: 1,
    render: (ctx) => {
      const alloc = allocationBy('assetClass', ctx.c, { memberId: ctx.memberId, accountId: ctx.accountId }, { includeNonPortfolio: true })
      return (
        <div>
          <div className="flex justify-center">
            <DonutRing
              slices={alloc.slice(0, 7).map((a, i) => ({ label: a.label, value: a.value }))}
              size={132}
              thickness={18}
              centerTitle="Total"
              centerValue={fmtMoney(alloc.reduce((s, a) => s + a.value, 0), ctx.c, { compact: true })}
            />
          </div>
          <div className="mt-3 space-y-1">
            {alloc.slice(0, 6).map((a, i) => (
              <div key={a.key} className="flex items-center gap-2 text-[11.5px]">
                <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: CHART_COLORS[i % 8] }} />
                <span className="min-w-0 flex-1 truncate text-ink2">{a.label}</span>
                <span className="tnum font-medium text-ink">{a.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
  },
  {
    id: 'sector',
    title: 'Sector exposure',
    question: 'Which sectors dominate my equities?',
    defaultSize: 1,
    render: (ctx) => {
      const secs = allocationBy('sector', ctx.c, { memberId: ctx.memberId, accountId: ctx.accountId }).slice(0, 6)
      return (
        <div className="space-y-2">
          {secs.map((s) => (
            <div key={s.key}>
              <div className="mb-0.5 flex justify-between text-[11.5px]"><span className="text-ink2">{s.label}</span><span className="tnum text-ink">{s.pct.toFixed(1)}%</span></div>
              <ProgressBar pct={s.pct} tone={s.pct > 35 ? 'warn' : 'brand'} height="h-1" />
            </div>
          ))}
          {secs[0]?.pct > 35 && <p className="text-[10.5px] text-warn">⚠ {secs[0].label} exceeds your 35% sector guideline.</p>}
        </div>
      )
    },
  },
  {
    id: 'geography',
    title: 'Geography',
    question: 'How globally spread am I?',
    defaultSize: 1,
    render: (ctx) => {
      const geo = allocationBy('geography', ctx.c, { memberId: ctx.memberId, accountId: ctx.accountId })
      return <HBarStack slices={geo.map((g) => ({ label: g.label, value: g.value }))} currency={ctx.c} height={12} />
    },
  },
  {
    id: 'currency',
    title: 'Currency exposure',
    question: 'What happens if the rupee moves?',
    defaultSize: 1,
    render: (ctx) => {
      const cur = allocationBy('currency', ctx.c, { memberId: ctx.memberId }, { includeNonPortfolio: true })
      return (
        <>
          <HBarStack slices={cur.map((g) => ({ label: g.label, value: g.value }))} currency={ctx.c} height={12} />
          <p className="mt-2 text-[11px] leading-relaxed text-ink3">
            A 5% INR depreciation would reduce household net worth by ≈ {fmtMoney(convert(19_800, 'USD', ctx.c), ctx.c, { compact: true })} (0.8%).
          </p>
        </>
      )
    },
  },
  {
    id: 'liquidity',
    title: 'Liquidity ladder',
    question: 'How fast can I raise cash?',
    defaultSize: 1,
    render: ({ c }) => {
      const snap = netWorthSnapshot(c)
      const rows = [
        { label: 'Same day (cash)', v: snap.cash },
        { label: '2–3 days (listed securities)', v: snap.investable * 0.9 },
        { label: 'Months (real estate)', v: snap.realEstateValue },
        { label: 'Years (private, RSU vesting)', v: snap.privateValue + snap.investable * 0.1 },
      ]
      const max = Math.max(...rows.map((r) => r.v))
      return (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-0.5 flex justify-between text-[11.5px]"><span className="text-ink2">{r.label}</span><span className="tnum text-ink">{fmtMoney(r.v, c, { compact: true })}</span></div>
              <ProgressBar pct={(r.v / max) * 100} tone="brand" height="h-1" />
            </div>
          ))}
        </div>
      )
    },
  },
  {
    id: 'leverage',
    title: 'Leverage',
    question: 'How much debt am I carrying, and against what?',
    defaultSize: 1,
    render: ({ c }) => {
      const snap = netWorthSnapshot(c)
      const lt = liabilityTotals(c)
      const ratio = (lt.balance / snap.assets) * 100
      return (
        <>
          <div className="flex items-baseline justify-between">
            <span className="tnum font-display text-[22px] font-semibold text-ink">{fmtPct(ratio)}</span>
            <span className="text-[11px] text-ink3">debt / assets</span>
          </div>
          <ProgressBar pct={ratio} tone={ratio > 40 ? 'warn' : 'brand'} className="mt-1.5" />
          <div className="mt-3 space-y-1.5 text-[11.5px]">
            <div className="flex justify-between"><span className="text-ink2">Weighted rate</span><span className="tnum text-ink">{lt.weightedRate.toFixed(2)}%</span></div>
            <div className="flex justify-between"><span className="text-ink2">Monthly service</span><span className="tnum text-ink">{fmtMoney(lt.monthlyPayment, c, { compact: true })}</span></div>
            <div className="flex justify-between"><span className="text-ink2">Floating-rate share</span><span className="tnum text-warn">7.7%</span></div>
          </div>
        </>
      )
    },
  },
  {
    id: 'income',
    title: 'Passive income',
    question: 'Is income arriving as expected?',
    defaultSize: 2,
    render: (ctx) => {
      const agg = incomeAgg(ctx.c, { memberId: ctx.memberId })
      const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
      return (
        <MonthBars
          months={agg.byMonth.map((m, i) => ({ label: monthNames[i], a: m.received, b: m.expected }))}
          currency={ctx.c}
          height={150}
          highlightMonth={6}
        />
      )
    },
  },
  {
    id: 'tax',
    title: 'Tax exposure',
    question: 'What will I owe, and where?',
    defaultSize: 1,
    render: ({ c }) => (
      <div className="space-y-2.5">
        {TAX_SUMMARIES.map((t) => (
          <div key={t.jurisdiction} className="rounded-lg border border-line p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-ink">{t.jurisdiction === 'US' ? '🇺🇸 United States' : '🇮🇳 India'}</span>
              <Badge tone="warn">Estimate</Badge>
            </div>
            <div className="tnum mt-1 text-[17px] font-semibold text-ink">{fmtMoney(convert(t.estimatedObligation, t.currency, c), c, { compact: true })}</div>
            <div className="text-[10.5px] text-ink3">est. 2026 obligation · next: {t.deadlines[0].label} ({fmtDate(t.deadlines[0].date, 'short')})</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'options',
    title: 'Options exposure',
    question: 'What could be assigned or expire?',
    defaultSize: 1,
    render: ({ c }) => {
      const strategies = allStrategyMetrics()
      const high = strategies.filter((s) => s.assignmentRisk === 'high')
      return (
        <>
          <div className="flex items-baseline justify-between">
            <span className="tnum font-display text-[22px] font-semibold text-ink">{fmtMoney(optionsPremiumYtd(c), c, { compact: true })}</span>
            <span className="text-[11px] text-ink3">premium YTD</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {strategies.slice(0, 4).map((s) => (
              <Link to="/options" key={s.strategy.id} className="flex items-center justify-between rounded-lg border border-line px-2 py-1.5 text-[11.5px] hover:border-brand">
                <span className="font-medium text-ink">{s.strategy.underlying} <span className="text-ink3">{s.daysToExpiry}d</span></span>
                {s.assignmentRisk === 'high' ? <Badge tone="loss" icon="alert">Assignment</Badge> : <Delta value={s.pnl} currency="USD" arrow={false} />}
              </Link>
            ))}
          </div>
        </>
      )
    },
  },
  {
    id: 'realestate',
    title: 'Real estate equity',
    question: 'How much equity sits in property?',
    defaultSize: 1,
    render: ({ c }) => (
      <div className="space-y-2.5">
        {PROPERTIES.map((p) => {
          const m = propertyMetrics(p.id)!
          const equityC = convert(m.equity, p.currency, c)
          const valueC = convert(m.currentValue, p.currency, c)
          return (
            <Link to={`/real-estate/${p.id}`} key={p.id} className="block rounded-lg border border-line p-2.5 hover:border-brand">
              <div className="flex justify-between text-[11.5px]"><span className="font-medium text-ink">{p.name}</span><span className="tnum text-ink">{fmtMoney(equityC, c, { compact: true })}</span></div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-line">
                <div className="bg-chart-1" style={{ width: `${(m.equity / m.currentValue) * 100}%` }} />
                <div className="bg-chart-4/60" style={{ width: `${(m.mortgageBalance / m.currentValue) * 100}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-ink3">{((m.equity / m.currentValue) * 100).toFixed(0)}% equity of {fmtMoney(valueC, c, { compact: true })}</div>
            </Link>
          )
        })}
      </div>
    ),
  },
  {
    id: 'commitments',
    title: 'Capital commitments',
    question: 'What cash am I still on the hook for?',
    defaultSize: 1,
    render: ({ c }) => (
      <div className="space-y-2.5">
        {SYNDICATIONS.map((s) => {
          const unfunded = s.committed - s.called
          return (
            <div key={s.id} className="rounded-lg border border-line p-2.5">
              <div className="flex justify-between text-[11.5px]"><span className="font-medium text-ink">{s.name}</span><span className="tnum text-warn">{fmtMoney(convert(unfunded, s.currency, c), c, { compact: true })} unfunded</span></div>
              <ProgressBar pct={(s.called / s.committed) * 100} tone="brass" className="mt-1.5" height="h-1" />
              <div className="mt-1 text-[10px] text-ink3">
                {((s.called / s.committed) * 100).toFixed(0)}% called{s.nextCapitalCall ? ` · next call ${fmtMoney(convert(s.nextCapitalCall.amount, s.currency, c), c, { compact: true })} on ${fmtDate(s.nextCapitalCall.date, 'short')}` : ''}
              </div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    id: 'goals',
    title: 'Goal progress',
    question: 'Am I on track?',
    defaultSize: 1,
    render: ({ c }) => (
      <div className="space-y-2.5">
        {GOALS.map((g) => (
          <Link to="/plan" key={g.id} className="block">
            <div className="mb-0.5 flex justify-between text-[11.5px]">
              <span className="text-ink2">{g.name}</span>
              <span className={cn('font-medium', g.onTrack === 'on_track' ? 'text-gain' : 'text-warn')}>{g.onTrack === 'on_track' ? 'On track' : 'At risk'}</span>
            </div>
            <ProgressBar pct={(g.currentFunding / g.targetAmount) * 100} tone={g.onTrack === 'on_track' ? 'brand' : 'warn'} height="h-1.5" />
          </Link>
        ))}
      </div>
    ),
  },
  {
    id: 'dataquality',
    title: 'Data quality',
    question: 'Can I trust these numbers?',
    defaultSize: 1,
    render: () => {
      const dq = dataCompleteness()
      return (
        <div className="flex items-center gap-4">
          <ProgressRing pct={dq.pct} size={64} />
          <div className="space-y-1 text-[11.5px]">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gain" /><span className="text-ink2">{dq.verifiedPct}% verified or confirmed</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn" /><span className="text-ink2">1 stale valuation</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-loss" /><span className="text-ink2">1 conflict to resolve</span></div>
            <Link to="/inbox" className="font-medium text-brand hover:underline">Open inbox →</Link>
          </div>
        </div>
      )
    },
  },
  {
    id: 'queue',
    title: 'Recommendation queue',
    question: 'What actions are waiting on me?',
    defaultSize: 1,
    render: () => (
      <div className="space-y-1.5">
        {SUGGESTIONS.filter((s) => s.status === 'open').slice(0, 5).map((s) => {
          const meta = CATEGORY_META[s.category]
          return (
            <Link to="/inbox" key={s.id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-[11.5px] hover:border-brand">
              <Icon name={meta.icon} size={12} className={meta.tone === 'loss' ? 'text-loss' : meta.tone === 'brass' ? 'text-brass' : 'text-brand'} />
              <span className="min-w-0 flex-1 truncate text-ink">{s.title}</span>
            </Link>
          )
        })}
      </div>
    ),
  },
]

function PerfChart({ a, b }: { a: number[]; b: number[] }) {
  // Render two normalized % series using AreaChart's compare option
  return (
    <AreaChart
      data={a.map((v) => v)}
      compare={b}
      height={140}
      currency="USD"
      showAxis={false}
      seriesLabel="Portfolio"
      compareLabel="S&P 500"
      summary="Portfolio return vs S&P 500"
    />
  )
}

export default function ProOverview() {
  const app = useApp()
  const c = app.currency
  const [customize, setCustomize] = useState(false)
  const [accountId, setAccountId] = useState<string | undefined>(undefined)
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('meridian.dash.enabled') || 'null') ?? Object.fromEntries(MODULES.map((m) => [m.id, true]))
    } catch {
      return Object.fromEntries(MODULES.map((m) => [m.id, true]))
    }
  })
  const [sizes, setSizes] = useState<Record<string, 1 | 2>>(() => {
    try {
      return JSON.parse(localStorage.getItem('meridian.dash.sizes') || 'null') ?? Object.fromEntries(MODULES.map((m) => [m.id, m.defaultSize]))
    } catch {
      return Object.fromEntries(MODULES.map((m) => [m.id, m.defaultSize]))
    }
  })

  const persist = (e: Record<string, boolean>, s: Record<string, 1 | 2>) => {
    localStorage.setItem('meridian.dash.enabled', JSON.stringify(e))
    localStorage.setItem('meridian.dash.sizes', JSON.stringify(s))
  }

  const rangeDays = { '1M': 30, '3M': 92, YTD: 200, '1Y': 366, ALL: 380 }[app.dateRange]
  const ctx: Ctx = { c, memberId: app.memberId, accountId, rangeDays }

  const exportCsv = () => {
    const rows = positionMetrics(c, { memberId: app.memberId, accountId })
    const csv = ['Symbol,Name,Account,Qty,Value,Cost,Unrealized,Weight%']
      .concat(rows.map((r) => `${r.symbol},"${r.name}","${r.accountLabel}",${r.qty},${r.value.toFixed(0)},${r.cost.toFixed(0)},${r.unrealized.toFixed(0)},${r.weightPct.toFixed(2)}`))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'meridian-overview.csv'
    a.click()
  }

  return (
    <div className="fade-up space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={accountId ?? ''}
          onChange={(e) => setAccountId(e.target.value || undefined)}
          className="h-9 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-brand"
          aria-label="Filter by account"
        >
          <option value="">All accounts</option>
          {ACCOUNTS.map((a) => (
            <option key={a.id} value={a.id}>{a.institution} — {a.name}</option>
          ))}
        </select>
        <div className="flex gap-1 rounded-ctl border border-line bg-surface2 p-0.5">
          {(['1M', '3M', 'YTD', '1Y', 'ALL'] as const).map((r) => (
            <button key={r} onClick={() => app.setDateRange(r)} className={cn('rounded-[7px] px-2 py-1 text-[11px] font-medium', app.dateRange === r ? 'bg-surface text-ink shadow-card' : 'text-ink3 hover:text-ink')}>
              {r}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" icon="download" onClick={exportCsv}>Export</Button>
          <Button size="sm" variant="secondary" icon="settings" onClick={() => setCustomize(true)}>Customize</Button>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULES.filter((m) => enabled[m.id]).map((m) => (
          <Card key={m.id} pad className={cn('group relative', sizes[m.id] === 2 ? 'md:col-span-2' : '')}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[13px] font-semibold text-ink">{m.title}</h3>
                <p className="text-[10.5px] text-ink3">{m.question}</p>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  title={sizes[m.id] === 2 ? 'Shrink' : 'Expand'}
                  onClick={() => { const s = { ...sizes, [m.id]: (sizes[m.id] === 2 ? 1 : 2) as 1 | 2 }; setSizes(s); persist(enabled, s) }}
                  className="hidden rounded-md p-1 text-ink3 hover:bg-surface2 hover:text-ink md:block"
                >
                  <Icon name={sizes[m.id] === 2 ? 'chevronLeft' : 'chevronRight'} size={13} />
                </button>
                <button
                  title="Remove module"
                  onClick={() => { const e = { ...enabled, [m.id]: false }; setEnabled(e); persist(e, sizes) }}
                  className="rounded-md p-1 text-ink3 hover:bg-surface2 hover:text-loss"
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            </div>
            {m.render(ctx)}
          </Card>
        ))}
      </div>

      <Modal open={customize} onClose={() => setCustomize(false)} title="Customize dashboard">
        <p className="mb-3 text-[12.5px] text-ink2">Choose which modules appear on your overview. Layout is saved to this device.</p>
        <div className="space-y-1.5">
          {MODULES.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <div>
                <div className="text-[13px] font-medium text-ink">{m.title}</div>
                <div className="text-[11px] text-ink3">{m.question}</div>
              </div>
              <Toggle checked={!!enabled[m.id]} onChange={(v) => { const e = { ...enabled, [m.id]: v }; setEnabled(e); persist(e, sizes) }} label={`Show ${m.title}`} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => {
            const e = Object.fromEntries(MODULES.map((m) => [m.id, true]))
            const s = Object.fromEntries(MODULES.map((m) => [m.id, m.defaultSize])) as Record<string, 1 | 2>
            setEnabled(e); setSizes(s); persist(e, s)
          }}>Reset layout</Button>
          <Button variant="primary" onClick={() => setCustomize(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  )
}
