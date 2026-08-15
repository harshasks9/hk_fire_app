import { describe, it, expect } from 'vitest'
import {
  STOCK_ROUND_TRIPS, TRADING_STATS, REALIZED_BY_SYMBOL, REALIZED_BY_MONTH,
  OPTIONS_BY_UNDERLYING, OPTIONS_TOTALS, LIVE_OPTION_BOOK, LIVE_STRUCTURES,
  INCOME_SUMMARY, CAMPAIGN_FLOWS, TRADE_CADENCE, TRADING_WINDOW,
} from '@/data/fidelityTrading'

/* These tests pin the imported Fidelity dataset to the figures computed from
   the user's CSV exports. If a row is edited, the reconciliation breaks. */

describe('fidelity round trips', () => {
  it('has 24 FIFO round trips reconciling to −$35,461.56 realized', () => {
    expect(STOCK_ROUND_TRIPS).toHaveLength(24)
    expect(TRADING_STATS.totalRealized).toBeCloseTo(-35461.56, 1)
  })

  it('win rate is 6/24 = 25% with two flat EPR exits', () => {
    expect(TRADING_STATS.wins).toBe(6)
    expect(TRADING_STATS.losses).toBe(16)
    expect(TRADING_STATS.flat).toBe(2)
    expect(TRADING_STATS.winRate).toBeCloseTo(0.25, 5)
  })

  it('median hold: winners 63d, losers 116d', () => {
    expect(TRADING_STATS.medianHoldWin).toBe(63)
    expect(TRADING_STATS.medianHoldLoss).toBe(116)
  })

  it('per-trip P&L equals proceeds minus cost', () => {
    // Merged multi-lot trips display the first lot's buy price; cost is the
    // authoritative summed basis, so P&L must equal sellPx × qty − cost.
    for (const r of STOCK_ROUND_TRIPS) {
      // $5 tolerance: fractional share counts are stored rounded to 2dp, so
      // high-priced names drift by up to price × 0.005 on each leg
      expect(Math.abs(r.pnl - (r.sellPx * r.qty - r.cost))).toBeLessThan(5)
      expect(r.retPct).toBeCloseTo((r.pnl / r.cost) * 100, 1)
    }
  })

  it('symbol rollup: MSFT is the worst (−$22,441), GLD the best (+$6,728)', () => {
    const msft = REALIZED_BY_SYMBOL.find((s) => s.sym === 'MSFT')!
    const gld = REALIZED_BY_SYMBOL.find((s) => s.sym === 'GLD')!
    expect(msft.pnl).toBeCloseTo(-22441.42, 1)
    expect(gld.pnl).toBeCloseTo(6727.85, 1)
    expect(REALIZED_BY_SYMBOL[0].sym).toBe('MSFT') // sorted worst-first
  })

  it('monthly realized sums to the total', () => {
    const monthly = REALIZED_BY_MONTH.reduce((s, [, v]) => s + v, 0)
    expect(monthly).toBeCloseTo(TRADING_STATS.totalRealized, 1)
  })

  it('PYPL capitulation: six lots all closed 2026-07-27 for −$11,398', () => {
    const pypl = STOCK_ROUND_TRIPS.filter((r) => r.sym === 'PYPL')
    expect(pypl).toHaveLength(6)
    expect(pypl.every((r) => r.sellDate === '2026-07-27' && r.sellPx === 48.5)).toBe(true)
    expect(pypl.reduce((s, r) => s + r.pnl, 0)).toBeCloseTo(-11398, 0)
  })
})

