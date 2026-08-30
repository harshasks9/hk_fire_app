/* ---------------------------------------------------------------------------
   Imported trading history — Fidelity Individual account (•••9001).

   Parsed from the user's five uploaded Accounts_History CSV exports covering
   2025-07-01 → 2026-08-14 (3,634 transactions). Every trade row below is the
   broker's own record; round trips are FIFO-matched buys and sells inside the
   window. Aggregates are computed from the rows, never hand-entered.

   What this dataset can and cannot say:
   - Round-trip P&L covers positions BOTH opened and closed in the window.
     71 sells matched no in-window buy (positions predating Jul 2025) and are
     excluded from win/loss stats rather than guessed at.
   - Option figures are premium CASH FLOW. Contracts whose expiry has passed
     are "settled" (cash is final); contracts still alive (LEAPS out to 2028)
     are "live" — cash deployed, unrealized value unknown without marks.
   - Campaign flows are net cash moved per symbol in the window — a rotation
     map, not P&L, since positions opened before the window carry no basis
     here and open positions are not marked.
--------------------------------------------------------------------------- */

export const FIDELITY_ACCOUNT_LABEL = 'Fidelity — Individual (•••9001)'
export const FIDELITY_SOURCE_LABEL = 'Fidelity Accounts_History exports (5 files)'

export const TRADING_WINDOW = {
  from: '2025-07-01',
  to: '2026-08-14',
  transactions: 3_634,
  symbolsTraded: 47,
  stockTradeCount: 667,
}

export interface StockRoundTrip {
  sym: string
  buyDate: string
  sellDate: string
  qty: number
  buyPx: number
  sellPx: number
  cost: number
  pnl: number
  retPct: number
  holdDays: number
}

/** FIFO-matched round trips, merged per (symbol, buy date, sell date), in sell order. */
export const STOCK_ROUND_TRIPS: StockRoundTrip[] = [
  { sym: 'EPR', buyDate: '2025-08-15', sellDate: '2025-09-22', qty: 2500, buyPx: 55, sellPx: 55, cost: 137500, pnl: 0, retPct: 0, holdDays: 38 },
  { sym: 'GOOG', buyDate: '2025-09-10', sellDate: '2025-09-22', qty: 500, buyPx: 240.19, sellPx: 235, cost: 120094, pnl: -2594, retPct: -2.16, holdDays: 12 },
  { sym: 'GOOG', buyDate: '2025-10-21', sellDate: '2025-11-03', qty: 250, buyPx: 252.8, sellPx: 255, cost: 63200, pnl: 550, retPct: 0.87, holdDays: 13 },
  { sym: 'LYB', buyDate: '2025-07-24', sellDate: '2025-11-17', qty: 200, buyPx: 60.14, sellPx: 44.54, cost: 12028, pnl: -3120, retPct: -25.94, holdDays: 116 },
  { sym: 'SPG', buyDate: '2025-11-11', sellDate: '2025-11-24', qty: 500, buyPx: 184.9, sellPx: 180, cost: 92450, pnl: -2450, retPct: -2.65, holdDays: 13 },
  { sym: 'GLD', buyDate: '2025-11-12', sellDate: '2025-12-01', qty: 100, buyPx: 385.9, sellPx: 387, cost: 38590, pnl: 110, retPct: 0.29, holdDays: 19 },
  { sym: 'EPR', buyDate: '2025-10-20', sellDate: '2026-01-30', qty: 1020, buyPx: 55, sellPx: 54.09, cost: 56100, pnl: -928.2, retPct: -1.65, holdDays: 102 },
  { sym: 'AIV', buyDate: '2026-01-20', sellDate: '2026-01-30', qty: 1000, buyPx: 6.9, sellPx: 5.9, cost: 6900, pnl: -1000, retPct: -14.49, holdDays: 10 },
  { sym: 'GLD', buyDate: '2025-12-08', sellDate: '2026-03-05', qty: 100, buyPx: 390, sellPx: 456, cost: 39000, pnl: 6600, retPct: 16.92, holdDays: 87 },
  { sym: 'GLD', buyDate: '2025-12-26', sellDate: '2026-03-05', qty: 100, buyPx: 416.66, sellPx: 456, cost: 41666, pnl: 3934, retPct: 9.44, holdDays: 69 },
  { sym: 'DEA', buyDate: '2025-07-09', sellDate: '2026-03-19', qty: 40.25, buyPx: 22.95, sellPx: 22.07, cost: 923.65, pnl: -36.62, retPct: -3.96, holdDays: 253 },
  { sym: 'GLD', buyDate: '2026-01-27', sellDate: '2026-03-30', qty: 4.29, buyPx: 466.4, sellPx: 417.29, cost: 2002.31, pnl: -211.3, retPct: -10.55, holdDays: 62 },
  { sym: 'GLD', buyDate: '2026-02-02', sellDate: '2026-03-30', qty: 95.71, buyPx: 456, sellPx: 417.29, cost: 43642.85, pnl: -3704.86, retPct: -8.49, holdDays: 56 },
  { sym: 'MSFT', buyDate: '2026-01-23', sellDate: '2026-03-30', qty: 217.77, buyPx: 460.52, sellPx: 357.48, cost: 100287.44, pnl: -22441.42, retPct: -22.38, holdDays: 66 },
  { sym: 'GOOG', buyDate: '2026-03-30', sellDate: '2026-03-30', qty: 251.76, buyPx: 273.08, sellPx: 272.89, cost: 68749.55, pnl: -46.35, retPct: -0.07, holdDays: 0 },
  { sym: 'GOOG', buyDate: '2026-03-31', sellDate: '2026-03-31', qty: 251.76, buyPx: 280.64, sellPx: 280.75, cost: 70652.8, pnl: 25.18, retPct: 0.04, holdDays: 0 },
  { sym: 'EPR', buyDate: '2025-10-20', sellDate: '2026-05-18', qty: 1480, buyPx: 55, sellPx: 55, cost: 81400, pnl: 0, retPct: 0, holdDays: 210 },
  { sym: 'PYPL', buyDate: '2025-11-06', sellDate: '2026-07-27', qty: 100, buyPx: 66.72, sellPx: 48.5, cost: 6672, pnl: -1822, retPct: -27.31, holdDays: 263 },
  { sym: 'PYPL', buyDate: '2025-11-07', sellDate: '2026-07-27', qty: 100, buyPx: 65.63, sellPx: 48.5, cost: 6563, pnl: -1713, retPct: -26.1, holdDays: 262 },
  { sym: 'PYPL', buyDate: '2025-11-10', sellDate: '2026-07-27', qty: 200, buyPx: 66.51, sellPx: 48.5, cost: 13302, pnl: -3602, retPct: -27.08, holdDays: 259 },
  { sym: 'PYPL', buyDate: '2025-11-25', sellDate: '2026-07-27', qty: 100, buyPx: 61.68, sellPx: 48.5, cost: 6168, pnl: -1318, retPct: -21.37, holdDays: 244 },
  { sym: 'PYPL', buyDate: '2025-12-01', sellDate: '2026-07-27', qty: 100, buyPx: 62.82, sellPx: 48.5, cost: 6282, pnl: -1432, retPct: -22.8, holdDays: 238 },
  { sym: 'PYPL', buyDate: '2025-12-03', sellDate: '2026-07-27', qty: 100, buyPx: 63.61, sellPx: 48.5, cost: 6361, pnl: -1511, retPct: -23.75, holdDays: 236 },
  { sym: 'NVDA', buyDate: '2026-06-08', sellDate: '2026-08-10', qty: 300, buyPx: 212.5, sellPx: 215, cost: 63250, pnl: 1250, retPct: 1.98, holdDays: 63 },
]

