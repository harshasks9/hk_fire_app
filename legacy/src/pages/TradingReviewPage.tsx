import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { fmtMoney, fmtNum, fmtPct, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, KV } from '@/components/ui'
import { Waterfall } from '@/components/charts'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import {
  FIDELITY_ACCOUNT_LABEL, FIDELITY_SOURCE_LABEL, TRADING_WINDOW, TRADING_STATS,
  STOCK_ROUND_TRIPS, REALIZED_BY_SYMBOL, ORPHAN_SELL_COUNT,
  OPTIONS_BY_UNDERLYING, OPTIONS_TOTALS, LIVE_STRUCTURES,
  INCOME_SUMMARY, CAMPAIGN_FLOWS, REBUY_PATTERN, TRADE_CADENCE, REALIZED_BY_MONTH,
  CO_TRADED_PAIRS, ORDER_SIZING, TRADING_STRENGTHS, TRADING_WEAKNESSES, FIDELITY_DATA_GAPS,
  type TradingFinding,
} from '@/data/fidelityTrading'

const usd = (n: number, decimals = 0) => fmtMoney(n, 'USD', { decimals })

export default function TradingReviewPage() {
  const app = useApp()
  const pro = app.mode === 'pro'
  const [showGaps, setShowGaps] = useState(false)
  const [tripSort, setTripSort] = useState<'date' | 'pnl'>('date')

  const trips = useMemo(() => {
    const t = [...STOCK_ROUND_TRIPS]
    if (tripSort === 'pnl') t.sort((a, b) => a.pnl - b.pnl)
    return t
  }, [tripSort])

  const cashBridge = useMemo(
    () => [
      { label: 'Dividends', value: INCOME_SUMMARY.dividendsTotal },
      { label: 'US withholding', value: INCOME_SUMMARY.nraWithholding },
      { label: 'Settled options', value: OPTIONS_TOTALS.settledCash },
      { label: 'Stock round trips', value: TRADING_STATS.totalRealized },
      { label: 'Margin interest', value: INCOME_SUMMARY.marginInterest },
    ],
    [],
  )
  const cashTotal = cashBridge.reduce((s, x) => s + x.value, 0)

  const harvested = CAMPAIGN_FLOWS.filter((c) => c.net > 0).slice(0, 8)
  const deployed = [...CAMPAIGN_FLOWS.filter((c) => c.net < 0)].sort((a, b) => a.net - b.net).slice(0, 8)
  const maxFlow = Math.max(...harvested.map((c) => c.net), ...deployed.map((c) => -c.net))

  return (
    <div className="fade-up space-y-5">
      {/* Provenance header */}
      <Card pad className="border-brand/30 bg-brand-soft/25">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-invert"><Icon name="trendUp" size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] font-semibold text-ink">Trading review — {FIDELITY_ACCOUNT_LABEL}</span>
              <Badge tone="brand" icon="file">Imported · {TRADING_WINDOW.transactions.toLocaleString()} transactions</Badge>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">
              Parsed from {FIDELITY_SOURCE_LABEL}, {fmtDate(TRADING_WINDOW.from)} → {fmtDate(TRADING_WINDOW.to)}.
              Every figure is computed from the broker's own rows — {TRADING_WINDOW.stockTradeCount} stock trades and {OPTIONS_TOTALS.positions} option
              contract lines across {TRADING_WINDOW.symbolsTraded} symbols. USD.
            </p>
          </div>
          <button onClick={() => setShowGaps((v) => !v)} className="text-[12px] font-medium text-warn hover:underline">
            {FIDELITY_DATA_GAPS.length} method notes
          </button>
        </div>
        {showGaps && (
          <div className="fade-up mt-3 rounded-lg bg-warn-soft/60 p-3">
            {FIDELITY_DATA_GAPS.map((g, i) => (
              <p key={i} className="flex items-start gap-2 py-0.5 text-[11.5px] leading-relaxed text-ink2">
                <Icon name="alert" size={11} className="mt-0.5 shrink-0 text-warn" />{g}
              </p>
            ))}
          </div>
        )}
      </Card>

      {/* Verdict */}
      <Card pad>
        <SectionHead title="The verdict" sub="One year of trading, reduced to its actual shape" />
        <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-ink2">
          Your <strong className="text-ink">income engines work</strong>: settled option premium earned {usd(OPTIONS_TOTALS.settledCash)} and
          dividends brought in {usd(INCOME_SUMMARY.dividendsTotal)} over the window.
          Your <strong className="text-ink">directional stock trades give part of it back</strong> — a 25% hit rate
          and {usd(TRADING_STATS.totalRealized)} realized, with losers held nearly twice as long as winners.
          And the account now carries a <strong className="text-ink">large correlated live book</strong>: {usd(-OPTIONS_TOTALS.liveCash)} of
          premium deployed in long LEAPS and risk reversals, stacked on the same names the stock book already owns.
          The pattern is a disciplined income investor sharing an account with an impatient directional trader — and the
          income investor is funding the other one.
        </p>
      </Card>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Stock round trips (realized)" value={usd(TRADING_STATS.totalRealized)} sub={`${TRADING_STATS.trips} trips · ${TRADING_STATS.wins} wins · win rate ${fmtPct(TRADING_STATS.winRate * 100, { decimals: 0 })}`} icon="scale" tone="loss" />
        <StatCard label="Settled option cash" value={`+${usd(OPTIONS_TOTALS.settledCash)}`} sub={`${OPTIONS_TOTALS.expiredLegs} lines expired · ${OPTIONS_TOTALS.assignedLegs} assigned — final cash`} icon="coins" tone="gain" />
        <StatCard label="Deployed in live options" value={usd(OPTIONS_TOTALS.liveCash)} sub={`${OPTIONS_TOTALS.liveContracts.toLocaleString()} contracts open, LEAPS to Jan 2028 — unmarked`} icon="layers" tone="warn" />
        <StatCard label="Dividends (net of withholding)" value={usd(INCOME_SUMMARY.dividendsTotal + INCOME_SUMMARY.nraWithholding)} sub={`${usd(INCOME_SUMMARY.dividendsTotal)} gross − ${usd(-INCOME_SUMMARY.nraWithholding)} NRA tax`} icon="wallet" tone="gain" />
      </div>

      {/* Strengths & weaknesses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Strengths" sub="What the record says you should keep doing" />
          <div className="space-y-2.5">
            {TRADING_STRENGTHS.map((f) => <FindingCard key={f.id} f={f} tone="gain" />)}
          </div>
        </Card>
        <Card pad>
          <SectionHead title="Weaknesses" sub="Where the record says the money leaks" />
          <div className="space-y-2.5">
            {TRADING_WEAKNESSES.map((f) => <FindingCard key={f.id} f={f} tone="loss" />)}
          </div>
        </Card>
      </div>

      {/* Cash engine bridge */}
      <Card pad>
        <SectionHead
          title="Where the cash actually came from"
          sub="Realized and settled flows only — market moves on open holdings are deliberately excluded"
        />
        <Waterfall
          items={cashBridge}
          currency="USD"
          summary={`Net realized cash generation ≈ ${usd(cashTotal)} over the window. The engines (dividends + settled premium) produced ${usd(INCOME_SUMMARY.dividendsTotal + OPTIONS_TOTALS.settledCash)}; withholding, stock losses and margin interest took ${usd(INCOME_SUMMARY.nraWithholding + TRADING_STATS.totalRealized + INCOME_SUMMARY.marginInterest)} back.`}
        />
      </Card>

      {/* Round trips */}
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <SectionHead
            title="Every completed stock round trip"
            sub={`FIFO-matched buys and sells inside the window · ${ORPHAN_SELL_COUNT} sells of pre-window positions excluded, not guessed`}
            className="mb-0"
          />
          <div className="flex gap-1 text-[11px]">
            <button onClick={() => setTripSort('date')} className={cn('rounded-full border px-2.5 py-1', tripSort === 'date' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink2 hover:bg-surface2')}>By date</button>
            <button onClick={() => setTripSort('pnl')} className={cn('rounded-full border px-2.5 py-1', tripSort === 'pnl' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink2 hover:bg-surface2')}>By P&L</button>
          </div>
        </div>
        <div className="scroll-thin mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-[12px]">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Symbol</th>
                <th className="px-2 py-2 text-left font-semibold">Held</th>
                <th className="px-2 py-2 text-right font-semibold">Days</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Buy</th>
                <th className="px-2 py-2 text-right font-semibold">Sell</th>
                <th className="px-2 py-2 text-right font-semibold">Cost</th>
                <th className="px-2 py-2 text-right font-semibold">P&L</th>
                <th className="px-5 py-2 text-right font-semibold">Return</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((r, i) => (
                <tr key={i} className="tnum border-b border-line last:border-0 hover:bg-surface2/50">
                  <td className="px-5 py-2 font-semibold text-ink">{r.sym}</td>
                  <td className="px-2 py-2 text-ink2">{fmtDate(r.buyDate, 'short')} → {fmtDate(r.sellDate, 'short')}<span className="ml-1 text-[10px] text-ink3">{r.sellDate.slice(0, 4)}</span></td>
                  <td className="px-2 py-2 text-right">{r.holdDays}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(r.qty, r.qty % 1 ? 2 : 0)}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(r.buyPx)}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(r.sellPx)}</td>
                  <td className="px-2 py-2 text-right text-ink2">{usd(r.cost)}</td>
                  <td className={cn('px-2 py-2 text-right font-semibold', r.pnl > 0 ? 'text-gain' : r.pnl < 0 ? 'text-loss' : 'text-ink2')}>{usd(r.pnl, 2)}</td>
                  <td className={cn('px-5 py-2 text-right', r.pnl > 0 ? 'text-gain' : r.pnl < 0 ? 'text-loss' : 'text-ink2')}>{fmtPct(r.retPct, { sign: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-2.5 text-[10.5px] text-ink3">
          Two EPR exits at exactly cost count as neither wins nor losses. Prices are the broker's fill prices; multi-lot same-day fills are merged.
        </p>
      </Card>

      {/* Realized by symbol + by month */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Realized P&L by symbol" sub="Round trips only — the directional scoreboard" />
          <div className="space-y-1.5">
            {REALIZED_BY_SYMBOL.map((s) => (
              <SignedBar key={s.sym} label={s.sym} sub={`${s.trips} trip${s.trips > 1 ? 's' : ''} · ${s.wins} win${s.wins === 1 ? '' : 's'}`} value={s.pnl} max={22441.42} />
            ))}
          </div>
        </Card>
        <Card pad>
          <SectionHead title="Realized P&L by month" sub="Only months with completed round trips shown" />
          <div className="space-y-1.5">
            {REALIZED_BY_MONTH.map(([m, v]) => (
              <SignedBar key={m} label={monthLabel(m)} value={v} max={15881.36} />
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            March 2026 is the capitulation month: MSFT −$22.4K and the GLD re-entry −$3.9K were both closed on Mar 30, right as the
            book was de-risked. July repeats the shape with the PYPL capitulation (−$11.4K in one day).
          </p>
        </Card>
      </div>

      {/* Options program */}
      <Card pad={false} className="overflow-hidden">
        <div className="px-5 pt-4">
          <SectionHead
            title="Options program by underlying"
            sub="Settled cash is final (contracts past expiry). Live cash is premium deployed in contracts still open — value unknown without marks."
          />
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[780px] text-[12px]">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Underlying</th>
                <th className="px-2 py-2 text-right font-semibold">Sold</th>
                <th className="px-2 py-2 text-right font-semibold">Bought open</th>
                <th className="px-2 py-2 text-right font-semibold">Expired</th>
                <th className="px-2 py-2 text-right font-semibold">Assigned</th>
                <th className="px-2 py-2 text-right font-semibold">Settled cash</th>
                <th className="px-5 py-2 text-right font-semibold">Live cash</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS_BY_UNDERLYING.map((o) => (
                <tr key={o.under} className="tnum border-b border-line last:border-0 hover:bg-surface2/50">
                  <td className="px-5 py-2 font-semibold text-ink">{o.under}</td>
                  <td className="px-2 py-2 text-right">{o.soldContracts || '—'}</td>
                  <td className="px-2 py-2 text-right">{o.boughtOpen || '—'}</td>
                  <td className="px-2 py-2 text-right text-ink2">{o.expiredLegs || '—'}</td>
                  <td className="px-2 py-2 text-right text-ink2">{o.assignedLegs || '—'}</td>
                  <td className={cn('px-2 py-2 text-right font-semibold', o.settledCash > 0 ? 'text-gain' : o.settledCash < 0 ? 'text-loss' : 'text-ink3')}>{o.settledCash ? usd(o.settledCash, 2) : '—'}</td>
                  <td className={cn('px-5 py-2 text-right', o.liveCash < 0 ? 'text-warn' : o.liveCash > 0 ? 'text-gain' : 'text-ink3')}>{o.liveCash ? usd(o.liveCash, 2) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="tnum border-t border-line bg-surface2/60 font-semibold text-ink">
                <td className="px-5 py-2.5">Total</td>
                <td className="px-2 py-2.5 text-right">{OPTIONS_TOTALS.soldContracts.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-right">{OPTIONS_TOTALS.boughtOpen}</td>
                <td className="px-2 py-2.5 text-right">{OPTIONS_TOTALS.expiredLegs}</td>
                <td className="px-2 py-2.5 text-right">{OPTIONS_TOTALS.assignedLegs}</td>
                <td className="px-2 py-2.5 text-right text-gain">{usd(OPTIONS_TOTALS.settledCash, 2)}</td>
                <td className="px-5 py-2.5 text-right text-warn">{usd(OPTIONS_TOTALS.liveCash, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Live structures */}
      <Card pad>
        <SectionHead
          title="The live option book, grouped into structures"
          sub={`${usd(-OPTIONS_TOTALS.liveCash)} net premium deployed in contracts still open at ${fmtDate(TRADING_WINDOW.to)}`}
        />
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {LIVE_STRUCTURES.map((s) => (
            <div key={s.under} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink">{s.under}</span>
                <span className={cn('tnum text-[12.5px] font-semibold', s.cash < 0 ? 'text-warn' : 'text-gain')}>{usd(s.cash, 0)}</span>
              </div>
              <div className="mt-0.5 text-[10.5px] text-ink3">{s.label}</div>
              <div className="mt-2 space-y-0.5">
                {s.legs.map((l, i) => (
                  <div key={i} className="tnum flex items-baseline justify-between text-[11px]">
                    <span className="text-ink2">{l.netQty > 0 ? '+' : ''}{l.netQty}× ${l.strike} {l.type === 'call' ? 'C' : 'P'} <span className="text-ink3">{fmtDate(l.expiry, 'short')} {l.expiry.slice(0, 4)}</span></span>
                    <span className={l.cash < 0 ? 'text-ink2' : 'text-gain'}>{usd(l.cash, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {pro && (
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            Pattern: long-dated calls financed by short puts (risk reversals) on the mega-caps, outright LEAPS calls on OWL, BAM, NVO, DRAM,
            ARE, FOUR — plus the deep-ITM GOOG Dec-2027 90/100 call spread, which behaves like a financing position. Almost every leg is
            long equity beta with 2027–2028 expiry. The short puts (SPY $500, MSFT $380, META $400, GOOG $190, UNH $190, COF $150) all
            come due in the same kind of market.
          </p>
        )}
      </Card>

      {/* Rotation map */}
      <Card pad>
        <SectionHead title="The rotation map" sub="Net cash per symbol across the window — where money left, and where it went. Flows, not P&L." />
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gain">Harvested</div>
            <div className="space-y-1.5">
              {harvested.map((c) => (
                <FlowBar key={c.sym} label={c.sym} value={c.net} max={maxFlow} tone="gain" sub={`${c.trades} trades${c.dividends > 500 ? ` · ${usd(c.dividends)} divs` : ''}`} />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warn">Deployed</div>
            <div className="space-y-1.5">
              {deployed.map((c) => (
                <FlowBar key={c.sym} label={c.sym} value={c.net} max={maxFlow} tone="warn" sub={`${c.trades} trades${c.dividends > 500 ? ` · ${usd(c.dividends)} divs` : ''}`} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
          Read: ~$1.9M was harvested from legacy positions (MSFT, SPG, EPR, NNN, JEPI, GOOG, HIW…) and redeployed into the income
          complex — OWL above all ({usd(1029167)} inbound including options), then META, BAM, DEA, GLD, PAX, SPYI, MSDL. The rotation
          itself was executed patiently; the concentration it produced is the risk (see weaknesses).
        </p>
      </Card>

      {/* Behavior: cadence, rebuys, correlation */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Trading cadence" sub="Stock + option trades per month — the program never stops" />
          <CadenceBars data={TRADE_CADENCE} />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            <KV k="Median buy" v={usd(ORDER_SIZING.medianBuy, 2)} />
            <KV k="90th percentile" v={usd(ORDER_SIZING.p90Buy)} />
            <KV k="Largest buy" v={usd(ORDER_SIZING.maxBuy)} />
          </div>
        </Card>
        <Card pad>
          <SectionHead title="Re-entry behavior" sub="After selling, how was the next buy priced?" />
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="warn">{REBUY_PATTERN.atHigherPrice} of {REBUY_PATTERN.total} re-entries were at a higher price</Badge>
          </div>
          <div className="space-y-1">
            {REBUY_PATTERN.examples.map((r, i) => (
              <div key={i} className="tnum flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] odd:bg-surface2/50">
                <span className="font-medium text-ink">{r.sym}</span>
                <span className="text-ink2">sold {fmtNum(r.soldAt)} <span className="text-ink3">{fmtDate(r.sellDate, 'short')}</span></span>
                <span className={cn('font-medium', r.higher ? 'text-warn' : 'text-gain')}>
                  rebought {fmtNum(r.reboughtAt)} <span className="text-ink3">{fmtDate(r.rebuyDate, 'short')}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            Selling and re-entering higher is paying a fee to feel safe. The GLD sequence — banked +$10.5K, re-entered $2 higher,
            gave back −$3.9K — is the expensive version of this habit.
          </p>
        </Card>
      </div>

      {/* Correlation */}
      <Card pad>
        <SectionHead title="Correlation & concentration" sub="Which names move and trade together in this account" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">Co-traded pairs (same-week activity)</div>
            <div className="space-y-1.5">
              {CO_TRADED_PAIRS.map(([pair, n]) => (
                <div key={pair} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-[11.5px] font-medium text-ink">{pair}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-brand/70" style={{ width: `${(n / 17) * 100}%` }} />
                  </div>
                  <span className="tnum w-8 text-right text-[11px] text-ink2">{n}w</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink3">OWL appears in 8 of the top 12 pairs — it is the hub of the whole trading graph.</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-line p-3">
              <div className="text-[12px] font-semibold text-ink">Complex 1 — Mega-cap tech &amp; leverage</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">
                MSFT · GOOG · META · NVDA · SNOW · NOW · MU/INTC — plus leveraged wrappers DRAM (2× MU), MSFU (2× MSFT), GGLL (2× GOOG)
                and the LEAPS risk reversals. One factor: tech beta.
              </p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="text-[12px] font-semibold text-ink">Complex 2 — Rate-sensitive income</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">
                REITs (DEA, EPR, SPG, NNN, HIW, ARE…) · alt managers (OWL, PAX, BAM) · BDCs (MSDL, OTF, BXSL) · option-income funds
                (NVDY, SPYI, XDTE, YMAG, DIVO). One factor: rates &amp; credit spreads.
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-ink3">
              A rate shock or broad risk-off event hits both complexes at once — the two books diversify the tickers, not the risk.
              GLD is the only meaningful diversifier in the record, and it is also the trade with the best realized edge.
            </p>
          </div>
        </div>
      </Card>

      {/* Income detail */}
      <Card pad>
        <SectionHead title="The dividend machine" sub={`${usd(INCOME_SUMMARY.dividendsTotal)} collected · ${usd(-INCOME_SUMMARY.nraWithholding)} withheld at source (NRA 30%) · ${usd(INCOME_SUMMARY.reinvested)} auto-reinvested`} />
        <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
          {INCOME_SUMMARY.topPayers.map(([sym, v]) => (
            <KV key={sym} k={sym} v={usd(v, 2)} />
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
          The 30% non-resident withholding is structural for US-domiciled funds and stocks: ≈{fmtPct((-INCOME_SUMMARY.nraWithholding / INCOME_SUMMARY.dividendsTotal) * 100, { decimals: 1 })} of
          the gross stream never arrives. For the index-fund sleeve, Irish-domiciled UCITS equivalents reduce treaty leakage; for single
          names it is the cost of the strategy. Computed drag, not tax advice.
        </p>
      </Card>

      {/* Cross-links */}
      <div className="flex flex-wrap items-center gap-3 pb-2">
        <Link to="/options" className="text-[12.5px] font-medium text-brand hover:underline">Moomoo option trades →</Link>
        <Link to="/research" className="text-[12.5px] font-medium text-brand hover:underline">Research Lab dossiers →</Link>
        <span className="text-[11px] text-ink3">Round trips, option flows and campaign figures reconcile to the CSV exports; see method notes above.</span>
      </div>
    </div>
  )
}

function FindingCard({ f, tone }: { f: TradingFinding; tone: 'gain' | 'loss' }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className={cn(
        'block w-full rounded-xl border p-3 text-left transition-colors',
        tone === 'gain' ? 'border-gain/25 bg-gain-soft/30 hover:bg-gain-soft/50' : 'border-loss/25 bg-loss-soft/30 hover:bg-loss-soft/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-semibold leading-snug text-ink">{f.title}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Badge tone={f.kind === 'calculated' ? 'info' : 'neutral'}>{f.kind}</Badge>
          <Icon name={open ? 'chevronDown' : 'chevronRight'} size={13} className="mt-0.5 text-ink3" />
        </span>
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">{f.detail}</p>
      {open && (
        <div className="fade-up mt-2 space-y-1 border-t border-line pt-2">
          {f.evidence.map((e, i) => (
            <p key={i} className="tnum flex items-start gap-1.5 text-[11px] leading-relaxed text-ink2">
              <Icon name="check" size={11} className={cn('mt-0.5 shrink-0', tone === 'gain' ? 'text-gain' : 'text-loss')} />{e}
            </p>
          ))}
        </div>
      )}
    </button>
  )
}

function SignedBar({ label, sub, value, max }: { label: string; sub?: string; value: number; max: number }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11.5px] font-medium text-ink">{label}</span>
      {sub && <span className="hidden w-24 shrink-0 text-[10px] text-ink3 sm:block">{sub}</span>}
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
        <div
          className={cn('absolute top-0 h-full', value >= 0 ? 'left-1/2 rounded-r-full bg-gain/80' : 'right-1/2 rounded-l-full bg-loss/70')}
          style={{ width: `${pct / 2}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
      </div>
      <span className={cn('tnum w-24 shrink-0 text-right text-[11.5px] font-medium', value > 0 ? 'text-gain' : value < 0 ? 'text-loss' : 'text-ink3')}>
        {fmtMoney(value, 'USD', { decimals: 0 })}
      </span>
    </div>
  )
}

function FlowBar({ label, sub, value, max, tone }: { label: string; sub?: string; value: number; max: number; tone: 'gain' | 'warn' }) {
  const pct = Math.max(2, (Math.abs(value) / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11.5px] font-medium text-ink">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
        <div className={cn('h-full rounded-full', tone === 'gain' ? 'bg-gain/75' : 'bg-warn/75')} style={{ width: `${pct}%` }} />
      </div>
      <span className="tnum w-24 shrink-0 text-right text-[11.5px] font-medium text-ink">{fmtMoney(Math.abs(value), 'USD', { compact: true })}</span>
      {sub && <span className="hidden w-28 shrink-0 text-right text-[10px] text-ink3 md:block">{sub}</span>}
    </div>
  )
}

function CadenceBars({ data }: { data: [string, number][] }) {
  const max = Math.max(...data.map(([, n]) => n))
  return (
    <div>
      <div className="flex h-[120px] items-end gap-1">
        {data.map(([m, n]) => (
          <div key={m} className="group relative flex-1" title={`${monthLabel(m)}: ${n} trades`}>
            <div className="w-full rounded-t bg-brand/60 transition-colors group-hover:bg-brand" style={{ height: `${(n / max) * 112}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[9px] text-ink3">
        {data.map(([m]) => (
          <span key={m} className="flex-1 text-center">{m.slice(5)}</span>
        ))}
      </div>
    </div>
  )
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[Number(mo) - 1]} ${y}`
}
