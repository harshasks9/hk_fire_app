import React, { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { SYNDICATIONS } from '@/data/realestate'
import { convert } from '@/data/fx'
import { fmtMoney, fmtPct, fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, ProgressBar, KV, ProvenanceChip } from '@/components/ui'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { Syndication } from '@/data/types'

export default function PrivatePage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const [open, setOpen] = useState<string | null>(SYNDICATIONS[0]?.id ?? null)

  const totalCommitted = SYNDICATIONS.reduce((s, x) => s + convert(x.committed, x.currency, c), 0)
  const totalCalled = SYNDICATIONS.reduce((s, x) => s + convert(x.called, x.currency, c), 0)
  const totalNav = SYNDICATIONS.reduce((s, x) => s + convert(x.navValue, x.currency, c), 0)
  const totalDist = SYNDICATIONS.reduce((s, x) => s + convert(x.distributions.reduce((y, d) => y + d.amount, 0), x.currency, c), 0)

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Committed" value={fmtMoney(totalCommitted, c, { compact: true })} sub={`${SYNDICATIONS.length} deals · 2 sponsors`} icon="briefcase" />
        <StatCard label="Called so far" value={fmtMoney(totalCalled, c, { compact: true })} sub={`${fmtMoney(totalCommitted - totalCalled, c, { compact: true })} unfunded — keep liquid`} icon="wallet" tone="warn" />
        <StatCard label="Reported NAV" value={fmtMoney(totalNav, c, { compact: true })} sub="Sponsor-reported, Q1 2026" icon="trendUp" />
        <StatCard label="Distributions received" value={fmtMoney(totalDist, c, { compact: true })} sub={`DPI ${(totalDist / totalCalled).toFixed(2)}× · TVPI ${((totalDist + totalNav) / totalCalled).toFixed(2)}×`} icon="coins" tone="gain" />
      </div>

      <Card pad className="border-info/30 bg-info-soft/30">
        <div className="flex items-start gap-3">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-info" />
          <p className="text-[12px] leading-relaxed text-ink2">
            Private values come from <b>sponsor reports</b>, not markets. NAVs are typically one quarter old and unaudited between annual statements — Meridian labels them accordingly and never blends them silently with market-priced assets.
          </p>
        </div>
      </Card>

      {SYNDICATIONS.map((s) => (
        <DealCard key={s.id} s={s} pro={pro} c={c} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />
      ))}
    </div>
  )
}