/** Sells with no matching in-window buy — excluded from stats, never guessed. */
export const ORPHAN_SELL_COUNT = 71

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}

export const TRADING_STATS = (() => {
  const wins = STOCK_ROUND_TRIPS.filter((r) => r.pnl > 0)
  const losses = STOCK_ROUND_TRIPS.filter((r) => r.pnl < 0)
  return {
    trips: STOCK_ROUND_TRIPS.length,
    wins: wins.length,
    losses: losses.length,
    flat: STOCK_ROUND_TRIPS.length - wins.length - losses.length,
    winRate: wins.length / STOCK_ROUND_TRIPS.length,
    totalRealized: STOCK_ROUND_TRIPS.reduce((s, r) => s + r.pnl, 0),
    avgWin: wins.reduce((s, r) => s + r.pnl, 0) / wins.length,
    avgLoss: losses.reduce((s, r) => s + r.pnl, 0) / losses.length,
    medianHoldWin: median(wins.map((r) => r.holdDays)),
    medianHoldLoss: median(losses.map((r) => r.holdDays)),
  }
})()

export interface SymbolRealized {
  sym: string
  trips: number
  wins: number
  pnl: number
}

export const REALIZED_BY_SYMBOL: SymbolRealized[] = (() => {
  const by: Record<string, SymbolRealized> = {}
  for (const r of STOCK_ROUND_TRIPS) {
    by[r.sym] ??= { sym: r.sym, trips: 0, wins: 0, pnl: 0 }
    by[r.sym].trips++
    if (r.pnl > 0) by[r.sym].wins++
    by[r.sym].pnl += r.pnl
  }
  return Object.values(by).sort((a, b) => a.pnl - b.pnl)
})()

/* ------------------------------ options program --------------------------- */

export interface OptionUnderlyingFlow {
  under: string
  soldContracts: number
  boughtOpen: number
  premIn: number
  premOut: number
  fees: number
  expiredLegs: number
  assignedLegs: number
  positions: number
  /** Net cash on contracts whose expiry has already passed — final. */
  settledCash: number
  /** Net cash deployed into contracts still alive at window end — unrealized. */
  liveCash: number
  liveContracts: number
}

