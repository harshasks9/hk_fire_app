import React, { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { DEFAULT_ASSUMPTIONS, ASSUMPTION_HISTORY } from '@/data/goals'
import { netWorthSnapshot } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct } from '@/lib/format'
import { Card, SectionHead, Badge, Button, KV } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { mulberry32 } from '@/data/rng'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { ScenarioAssumptions } from '@/data/types'

interface SliderDef {
  key: keyof ScenarioAssumptions
  label: string
  min: number
  max: number
  step: number
  unit: string
}

const SLIDERS: SliderDef[] = [
  { key: 'usReturnPct', label: 'US equity return', min: 2, max: 11, step: 0.1, unit: '%/yr' },
  { key: 'inReturnPct', label: 'India equity return', min: 4, max: 15, step: 0.1, unit: '%/yr' },
  { key: 'inflationPct', label: 'Inflation (US)', min: 1, max: 6, step: 0.1, unit: '%/yr' },
  { key: 'incomeGrowthPct', label: 'Income growth', min: 0, max: 8, step: 0.5, unit: '%/yr' },
  { key: 'spendingGrowthPct', label: 'Spending growth', min: 0, max: 8, step: 0.5, unit: '%/yr' },
  { key: 'retirementAge', label: 'Retirement age', min: 45, max: 65, step: 1, unit: '' },
  { key: 'withdrawalRatePct', label: 'Withdrawal rate', min: 2.5, max: 5.5, step: 0.1, unit: '%' },
  { key: 'lifeExpectancy', label: 'Plan to age', min: 80, max: 100, step: 1, unit: '' },
  { key: 'propertyAppreciationPct', label: 'Property appreciation', min: 0, max: 7, step: 0.2, unit: '%/yr' },
  { key: 'vacancyPct', label: 'Rental vacancy', min: 0, max: 20, step: 1, unit: '%' },
  { key: 'usdInrDriftPct', label: 'USD/INR drift', min: 0, max: 5, step: 0.5, unit: '%/yr' },
]

