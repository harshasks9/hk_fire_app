import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { netWorthBreakdown } from '@/store/selectors'
import { mulberry32 } from '@/data/rng'
import { fmtMoney } from '@/lib/format'
import { Badge, Button, Card, EmptyState, KV, SectionHead } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { cn } from '@/lib/cn'

interface Assumptions {
  startOverride: number | null
  currentAge: number
  retireAge: number
  planToAge: number
  monthlySavings: number
  annualSpend: number
  returnPct: number
  volPct: number
  inflationPct: number
}

const DEFAULTS: Assumptions = {
  startOverride: null,
  currentAge: 40,
  retireAge: 50,
  planToAge: 90,
  monthlySavings: 5000,
  annualSpend: 120000,
  returnPct: 6,
  volPct: 12,
  inflationPct: 3,
}

const KEY = 'meridian.personal.scenarios'

function loadAssumptions(): Assumptions {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Assumptions>) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export default function PersonalScenarios() {
  const app = useApp()
  const store = useStore()
  const c = app.currency
  const [a, setA] = useState<Assumptions>(loadAssumptions)
  const [showMc, setShowMc] = useState(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(a))
  }, [a])

  const nw = useMemo(() => netWorthBreakdown(store, c), [store, c])
  const hasBase = store.accounts.length + store.assets.length > 0
  const start = a.startOverride ?? (hasBase ? nw.netWorth : 0)

  const yearsToRetire = Math.max(0, a.retireAge - a.currentAge)
  const yearsTotal = Math.max(1, a.planToAge - a.currentAge)

  const project = (returnAdj: number) => {
    const pts: number[] = []
    let v = start
    const r = a.returnPct / 100 + returnAdj
    for (let y = 0; y <= yearsTotal; y++) {
      pts.push(v)
      const spend = a.annualSpend * Math.pow(1 + a.inflationPct / 100, y)
      if (y < yearsToRetire) v = v * (1 + r) + a.monthlySavings * 12
      else v = v * (1 + r) - spend
      if (v < 0) v = 0
    }
    return pts
  }

  const base = useMemo(() => project(0), [a, start])
  const upside = useMemo(() => project(0.015), [a, start])
  const downside = useMemo(() => project(-0.02), [a, start])
  const depletedYear = base.findIndex((v, i) => i > yearsToRetire && v <= 0)

  const mc = useMemo(() => {
    if (!showMc) return null
    const rnd = mulberry32(42)
    const normal = () => {
      const u = 1 - rnd()
      const v = rnd()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }
    const endings: number[] = []
    let success = 0
    for (let p = 0; p < 500; p++) {
      let v = start
      let ok = true
      for (let y = 0; y <= yearsTotal; y++) {
        const r = a.returnPct / 100 + (a.volPct / 100) * normal()
        const spend = a.annualSpend * Math.pow(1 + a.inflationPct / 100, y)
        if (y < yearsToRetire) v = v * (1 + r) + a.monthlySavings * 12
        else v = v * (1 + r) - spend
        if (v <= 0) { ok = false; v = 0; break }
      }
      endings.push(v)
      if (ok) success++
    }
    endings.sort((x, y) => x - y)
    return {
      successPct: (success / 500) * 100,
      p10: endings[Math.floor(500 * 0.1)],
      p50: endings[Math.floor(500 * 0.5)],
      p90: endings[Math.floor(500 * 0.9)],
    }
  }, [showMc, a, start])

  if (!hasBase && a.startOverride === null) {
    return (
      <Card pad={false} className="fade-up">
        <EmptyState
          icon="compass"
          title="Projections need a starting point"
          body="Add your accounts so net worth is real, or set a starting amount by hand below — the model will not invent one."
          action={
            <div className="flex gap-2">
              <Link to="/balances"><Button variant="primary" icon="plus">Add accounts</Button></Link>
              <Button onClick={() => setA((x) => ({ ...x, startOverride: 0 }))}>Enter a number manually</Button>
            </div>
          }
        />
      </Card>
    )
  }

  const labelCls = 'flex items-center justify-between text-[11.5px] font-medium text-ink2'
  const years = Array.from({ length: yearsTotal + 1 }, (_, i) => a.currentAge + i)

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <SectionHead
          title="Projection"
          sub={`Starting from ${a.startOverride !== null ? 'a number you set' : 'your live net worth'} (${fmtMoney(start, c)}). Every input below is your assumption — labeled and editable, never measured.`}
          right={<Button size="sm" onClick={() => setA({ ...DEFAULTS })}>Reset</Button>}
        />
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className={labelCls}><span>Starting amount</span><Badge tone={a.startOverride !== null ? 'warn' : 'info'}>{a.startOverride !== null ? 'manual' : 'from records'}</Badge></div>
            <input
              inputMode="decimal"
              className="tnum mt-1.5 h-9 w-full rounded-ctl border border-line bg-surface px-3 text-[13px] outline-none focus:border-brand"
              value={a.startOverride !== null ? String(a.startOverride) : nw.netWorth.toFixed(0)}
              onChange={(e) => {
                const v = Number(e.target.value.replace(/,/g, ''))
                setA((x) => ({ ...x, startOverride: Number.isFinite(v) ? v : x.startOverride }))
              }}
            />
            {a.startOverride !== null && hasBase && (
              <button className="mt-1 text-[10.5px] font-medium text-brand hover:underline" onClick={() => setA((x) => ({ ...x, startOverride: null }))}>
                Use my real net worth instead
              </button>
            )}
          </div>
          <Slider label="Current age" value={a.currentAge} min={18} max={80} onChange={(v) => setA((x) => ({ ...x, currentAge: v, retireAge: Math.max(v, x.retireAge), planToAge: Math.max(v + 5, x.planToAge) }))} />
          <Slider label="Stop-working age" value={a.retireAge} min={a.currentAge} max={80} onChange={(v) => setA((x) => ({ ...x, retireAge: v }))} />
          <Slider label="Plan to age" value={a.planToAge} min={a.retireAge + 5} max={100} onChange={(v) => setA((x) => ({ ...x, planToAge: v }))} />
          <Slider label="Monthly savings" value={a.monthlySavings} min={0} max={50000} step={500} money={c} onChange={(v) => setA((x) => ({ ...x, monthlySavings: v }))} />
          <Slider label="Annual spend (retired)" value={a.annualSpend} min={12000} max={500000} step={6000} money={c} onChange={(v) => setA((x) => ({ ...x, annualSpend: v }))} />
          <Slider label="Expected return %/yr" value={a.returnPct} min={0} max={12} step={0.5} onChange={(v) => setA((x) => ({ ...x, returnPct: v }))} />
          <Slider label="Volatility %/yr" value={a.volPct} min={2} max={30} step={1} onChange={(v) => setA((x) => ({ ...x, volPct: v }))} />
        </div>
      </Card>

      <Card pad>
        <SectionHead
          title="Deterministic paths"
          sub={`Base uses exactly your assumptions; upside +1.5%/yr; downside −2%/yr. Inflation ${a.inflationPct}% applies to spending.`}
          right={depletedYear > 0
            ? <Badge tone="loss">Base case depletes at age {a.currentAge + depletedYear}</Badge>
            : <Badge tone="gain">Base case lasts to {a.planToAge}</Badge>}
        />
        <AreaChart
          data={base}
          compare={downside}
          seriesLabel="Base"
          compareLabel="Downside (−2%/yr)"
          compareColor="var(--m-loss)"
          labels={years.map(String)}
          currency={c}
          height={260}
        />
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
          <KV k={`Downside at ${a.planToAge}`} v={fmtMoney(downside[downside.length - 1], c, { compact: true })} />
          <KV k={`Base at ${a.planToAge}`} v={fmtMoney(base[base.length - 1], c, { compact: true })} />
          <KV k={`Upside at ${a.planToAge}`} v={fmtMoney(upside[upside.length - 1], c, { compact: true })} />
        </div>
      </Card>

      <Card pad>
        <SectionHead
          title="Monte Carlo"
          sub="500 random-return paths with your volatility assumption. Deterministic seed — the same inputs always give the same answer."
          right={<Button size="sm" variant={showMc ? 'secondary' : 'primary'} onClick={() => setShowMc((v) => !v)}>{showMc ? 'Hide' : 'Run simulation'}</Button>}
        />
        {mc && (
          <div className="fade-up grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className={cn('rounded-xl border p-3', mc.successPct >= 80 ? 'border-gain/40 bg-gain-soft/30' : mc.successPct >= 60 ? 'border-warn/40 bg-warn-soft/30' : 'border-loss/40 bg-loss-soft/30')}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Success rate</div>
              <div className="tnum mt-1 text-[22px] font-semibold text-ink">{mc.successPct.toFixed(0)}%</div>
              <div className="text-[10.5px] text-ink3">paths that never hit zero</div>
            </div>
            <KV k="10th percentile ending" v={fmtMoney(mc.p10, c, { compact: true })} className="rounded-xl border border-line p-3" />
            <KV k="Median ending" v={fmtMoney(mc.p50, c, { compact: true })} className="rounded-xl border border-line p-3" />
            <KV k="90th percentile ending" v={fmtMoney(mc.p90, c, { compact: true })} className="rounded-xl border border-line p-3" />
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-ink3">
          Simplifications, stated plainly: one blended portfolio return, spending inflated at a constant rate, no taxes,
          no one-off events, annual steps. This is a planning sketch, not a prediction.
        </p>
      </Card>
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, money, onChange }: {
  label: string; value: number; min: number; max: number; step?: number
  money?: 'USD' | 'INR'; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px] font-medium text-ink2">
        <span>{label}</span>
        <span className="tnum font-semibold text-ink">{money ? fmtMoney(value, money, { compact: true }) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[var(--m-brand)]"
      />
    </div>
  )
}