export const OPTIONS_BY_UNDERLYING: OptionUnderlyingFlow[] = [
  { under: 'SPY', soldContracts: 3, boughtOpen: 3, premIn: 50981.31, premOut: 5624.02, fees: 4.71, expiredLegs: 0, assignedLegs: 0, positions: 3, settledCash: 46398.66, liveCash: -1046.08, liveContracts: 6 },
  { under: 'MSFT', soldContracts: 920, boughtOpen: 29, premIn: 64545.59, premOut: 37917.66, fees: 650.07, expiredLegs: 35, assignedLegs: 4, positions: 64, settledCash: 44178.08, liveCash: -18200.22, liveContracts: 36 },
  { under: 'EPR', soldContracts: 176, boughtOpen: 5, premIn: 13771.2, premOut: 63.09, fees: 126.89, expiredLegs: 2, assignedLegs: 4, positions: 7, settledCash: 13581.22, liveCash: 0, liveContracts: 0 },
  { under: 'INTC', soldContracts: 30, boughtOpen: 0, premIn: 40223.11, premOut: 27430.39, fees: 47.28, expiredLegs: 0, assignedLegs: 0, positions: 5, settledCash: 12745.44, liveCash: 0, liveContracts: 0 },
  { under: 'SPG', soldContracts: 58, boughtOpen: 0, premIn: 13861.01, premOut: 3420.97, fees: 49.96, expiredLegs: 2, assignedLegs: 1, positions: 5, settledCash: 10390.08, liveCash: 0, liveContracts: 0 },
  { under: 'META', soldContracts: 110, boughtOpen: 2, premIn: 24541.04, premOut: 74531.16, fees: 80.12, expiredLegs: 14, assignedLegs: 2, positions: 33, settledCash: 8735.12, liveCash: -58805.36, liveContracts: 4 },
  { under: 'MU', soldContracts: 34, boughtOpen: 0, premIn: 6179.3, premOut: 112.17, fees: 22.87, expiredLegs: 4, assignedLegs: 0, positions: 7, settledCash: 6044.26, liveCash: 0, liveContracts: 0 },
  { under: 'GOOG', soldContracts: 246, boughtOpen: 20, premIn: 130273.74, premOut: 136690.39, fees: 211.65, expiredLegs: 10, assignedLegs: 2, positions: 37, settledCash: 5230.18, liveCash: -11858.48, liveContracts: 25 },
  { under: 'CODI', soldContracts: 0, boughtOpen: 0, premIn: 3644.69, premOut: 0, fees: 15.31, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 3629.38, liveCash: 0, liveContracts: 0 },
  { under: 'NVDA', soldContracts: 51, boughtOpen: 0, premIn: 3287.93, premOut: 131.2, fees: 34.27, expiredLegs: 4, assignedLegs: 3, positions: 14, settledCash: 2755.72, liveCash: 366.74, liveContracts: 10 },
  { under: 'GLD', soldContracts: 30, boughtOpen: 5, premIn: 8689.88, premOut: 6131.66, fees: 26.78, expiredLegs: 6, assignedLegs: 4, positions: 16, settledCash: 2531.44, liveCash: 0, liveContracts: 0 },
  { under: 'NOW', soldContracts: 47, boughtOpen: 0, premIn: 2670.64, premOut: 22.15, fees: 31.51, expiredLegs: 2, assignedLegs: 1, positions: 6, settledCash: 2190.24, liveCash: 426.74, liveContracts: 10 },
  { under: 'PYPL', soldContracts: 54, boughtOpen: 15, premIn: 2095.77, premOut: 3690.78, fees: 44.01, expiredLegs: 6, assignedLegs: 1, positions: 9, settledCash: 1892.34, liveCash: -3531.36, liveContracts: 1 },
  { under: 'BAM', soldContracts: 20, boughtOpen: 8, premIn: 1726.54, premOut: 11693.38, fees: 18.84, expiredLegs: 0, assignedLegs: 1, positions: 2, settledCash: 1713.08, liveCash: -11698.76, liveContracts: 8 },
  { under: 'OWL', soldContracts: 71, boughtOpen: 325, premIn: 1703.46, premOut: 91515.96, fees: 264.5, expiredLegs: 4, assignedLegs: 2, positions: 11, settledCash: 1613.58, liveCash: -91690.58, liveContracts: 324 },
  { under: 'SNOW', soldContracts: 12, boughtOpen: 5, premIn: 5149.98, premOut: 4109.37, fees: 13.39, expiredLegs: 4, assignedLegs: 1, positions: 9, settledCash: 1027.22, liveCash: 0, liveContracts: 0 },
  { under: 'UNH', soldContracts: 8, boughtOpen: 2, premIn: 3592.64, premOut: 8857.35, fees: 6.71, expiredLegs: 3, assignedLegs: 0, positions: 5, settledCash: 489.98, liveCash: -5761.4, liveContracts: 4 },
  { under: 'STWD', soldContracts: 20, boughtOpen: 0, premIn: 406.63, premOut: 115.09, fees: 13.46, expiredLegs: 1, assignedLegs: 0, positions: 1, settledCash: 278.08, liveCash: 0, liveContracts: 0 },
  { under: 'LULU', soldContracts: 2, boughtOpen: 2, premIn: 342.67, premOut: 63.33, fees: 2.66, expiredLegs: 2, assignedLegs: 0, positions: 2, settledCash: 276.68, liveCash: 0, liveContracts: 0 },
  { under: 'XLC', soldContracts: 3, boughtOpen: 0, premIn: 162.97, premOut: 0, fees: 2.03, expiredLegs: 0, assignedLegs: 1, positions: 1, settledCash: 160.94, liveCash: 0, liveContracts: 0 },
  { under: 'AMZN', soldContracts: 0, boughtOpen: 5, premIn: 5346.63, premOut: 5683.37, fees: 6.74, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: -343.48, liveCash: 0, liveContracts: 0 },
  { under: 'DEA', soldContracts: 5, boughtOpen: 2, premIn: 206.63, premOut: 902.34, fees: 4.71, expiredLegs: 0, assignedLegs: 1, positions: 3, settledCash: -700.42, liveCash: 0, liveContracts: 0 },
  { under: 'MSFU', soldContracts: 0, boughtOpen: 20, premIn: 94.54, premOut: 3653.46, fees: 18.92, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: -3577.84, liveCash: 0, liveContracts: 0 },
  { under: 'WW', soldContracts: 0, boughtOpen: 5, premIn: 0, premOut: 5453.37, fees: 3.37, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -5456.74, liveContracts: 5 },
  { under: 'COF', soldContracts: 3, boughtOpen: 3, premIn: 1122.98, premOut: 7232.02, fees: 4.04, expiredLegs: 0, assignedLegs: 0, positions: 2, settledCash: 0, liveCash: -6113.08, liveContracts: 6 },
  { under: 'PAX', soldContracts: 0, boughtOpen: 40, premIn: 0, premOut: 8676.92, fees: 26.92, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -8703.84, liveContracts: 40 },
  { under: 'FOUR', soldContracts: 0, boughtOpen: 5, premIn: 0, premOut: 10503.32, fees: 3.32, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -10506.64, liveContracts: 5 },
  { under: 'ARE', soldContracts: 0, boughtOpen: 7, premIn: 0, premOut: 21894.68, fees: 4.68, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -21899.36, liveContracts: 7 },
  { under: 'NVO', soldContracts: 0, boughtOpen: 11, premIn: 0, premOut: 26212.36, fees: 7.36, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -26219.72, liveContracts: 11 },
  { under: 'DRAM', soldContracts: 0, boughtOpen: 9, premIn: 0, premOut: 35286.04, fees: 6.04, expiredLegs: 0, assignedLegs: 0, positions: 1, settledCash: 0, liveCash: -35292.08, liveContracts: 9 },
]

export const OPTIONS_TOTALS = (() => {
  const t = OPTIONS_BY_UNDERLYING.reduce(
    (s, o) => ({
      soldContracts: s.soldContracts + o.soldContracts,
      boughtOpen: s.boughtOpen + o.boughtOpen,
      premIn: s.premIn + o.premIn,
      premOut: s.premOut + o.premOut,
      fees: s.fees + o.fees,
      expiredLegs: s.expiredLegs + o.expiredLegs,
      assignedLegs: s.assignedLegs + o.assignedLegs,
      positions: s.positions + o.positions,
      settledCash: s.settledCash + o.settledCash,
      liveCash: s.liveCash + o.liveCash,
      liveContracts: s.liveContracts + o.liveContracts,
    }),
    { soldContracts: 0, boughtOpen: 0, premIn: 0, premOut: 0, fees: 0, expiredLegs: 0, assignedLegs: 0, positions: 0, settledCash: 0, liveCash: 0, liveContracts: 0 },
  )
  return { ...t, netCash: t.premIn - t.premOut - t.fees }
})()

