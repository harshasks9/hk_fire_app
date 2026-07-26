/* ---------------------------------------------------------------------------
   Imported option trades — Moomoo Singapore Margin Account (•••5272).

   Extracted from the user's uploaded monthly statements (Mar–Jun 2026).
   Every figure below is transcribed from a statement row: gross premium,
   itemized fees and net amounts are the broker's own numbers, not estimates.
   Identifiers are masked; only trade economics are recorded.

   Data gaps are stated, never papered over:
   - Jul 2026 statement not uploaded → outcome of the MSFT 07/06 340P
     (open at Jun 30) is unknown to the tracker.
   - OWL / PYPL long calls were opened before Mar 2026 → cost basis unknown
     until earlier statements are uploaded.
--------------------------------------------------------------------------- */

export interface ImportedOptionTrade {
  orderDate: string
  time: string
  action: 'Sell to Open'
  underlying: 'NVDA' | 'MSFT'
  expiry: string
  strike: number
  type: 'put'
  qty: number
  fills?: number[]
  price: number // per share
  gross: number // USD
  fees: number // USD, broker-itemized total
  net: number // USD
  outcome: 'expired_worthless' | 'open_at_last_statement'
  outcomeDate?: string
  source: string
  note?: string
}

export interface ImportedOptionHolding {
  underlying: string
  expiry: string
  strike: number
  type: 'call' | 'put'
  side: 'long' | 'short'
  qty: number
  markPrice: number // per share, at last statement date
  markValue: number // USD
  markDate: string
  earlierMark?: { date: string; price: number }
  costBasis: number | null // null = unknown (pre-Mar statements needed)
  source: string
  note?: string
}

export const MOOMOO_ACCOUNT_LABEL = 'Moomoo SG — Margin (•••5272)'
export const MOOMOO_STATEMENTS = [
  'Moomoo SG Statement — Mar 2026',
  'Moomoo SG Statement — Apr 2026',
  'Moomoo SG Statement — May 2026',
  'Moomoo SG Statement — Jun 2026',
]

export const IMPORTED_OPTION_TRADES: ImportedOptionTrade[] = [
  {
    orderDate: '2026-05-29', time: '23:25:09', action: 'Sell to Open',
    underlying: 'NVDA', expiry: '2026-06-05', strike: 205, type: 'put', qty: 10,
    price: 1.26, gross: 1_260.0, fees: 14.92, net: 1_245.08,
    outcome: 'expired_worthless', outcomeDate: '2026-06-05',
    source: 'Moomoo SG Statement — May 2026',
    note: 'Marked at ≈$2.45 at the May month-end (position was underwater ≈$1.2K mid-trade) before expiring worthless.',
  },
  {
    orderDate: '2026-06-13', time: '03:11:01', action: 'Sell to Open',
    underlying: 'MSFT', expiry: '2026-06-18', strike: 360, type: 'put', qty: 6,
    price: 0.47, gross: 282.0, fees: 6.79, net: 275.21,
    outcome: 'expired_worthless', outcomeDate: '2026-06-18',
    source: 'Moomoo SG Statement — Jun 2026',
  },
  {
    orderDate: '2026-06-13', time: '03:13:51', action: 'Sell to Open',
    underlying: 'NVDA', expiry: '2026-06-22', strike: 187.5, type: 'put', qty: 5,
    price: 0.49, gross: 245.0, fees: 6.21, net: 238.79,
    outcome: 'expired_worthless', outcomeDate: '2026-06-22',
    source: 'Moomoo SG Statement — Jun 2026',
  },
  {
    orderDate: '2026-06-18', time: '23:15:15', action: 'Sell to Open',
    underlying: 'MSFT', expiry: '2026-06-26', strike: 350, type: 'put', qty: 8,
    fills: [1, 1, 6],
    price: 0.53, gross: 424.0, fees: 8.64, net: 415.36,
    outcome: 'expired_worthless', outcomeDate: '2026-06-26',
    source: 'Moomoo SG Statement — Jun 2026',
    note: 'Filled in three lots (1 + 1 + 6) at the same limit price.',
  },
  {
    orderDate: '2026-06-23', time: '23:23:48', action: 'Sell to Open',
    underlying: 'NVDA', expiry: '2026-06-29', strike: 185, type: 'put', qty: 10,
    price: 0.45, gross: 450.0, fees: 10.76, net: 439.24,
    outcome: 'expired_worthless', outcomeDate: '2026-06-29',
    source: 'Moomoo SG Statement — Jun 2026',
  },
  {
    orderDate: '2026-06-30', time: '00:31:20', action: 'Sell to Open',
    underlying: 'MSFT', expiry: '2026-07-06', strike: 340, type: 'put', qty: 10,
    price: 0.4, gross: 400.0, fees: 13.48, net: 386.52,
    outcome: 'open_at_last_statement',
    source: 'Moomoo SG Statement — Jun 2026',
    note: 'Marked at $0.1824 at Jun 30 (≈+$218 unrealized). Final outcome requires the Jul 2026 statement.',
  },
]

export const IMPORTED_OPTION_HOLDINGS: ImportedOptionHolding[] = [
  {
    underlying: 'OWL', expiry: '2028-01-21', strike: 10, type: 'call', side: 'long', qty: 10,
    markPrice: 1.75, markValue: 1_750.0, markDate: '2026-06-30',
    earlierMark: { date: '2026-03-31', price: 2.0999 },
    costBasis: null,
    source: 'Moomoo SG Statement — Jun 2026',
    note: 'LEAPS held alongside 2,500 OWL shares in the same account. Opened before Mar 2026 — cost basis needs earlier statements.',
  },
  {
    underlying: 'PYPL', expiry: '2027-01-15', strike: 42.5, type: 'call', side: 'long', qty: 4,
    markPrice: 5.8764, markValue: 2_350.56, markDate: '2026-06-30',
    earlierMark: { date: '2026-03-31', price: 8.9025 },
    costBasis: null,
    source: 'Moomoo SG Statement — Jun 2026',
    note: 'Opened before Mar 2026 — cost basis needs earlier statements.',
  },
]

/* Aggregates — computed from the rows above, not hand-entered. */
export const IMPORTED_SUMMARY = (() => {
  const closed = IMPORTED_OPTION_TRADES.filter((t) => t.outcome === 'expired_worthless')
  const open = IMPORTED_OPTION_TRADES.filter((t) => t.outcome === 'open_at_last_statement')
  const gross = IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.gross, 0)
  const fees = IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.fees, 0)
  const net = IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.net, 0)
  return {
    orders: IMPORTED_OPTION_TRADES.length,
    contracts: IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.qty, 0),
    grossPremium: gross,
    fees,
    netPremium: net,
    closedCount: closed.length,
    closedNet: closed.reduce((s, t) => s + t.net, 0),
    expiredWorthlessCount: closed.filter((t) => t.outcome === 'expired_worthless').length,
    openCount: open.length,
    lastStatementDate: '2026-06-30',
  }
})()

export const IMPORTED_DATA_GAPS = [
  'Jul 2026 statement not uploaded — outcome of MSFT 07/06 $340 put (10 contracts, open at Jun 30) is unknown',
  'OWL and PYPL call cost basis unknown — opened before Mar 2026; upload earlier statements to complete P&L',
  'Order-history screenshot (reviewed) contains ULTY/XDTE ETF buys only — no option trades, so nothing was imported from it',
]
