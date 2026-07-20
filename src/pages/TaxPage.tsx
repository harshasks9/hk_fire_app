import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { TAX_SUMMARIES } from '@/data/tax'
import { POSITIONS } from '@/data/portfolio'
import { INSTRUMENTS } from '@/data/instruments'
import { convert } from '@/data/fx'
import { fmtMoney, fmtDate, relDate, daysAgo } from '@/lib/format'
import { Card, SectionHead, Badge, Button, KV, Segmented } from '@/components/ui'
import { StatCard, ObligationRow } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function TaxPage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const [jur, setJur] = useState<'US' | 'IN'>('US')
  const t = TAX_SUMMARIES.find((x) => x.jurisdiction === jur)!
  const cv = (v: number) => convert(v, t.currency, c)

  const harvestable = useMemo(() => {
    const out: { symbol: string; lotDate: string; qty: number; loss: number }[] = []
    for (const p of POSITIONS) {
      const inst = INSTRUMENTS[p.symbol]
      if (!inst || inst.currency !== 'USD') continue
      for (const l of p.lots) {
        const loss = (inst.price - l.costPerUnit) * l.qty
        if (loss < -100) out.push({ symbol: p.symbol, lotDate: l.date, qty: l.qty, loss })
      }
    }
    return out.sort((a, b) => a.loss - b.loss)
  }, [])

  return (
    <div className="fade-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[{ value: 'US', label: '🇺🇸 United States' }, { value: 'IN', label: '🇮🇳 India' }]}
          value={jur}
          onChange={setJur}
        />
        <Badge tone="warn" icon="alert">All figures are estimates until filings are complete</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={`Est. ${t.year} obligation`} value={fmtMoney(cv(t.estimatedObligation), c, { compact: true })} sub="Estimate — assumes current income run rate" icon="receipt" tone="warn" />
        <StatCard label="Realized gains YTD" value={fmtMoney(cv(t.realizedStGains + t.realizedLtGains), c, { compact: true })} sub={`${fmtMoney(cv(t.realizedStGains), c, { compact: true })} short-term · ${fmtMoney(cv(t.realizedLtGains), c, { compact: true })} long-term`} icon="trendUp" />
        <StatCard label="Harvestable losses" value={fmtMoney(cv(t.harvestableLosses), c, { compact: true })} sub={jur === 'US' ? 'O and BND lots below basis' : 'None identified'} icon="bulb" tone="gain" />
        <StatCard label={jur === 'US' ? 'Foreign withholding' : 'Carry-forward losses'} value={fmtMoney(cv(jur === 'US' ? t.foreignWithholding : t.carryForwardLosses), c, { compact: true })} sub={jur === 'US' ? 'Creditable via Form 1116' : 'From FY2024-25, usable 8 years'} icon="scale" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Deadlines" sub={jur === 'US' ? 'Federal calendar · WA has no state income tax' : 'Indian FY 2026-27 (AY 2027-28)'} />
          {t.deadlines.map((d, i) => (
            <ObligationRow key={i} date={d.date} label={d.label} amount={0} currency={t.currency} displayCurrency={c} />
          ))}
          {t.missingDocs.length > 0 && (
            <div className="mt-3 rounded-lg bg-warn-soft p-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-warn">Missing documents</div>
              {t.missingDocs.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-1 text-[12px]">
                  <span className="text-ink2">{m}</span>
                  <Button size="sm" variant="ghost" icon="upload" onClick={() => app.setUploadOpen(true)}>Upload</Button>
                </div>
              ))}
            </div>
          )}
          {t.residencyDays !== undefined && (
            <div className="mt-3 border-t border-line pt-3">
              <KV k="India residency days (FY)" v={`${t.residencyDays} of 181 limit — NRI status safe`} />
            </div>
          )}
        </Card>

        <Card pad>
          <SectionHead title="Gains position" sub="Realized locks in tax; unrealized is still yours to plan" />
          <div className="space-y-3">
            <GainsBar label="Short-term realized" v={cv(t.realizedStGains)} max={cv(t.unrealizedLtGains)} tone="bg-warn" c={c} note={jur === 'US' ? 'taxed as ordinary income' : 'STCG 20%'} />
            <GainsBar label="Long-term realized" v={cv(t.realizedLtGains)} max={cv(t.unrealizedLtGains)} tone="bg-brass" c={c} note={jur === 'US' ? '15% bracket' : 'LTCG 12.5% over ₹1.25L'} />
            <GainsBar label="Short-term unrealized" v={cv(t.unrealizedStGains)} max={cv(t.unrealizedLtGains)} tone="bg-info" c={c} note="wait for LT where possible" />
            <GainsBar label="Long-term unrealized" v={cv(t.unrealizedLtGains)} max={cv(t.unrealizedLtGains)} tone="bg-gain" c={c} note="preferential rate when realized" />
          </div>
          {pro && t.advisorNotes && (
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Advisor notes</div>
              {t.advisorNotes.map((n, i) => <p key={i} className="py-0.5 text-[12px] leading-relaxed text-ink2">· {n}</p>)}
            </div>
          )}
        </Card>
      </div>

      {/* Pro: lot-level harvesting + sale scenario */}
      {pro && jur === 'US' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card pad={false} className="overflow-hidden">
            <div className="px-5 pt-4">
              <SectionHead title="Tax-loss harvesting candidates" sub="Lots trading below cost — sell to offset this year's gains" />
            </div>
            <table className="w-full text-[12.5px]">
              <thead className="border-b border-line bg-surface2/60 text-[10.5px] uppercase tracking-wide text-ink3">
                <tr>
                  <th className="px-5 py-2 text-left font-semibold">Lot</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Loss</th>
                  <th className="px-3 py-2 text-right font-semibold">Tax value*</th>
                </tr>
              </thead>
              <tbody>
                {harvestable.map((h, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5"><Link to={`/position/${h.symbol}`} className="font-semibold text-ink hover:text-brand">{h.symbol}</Link> <span className="tnum text-[11px] text-ink3">{fmtDate(h.lotDate)}</span></td>
                    <td className="tnum px-3 py-2.5 text-right">{h.qty}</td>
                    <td className="tnum px-3 py-2.5 text-right text-loss">{fmtMoney(convert(h.loss, 'USD', c), c, { compact: true })}</td>
                    <td className="tnum px-3 py-2.5 text-right text-gain">+{fmtMoney(convert(-h.loss * 0.15, 'USD', c), c, { compact: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-[11px] text-ink3">*At 15% LT offset. Mind the 30-day wash-sale window — including repurchases in the Roth IRA.</p>
          </Card>

          <Card pad>
            <SectionHead title="Sale scenario sandbox" sub="What would selling cost in tax?" />
            <SaleScenario c={c} />
            <div className="mt-4 border-t border-line pt-3">
              <SectionHead title="Brokerage reconciliation" className="mb-1" />
              <div className="space-y-1.5 text-[12px]">
                <ReconRow label="Fidelity 1099 (2025) vs recorded gains" status="Matched to the dollar" ok />
                <ReconRow label="Schwab 1099 (2025) vs recorded gains" status="Matched after VXUS withholding fix" ok />
                <ReconRow label="IBKR 2026 activity vs recorded premium" status="1 unknown row (NCLH) — in inbox" ok={false} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function GainsBar({ label, v, max, tone, c, note }: { label: string; v: number; max: number; tone: string; c: 'USD' | 'INR'; note: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[12px]">
        <span className="text-ink2">{label} <span className="text-[10.5px] text-ink3">({note})</span></span>
        <span className="tnum font-semibold text-ink">{fmtMoney(v, c, { compact: true })}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.min(100, (v / Math.max(max, 1)) * 100)}%` }} />
      </div>
    </div>
  )
}

function ReconRow({ label, status, ok }: { label: string; status: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
      <Icon name={ok ? 'check' : 'alert'} size={14} className={ok ? 'text-gain' : 'text-warn'} />
      <span className="min-w-0 flex-1 text-ink2">{label}</span>
      <span className={cn('text-[11px]', ok ? 'text-ink3' : 'text-warn')}>{status}</span>
    </div>
  )
}

function SaleScenario({ c }: { c: 'USD' | 'INR' }) {
  const [symbol, setSymbol] = useState('NVDA')
  const [pct, setPct] = useState(20)
  const inst = INSTRUMENTS[symbol]
  const positions = POSITIONS.filter((p) => p.symbol === symbol)
  const totalQty = positions.reduce((s, p) => s + p.qty, 0)
  const qty = Math.round((totalQty * pct) / 100)
  // consume highest-basis lots first (SpecID)
  const lots = positions.flatMap((p) => p.lots).sort((a, b) => b.costPerUnit - a.costPerUnit)
  let rem = qty
  let basis = 0
  for (const l of lots) {
    const take = Math.min(rem, l.qty)
    basis += take * l.costPerUnit
    rem -= take
    if (rem <= 0) break
  }
  const proceeds = qty * inst.price
  const gain = proceeds - basis
  const tax = Math.max(0, gain) * 0.15
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="h-9 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] outline-none focus:border-brand" aria-label="Position to model">
          {['NVDA', 'AAPL', 'MSFT', 'VOO', 'SCHD'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="flex flex-1 items-center gap-2">
          <input type="range" min={5} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="flex-1 accent-(--m-brand)" aria-label="Percent to sell" />
          <span className="tnum w-10 text-right text-[13px] font-semibold">{pct}%</span>
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <KV k={`Sell ${qty} shares at $${inst.price}`} v={fmtMoney(convert(proceeds, 'USD', c), c, { compact: true })} />
        <KV k="Basis consumed (SpecID, highest first)" v={fmtMoney(convert(basis, 'USD', c), c, { compact: true })} />
        <KV k="Realized gain" v={<span className={gain >= 0 ? 'text-gain' : 'text-loss'}>{fmtMoney(convert(gain, 'USD', c), c, { compact: true })}</span>} />
        <KV k="Est. federal tax (15% LT)" v={<span className="text-warn">{fmtMoney(convert(tax, 'USD', c), c, { compact: true })}</span>} />
        <KV k="Net proceeds" v={fmtMoney(convert(proceeds - tax, 'USD', c), c, { compact: true })} />
      </div>
      <p className="mt-2 text-[10.5px] text-ink3">Estimate. Ignores NIIT phase-in and assumes all consumed lots are long-term (true for {symbol} at this size).</p>
    </div>
  )
}
