import React, { useMemo } from 'react'
import { useApp } from '@/state/AppContext'
import { INSURANCE } from '@/data/insurance'
import { convert } from '@/data/fx'
import { fmtMoney, fmtDate, relDate, daysUntil } from '@/lib/format'
import { Card, SectionHead, Badge, ProvenanceChip, KV } from '@/components/ui'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

const KIND_LABELS: Record<string, string> = {
  term_life: 'Term life',
  health: 'Health',
  home: 'Property',
  auto: 'Auto',
  endowment: 'Endowment',
  umbrella: 'Umbrella',
}

export default function InsurancePage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const cv = (v: number, cur: 'USD' | 'INR') => convert(v, cur, c)

  const lifeCover = INSURANCE.filter((p) => p.kind === 'term_life').reduce((s, p) => s + cv(p.coverage, p.currency), 0)
  const annualPremium = INSURANCE.reduce((s, p) => s + cv(p.premium, p.currency), 0)
  const atRisk = INSURANCE.filter((p) => p.status !== 'active')

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Life coverage" value={fmtMoney(lifeCover, c, { compact: true })} sub="≈ 12× annual household spending" icon="shield" tone="gain" />
        <StatCard label="Annual premiums" value={fmtMoney(annualPremium, c, { compact: true })} sub={`${INSURANCE.length} active policies`} icon="coins" />
        <StatCard label="Next renewal" value={fmtDate('2026-08-05', 'short')} sub="LIC endowment premium — lapse risk" icon="calendar" tone="warn" />
        <StatCard label="Coverage gaps" value="1" sub="No umbrella policy — see recommendation" icon="alert" tone="loss" />
      </div>

      {atRisk.length > 0 && (
        <Card pad className="border-warn/40 bg-warn-soft/40">
          <div className="flex flex-wrap items-center gap-3">
            <Icon name="alert" size={18} className="shrink-0 text-warn" />
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink2">
              <b className="text-ink">LIC endowment premium of ₹48,000 due Aug 5.</b> The policy lapses if the grace period passes — forfeiting the ₹25L maturity benefit against only ₹6.2L surrender value.
            </p>
            <Badge tone="warn">Also in Needs Review</Badge>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {INSURANCE.map((p) => {
          const renewDays = p.renewalDate ? daysUntil(p.renewalDate) : null
          return (
            <Card key={p.id} pad>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', p.status !== 'active' ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand')}>
                    <Icon name="shield" size={17} />
                  </span>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{KIND_LABELS[p.kind]} — {p.insured}</div>
                    <div className="text-[11px] text-ink3">{p.insurer} · {p.policyNumber}</div>
                  </div>
                </div>
                <Badge tone={p.status === 'active' ? 'gain' : 'warn'}>{p.status === 'active' ? 'Active' : 'Lapse risk'}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-0.5">
                {p.coverage > 0 && <KV k="Coverage" v={fmtMoney(cv(p.coverage, p.currency), c, { compact: true })} />}
                <KV k="Premium" v={`${fmtMoney(cv(p.premium, p.currency), c, { compact: true })}/${p.premiumFrequency === 'annual' ? 'yr' : 'mo'}`} />
                {p.renewalDate && (
                  <KV k={p.kind === 'endowment' ? 'Premium due' : 'Renews'} v={<span className={renewDays !== null && renewDays < 45 ? 'text-warn' : ''}>{fmtDate(p.renewalDate, 'medium')}</span>} />
                )}
                {p.maturityDate && <KV k="Matures" v={fmtDate(p.maturityDate, 'medium')} />}
                {p.beneficiary && <KV k="Beneficiary" v={p.beneficiary} />}
                {pro && p.surrenderValue && <KV k="Surrender value" v={fmtMoney(cv(p.surrenderValue, p.currency), c, { compact: true })} />}
                {pro && p.maturityValue && <KV k="Maturity value" v={fmtMoney(cv(p.maturityValue, p.currency), c, { compact: true })} />}
              </div>
              {pro && (p.riders || p.exclusions) && (
                <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {p.riders && <p className="text-[11.5px] text-ink2"><b className="text-ink">Riders: </b>{p.riders.join('; ')}</p>}
                  {p.exclusions && <p className="text-[11.5px] text-warn"><b>Exclusions: </b>{p.exclusions.join('; ')}</p>}
                </div>
              )}
              {pro && p.kind === 'endowment' && (
                <div className="mt-3 rounded-lg bg-surface2 p-2.5 text-[11.5px] leading-relaxed text-ink2">
                  <b className="text-ink">Policy return analysis: </b>Projected IRR to maturity ≈ 4.8% (INR). Below India inflation assumption (5.5%) — flagged for review at maturity, but keep paying given the sunk premium and guaranteed value.
                </div>
              )}
              <div className="mt-3"><ProvenanceChip provenance={p.source.provenance} asOf={p.source.asOf} /></div>
            </Card>
          )
        })}
      </div>

      {pro && (
        <Card pad>
          <SectionHead title="Coverage vs exposures" sub="Does protection match what you have at risk?" />
          <div className="space-y-2.5">
            {[
              { label: 'Life cover vs 12× spending + debts', have: lifeCover, need: cv(2_800_000, 'USD'), ok: true },
              { label: 'Dwelling cover vs Seattle rebuild cost', have: cv(1_100_000, 'USD'), need: cv(1_050_000, 'USD'), ok: true },
              { label: 'Liability cover vs net worth', have: cv(500_000, 'USD'), need: cv(2_540_000, 'USD'), ok: false },
              { label: 'Landlord loss-of-rents (12 mo)', have: cv(52_200, 'USD'), need: cv(52_200, 'USD'), ok: true },
            ].map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                <Icon name={r.ok ? 'check' : 'alert'} size={15} className={r.ok ? 'text-gain' : 'text-loss'} />
                <span className="min-w-0 flex-1 text-[12.5px] text-ink2">{r.label}</span>
                <span className="tnum text-[12px] text-ink">{fmtMoney(r.have, c, { compact: true })} <span className="text-ink3">of</span> {fmtMoney(r.need, c, { compact: true })}</span>
                {!r.ok && <Badge tone="loss">Gap</Badge>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink3">No duplicate coverage detected across the 7 policies on file.</p>
        </Card>
      )}
    </div>
  )
}