export interface LiveOptionPosition {
  under: string
  expiry: string
  strike: number
  type: 'call' | 'put'
  /** Positive = long contracts, negative = short. */
  netQty: number
  /** Net premium cash on this contract line (negative = cash deployed). */
  cash: number
}

/** Option contracts still alive at the last export date, with net cash per line. */
export const LIVE_OPTION_BOOK: LiveOptionPosition[] = [
  { under: 'OWL', expiry: '2028-01-21', strike: 5, type: 'call', netQty: 100, cash: -45573.04 },
  { under: 'OWL', expiry: '2028-01-21', strike: 8, type: 'call', netQty: 10, cash: -4713.48 },
  { under: 'OWL', expiry: '2028-01-21', strike: 10, type: 'call', netQty: 14, cash: -9538.76 },
  { under: 'OWL', expiry: '2028-01-21', strike: 15, type: 'call', netQty: 200, cash: -31865.3 },
  { under: 'META', expiry: '2028-01-21', strike: 400, type: 'call', netQty: 2, cash: -64102.68 },
  { under: 'META', expiry: '2028-01-21', strike: 400, type: 'put', netQty: -2, cash: 5297.32 },
  { under: 'MSFT', expiry: '2027-01-15', strike: 570, type: 'call', netQty: 10, cash: -33293.46 },
  { under: 'MSFT', expiry: '2027-01-15', strike: 380, type: 'put', netQty: -10, cash: 13616.54 },
  { under: 'MSFT', expiry: '2026-08-21', strike: 517.5, type: 'call', netQty: -16, cash: 1476.7 },
  { under: 'GOOG', expiry: '2027-12-17', strike: 90, type: 'call', netQty: -5, cash: 95293.28 },
  { under: 'GOOG', expiry: '2027-12-17', strike: 100, type: 'call', netQty: 5, cash: -90931.72 },
  { under: 'GOOG', expiry: '2027-12-17', strike: 170, type: 'put', netQty: 5, cash: -5206.68 },
  { under: 'GOOG', expiry: '2028-01-21', strike: 300, type: 'call', netQty: 5, cash: -20026.68 },
  { under: 'GOOG', expiry: '2028-01-21', strike: 190, type: 'put', netQty: -5, cash: 9013.32 },
  { under: 'SPY', expiry: '2027-01-15', strike: 720, type: 'call', netQty: 3, cash: -5626.04 },
  { under: 'SPY', expiry: '2027-01-15', strike: 500, type: 'put', netQty: -3, cash: 4579.96 },
  { under: 'DRAM', expiry: '2028-01-21', strike: 30, type: 'call', netQty: 9, cash: -35292.08 },
  { under: 'NVO', expiry: '2028-01-21', strike: 25, type: 'call', netQty: 11, cash: -26219.72 },
  { under: 'ARE', expiry: '2028-01-21', strike: 50, type: 'call', netQty: 7, cash: -21899.36 },
  { under: 'BAM', expiry: '2028-01-21', strike: 35, type: 'call', netQty: 8, cash: -11698.76 },
  { under: 'FOUR', expiry: '2028-01-21', strike: 30, type: 'call', netQty: 5, cash: -10506.64 },
  { under: 'UNH', expiry: '2028-01-21', strike: 330, type: 'call', netQty: 2, cash: -8858.7 },
  { under: 'UNH', expiry: '2028-01-21', strike: 190, type: 'put', netQty: -2, cash: 3097.3 },
  { under: 'COF', expiry: '2026-12-18', strike: 250, type: 'call', netQty: 3, cash: -7234.04 },
  { under: 'COF', expiry: '2026-12-18', strike: 150, type: 'put', netQty: -3, cash: 1120.96 },
  { under: 'PAX', expiry: '2026-10-16', strike: 10, type: 'call', netQty: 40, cash: -8703.84 },
  { under: 'WW', expiry: '2026-08-21', strike: 12.5, type: 'call', netQty: 5, cash: -5456.74 },
  { under: 'PYPL', expiry: '2027-01-15', strike: 40, type: 'call', netQty: 1, cash: -3531.36 },
  { under: 'NVDA', expiry: '2026-08-17', strike: 200, type: 'put', netQty: -10, cash: 366.74 },
  { under: 'NOW', expiry: '2026-08-28', strike: 108, type: 'put', netQty: -10, cash: 426.74 },
]

export interface LiveStructure {
  under: string
  label: string
  legs: LiveOptionPosition[]
  cash: number
}

/** Group the live book into recognizable structures (risk reversal, spread, outright). */
export const LIVE_STRUCTURES: LiveStructure[] = (() => {
  const byUnder: Record<string, LiveOptionPosition[]> = {}
  for (const p of LIVE_OPTION_BOOK) (byUnder[p.under] ??= []).push(p)
  const out: LiveStructure[] = []
  for (const [under, legs] of Object.entries(byUnder)) {
    const longCalls = legs.filter((l) => l.type === 'call' && l.netQty > 0)
    const shortCalls = legs.filter((l) => l.type === 'call' && l.netQty < 0)
    const longPuts = legs.filter((l) => l.type === 'put' && l.netQty > 0)
    const shortPuts = legs.filter((l) => l.type === 'put' && l.netQty < 0)
    let label = 'Mixed book'
    if (longCalls.length && shortPuts.length && !shortCalls.length && !longPuts.length) label = 'Risk reversal (long calls financed by short puts)'
    else if (longCalls.length && shortCalls.length && !longPuts.length && !shortPuts.length) label = 'Call spread'
    else if (longCalls.length && !shortCalls.length && !longPuts.length && !shortPuts.length) label = 'Long calls (outright)'
    else if (shortPuts.length && !longCalls.length && !shortCalls.length && !longPuts.length) label = 'Short puts'
    else if (shortCalls.length && !longCalls.length && !longPuts.length && !shortPuts.length) label = 'Short calls'
    out.push({ under, label, legs, cash: legs.reduce((s, l) => s + l.cash, 0) })
  }
  return out.sort((a, b) => a.cash - b.cash)
})()

