import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { LIABILITIES, amortize } from '@/data/liabilities'
import { liabilityTotals } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, ProvenanceChip, KV } from '@/components/ui'
import { StackedArea, AreaChart } from '@/components/charts'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { walkTo } from '@/data/rng'
import type { Liability } from '@/data/types'

const KIND_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  loan_against_securities: 'Loan against securities',
  auto: 'Auto loan',
  heloc: 'HELOC',
}

export default function LiabilitiesPage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const [open, setOpen] = useState<string | null>(null)
  const totals = useMemo(() => liabilityTotals(c), [c])

  // Debt-reduction trend (synthesized, ending at today's balance)
  const trend = useMemo(() => walkTo(totals.balance, 24, 88, 0.001, -0.003), [totals.balance])

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total debt" value={fmtMoney(totals.balance, c, { compact: true })} sub={`${LIABILITIES.length} loans across 2 countries`} icon="scale" />
        <StatCard label="Monthly payments" value={fmtMoney(totals.monthlyPayment, c, { compact: true })} sub="P&I + interest-only PAL" icon="calendar" />
        <StatCard label="Blended rate" value={fmtPct(totals.weightedRate)} sub="92% fixed · 8% floating (PAL)" icon="receipt" />
        <StatCard label="24-month trend" value={`−${fmtMoney(fmtTrendDelta(trend, c), c, { compact: true })}`} sub="Principal reduced — debt shrinking steadily" icon="trendUp" tone="gain" />
      </div>

      <Card pad>
        <SectionHead title="Debt reduction" sub="Total balances, trailing 24 months — lower is better" />
        <AreaChart data={trend} height={140} currency={c} color="var(--m-chart-4)" summary="Debt declining steadily over 24 months" />
      </Card>

      <div className="space-y-3">
        {LIABILITIES.map((l) => (
          <LiabilityCard key={l.id} l={l} c={c} pro={pro} open={open === l.id} onToggle={() => setOpen(open === l.id ? null : l.id)} />
        ))}
      </div>
    </div>
  )
}

function fmtTrendDelta(trend: number[], c: 'USD' | 'INR'): number {
  return Math.max(0, trend[0] - trend[trend.length - 1])
}

