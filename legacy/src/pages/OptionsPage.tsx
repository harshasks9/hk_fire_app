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
import {
  IMPORTED_OPTION_TRADES, IMPORTED_OPTION_HOLDINGS, IMPORTED_SUMMARY, IMPORTED_DATA_GAPS,
  MOOMOO_ACCOUNT_LABEL, MOOMOO_STATEMENTS,
} from '@/data/moomooOptionTrades'

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
      {/* Imported real trades — Moomoo SG (always first: real data leads) */}
      <ImportedTradesSection pro={pro} />

      {/* Sample dataset divider */}
      <div className="flex items-center gap-3 pt-2">
        <Badge tone="warn">Demo dataset below</Badge>
        <span className="text-[11px] text-ink3">The strategies and stats that follow are Meridian's sample household data, not your imported account.</span>
      </div>

      {/* Urgent banner — visible in BOTH modes */}
      {urgent.map((u) => (
        <Card key={u.strategy.id} pad className="border-loss/40 bg-loss-soft/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-loss-soft text-loss"><Icon name="alert" size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-ink">
                {u.strategy.underlying} {STRATEGY_LABELS[u.strategy.kind].toLowerCase()} expires in {u.daysToExpiry} day{u.daysToExpiry === 1 ? '' : 's'} — in the money
              </div>
              <p className="text-[12px] leading-relaxed text-ink2">{u.actionNeeded}. Rolling or accepting assignment is a broker action — Meridian tracks the outcome, it can't place orders.</p>
            </div>
          </div>
        </Card>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Premium collected 2026" value={fmtMoney(premiumYtd, c, { compact: true })} sub={`Across ${OPTION_STRATEGIES.length} sample strategies`} icon="coins" tone="gain" />
        <StatCard label="Open strategy P&L" value={<Delta value={openPnl} currency="USD" arrow={false} className="font-display text-[22px]" />} sub="vs premium received at open" icon="layers" />
        <StatCard label="Collateral committed" value={fmtMoney(collateral, 'USD', { compact: true })} sub="Cash securing short puts" icon="lock" />
        <StatCard label="Strategies tracked" value={`${strategies.length}`} sub={`${urgent.length} need${urgent.length === 1 ? 's' : ''} attention before expiry`} icon="trendUp" tone={urgent.length ? 'warn' : 'neutral'} />
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

/* -- Imported real trades: Moomoo SG Margin (•••5272) ---------------------------- */

function ImportedTradesSection({ pro }: { pro: boolean }) {
  const [showGaps, setShowGaps] = useState(false)
  const s = IMPORTED_SUMMARY
  return (
    <div className="space-y-3">
      <Card pad className="border-brand/30 bg-brand-soft/25">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-invert"><Icon name="check" size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-ink">Your imported trades — {MOOMOO_ACCOUNT_LABEL}</span>
              <Badge tone="brand" icon="file">Imported from {MOOMOO_STATEMENTS.length} statements</Badge>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">
              Extracted from your Mar–Jun 2026 Moomoo Singapore statements. Premiums, fees and outcomes are the broker's own figures. USD.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/trading-review" className="text-[12px] font-medium text-brand hover:underline">Fidelity trading review →</Link>
            <button onClick={() => setShowGaps((v) => !v)} className="text-[12px] font-medium text-warn hover:underline">
              {IMPORTED_DATA_GAPS.length} data gaps
            </button>
          </div>
        </div>
        {showGaps && (
          <div className="fade-up mt-3 rounded-lg bg-warn-soft/60 p-3">
            {IMPORTED_DATA_GAPS.map((g, i) => (
              <p key={i} className="flex items-start gap-2 py-0.5 text-[11.5px] leading-relaxed text-ink2">
                <Icon name="alert" size={11} className="mt-0.5 shrink-0 text-warn" />{g}
              </p>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Net premium collected" value={fmtMoney(s.netPremium, 'USD', { decimals: 2 })} sub={`${fmtMoney(s.grossPremium, 'USD', { decimals: 2 })} gross − ${fmtMoney(s.fees, 'USD', { decimals: 2 })} fees`} icon="coins" tone="gain" />
        <StatCard label="Expired worthless" value={`${s.expiredWorthlessCount} of ${s.orders}`} sub={`${fmtMoney(s.closedNet, 'USD', { decimals: 2 })} net banked — 100% win rate so far`} icon="check" tone="gain" />
        <StatCard label="Open at last statement" value={`${s.openCount}`} sub="MSFT 07/06 $340P ×10 — Jul statement needed" icon="clock" tone="warn" />
        <StatCard label="Contracts written" value={`${s.contracts}`} sub={`${s.orders} orders · NVDA + MSFT short puts`} icon="layers" />
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="px-5 pt-4">
          <SectionHead title="Trade log" sub="Every option order from your statements, with broker-itemized fees" />
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-[12px]">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Order</th>
                <th className="px-2 py-2 text-left font-semibold">Contract</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Price</th>
                <th className="px-2 py-2 text-right font-semibold">Gross</th>
                <th className="px-2 py-2 text-right font-semibold">Fees</th>
                <th className="px-2 py-2 text-right font-semibold">Net</th>
                <th className="px-2 py-2 text-left font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {IMPORTED_OPTION_TRADES.map((t, i) => (
                <tr key={i} className="tnum border-b border-line last:border-0 hover:bg-surface2/50" title={t.note}>
                  <td className="px-5 py-2.5">
                    <span className="font-medium text-ink">{fmtDate(t.orderDate)}</span>
                    <span className="block text-[10px] text-ink3">{t.time} SGT · {t.action}</span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="font-semibold text-ink">{t.underlying} ${t.strike} {t.type.toUpperCase()}</span>
                    <span className="block text-[10px] text-ink3">exp {fmtDate(t.expiry, 'short')}{t.fills ? ` · ${t.fills.length} fills` : ''}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">{t.qty}</td>
                  <td className="px-2 py-2.5 text-right">{t.price.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(t.gross, 'USD', { decimals: 2 })}</td>
                  <td className="px-2 py-2.5 text-right text-ink2">{t.fees.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-right font-semibold text-gain">{fmtMoney(t.net, 'USD', { decimals: 2 })}</td>
                  <td className="px-2 py-2.5">
                    {t.outcome === 'expired_worthless' ? (
                      <Badge tone="gain" icon="check">Expired {fmtDate(t.outcomeDate!, 'short')}</Badge>
                    ) : (
                      <Badge tone="warn" icon="clock">Open at Jun 30</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-2.5 text-[10.5px] text-ink3">
          Source: {MOOMOO_STATEMENTS.slice(-2).join(' · ')} — figures transcribed verbatim; hover a row for statement notes.
        </p>
      </Card>

      <Card pad>
        <SectionHead
          title="Open option holdings (as of Jun 30 statement)"
          sub="LEAPS held in the same account — cost basis awaits pre-March statements"
        />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {IMPORTED_OPTION_HOLDINGS.map((h, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  {h.side === 'long' ? '+' : '−'}{h.qty}× {h.underlying} ${h.strike} {h.type.toUpperCase()}
                </span>
                <Badge tone="neutral">exp {fmtDate(h.expiry, 'medium')}</Badge>
              </div>
              <div className="tnum mt-1.5 flex items-baseline justify-between text-[12px]">
                <span className="text-ink2">Mark {h.markPrice.toFixed(2)} · {fmtDate(h.markDate, 'short')}</span>
                <span className="font-semibold text-ink">{fmtMoney(h.markValue, 'USD')}</span>
              </div>
              {h.earlierMark && (
                <div className="tnum text-[10.5px] text-ink3">Mar 31 mark: {h.earlierMark.price.toFixed(2)} ({h.markPrice >= h.earlierMark.price ? '+' : ''}{(((h.markPrice - h.earlierMark.price) / h.earlierMark.price) * 100).toFixed(0)}% since)</div>
              )}
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink2">{h.note}</p>
              <div className="mt-1.5"><Badge tone="info">Imported</Badge> <span className="text-[10px] text-ink3">{h.source}</span></div>
            </div>
          ))}
        </div>
        {pro && (
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            Pattern note (computed from the log): all six short puts were written 4–9 days from expiry at ~0.2–0.6% premium-to-strike,
            on NVDA and MSFT only — a short-dated OTM put income program. Annualized yield on collateral can't be computed honestly
            without knowing margin usage per trade; upload the July statement to extend the record.
          </p>
        )}
      </Card>
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