/* ------------------------------ income & tax ------------------------------ */

export const INCOME_SUMMARY = {
  dividendsTotal: 228_896.75,
  nraWithholding: -27_078.42,
  marginInterest: -944.17,
  reinvested: 45_670.24,
  topPayers: [
    ['OWL', 51_125.09],
    ['NVDY', 26_611.98],
    ['EPR', 18_727.73],
    ['DEA', 17_382.21],
    ['SPYI', 15_429.59],
    ['XDTE', 13_946.08],
    ['MSFT', 9_357.36],
    ['PAX', 8_694.8],
    ['SPAXX', 8_091.24],
    ['YMAG', 7_421.1],
    ['BXSL', 7_054.51],
    ['Tidal Trust II (YieldMax)', 6_770.41],
    ['HIW', 5_788.84],
    ['MSDL', 5_567.8],
    ['NNN', 3_558.09],
  ] as [string, number][],
}

/* ------------------------------ rotation map ------------------------------ */

export interface CampaignFlow {
  sym: string
  /** Net stock cash in window: positive = harvested (net seller), negative = deployed (net buyer). */
  stockCash: number
  optionsCash: number
  dividends: number
  tax: number
  /** Net share-count change in window. */
  stockQty: number
  trades: number
  net: number
}

/** Net cash moved per symbol — a rotation map, not P&L. Sorted by net flow. */
export const CAMPAIGN_FLOWS: CampaignFlow[] = [
  { sym: 'MSFT', stockCash: 1072722.07, optionsCash: 26627.93, dividends: 9357.36, tax: -2807.21, stockQty: -2454.47, trades: 116, net: 1105900.15 },
  { sym: 'SPG', stockCash: 286936.1, optionsCash: 10440.04, dividends: 3455.36, tax: -1036.61, stockQty: -1607.15, trades: 12, net: 299794.89 },
  { sym: 'EPR', stockCash: 132007.83, optionsCash: 13708.11, dividends: 18727.73, tax: -1854.45, stockQty: -2347.19, trades: 26, net: 162589.22 },
  { sym: 'NNN', stockCash: 88391.95, optionsCash: 0, dividends: 3558.09, tax: -1018.01, stockQty: -1976.72, trades: 2, net: 90932.03 },
  { sym: 'JEPI', stockCash: 82091.19, optionsCash: 0, dividends: 1025.53, tax: -23.97, stockQty: -1461.37, trades: 3, net: 83092.75 },
  { sym: 'GOOG', stockCash: 85186.5, optionsCash: -6416.65, dividends: 287.5, tax: -86.25, stockQty: -350, trades: 79, net: 78971.1 },
  { sym: 'HIW', stockCash: 64332.65, optionsCash: 0, dividends: 5788.84, tax: -353.06, stockQty: -2390.66, trades: 6, net: 69768.43 },
  { sym: 'SPY', stockCash: 0, optionsCash: 45357.29, dividends: 0, tax: 0, stockQty: 0, trades: 3, net: 45357.29 },
  { sym: 'VNOPRM', stockCash: 42083.98, optionsCash: 0, dividends: 1483.79, tax: -59.07, stockQty: -2361, trades: 7, net: 43508.7 },
  { sym: 'WPC', stockCash: 35692.99, optionsCash: 0, dividends: 472.45, tax: -106.35, stockQty: -524.95, trades: 4, net: 36059.09 },
  { sym: 'XLC', stockCash: 34500, optionsCash: 162.97, dividends: 0, tax: 0, stockQty: -300, trades: 2, net: 34662.97 },
  { sym: 'STWD', stockCash: 26473.16, optionsCash: 291.54, dividends: 1444.52, tax: -205.3, stockQty: -1504.71, trades: 4, net: 28003.92 },
  { sym: 'BSRTF', stockCash: 21421.21, optionsCash: 0, dividends: 81.26, tax: 0, stockQty: -1740, trades: 3, net: 21502.47 },
  { sym: 'PYPL', stockCash: 17701.97, optionsCash: -1595.01, dividends: 252, tax: -75.6, stockQty: -600, trades: 18, net: 16283.36 },
  { sym: 'OUT', stockCash: 13550.05, optionsCash: 0, dividends: 220.31, tax: 0, stockQty: -734.37, trades: 3, net: 13770.36 },
  { sym: 'XDTE', stockCash: 0, optionsCash: 0, dividends: 13946.08, tax: -804.63, stockQty: 0, trades: 0, net: 13141.45 },
  { sym: 'INTC', stockCash: 0, optionsCash: 12792.72, dividends: 0, tax: 0, stockQty: 0, trades: 8, net: 12792.72 },
  { sym: 'BXSL', stockCash: 4539.02, optionsCash: 0, dividends: 7054.51, tax: -433.81, stockQty: -191, trades: 1, net: 11159.72 },
  { sym: 'TFSL', stockCash: 10212.32, optionsCash: 0, dividends: 0, tax: 0, stockQty: -800, trades: 1, net: 10212.32 },
  { sym: 'XRN', stockCash: 6737.98, optionsCash: 0, dividends: 447.86, tax: 0, stockQty: -181.18, trades: 3, net: 7185.84 },
  { sym: 'MU', stockCash: 0, optionsCash: 6067.13, dividends: 0, tax: 0, stockQty: 0, trades: 10, net: 6067.13 },
  { sym: 'SPAXX', stockCash: 0, optionsCash: 0, dividends: 8091.24, tax: -2427.38, stockQty: 0, trades: 0, net: 5663.86 },
  { sym: 'FLG', stockCash: 5461.89, optionsCash: 0, dividends: 8.52, tax: -2.56, stockQty: -425.55, trades: 2, net: 5467.85 },
  { sym: 'LYB', stockCash: 4464.85, optionsCash: 0, dividends: 658.49, tax: 0, stockQty: -146.54, trades: 4, net: 5123.34 },
  { sym: 'KRG', stockCash: 4725, optionsCash: 0, dividends: 311, tax: -93.27, stockQty: -200, trades: 1, net: 4942.73 },
  { sym: 'FSK', stockCash: 3940.49, optionsCash: 0, dividends: 619.41, tax: 0, stockQty: -294.95, trades: 2, net: 4559.9 },
  { sym: 'CODI', stockCash: 0, optionsCash: 3644.69, dividends: 0, tax: 0, stockQty: 0, trades: 2, net: 3644.69 },
  { sym: 'MPT', stockCash: 3545.79, optionsCash: 0, dividends: 66.2, tax: 0, stockQty: -827.48, trades: 3, net: 3611.99 },
  { sym: 'NLY', stockCash: 2979.09, optionsCash: 0, dividends: 99, tax: 0, stockQty: -146.18, trades: 2, net: 3078.09 },
  { sym: 'SAFE', stockCash: 2678, optionsCash: 0, dividends: 70.8, tax: 0.29, stockQty: -200, trades: 1, net: 2749.09 },
  { sym: 'PUBM', stockCash: 1452.48, optionsCash: 0, dividends: 0, tax: 0, stockQty: -160, trades: 1, net: 1452.48 },
  { sym: 'VONOY', stockCash: 0, optionsCash: 0, dividends: 1136.75, tax: 0, stockQty: 0, trades: 0, net: 1136.75 },
  { sym: 'OMF', stockCash: 0, optionsCash: 0, dividends: 969.4, tax: 0, stockQty: 0, trades: 0, net: 969.4 },
  { sym: 'NLCP', stockCash: 0, optionsCash: 0, dividends: 750.35, tax: 0, stockQty: 0, trades: 0, net: 750.35 },
  { sym: 'NVDY', stockCash: -25853.14, optionsCash: 0, dividends: 26611.98, tax: -520.99, stockQty: 1816.09, trades: 86, net: 237.85 },
  { sym: 'JEPQ', stockCash: -193.09, optionsCash: 0, dividends: 293.25, tax: 0, stockQty: 3.24, trades: 2, net: 100.16 },
  { sym: 'AMZN', stockCash: 0, optionsCash: -336.74, dividends: 0, tax: 0, stockQty: 0, trades: 2, net: -336.74 },
  { sym: 'AIV', stockCash: -1000, optionsCash: 0, dividends: 0, tax: 0, stockQty: 0, trades: 2, net: -1000 },
  { sym: 'MSFU', stockCash: 0, optionsCash: -3558.92, dividends: 0, tax: 0, stockQty: 0, trades: 2, net: -3558.92 },
  { sym: 'UNH', stockCash: 0, optionsCash: -5264.71, dividends: 0, tax: 0, stockQty: 0, trades: 5, net: -5264.71 },
  { sym: 'GGLL', stockCash: -5803.2, optionsCash: 0, dividends: 58.02, tax: -17.41, stockQty: 50, trades: 1, net: -5762.59 },
  { sym: 'COF', stockCash: 0, optionsCash: -6109.04, dividends: 0, tax: 0, stockQty: 0, trades: 2, net: -6109.04 },
  { sym: 'NOW', stockCash: -10700, optionsCash: 2648.49, dividends: 0, tax: 0, stockQty: 100, trades: 12, net: -8051.51 },
  { sym: 'FOUR', stockCash: 0, optionsCash: -10503.32, dividends: 0, tax: 0, stockQty: 0, trades: 1, net: -10503.32 },
  { sym: 'YMAG', stockCash: -18865.23, optionsCash: 0, dividends: 7421.1, tax: -1626.94, stockQty: 1239.15, trades: 5, net: -13071.07 },
  { sym: 'IWGFF', stockCash: -15725, optionsCash: 0, dividends: 113.74, tax: 0, stockQty: 5000, trades: 1, net: -15611.26 },
  { sym: 'NVDA', stockCash: -19751.33, optionsCash: 3156.73, dividends: 0, tax: 0, stockQty: 100, trades: 25, net: -16594.6 },
  { sym: 'SNOW', stockCash: -18500, optionsCash: 1040.61, dividends: 0, tax: 0, stockQty: 100, trades: 14, net: -17459.39 },
  { sym: 'LULU', stockCash: -18230, optionsCash: 279.34, dividends: 0, tax: 0, stockQty: 100, trades: 3, net: -17950.66 },
  { sym: 'ARE', stockCash: 0, optionsCash: -21894.68, dividends: 1216.54, tax: -316.12, stockQty: 0, trades: 2, net: -20994.26 },
  { sym: 'OTF', stockCash: -33125.84, optionsCash: 0, dividends: 1564.4, tax: 0, stockQty: 2760.27, trades: 33, net: -31561.44 },
  { sym: 'DRAM', stockCash: 0, optionsCash: -35286.04, dividends: 0, tax: 0, stockQty: 0, trades: 7, net: -35286.04 },
  { sym: 'DIVO', stockCash: -45260.64, optionsCash: 0, dividends: 1920.61, tax: 0, stockQty: 1003, trades: 4, net: -43340.03 },
  { sym: 'WW', stockCash: -47378, optionsCash: -5453.37, dividends: 0, tax: 0, stockQty: 1400, trades: 7, net: -52831.37 },
  { sym: 'NVO', stockCash: -33750.49, optionsCash: -26212.36, dividends: 867.16, tax: 0, stockQty: 712.31, trades: 5, net: -59095.69 },
  { sym: 'MSDL', stockCash: -64765.36, optionsCash: 0, dividends: 5567.8, tax: -496.38, stockQty: 3940, trades: 9, net: -59693.94 },
  { sym: 'SPYI', stockCash: -83968.16, optionsCash: 0, dividends: 15429.59, tax: -1227.03, stockQty: 1625.04, trades: 14, net: -69765.6 },
  { sym: 'PAX', stockCash: -82659.25, optionsCash: -8676.92, dividends: 8694.8, tax: 0, stockQty: 6566.64, trades: 69, net: -82641.37 },
  { sym: 'GLD', stockCash: -91398.31, optionsCash: 2558.22, dividends: 0, tax: 0, stockQty: 212, trades: 45, net: -88840.09 },
  { sym: 'DEA', stockCash: -137761.49, optionsCash: -695.71, dividends: 17382.21, tax: -2639.73, stockQty: 6145.76, trades: 93, net: -123714.72 },
  { sym: 'BAM', stockCash: -142146.5, optionsCash: -9966.84, dividends: 1507.5, tax: 0, stockQty: 3089.66, trades: 7, net: -150605.84 },
  { sym: 'META', stockCash: -287000, optionsCash: -49990.12, dividends: 361.81, tax: -63, stockQty: 500, trades: 51, net: -336691.31 },
  { sym: 'OWL', stockCash: -982034.26, optionsCash: -89812.5, dividends: 51125.09, tax: -8445.75, stockQty: 71184.37, trades: 216, net: -1029167.42 },
]

