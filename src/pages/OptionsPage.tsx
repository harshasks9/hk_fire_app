import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { OPTION_STRATEGIES, STRATEGY_LABELS } from '@/data/options'
import { allStrategyMetrics, optionsPremiumYtd, strategyMetrics, type StrategyMetrics } from '@/data/selectors'
import { anyInstrument } from '@/data/watchlist'
import { accountById } from '@/data/household'
import { fmtMoney, fmtNum, fmtPct, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Button, KV, ProvenanceChip } from '@/components/ui'
import { PayoffDiagram } from '@/components/charts'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function OptionsPage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const strategies = useMemo(allStrategyMetrics, [])
  const [expanded, setExpanded] = useState<string | null>(strategies.find((s) => s.assignmentRisk === 'high')?.strategy.id ?? null)

  const premiumYtd = optionsPremiumYtd(c)
  const openPnl = strategies.reduce((s, x) => s + x.pnl, 0)
  const collateral = OPTION_STRATEGIES.reduce((s, x) => s + (x.collateral ?? 0), 0)
  const urgent = strategies.filter((s) => s.assignmentRisk === 'high')

  return (
    <div className="fade-up space-y-5">
      {/* Urgent banner — visible in BOTH modes */}
      {urgent.map((u) => (
        <Card key={u.strategy.id} pad className="border-loss/40 bg-loss-soft/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-loss-soft text-loss"><Icon name="alert" size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-ink">
                {u.strategy.underlying} {STRATEGY_LABELS[u.strategy.kind].toLowerCase()} expires in {u.daysToExpiry} day{u.daysToExpiry === 1 ? '' : 's'} — in the money
              </div>
              <p className="text-[12px] leading-relaxed text-ink2">{u.actionNeeded}. If assigned, ~$23,500 of long-term gains would be realized (est. tax ≈ $3,500).</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Roll to Aug $240</Button>
              <Button size="sm" variant="ghost">Let it assign</Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Premium collected 2026" value={fmtMoney(premiumYtd, c, { compact: true })} sub="10 credits across 4 underlyings" icon="coins" tone="gain" />
        <StatCard label="Open strategy P&L" value={<Delta value={openPnl} currency="USD" arrow={false} className="font-display text-[22px]" />} sub="vs premium received at open" icon="layers" />
        <StatCard label="Collateral committed" value={fmtMoney(collateral, 'USD', { compact: true })} sub="Cash securing short puts" icon="lock" />
        <StatCard label="Annualized premium yield" value="9.8%" sub="Estimate on collateral + covered shares" icon="trendUp" tone="warn" />
      </div>

      {/* Strategies */}
      <div className="space-y-3">
        {strategies.map((m) => (
          <StrategyCard key={m.strategy.id} m={m} pro={pro} expanded={expanded === m.strategy.id} onToggle={() => setExpanded(expanded === m.strategy.id ? null : m.strategy.id)} />
        ))}
      </div>
      {!pro && (
        <p className="px-1 text-[11px] text-ink3">
          Simple Mode groups contracts into strategies. Switch to Pro for greeks, payoff diagrams, roll history, breakevens and expiry scenarios.
        </p>
      )}
    </div>
  )
}

function StrategyCard({ m, pro, expanded, onToggle }: { m: StrategyMetrics; pro: boolean; expanded: boolean; onToggle: () => void }) {
  const s = m.strategy
  const inst = anyInstrument(s.underlying)
  const riskTone = m.assignmentRisk === 'high' ? 'loss' : m.assignmentRisk === 'elevated' ? 'warn' : 'gain'
  const payoff = useMemo(() => buildPayoff(m), [m])

  return (
    <Card pad>
      <button onClick={onToggle} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-left">
        <span className="flex min-w-[150px] items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{s.underlying}</span>
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">{STRATEGY_LABELS[s.kind]}</span>
            <span className="text-[11px] text-ink3">{accountById(s.accountId)?.institution} · opened {fmtDate(s.openedAt, 'short')}</span>
          </span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Net premium</span>
          <span className={cn('tnum text-[13px] font-semibold', m.netPremium >= 0 ? 'text-ink' : 'text-loss')}>{fmtMoney(m.netPremium, 'USD')}</span>
        </span>
        <span className="min-w-[90px]">
          <span className="block text-[10.5px] text-ink3">Open P&L</span>
          <Delta value={m.pnl} pct={m.pnlPct} currency="USD" arrow={false} className="text-[12.5px]" />
        </span>
        <span className="min-w-[110px]">
          <span className="block text-[10.5px] text-ink3">Expiry</span>
          <span className="tnum text-[12.5px] font-medium text-ink">{fmtDate(m.expiry, 'short')} · {m.daysToExpiry}d</span>
        </span>
        <Badge tone={riskTone} icon={m.assignmentRisk === 'high' ? 'alert' : undefined} className="ml-auto">
          {m.assignmentRisk === 'high' ? 'Assignment likely' : m.assignmentRisk === 'elevated' ? 'Watch closely' : 'Low risk'}
        </Badge>
        <Icon name="chevronDown" size={15} className={cn('text-ink3 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="fade-up mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
          <div>
            {pro ? (
              <>
                <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Legs</div>
                <div className="scroll-thin overflow-x-auto">
                  <table className="w-full min-w-[420px] text-[12px]">
                    <thead className="text-[10px] uppercase tracking-wide text-ink3">
                      <tr>
                        <th className="py-1.5 text-left font-semibold">Side</th>
                        <th className="py-1.5 text-right font-semibold">Strike</th>
                        <th className="py-1.5 text-right font-semibold">Expiry</th>
                        <th className="py-1.5 text-right font-semibold">Qty</th>
                        <th className="py-1.5 text-right font-semibold">Open</th>
                        <th className="py-1.5 text-right font-semibold">Mark</th>
                        <th className="py-1.5 text-right font-semibold">Δ</th>
                        <th className="py-1.5 text-right font-semibold">θ/day</th>
                        <th className="py-1.5 text-right font-semibold">IV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.legs.map((l) => (
                        <tr key={l.id} className="border-t border-line">
                          <td className="py-1.5"><Badge tone={l.side === 'short' ? 'loss' : 'gain'}>{l.side} {l.type}</Badge></td>
                          <td className="tnum py-1.5 text-right">${l.strike}</td>
                          <td className="tnum py-1.5 text-right">{fmtDate(l.expiry, 'short')}</td>
                          <td className="tnum py-1.5 text-right">{l.contracts}</td>
                          <td className="tnum py-1.5 text-right">{fmtNum(Math.abs(l.premium))}</td>
                          <td className="tnum py-1.5 text-right">{fmtNum(Math.abs(l.currentPrice))}</td>
                          <td className="tnum py-1.5 text-right">{l.delta.toFixed(2)}</td>
                          <td className="tnum py-1.5 text-right">{l.theta.toFixed(2)}</td>
                          <td className="tnum py-1.5 text-right">{Math.round(l.iv * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="space-y-0.5">
                <KV k="Underlying price" v={`$${fmtNum(m.underlyingPrice)}`} />
                <KV k="Premium received" v={fmtMoney(m.netPremium, 'USD')} />
                <KV k="Current gain / loss" v={<Delta value={m.pnl} currency="USD" arrow={false} />} />
                <KV k="Days remaining" v={`${m.daysToExpiry}`} />
                {m.actionNeeded && <KV k="Action needed" v={<span className="text-loss">{m.actionNeeded.split('—')[1] ?? m.actionNeeded}</span>} />}
              </div>
            )}

            <div className="mt-3 space-y-0.5">
              {pro && <KV k="Breakeven" v={`$${fmtNum(m.breakeven)}`} />}
              {pro && m.maxProfit !== null && <KV k="Max profit" v={fmtMoney(m.maxProfit, 'USD')} />}
              {pro && <KV k="Max loss" v={m.maxLoss !== null ? fmtMoney(-m.maxLoss, 'USD') : s.kind === 'covered_call' ? 'Downside of shares (covered)' : 'Defined by structure'} />}
              {s.collateral && <KV k="Collateral / buying power" v={fmtMoney(s.collateral, 'USD')} />}
              {s.linkedPositionId && (
                <KV k="Covered by" v={<Link to={`/position/${s.underlying}`} className="text-brand hover:underline">{s.legs[0].contracts * 100} shares of {s.underlying} →</Link>} />
              )}
            </div>

            {pro && s.rollHistory && s.rollHistory.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Roll history</div>
                {s.rollHistory.map((r, i) => (
                  <div key={i} className="flex justify-between border-b border-line py-1.5 text-[11.5px] last:border-0">
                    <span className="text-ink2">{fmtDate(r.date, 'short')} — {r.note}</span>
                    <span className="tnum text-gain">+${(r.credit * 100 * s.legs[0].contracts).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3"><ProvenanceChip provenance={s.source.provenance} asOf={s.source.asOf} /></div>
          </div>

          {pro && (
            <div>
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Payoff at expiry</div>
              <PayoffDiagram
                payoff={payoff}
                spot={m.underlyingPrice}
                breakeven={m.breakeven}
                summary={`${s.underlying} ${STRATEGY_LABELS[s.kind]} payoff`}
              />
              <div className="mt-2 rounded-lg bg-surface2 p-2.5 text-[11.5px] leading-relaxed text-ink2">
                <b className="text-ink">Expiry scenarios: </b>
                {scenarioText(m)}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function buildPayoff(m: StrategyMetrics): { price: number; pnl: number }[] {
  const s = m.strategy
  const spot = m.underlyingPrice
  const lo = spot * 0.78
  const hi = spot * 1.22
  const pts: { price: number; pnl: number }[] = []
  for (let i = 0; i <= 60; i++) {
    const price = lo + ((hi - lo) * i) / 60
    let pnl = 0
    for (const l of s.legs) {
      const mult = l.contracts * 100
      const intrinsic = l.type === 'call' ? Math.max(0, price - l.strike) : Math.max(0, l.strike - price)
      // premium sign in data: + received (short), − paid (long)
      pnl += l.premium * mult + (l.side === 'long' ? intrinsic : -intrinsic) * mult
    }
    // Covered calls include the underlying shares' P&L versus today's price
    if (s.kind === 'covered_call') {
      const short = s.legs.find((l) => l.side === 'short')!
      pnl += (price - spot) * short.contracts * 100
    }
    pts.push({ price, pnl })
  }
  return pts
}

function scenarioText(m: StrategyMetrics): string {
  const s = m.strategy
  const short = s.legs.find((l) => l.side === 'short')
  if (!short) return ''
  if (s.kind === 'covered_call')
    return `Above $${short.strike}: shares called away, keep ${fmtMoney(m.maxProfit ?? 0, 'USD')} total. Below $${short.strike}: keep shares + full ${fmtMoney(m.netPremium, 'USD')} premium.`
  if (s.kind === 'cash_secured_put')
    return `Below $${short.strike}: assigned ${short.contracts * 100} shares at an effective ${fmtNum(m.breakeven)} cost. Above: keep the full premium.`
  if (s.kind === 'vertical_spread')
    return `Above $${short.strike}: max profit ${fmtMoney(m.maxProfit ?? 0, 'USD')}. Below $${s.legs.find((l) => l.side === 'long')?.strike}: max loss ${fmtMoney(m.maxLoss ?? 0, 'USD')}.`
  return `Short leg decays fastest near $${short.strike}; long leg retains value past ${fmtDate(s.legs.find((l) => l.side === 'long')?.expiry ?? m.expiry, 'short')}.`
}
