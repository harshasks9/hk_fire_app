import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { PROPERTIES, SYNDICATIONS } from '@/data/realestate'
import { propertyMetrics } from '@/data/selectors'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, ProvenanceChip, ProgressBar } from '@/components/ui'
import { StatCard, Freshness } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function RealEstatePage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'

  const totals = useMemo(() => {
    let value = 0, equity = 0, cashflow = 0
    for (const p of PROPERTIES) {
      const m = propertyMetrics(p.id)!
      value += convert(m.currentValue, p.currency, c)
      equity += convert(m.equity, p.currency, c)
      cashflow += convert(m.monthlyCashFlow, p.currency, c)
    }
    return { value, equity, cashflow }
  }, [c])

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Property value" value={fmtMoney(totals.value, c, { compact: true })} sub="3 direct properties" icon="building" />
        <StatCard label="Your equity" value={fmtMoney(totals.equity, c, { compact: true })} sub={`${fmtPct((totals.equity / totals.value) * 100, { decimals: 0 })} of value — rest is mortgage`} icon="wallet" tone="gain" />
        <StatCard label="Monthly cash flow" value={fmtMoney(totals.cashflow, c, { compact: true })} sub="Rent minus costs & debt service" icon="coins" tone={totals.cashflow >= 0 ? 'gain' : 'loss'} />
        <StatCard label="Syndicated NAV" value={fmtMoney(SYNDICATIONS.reduce((s, x) => s + convert(x.navValue, x.currency, c), 0), c, { compact: true })} sub={`${SYNDICATIONS.length} deals · $27.5K unfunded`} icon="briefcase" />
      </div>

      {/* Direct properties */}
      <SectionHead title="Direct properties" className="px-1" />
      <div className="grid gap-4 lg:grid-cols-3">
        {PROPERTIES.map((p) => {
          const m = propertyMetrics(p.id)!
          const latest = p.valuations[p.valuations.length - 1]
          const sym = p.currency === 'INR' ? '₹' : '$'
          return (
            <Link key={p.id} to={`/real-estate/${p.id}`}>
              <Card pad className="h-full transition-shadow hover:shadow-pop">
                {/* Visual header */}
                <div className={cn('relative -m-5 mb-4 h-24 overflow-hidden rounded-t-card bg-gradient-to-br p-4',
                  p.kind === 'primary_residence' ? 'from-brand/85 to-brand2' : 'from-chart-3/85 to-info')}>
                  <div className="absolute -bottom-5 -right-3 opacity-20"><Icon name="building" size={110} strokeWidth={1} className="text-invert" /></div>
                  <Badge tone="neutral" className="border-white/30 bg-white/15 text-invert">{p.kind === 'primary_residence' ? 'Primary home' : 'Rental'}</Badge>
                  <div className="mt-2 font-display text-[16px] font-semibold text-invert">{p.name}</div>
                  <div className="text-[10.5px] text-invert/75">{p.address}</div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="tnum font-display text-[20px] font-semibold text-ink">{fmtMoney(convert(m.currentValue, p.currency, c), c, { compact: true })}</span>
                  <ProvenanceChip provenance={latest.source.provenance} stale={latest.source.stale} />
                </div>
                <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-line" title={`Equity ${fmtPct((m.equity / m.currentValue) * 100)}`}>
                  <div className="bg-chart-1" style={{ width: `${(m.equity / m.currentValue) * 100}%` }} />
                  <div className="bg-chart-4/50" style={{ width: `${(m.mortgageBalance / m.currentValue) * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10.5px] text-ink3">
                  <span>Equity {fmtMoney(convert(m.equity, p.currency, c), c, { compact: true })}</span>
                  {m.mortgageBalance > 0 && <span>Mortgage {fmtMoney(convert(m.mortgageBalance, p.currency, c), c, { compact: true })}</span>}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12px]">
                  {p.monthlyRent ? (
                    <>
                      <Row k="Rent" v={`${sym}${p.monthlyRent.toLocaleString()}/mo`} />
                      <Row k="Cash flow" v={<span className={m.monthlyCashFlow >= 0 ? 'text-gain' : 'text-loss'}>{fmtMoney(convert(m.monthlyCashFlow, p.currency, c), c, { compact: true })}/mo</span>} />
                      <Row k="Occupancy" v={`${p.occupancyPct}%`} />
                      {pro && <Row k="Cap rate" v={fmtPct(m.capRatePct)} />}
                      {pro && m.cashOnCashPct !== null && <Row k="Cash-on-cash" v={fmtPct(m.cashOnCashPct)} />}
                    </>
                  ) : (
                    <>
                      <Row k="Purchased" v={`${fmtDate(p.purchaseDate, 'medium')}`} />
                      <Row k="Appreciation" v={<span className="text-gain">+{fmtPct(m.appreciationPct, { decimals: 0 })}</span>} />
                      {pro && m.ltvPct !== null && <Row k="LTV" v={fmtPct(m.ltvPct, { decimals: 0 })} />}
                    </>
                  )}
                  {p.nextObligation && (
                    <div className="mt-1 rounded-lg bg-surface2 px-2.5 py-1.5 text-[11px] text-ink2">
                      <Icon name="calendar" size={11} className="mr-1 inline text-ink3" />
                      {p.nextObligation.label} · {relDate(p.nextObligation.date)}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Syndications summary */}
      <SectionHead title="Syndicated investments" className="px-1" right={<Link to="/private" className="text-[12px] font-medium text-brand hover:underline">Full detail →</Link>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {SYNDICATIONS.map((s) => (
          <Link key={s.id} to="/private">
            <Card pad className="transition-shadow hover:shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{s.name}</div>
                  <div className="text-[11px] text-ink3">{s.sponsor} · {s.strategy}</div>
                </div>
                <Badge tone="neutral">NAV {fmtDate(s.navDate, 'short')}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <MiniStat label="Invested" v={fmtMoney(convert(s.called, s.currency, c), c, { compact: true })} />
                <MiniStat label="Current value" v={fmtMoney(convert(s.navValue, s.currency, c), c, { compact: true })} />
                <MiniStat label="Distributions" v={fmtMoney(convert(s.distributions.reduce((x, d) => x + d.amount, 0), s.currency, c), c, { compact: true })} />
              </div>
              {s.nextCapitalCall && (
                <div className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[11.5px] text-ink2">
                  <span className="font-semibold text-warn">Capital call: </span>
                  {fmtMoney(convert(s.nextCapitalCall.amount, s.currency, c), c, { compact: true })} due {fmtDate(s.nextCapitalCall.date)}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-ink2">{k}</span>
      <span className="tnum font-medium text-ink">{v}</span>
    </div>
  )
}

function MiniStat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-lg bg-surface2/70 p-2">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink3">{label}</div>
      <div className="tnum mt-0.5 text-[13.5px] font-semibold text-ink">{v}</div>
    </div>
  )
}