/* --------------------------- behavioral patterns -------------------------- */

export const REBUY_PATTERN = {
  total: 7,
  atHigherPrice: 5,
  examples: [
    { sym: 'GOOG', soldAt: 235, sellDate: '2025-09-22', reboughtAt: 252.8, rebuyDate: '2025-10-21', higher: true },
    { sym: 'GOOG', soldAt: 272.89, sellDate: '2026-03-30', reboughtAt: 280.64, rebuyDate: '2026-03-31', higher: true },
    { sym: 'GLD', soldAt: 387, sellDate: '2025-12-01', reboughtAt: 390, rebuyDate: '2025-12-08', higher: true },
    { sym: 'GLD', soldAt: 456, sellDate: '2026-03-05', reboughtAt: 458.03, rebuyDate: '2026-03-16', higher: true },
    { sym: 'EPR', soldAt: 55, sellDate: '2025-09-22', reboughtAt: 55, rebuyDate: '2025-10-20', higher: false },
    { sym: 'DEA', soldAt: 22.07, sellDate: '2026-03-19', reboughtAt: 17.5, rebuyDate: '2026-03-23', higher: false },
  ],
}

/** Stock + option trade count per month. */
export const TRADE_CADENCE: [string, number][] = [
  ['2025-07', 34], ['2025-08', 24], ['2025-09', 79], ['2025-10', 88],
  ['2025-11', 111], ['2025-12', 104], ['2026-01', 71], ['2026-02', 100],
  ['2026-03', 82], ['2026-04', 53], ['2026-05', 103], ['2026-06', 73],
  ['2026-07', 98], ['2026-08', 34],
]