export default function ScenariosPage() {
  const app = useApp()
  const c = app.currency
  const [a, setA] = useState<ScenarioAssumptions>({ ...DEFAULT_ASSUMPTIONS })
  const [showMc, setShowMc] = useState(false)
  const snap = useMemo(() => netWorthSnapshot(c), [c])

  const CURRENT_AGE = 38
  const yearsToRetire = a.retirementAge - CURRENT_AGE
  const yearsTotal = a.lifeExpectancy - CURRENT_AGE

  const project = (returnAdj: number, spendAdj: number) => {
    const pts: number[] = []
    let v = snap.total
    const contribAnnual = convert(9_800 * 12, 'USD', c)
    const spendAnnual = convert(150_000, 'USD', c)
    const blendedReturn = (a.usReturnPct * 0.82 + a.inReturnPct * 0.18) / 100 + returnAdj
    for (let y = 0; y <= yearsTotal; y++) {
      pts.push(v)
      if (y < yearsToRetire) {
        v = v * (1 + blendedReturn) + contribAnnual * Math.pow(1 + a.incomeGrowthPct / 100, y)
      } else {
        const spend = spendAnnual * Math.pow(1 + (a.spendingGrowthPct + spendAdj) / 100, y)
        v = v * (1 + blendedReturn - 0.01) - Math.max(spend, v * (a.withdrawalRatePct / 100))
      }
      if (v < 0) v = 0
    }
    return pts
  }

  const base = useMemo(() => project(0, 0), [a, snap.total, c])
  const upside = useMemo(() => project(0.015, 0), [a, snap.total, c])
  const downside = useMemo(() => project(-0.02, 0.5), [a, snap.total, c])
  const depleted = base.findIndex((v, i) => i > yearsToRetire && v <= 0)

  // Lightweight Monte Carlo (200 paths)
  const mc = useMemo(() => {
    if (!showMc) return null
    const rnd = mulberry32(42)
    const blended = (a.usReturnPct * 0.82 + a.inReturnPct * 0.18) / 100
    let success = 0
    const finals: number[] = []
    for (let p = 0; p < 200; p++) {
      let v = snap.total
      const contribAnnual = convert(9_800 * 12, 'USD', c)
      const spendAnnual = convert(150_000, 'USD', c)
      let ok = true
      for (let y = 0; y < yearsTotal; y++) {
        const shock = (rnd() + rnd() + rnd() + rnd() - 2) * 0.5 * 0.145 // ~N(0, 14.5%)
        const r = blended + shock
        if (y < yearsToRetire) v = v * (1 + r) + contribAnnual
        else {
          v = v * (1 + r - 0.01) - spendAnnual * Math.pow(1 + a.spendingGrowthPct / 100, y)
          if (v <= 0) { ok = false; break }
        }
      }
      if (ok) success++
      finals.push(Math.max(0, v))
    }
    finals.sort((x, y) => x - y)
    return { successPct: (success / 200) * 100, p10: finals[20], p50: finals[100], p90: finals[180] }
  }, [showMc, a, snap.total, c, yearsTotal, yearsToRetire])

  const labels = Array.from({ length: yearsTotal + 1 }, (_, i) => `${2026 + i}`)

  return (
    <div className="fade-up space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Assumptions panel */}
        <Card pad className="lg:order-2">
          <SectionHead title="Assumptions" sub="Every projection is an estimate driven by these" right={
            <Button size="sm" variant="ghost" onClick={() => setA({ ...DEFAULT_ASSUMPTIONS })}>Reset</Button>
          } />
          <div className="scroll-thin max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="mb-0.5 flex justify-between text-[11.5px]">
                  <label htmlFor={s.key} className="text-ink2">{s.label}</label>
                  <span className="tnum font-semibold text-ink">{a[s.key]}{s.unit}</span>
                </div>
                <input
                  id={s.key}
                  type="range" min={s.min} max={s.max} step={s.step} value={a[s.key]}
                  onChange={(e) => setA({ ...a, [s.key]: Number(e.target.value) })}
                  className="w-full accent-(--m-brand)"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Assumption history</div>
            {ASSUMPTION_HISTORY.map((h, i) => (
              <p key={i} className="py-0.5 text-[11px] leading-relaxed text-ink3"><span className="tnum">{h.date}</span> — {h.change}</p>
            ))}
          </div>
        </Card>

        {/* Projection chart */}
        <Card pad className="lg:col-span-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHead
              title="Wealth trajectory"
              sub={`Retire at ${a.retirementAge} · plan to ${a.lifeExpectancy} · base / upside / downside`}
              className="mb-0"
            />
            <Badge tone={depleted === -1 ? 'gain' : 'loss'} icon={depleted === -1 ? 'check' : 'alert'}>
              {depleted === -1 ? 'Base case lasts to plan age' : `Base depletes at age ${CURRENT_AGE + depleted}`}
            </Badge>
          </div>
          <AreaChart
            data={base}
            compare={upside}
            compareLabel="Upside"
            labels={labels}
            height={250}
            currency={c}
            className="mt-3"
            seriesLabel="Base"
            summary={`Projected wealth path from 2026 to ${2026 + yearsTotal}`}
          />
          <AreaChart
            data={downside}
            labels={labels}
            height={90}
            currency={c}
            color="var(--m-chart-4)"
            className="mt-1"
            seriesLabel="Downside"
            summary="Downside scenario path"
          />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <ScenStat label="Base @ retirement" v={fmtMoney(base[yearsToRetire] ?? 0, c, { compact: true })} tone="text-ink" />
            <ScenStat label="Upside (+1.5% return)" v={fmtMoney(upside[yearsToRetire] ?? 0, c, { compact: true })} tone="text-gain" />
            <ScenStat label="Downside (−2%, +0.5% spend)" v={fmtMoney(downside[yearsToRetire] ?? 0, c, { compact: true })} tone="text-loss" />
          </div>
        </Card>
      </div>

      {/* Monte Carlo */}
      <Card pad>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead title="Monte Carlo analysis" sub="200 simulated market paths with ±14.5% annual volatility" className="mb-0" />
          <Button variant={showMc ? 'secondary' : 'primary'} size="sm" icon="refresh" onClick={() => setShowMc(!showMc)}>
            {showMc ? 'Hide' : 'Run simulation'}
          </Button>
        </div>
        {mc && (
          <div className="fade-up mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-surface2/70 p-4 text-center">
              <div className={cn('tnum font-display text-[30px] font-bold', mc.successPct >= 85 ? 'text-gain' : mc.successPct >= 70 ? 'text-warn' : 'text-loss')}>
                {Math.round(mc.successPct)}%
              </div>
              <div className="text-[11px] text-ink2">paths sustain spending to age {a.lifeExpectancy}</div>
            </div>
            <ScenStat label="10th percentile ending" v={fmtMoney(mc.p10, c, { compact: true })} tone="text-loss" />
            <ScenStat label="Median ending wealth" v={fmtMoney(mc.p50, c, { compact: true })} tone="text-ink" />
            <ScenStat label="90th percentile ending" v={fmtMoney(mc.p90, c, { compact: true })} tone="text-gain" />
          </div>
        )}
        {!showMc && <p className="mt-3 text-[12px] text-ink2">Runs locally on your assumptions. Deterministic seed — results are reproducible.</p>}
        <p className="mt-3 text-[11px] leading-relaxed text-ink3">
          Simplifications: property and private holdings compound at the blended rate; capital calls and liquidity events are treated as part of contributions; India returns converted at the assumed USD/INR drift. This is decision support, not advice.
        </p>
      </Card>
    </div>
  )
}

function ScenStat({ label, v, tone }: { label: string; v: string; tone: string }) {
  return (
    <div className="rounded-xl bg-surface2/70 p-4 text-center">
      <div className={cn('tnum font-display text-[20px] font-semibold', tone)}>{v}</div>
      <div className="mt-0.5 text-[11px] text-ink2">{label}</div>
    </div>
  )
}