function LiabilityCard({ l, c, pro, open, onToggle }: { l: Liability; c: 'USD' | 'INR'; pro: boolean; open: boolean; onToggle: () => void }) {
  const cv = (v: number) => convert(v, l.currency, c)
  const paidPct = ((l.originalPrincipal - l.balance) / l.originalPrincipal) * 100
  const yearsLeft = Math.max(0, (new Date(l.maturityDate).getTime() - new Date('2026-07-20').getTime()) / (365.25 * 86_400_000))
  const amort = useMemo(() => (l.monthlyPayment * 12 > l.balance * (l.ratePct / 100) ? amortize(l, 360) : []), [l])
  const amortYears = amort.filter((_, i) => i % 12 === 0)
  const isFloating = l.rateType === 'floating'
  return (
    <Card pad>
      <button onClick={onToggle} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-left">
        <span className="flex min-w-[210px] items-center gap-3">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', l.kind === 'loan_against_securities' ? 'bg-warn-soft text-warn' : 'bg-surface2 text-ink2')}>
            <Icon name={l.kind === 'mortgage' ? 'building' : l.kind === 'auto' ? 'compass' : 'scale'} size={17} />
          </span>
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">{l.name}</span>
            <span className="text-[11px] text-ink3">{KIND_LABELS[l.kind]} · {l.lender}</span>
          </span>
        </span>
        <span className="min-w-[100px]">
          <span className="block text-[10.5px] text-ink3">Outstanding</span>
          <span className="tnum text-[14px] font-semibold text-ink">{fmtMoney(cv(l.balance), c, { compact: true })}</span>
        </span>
        <span className="min-w-[70px]">
          <span className="block text-[10.5px] text-ink3">Rate</span>
          <span className={cn('tnum text-[13px] font-medium', isFloating ? 'text-warn' : 'text-ink')}>{l.ratePct}%{isFloating && ' fl.'}</span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Payment</span>
          <span className="tnum text-[13px] font-medium text-ink">{fmtMoney(cv(l.monthlyPayment), c, { compact: true })}/mo</span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Next due</span>
          <span className="tnum text-[12.5px] text-ink2">{fmtDate(l.nextPaymentDate, 'short')} · {relDate(l.nextPaymentDate)}</span>
        </span>
        <span className="min-w-[80px]">
          <span className="block text-[10.5px] text-ink3">Remaining</span>
          <span className="tnum text-[12.5px] text-ink2">{yearsLeft < 3 ? `${Math.round(yearsLeft * 12)} mo` : `${yearsLeft.toFixed(0)} yrs`}</span>
        </span>
        <Icon name="chevronDown" size={15} className={cn('ml-auto text-ink3 transition-transform', open && 'rotate-180')} />
      </button>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10.5px] text-ink3">
          <span>{paidPct.toFixed(0)}% of original {fmtMoney(cv(l.originalPrincipal), c, { compact: true })} repaid</span>
          {l.collateralRef && (
            <Link to={l.collateralRef.type === 'property' ? `/real-estate/${l.collateralRef.id}` : '/portfolio'} className="text-brand hover:underline">
              Secured by {l.collateralRef.label} →
            </Link>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gain" style={{ width: `${paidPct}%` }} /></div>
      </div>

      {open && (
        <div className="fade-up mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
          <div className="space-y-0.5">
            <KV k="Rate type" v={l.rateType === 'fixed' ? 'Fixed' : `Floating — ${l.rateIndex}`} />
            <KV k="Originated" v={fmtDate(l.originDate)} />
            <KV k="Matures" v={fmtDate(l.maturityDate)} />
            {pro && l.kind === 'mortgage' && <KV k="Effective rate (after amortization)" v={`${(l.ratePct * 1.0).toFixed(3)}%`} />}
            {pro && l.marginMaintenancePct && <KV k="Maintenance requirement" v={`Collateral LTV < ${l.marginMaintenancePct}%`} />}
            {pro && l.covenants && (
              <div className="pt-2">
                <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Covenants</div>
                {l.covenants.map((cv2, i) => <p key={i} className="text-[12px] leading-relaxed text-ink2">· {cv2}</p>)}
              </div>
            )}
            {pro && l.kind === 'loan_against_securities' && (
              <div className="mt-2 rounded-lg bg-warn-soft p-3 text-[12px] leading-relaxed text-ink2">
                <b className="text-warn">Margin monitor: </b>Current collateral LTV is 48% against a 50% covenant. A 4% market decline would breach it — consider paying down {fmtMoney(cv(6_000), c, { compact: true })} or pledging additional securities.
              </div>
            )}
            {pro && l.currency === 'INR' && (
              <p className="text-[11.5px] text-warn">Currency mismatch: INR liability against USD income.</p>
            )}
            <div className="pt-2"><ProvenanceChip provenance={l.source.provenance} asOf={l.source.asOf} /></div>
          </div>
          <div>
            {pro && amortYears.length > 1 ? (
              <>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Principal vs interest (annual)</div>
                <StackedArea
                  series={[amortYears.map((a) => a.principal * 12), amortYears.map((a) => a.interest * 12)]}
                  labels={amortYears.map((a) => a.date.slice(0, 4))}
                  currency={c}
                  height={160}
                  names={['Principal', 'Interest']}
                />
              </>
            ) : pro && l.kind === 'loan_against_securities' ? (
              <>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Prepayment scenario</div>
                <div className="space-y-2">
                  <ScenRow label="Keep drawn (12 mo interest)" v={`−${fmtMoney(cv(l.balance * l.ratePct / 100), c, { compact: true })}`} />
                  <ScenRow label="Repay from Marcus (forgone 4.05% interest)" v={`−${fmtMoney(cv(l.balance * 0.0405), c, { compact: true })}`} />
                  <ScenRow label="Net saved by repaying now" v={`+${fmtMoney(cv(l.balance * (l.ratePct / 100 - 0.0405)), c, { compact: true })}/yr`} good />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink3">Repaying the 7.15% floating PAL is your highest risk-free return. Surfaced as a recommendation in the queue.</p>
              </>
            ) : (
              <p className="rounded-xl bg-surface2/70 p-3 text-[12.5px] leading-relaxed text-ink2">
                {l.kind === 'mortgage'
                  ? `At ${l.ratePct}%, roughly ${fmtMoney(cv(l.balance * l.ratePct / 100 / 12), c, { compact: true })} of next month's ${fmtMoney(cv(l.monthlyPayment), c, { compact: true })} payment is interest; the rest builds equity.`
                  : 'Switch to Pro Mode for amortization, prepayment scenarios and covenant monitoring.'}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function ScenRow({ label, v, good }: { label: string; v: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]">
      <span className="text-ink2">{label}</span>
      <span className={cn('tnum font-semibold', good ? 'text-gain' : 'text-ink')}>{v}</span>
    </div>
  )
}