/** Realized round-trip P&L by sell month (months with closes only). */
export const REALIZED_BY_MONTH: [string, number][] = [
  ['2025-09', -2594], ['2025-11', -5020], ['2025-12', 110], ['2026-01', -1928.2],
  ['2026-03', -15881.36], ['2026-05', 0], ['2026-07', -11398], ['2026-08', 1250],
]

/** Symbols traded in the same calendar week, counted across the window. */
export const CO_TRADED_PAIRS: [string, number][] = [
  ['DEA + OWL', 17], ['NVDY + OWL', 14], ['GLD + OWL', 10], ['OWL + PAX', 10],
  ['NVDY + PAX', 7], ['OTF + OWL', 7], ['EPR + OWL', 6], ['GLD + NVDY', 6],
  ['GOOG + OWL', 5], ['DEA + NVDY', 5], ['OWL + PYPL', 5], ['DEA + GLD', 5],
]

export const ORDER_SIZING = {
  medianBuy: 92.24,
  p90Buy: 16_050,
  maxBuy: 228_000,
}

/* ------------------------- strengths & weaknesses ------------------------- */

export interface TradingFinding {
  id: string
  title: string
  detail: string
  evidence: string[]
  kind: 'calculated' | 'inferred'
}

export const TRADING_STRENGTHS: TradingFinding[] = [
  {
    id: 's-premium-engine',
    title: 'The short-premium engine genuinely makes money',
    detail:
      'On contracts that have already settled, the options program earned +$161,240 over ~13.5 months. This is a repeatable process — weekly and monthly covered calls and puts on names you hold — not a lucky trade.',
    evidence: [
      'Settled option cash: SPY +$46,399 · MSFT +$44,178 (920 contracts sold) · EPR +$13,581 · INTC +$12,745 · SPG +$10,390',
      '99 in-window contract lines expired worthless (107 expiry events counting pre-window positions), 28 assigned, across 251 lines',
      'Same discipline shows in the Moomoo account: 5 of 5 closed short puts expired worthless',
    ],
    kind: 'calculated',
  },
  {
    id: 's-rotation',
    title: 'A ~$2M portfolio rotation executed without forced selling',
    detail:
      'You harvested legacy positions methodically — MSFT ~$1.07M, SPG ~$287K, EPR ~$132K, NNN, JEPI, HIW — and redeployed into an income complex (OWL, DEA, PAX, MSDL, SPYI, DIVO) plus GLD. Two EPR exits went out at exactly your $55 cost: patience, not panic.',
    evidence: [
      'Top harvests: MSFT +$1,072,722 · SPG +$286,936 · EPR +$132,008 stock cash in window',
      'Top deployments: OWL −$982,034 · META −$287,000 · BAM −$142,147 · DEA −$137,761',
      'Dividends collected across the window: $228,897',
    ],
    kind: 'calculated',
  },
  {
    id: 's-gld',
    title: 'The gold trade showed real timing edge',
    detail:
      'Five GLD round trips netted +$6,728. The December entries at $390–417 rode the move to $456 for +9.4% and +16.9% — entered on trend, sized consistently, took profit.',
    evidence: [
      'GLD 2025-12-08 → 2026-03-05: +$6,600 (+16.9%, 87 days)',
      'GLD 2025-12-26 → 2026-03-05: +$3,934 (+9.4%, 69 days)',
    ],
    kind: 'calculated',
  },
  {
    id: 's-sizing',
    title: 'Sizing is usually systematic and small',
    detail:
      'The median buy is just $92 — a steady accumulation cadence into income names — and 90% of buys are under ~$16K. The account trades every single month; the process runs in all weather.',
    evidence: [
      'Median buy $92 · p90 $16,050 · 14 consecutive active months',
      '667 stock trades + steady option cadence, peak 111 trades in Nov 2025',
    ],
    kind: 'calculated',
  },
]

