import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { GOALS, DEFAULT_ASSUMPTIONS } from '@/data/goals'
import { upcomingObligations, netWorthSnapshot } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, ProgressBar, KV } from '@/components/ui'
import { AreaChart, ProgressRing } from '@/components/charts'
import { ObligationRow } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { walkTo } from '@/data/rng'

export default function PlanPage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const snap = useMemo(() => netWorthSnapshot(c), [c])
  const [contribution, setContribution] = useState(9_800)

  // Simple deterministic projection to 2040 with adjustable contribution
  const projection = useMemo(() => {
    const months = 162 // to Jan 2040
    const monthlyReturn = 0.065 / 12
    let v = snap.total
    const pts: number[] = []
    for (let m = 0; m < months; m++) {
      v = v * (1 + monthlyReturn) + convert(contribution, 'USD', c)
      if (m % 3 === 0) pts.push(v)
    }
    return pts
  }, [snap.total, contribution, c])

  const target = convert(6_000_000, 'USD', c)
  const projected = projection[projection.length - 1]

  return (
    <div className="fade-up space-y-5">
      {/* FI projection */}
      <Card pad>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionHead
              title="Financial independence"
              sub={`Target ${fmtMoney(target, c, { compact: true })} by Jan 2040 · currently ${fmtMoney(snap.total, c, { compact: true })}`}
              className="mb-0"
            />
          </div>
          <Badge tone={projected >= target ? 'gain' : 'warn'} icon={projected >= target ? 'check' : 'alert'}>
            {projected >= target ? 'On track' : 'Adjustment suggested'}
          </Badge>
        </div>
        <AreaChart
          data={projection}
          height={180}
          currency={c}
          className="mt-3"
          summary={`Projected wealth reaches ${fmtMoney(projected, c, { compact: true })} by 2040`}
        />
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface2/70 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Projected at 2040</div>
            <div className="tnum font-display text-[20px] font-semibold text-ink">{fmtMoney(projected, c, { compact: true })}</div>
            <div className={cn('text-[11px]', projected >= target ? 'text-gain' : 'text-warn')}>
              {projected >= target ? `${fmtMoney(projected - target, c, { compact: true })} above target` : `${fmtMoney(target - projected, c, { compact: true })} short`}
            </div>
          </div>
          <div className="rounded-xl bg-surface2/70 p-3">
            <label className="text-[10.5px] font-semibold uppercase tracking-wide text-ink3" htmlFor="contrib">Monthly contribution</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="contrib"
                type="range" min={4000} max={16000} step={200} value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
                className="flex-1 accent-(--m-brand)"
              />
              <span className="tnum w-16 text-right text-[13px] font-semibold text-ink">{fmtMoney(convert(contribution, 'USD', c), c, { compact: true })}</span>
            </div>
            <div className="mt-1 text-[10.5px] text-ink3">Drag to see how savings rate changes the outcome</div>
          </div>
          <div className="rounded-xl bg-surface2/70 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Assumptions</div>
            <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink2">6.5% nominal return · 2.6% inflation · estimate, not a guarantee</div>
            {pro && <Link to="/scenarios" className="text-[11.5px] font-medium text-brand hover:underline">Full scenario modelling →</Link>}
          </div>
        </div>
      </Card>

      {/* Goals */}
      <div className="grid gap-4 lg:grid-cols-3">
        {GOALS.map((g) => {
          const pct = (g.currentFunding / g.targetAmount) * 100
          return (
            <Card key={g.id} pad>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name={g.icon as any} size={16} /></span>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{g.name}</div>
                    <div className="text-[10.5px] text-ink3">by {fmtDate(g.targetDate, 'medium')}</div>
                  </div>
                </div>
                <Badge tone={g.onTrack === 'on_track' ? 'gain' : 'warn'}>{g.onTrack === 'on_track' ? 'On track' : 'At risk'}</Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[12px]">
                <span className="tnum font-semibold text-ink">{fmtMoney(convert(g.currentFunding, g.currency, c), c, { compact: true })}</span>
                <span className="text-ink3">of {fmtMoney(convert(g.targetAmount, g.currency, c), c, { compact: true })}</span>
              </div>
              <ProgressBar pct={pct} tone={g.onTrack === 'on_track' ? 'brand' : 'warn'} className="mt-1.5" />
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink2">{g.projectionNote}</p>
              {g.adjustment && (
                <div className="mt-2 rounded-lg bg-warn-soft p-2.5 text-[11.5px] leading-relaxed text-ink2">
                  <span className="font-semibold text-warn">Suggested adjustment: </span>{g.adjustment}
                </div>
              )}
              <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-[11px] text-ink3">
                <span>Saving {fmtMoney(convert(g.monthlyContribution, g.currency, c), c, { compact: true })}/mo</span>
                <button className="font-medium text-brand hover:underline">Adjust</button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Upcoming obligations */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Upcoming obligations" sub="Next 90 days — payments, calls, renewals and deadlines" />
          {upcomingObligations().map((o, i) => (
            <ObligationRow key={i} date={o.date} label={o.label} amount={o.amount} currency={o.currency} displayCurrency={c} />
          ))}
        </Card>
        <Card pad>
          <SectionHead title="Financial principles" sub="The rules your recommendations are checked against" />
          {[
            'Keep 6 months of expenses in cash or equivalents (currently 7.1 months ✓)',
            'No single stock above 5% of investable assets (NVDA at 6.1% ⚠)',
            'Max 40% of net worth in real estate (currently 38% ✓)',
            'Prefer long-term gains; harvest losses annually in Q4',
            'India allocation target: 10–12% of investable assets (currently 8.4%)',
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-2.5 border-b border-line py-2.5 text-[12.5px] leading-relaxed text-ink2 last:border-0">
              <Icon name={p.includes('⚠') ? 'alert' : 'check'} size={14} className={cn('mt-0.5 shrink-0', p.includes('⚠') ? 'text-warn' : 'text-gain')} />
              {p.replace(' ✓', '').replace(' ⚠', '')}
            </div>
          ))}
          <p className="mt-2 text-[11px] text-ink3">Edit principles in Settings → Preferences. Violations surface as observations, never silent changes.</p>
        </Card>
      </div>
    </div>
  )
}
