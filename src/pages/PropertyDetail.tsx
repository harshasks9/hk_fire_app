import React, { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { PROPERTIES } from '@/data/realestate'
import { LIABILITIES, amortize } from '@/data/liabilities'
import { propertyMetrics } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, ProvenanceChip, EmptyState, KV } from '@/components/ui'
import { Waterfall, StackedArea, AreaChart } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const app = useApp()
  const navigate = useNavigate()
  const c = app.currency
  const pro = app.mode === 'pro'
  const p = PROPERTIES.find((x) => x.id === id)
  const m = id ? propertyMetrics(id) : null

  if (!p || !m) {
    return <Card><EmptyState icon="building" title="Property not found" action={<Button variant="primary" onClick={() => navigate('/real-estate')}>Back to Real Estate</Button>} /></Card>
  }

  const mortgage = LIABILITIES.find((l) => l.id === p.mortgageId)
  const sym = p.currency === 'INR' ? '₹' : '$'
  const latest = p.valuations[p.valuations.length - 1]
  const isRental = !!p.monthlyRent
  const cv = (v: number) => convert(v, p.currency, c)

  // Simple levered IRR estimate & equity multiple for the pro underwriting section
  const holdYears = (new Date('2026-07-20').getTime() - new Date(p.purchaseDate).getTime()) / (365.25 * 86_400_000)
  const equityIn = m.totalCostBasis - (mortgage?.originalPrincipal ?? 0)
  const leveredIrr = equityIn > 0 ? (Math.pow(m.equity / equityIn, 1 / holdYears) - 1) * 100 : 0
  const unleveredIrr = (Math.pow(m.currentValue / m.totalCostBasis, 1 / holdYears) - 1) * 100

  const amort = mortgage ? amortize(mortgage, 300) : []
  const amortYears = amort.filter((_, i) => i % 12 === 0)

  return (
    <div className="fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate('/real-estate')} className="rounded-lg border border-line p-2 text-ink2 hover:bg-surface2" aria-label="Back">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-invert', p.kind === 'primary_residence' ? 'bg-brand' : 'bg-info')}>
            <Icon name="building" size={22} />
          </span>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-tight text-ink">{p.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink2">
              {p.address}
              <Badge tone="neutral">{p.kind === 'primary_residence' ? 'Primary residence' : 'Rental'}</Badge>
              <Badge tone="neutral">{p.ownershipPct}% owned</Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="tnum font-display text-[26px] font-semibold text-ink">{fmtMoney(cv(m.currentValue), c)}</div>
          <div className="flex items-center justify-end gap-2">
            <ProvenanceChip provenance={latest.source.provenance} asOf={latest.source.asOf} stale={latest.source.stale} />
          </div>
        </div>
      </div>

      {latest.source.stale && (
        <Card pad className="border-warn/40 bg-warn-soft/40">
          <div className="flex flex-wrap items-center gap-3">
            <Icon name="alert" size={18} className="shrink-0 text-warn" />
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink2">
              This valuation is a <b>broker estimate from {fmtDate(latest.date, 'long')}</b> at 55% confidence. Numbers derived from it (equity, net worth share) inherit that uncertainty.
            </p>
            <Button size="sm" variant="secondary" icon="refresh">Request fresh valuation</Button>
          </div>
        </Card>
      )}

      {/* The story: value built over time */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" pad>
          <SectionHead title="The story of this investment" sub={`Purchased ${fmtDate(p.purchaseDate, 'long')} for ${sym}${p.purchasePrice.toLocaleString()}`} />
          <Waterfall
            currency={c}
            height={210}
            items={[
              { label: 'Purchase', value: cv(p.purchasePrice) },
              ...p.improvements.map((i) => ({ label: i.label.split(' ')[0], value: cv(i.amount) })),
              { label: 'Appreciation', value: cv(m.currentValue - m.totalCostBasis) },
              { label: 'Value today', value: cv(m.currentValue), isTotal: true },
              { label: 'Mortgage', value: -cv(m.mortgageBalance) },
              { label: 'Your equity', value: cv(m.equity), isTotal: true },
            ]}
            summary={`From ${fmtMoney(cv(p.purchasePrice), c, { compact: true })} purchase to ${fmtMoney(cv(m.equity), c, { compact: true })} equity today`}
          />
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Valuation history</div>
            {p.valuations.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 text-[12.5px] last:border-0">
                <span className="tnum text-ink2">{fmtDate(v.date)}</span>
                <span className="text-[11px] text-ink3">{v.source.sourceLabel}</span>
                <span className="flex items-center gap-2">
                  <span className="tnum font-semibold text-ink">{fmtMoney(cv(v.value), c, { compact: true })}</span>
                  <ProvenanceChip provenance={v.source.provenance} stale={v.source.stale} />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          {isRental && (
            <Card pad>
              <SectionHead title="Monthly cash flow" />
              <KV k={`Rent (${p.occupancyPct}% occupied)`} v={fmtMoney(cv(m.monthlyRent), c)} />
              {p.monthlyCosts.map((x) => <KV key={x.label} k={x.label} v={`−${fmtMoney(cv(x.amount), c)}`} />)}
              {m.monthlyDebtService > 0 && <KV k="Mortgage (P&I)" v={`−${fmtMoney(cv(m.monthlyDebtService), c)}`} />}
              <div className="mt-2 flex items-baseline justify-between border-t-2 border-line pt-2">
                <span className="text-[12.5px] font-semibold text-ink">Net cash flow</span>
                <span className={cn('tnum text-[16px] font-bold', m.monthlyCashFlow >= 0 ? 'text-gain' : 'text-loss')}>{fmtMoney(cv(m.monthlyCashFlow), c)}/mo</span>
              </div>
            </Card>
          )}
          {p.tenant && (
            <Card pad>
              <SectionHead title="Tenancy" />
              <KV k="Tenant" v={p.tenant.name} />
              <KV k="Lease ends" v={<span className={relDate(p.tenant.leaseEnd).includes('mo') ? '' : 'text-warn'}>{fmtDate(p.tenant.leaseEnd)} ({relDate(p.tenant.leaseEnd)})</span>} />
              <KV k="Tenure" v={`${p.tenant.monthsOccupied} months`} />
              {p.nextObligation && <KV k="Next step" v={p.nextObligation.label} />}
            </Card>
          )}
          <Card pad>
            <SectionHead title="Linked records" />
            {mortgage && (
              <Link to="/liabilities" className="mb-1.5 flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] hover:border-brand">
                <span className="flex items-center gap-2"><Icon name="scale" size={14} className="text-ink3" /><span className="font-medium text-ink">{mortgage.name}</span></span>
                <span className="tnum text-ink2">{fmtMoney(cv(mortgage.balance), c, { compact: true })} @ {mortgage.ratePct}%</span>
              </Link>
            )}
            <Link to="/insurance" className="mb-1.5 flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] hover:border-brand">
              <span className="flex items-center gap-2"><Icon name="shield" size={14} className="text-ink3" /><span className="font-medium text-ink">Property insurance</span></span>
              <span className="tnum text-ink2">{p.insuranceAnnual > 0 ? `${fmtMoney(cv(p.insuranceAnnual), c, { compact: true })}/yr` : 'None on file ⚠'}</span>
            </Link>
            <Link to="/documents" className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] hover:border-brand">
              <span className="flex items-center gap-2"><Icon name="file" size={14} className="text-ink3" /><span className="font-medium text-ink">Deeds, appraisals & leases</span></span>
              <Icon name="chevronRight" size={13} className="text-ink3" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Pro underwriting */}
      {pro && isRental && (
        <Card pad>
          <SectionHead title="Underwriting" sub="Computed from recorded rent, costs, debt and the latest valuation" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <U label="NOI (annual)" v={fmtMoney(cv(m.noiAnnual), c, { compact: true })} />
            <U label="Cap rate" v={fmtPct(m.capRatePct)} />
            <U label="Cash-on-cash" v={m.cashOnCashPct !== null ? fmtPct(m.cashOnCashPct) : '—'} />
            <U label="DSCR" v={m.dscr !== null ? m.dscr.toFixed(2) : '—'} warn={m.dscr !== null && m.dscr < 1.2} />
            <U label="LTV" v={m.ltvPct !== null ? fmtPct(m.ltvPct, { decimals: 0 }) : '—'} />
            <U label="Levered IRR" v={fmtPct(leveredIrr)} />
            <U label="Unlevered IRR" v={fmtPct(unleveredIrr)} />
            <U label="Equity multiple" v={`${(m.equity / Math.max(equityIn, 1)).toFixed(2)}×`} />
          </div>
          <p className="mt-3 text-[11px] text-ink3">
            IRRs approximate appreciation + amortization only (excludes interim cash flows) — labelled as calculated estimates.
          </p>
        </Card>
      )}

      {/* Pro: amortization + hold-vs-sell */}
      {pro && mortgage && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card pad>
            <SectionHead title="Loan amortization" sub={`${mortgage.ratePct}% fixed · matures ${fmtDate(mortgage.maturityDate, 'medium')}`} />
            <StackedArea
              series={[amortYears.map((a) => a.principal * 12), amortYears.map((a) => a.interest * 12)]}
              labels={amortYears.map((a) => a.date.slice(0, 4))}
              currency={c}
              names={['Principal / yr', 'Interest / yr']}
              summary="Principal vs interest over the remaining loan term"
            />
          </Card>
          <Card pad>
            <SectionHead title="Hold vs sell vs refinance" sub="Decision snapshot at today's values — estimates" />
            <div className="space-y-2.5">
              <Scenario
                title="Hold"
                badge="Base case"
                tone="gain"
                lines={[
                  `Keep ${fmtMoney(cv(m.monthlyCashFlow), c, { compact: true })}/mo cash flow (${fmtPct(m.cashOnCashPct ?? 0)} CoC)`,
                  `3.875% debt is ${(7.15 - 3.875).toFixed(2)}pp below today's refi rates — valuable to keep`,
                ]}
              />
              <Scenario
                title="Sell now"
                badge="Est. net"
                tone="neutral"
                lines={[
                  `Proceeds ≈ ${fmtMoney(cv(m.currentValue * 0.94 - m.mortgageBalance), c, { compact: true })} after 6% costs`,
                  `Federal LT gain tax ≈ ${fmtMoney(cv((m.currentValue - m.totalCostBasis) * 0.15), c, { compact: true })} + $18.4K depreciation recapture (25%)`,
                ]}
              />
              <Scenario
                title="Cash-out refinance"
                badge="Snoozed"
                tone="warn"
                lines={[
                  `At 6.1% (quote Feb 2026): pulling ${fmtMoney(cv(120_000), c, { compact: true })} raises payment ${fmtMoney(cv(707), c)}/mo`,
                  'Your rule: revisit below 5.5% — snoozed Jan 2, 2026',
                ]}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Cost history */}
      <Card pad>
        <SectionHead title="Improvements & major costs" />
        {p.improvements.length === 0 && <p className="text-[12.5px] text-ink2">No capital improvements recorded.</p>}
        {p.improvements.map((i, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-line py-2.5 text-[12.5px] last:border-0">
            <span className="flex items-center gap-2.5"><span className="tnum text-ink3">{fmtDate(i.date)}</span><span className="font-medium text-ink">{i.label}</span></span>
            <span className="tnum font-medium text-ink">{fmtMoney(cv(i.amount), c, { compact: true })}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-2 border-line pt-2 text-[12.5px] font-semibold">
          <span>Total cost basis</span>
          <span className="tnum">{fmtMoney(cv(m.totalCostBasis), c, { compact: true })}</span>
        </div>
      </Card>
    </div>
  )
}

function U({ label, v, warn }: { label: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-surface2/70 p-3 text-center">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink3">{label}</div>
      <div className={cn('tnum mt-0.5 text-[15px] font-bold', warn ? 'text-warn' : 'text-ink')}>{v}</div>
    </div>
  )
}

function Scenario({ title, badge, tone, lines }: { title: string; badge: string; tone: 'gain' | 'warn' | 'neutral'; lines: string[] }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <Badge tone={tone}>{badge}</Badge>
      </div>
      <div className="mt-1.5 space-y-1">
        {lines.map((l, i) => <p key={i} className="text-[11.5px] leading-relaxed text-ink2">· {l}</p>)}
      </div>
    </div>
  )
}