export const TRADING_WEAKNESSES: TradingFinding[] = [
  {
    id: 'w-directional',
    title: 'Directional stock trading is the leak',
    detail:
      'Of 24 completed round trips, only 6 won — a 25% hit rate — for −$35,462 realized. The average loss (−$2,996) is 1.4× the average win (+$2,078). The premium engine earns; the directional book gives it back.',
    evidence: [
      '24 round trips · 6 wins · 16 losses · 2 flat — win rate 25%',
      'Total realized −$35,462 · avg win +$2,078 · avg loss −$2,996',
    ],
    kind: 'calculated',
  },
  {
    id: 'w-disposition',
    title: 'Losers are held almost twice as long as winners',
    detail:
      'Median hold: 63 days for winners, 116 for losers — the classic disposition pattern. PYPL is the case study: six lots averaged down at $61.68–66.72 through Nov–Dec 2025, then all capitulated together on Jul 27, 2026 at $48.50 for −$11,398.',
    evidence: [
      'Median hold 63d (winners) vs 116d (losers)',
      'PYPL: 6 lots, all sold 2026-07-27 at $48.50, −21% to −27% each, held 236–263 days',
    ],
    kind: 'calculated',
  },
  {
    id: 'w-chase',
    title: 'Entries chase strength; exits capitulate into weakness',
    detail:
      'The single worst trade — MSFT bought at $460.52 on Jan 23, 2026 after the run-up, sold at $357.48 on Mar 30 for −$22,441 — gave back half of everything the MSFT option engine earned. And 5 of 7 re-entries were made at a higher price than the exit.',
    evidence: [
      'MSFT round trip −$22,441 (−22.4% in 66 days) vs MSFT settled option income +$44,178',
      'GOOG sold $235 → rebought $252.80 a month later; GLD sold $456 → rebought $458.03 eleven days later, re-entry lost −$3,916',
      'GLD re-entry after the +$10.5K win returned −$3,705 on the largest lot',
    ],
    kind: 'calculated',
  },
  {
    id: 'w-leaps',
    title: 'The live LEAPS book is one large, correlated, leveraged bet',
    detail:
      '−$315,990 of net premium is deployed in contracts still open — mostly long calls out to Jan 2028, plus risk reversals whose short puts add obligations below the market. Nearly every leg is long equity beta; a broad drawdown hits all of it at once.',
    evidence: [
      'OWL: 324 long calls (~$91,691 deployed) on top of ~71K shares accumulated and $51K of dividends — a triple-stacked single-name bet',
      'Risk reversals: MSFT 570C/380P · META 400C/400P · GOOG 300C/190P · SPY 720C/500P · UNH 330C/190P · COF 250C/150P',
      'Outright long calls: DRAM $35.3K · NVO $26.2K · ARE $21.9K · BAM $11.7K · FOUR $10.5K · WW $5.5K',
    ],
    kind: 'calculated',
  },
  {
    id: 'w-factor',
    title: 'Two-factor concentration: mega-cap tech and rate-sensitive income',
    detail:
      'The book clusters into two complexes — mega-cap tech (MSFT, GOOG, META, NVDA plus leveraged wrappers DRAM, MSFU, GGLL) and rate-sensitive income (REITs, BDCs, alt managers OWL/PAX/BAM, option-income funds NVDY/SPYI/XDTE/YMAG). A rate shock or risk-off move hits both at once. OWL is the hub of the whole graph.',
    evidence: [
      'Co-traded weeks: DEA+OWL 17 · NVDY+OWL 14 · GLD+OWL 10 · OWL+PAX 10 — OWL appears in 8 of the top 12 pairs',
      'Alt managers OWL, PAX, BAM and BDCs MSDL, OTF, BXSL share the same credit/rate factor',
    ],
    kind: 'inferred',
  },
  {
    id: 'w-tax',
    title: 'A structural 30% dividend withholding drag',
    detail:
      'US non-resident withholding took −$27,078 of the $228,897 dividend stream — and the strategy is built around dividends. Every dollar rotated into US-domiciled high-yield funds carries this 30% haircut; Irish-domiciled equivalents (where they exist) leak 15% at fund level for index sleeves. Worth a deliberate review — this is a computed drag, not tax advice.',
    evidence: [
      'NRA withholding −$27,078.42 on $228,896.75 of dividends (≈11.8% of the gross stream)',
      'Heaviest hits: OWL −$8,446 · MSFT −$2,807 · DEA −$2,640 · SPAXX −$2,427 (money-market interest withheld at 30%)',
    ],
    kind: 'calculated',
  },
  {
    id: 'w-spec',
    title: 'Speculative long options bought in size, unhedged',
    detail:
      'Single-expiry call bets — DRAM, NVO, ARE, FOUR, WW — total ~$110K of premium at risk with no offsetting leg. The settled record for pure long-option bets is already negative (MSFU weeklies −$3,578, AMZN −$343).',
    evidence: [
      'Live outright calls: DRAM −$35,292 · NVO −$26,220 · ARE −$21,899 · FOUR −$10,507 · WW −$5,457',
      'Settled long-option bets: MSFU −$3,578 · AMZN −$343 · DEA options −$700',
    ],
    kind: 'calculated',
  },
]

export const FIDELITY_DATA_GAPS = [
  '71 sells matched no in-window buy (positions opened before Jul 2025) — excluded from win/loss stats rather than guessed; upload older exports to complete them',
  'Live option positions (LEAPS to 2028) show cash deployed, not value — current marks are needed to state unrealized P&L',
  'Campaign flows are net cash per symbol, not P&L: open positions are not marked and pre-window basis is unknown',
  'Assignment economics continue in the stock leg — settled option cash for assigned lines is final, but the resulting stock P&L lives in the stock record',
]