function DealCard({ s, pro, c, open, onToggle }: { s: Syndication; pro: boolean; c: 'USD' | 'INR'; open: boolean; onToggle: () => void }) {
  const cv = (v: number) => convert(v, s.currency, c)
  const dist = s.distributions.reduce((x, d) => x + d.amount, 0)
  const unfunded = s.committed - s.called
  return (
    <Card pad>
      <button onClick={onToggle} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-left">
        <span className="flex min-w-[220px] items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass-soft text-brass"><Icon name="briefcase" size={18} /></span>
          <span>
            <span className="block text-[14px] font-semibold text-ink">{s.name}</span>
            <span className="text-[11px] text-ink3">{s.sponsor} · exp. exit {fmtDate(s.expectedExit, 'medium')}</span>
          </span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Invested</span>
          <span className="tnum text-[13px] font-semibold text-ink">{fmtMoney(cv(s.called), c, { compact: true })}</span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Reported value</span>
          <span className="tnum text-[13px] font-semibold text-ink">{fmtMoney(cv(s.navValue), c, { compact: true })}</span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Distributed</span>
          <span className="tnum text-[13px] font-semibold text-gain">{dist > 0 ? fmtMoney(cv(dist), c, { compact: true }) : '—'}</span>
        </span>
        {unfunded > 0 && <Badge tone="warn">{fmtMoney(cv(unfunded), c, { compact: true })} unfunded</Badge>}
        <Icon name="chevronDown" size={15} className={cn('ml-auto text-ink3 transition-transform', open && 'rotate-180')} />
      </button>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10.5px] text-ink3"><span>Capital called</span><span className="tnum">{((s.called / s.committed) * 100).toFixed(0)}% of {fmtMoney(cv(s.committed), c, { compact: true })}</span></div>
        <ProgressBar pct={(s.called / s.committed) * 100} tone="brass" />
      </div>

      {open && (
        <div className="fade-up mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Latest sponsor update · {fmtDate(s.latestUpdate.date)}</div>
            <p className="rounded-xl bg-surface2/70 p-3 text-[12.5px] leading-relaxed text-ink2">{s.latestUpdate.summary}</p>

            <div className="mt-4 space-y-0.5">
              <KV k="Strategy" v={s.strategy} />
              {pro && <KV k="Legal entity" v={s.legalEntity} />}
              {pro && <KV k="Preferred return" v={`${s.preferredReturnPct}%`} />}
              {pro && <KV k="Waterfall" v={<span className="text-[11.5px]">{s.waterfall}</span>} />}
              {s.occupancyPct && <KV k="Occupancy" v={`${s.occupancyPct}%`} />}
              {s.nextCapitalCall && <KV k="Next capital call" v={<span className="text-warn">{fmtMoney(cv(s.nextCapitalCall.amount), c, { compact: true })} · {fmtDate(s.nextCapitalCall.date)}</span>} />}
              {pro && <KV k="Tax documents" v={s.taxDocs.join('; ')} />}
            </div>
            <div className="mt-3"><ProvenanceChip provenance={s.source.provenance} asOf={s.source.asOf} /></div>
          </div>

          <div>
            {pro && (
              <>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Underwritten vs actual</div>
                <div className="grid grid-cols-2 gap-3">
                  <CompareStat label="IRR" a={`${s.underwrittenIrr}%`} b={s.currentIrr ? `${s.currentIrr}%` : 'n/a'} good={!!s.currentIrr && s.currentIrr >= s.underwrittenIrr * 0.75} />
                  <CompareStat label="Equity multiple" a={`${s.equityMultipleTarget}× target`} b={`${(((dist + s.navValue) / Math.max(s.called, 1))).toFixed(2)}× current`} good={(dist + s.navValue) / Math.max(s.called, 1) >= 1} />
                </div>
              </>
            )}
            <div className="mt-4 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Cash flows</div>
            <div className="scroll-thin max-h-[220px] overflow-y-auto">
              <FlowRow d={s.source.asOf} label={`Capital called to date`} v={-cv(s.called)} c={c} />
              {s.distributions.map((d, i) => (
                <FlowRow key={i} d={d.date} label={`Distribution (${d.type.replace(/_/g, ' ')})`} v={cv(d.amount)} c={c} />
              ))}
              {s.nextCapitalCall && <FlowRow d={s.nextCapitalCall.date} label="Capital call #4 (upcoming)" v={-cv(s.nextCapitalCall.amount)} c={c} muted />}
              {s.distributions.length === 0 && <p className="py-3 text-[12px] text-ink2">No distributions yet — development-stage deal; first distributions underwritten for 2027.</p>}
            </div>
            {pro && (
              <div className="mt-3 rounded-lg bg-surface2 p-2.5 text-[11.5px] leading-relaxed text-ink2">
                <b className="text-ink">Concentration: </b>{s.sponsor} represents {s.sponsor === 'Bluebonnet Capital' ? '69%' : '31%'} of private NAV; both deals are Texas real estate — a shared geographic risk.
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function CompareStat({ label, a, b, good }: { label: string; a: string; b: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink3">{label}</div>
      <div className="tnum mt-1 text-[12px] text-ink2">{a}</div>
      <div className={cn('tnum text-[14px] font-bold', good ? 'text-gain' : 'text-warn')}>{b}</div>
    </div>
  )
}

function FlowRow({ d, label, v, c, muted }: { d: string; label: string; v: number; c: 'USD' | 'INR'; muted?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-line py-2 text-[12px] last:border-0', muted && 'opacity-60')}>
      <span className="flex items-center gap-2.5"><span className="tnum text-ink3">{fmtDate(d, 'short')}</span><span className="text-ink2">{label}</span></span>
      <span className={cn('tnum font-medium', v >= 0 ? 'text-gain' : 'text-ink')}>{v >= 0 ? '+' : ''}{fmtMoney(v, c, { compact: true })}</span>
    </div>
  )
}