describe('fidelity options program', () => {
  it('premium totals reconcile: in $384,620.88 − out $537,618.00 − fees $1,753.12', () => {
    expect(OPTIONS_TOTALS.premIn).toBeCloseTo(384620.88, 1)
    expect(OPTIONS_TOTALS.premOut).toBeCloseTo(537618.0, 1)
    expect(OPTIONS_TOTALS.fees).toBeCloseTo(1753.12, 1)
    expect(OPTIONS_TOTALS.netCash).toBeCloseTo(-154750.24, 1)
  })

  it('settled + live cash decompose the net exactly', () => {
    expect(OPTIONS_TOTALS.settledCash).toBeCloseTo(161239.98, 1)
    expect(OPTIONS_TOTALS.liveCash).toBeCloseTo(-315990.22, 1)
    expect(OPTIONS_TOTALS.settledCash + OPTIONS_TOTALS.liveCash).toBeCloseTo(OPTIONS_TOTALS.netCash, 1)
  })

  it('per-underlying settled + live equals premIn − premOut − fees', () => {
    for (const o of OPTIONS_BY_UNDERLYING) {
      expect(o.settledCash + o.liveCash).toBeCloseTo(o.premIn - o.premOut - o.fees, 1)
    }
  })

  it('1,903 contracts sold; 99 in-window lines expired; 28 assigned; 251 lines', () => {
    expect(OPTIONS_TOTALS.soldContracts).toBe(1903)
    // 99 among contracts traded in-window; 8 more expiries belong to
    // contracts opened before Jul 2025 (107 expiry events globally).
    expect(OPTIONS_TOTALS.expiredLegs).toBe(99)
    expect(OPTIONS_TOTALS.assignedLegs).toBe(28)
    expect(OPTIONS_TOTALS.positions).toBe(251)
  })

  it('live book cash sums to the live total; OWL carries 324 long calls', () => {
    const liveSum = LIVE_OPTION_BOOK.reduce((s, p) => s + p.cash, 0)
    expect(liveSum).toBeCloseTo(OPTIONS_TOTALS.liveCash, 1)
    const owl = LIVE_OPTION_BOOK.filter((p) => p.under === 'OWL')
    expect(owl.reduce((s, p) => s + p.netQty, 0)).toBe(324)
    expect(owl.reduce((s, p) => s + p.cash, 0)).toBeCloseTo(-91690.58, 1)
  })

  it('recognizes live structures: risk reversals, outright calls, mixed books', () => {
    const rr = LIVE_STRUCTURES.filter((s) => s.label.startsWith('Risk reversal'))
    const names = rr.map((s) => s.under)
    for (const u of ['META', 'SPY', 'UNH', 'COF']) expect(names).toContain(u)
    // MSFT and GOOG carry extra legs (short Aug calls / the 90-100 spread) → mixed
    expect(LIVE_STRUCTURES.find((s) => s.under === 'MSFT')!.label).toBe('Mixed book')
    expect(LIVE_STRUCTURES.find((s) => s.under === 'GOOG')!.label).toBe('Mixed book')
    const owl = LIVE_STRUCTURES.find((s) => s.under === 'OWL')!
    expect(owl.label).toBe('Long calls (outright)')
  })
})

describe('fidelity income and rotation', () => {
  it('dividends $228,896.75 with −$27,078.42 NRA withholding (≈11.8%)', () => {
    expect(INCOME_SUMMARY.dividendsTotal).toBeCloseTo(228896.75, 1)
    expect(INCOME_SUMMARY.nraWithholding).toBeCloseTo(-27078.42, 1)
    const dragPct = -INCOME_SUMMARY.nraWithholding / INCOME_SUMMARY.dividendsTotal
    expect(dragPct).toBeGreaterThan(0.11)
    expect(dragPct).toBeLessThan(0.125)
  })

  it('OWL is the biggest flow both ways: top dividend payer and top deployment', () => {
    expect(INCOME_SUMMARY.topPayers[0][0]).toBe('OWL')
    const byNet = [...CAMPAIGN_FLOWS].sort((a, b) => a.net - b.net)
    expect(byNet[0].sym).toBe('OWL')
    expect(byNet[0].net).toBeCloseTo(-1029167.42, 1)
    const top = [...CAMPAIGN_FLOWS].sort((a, b) => b.net - a.net)[0]
    expect(top.sym).toBe('MSFT')
    expect(top.net).toBeCloseTo(1105900.15, 1)
  })

  it('campaign flow nets equal their components', () => {
    for (const c of CAMPAIGN_FLOWS) {
      expect(c.net).toBeCloseTo(c.stockCash + c.optionsCash + c.dividends + c.tax, 1)
    }
  })

  it('cadence covers all 14 months of the window', () => {
    expect(TRADE_CADENCE).toHaveLength(14)
    expect(TRADE_CADENCE[0][0]).toBe('2025-07')
    expect(TRADE_CADENCE[13][0]).toBe('2026-08')
    expect(TRADING_WINDOW.transactions).toBe(3634)
  })
})
