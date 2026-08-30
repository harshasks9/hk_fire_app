/*
  The universe, lots and calibrated IVs were solved from the owner's own
  fills, not screen quotes. Chain liquidity defaults to 'none' for everything
  except the names verified in the brief — capacity is not tradeability.
*/

export interface TickerSeed {
  symbol: string
  group: 'universe' | 'holding' | 'blocked'
  active: boolean
  blocked: boolean
  blockedReason: string | null
  callLot: number | null
  putLot: number | null
  seedIv: number | null
  strikeIncrement: number | null
  allowsCalls: boolean
  allowsPuts: boolean
  chainLiquidity: 'liquid' | 'thin' | 'none'
}

const t = (p: Partial<TickerSeed> & { symbol: string }): TickerSeed => ({
  group: 'holding',
  active: false,
  blocked: false,
  blockedReason: null,
  callLot: null,
  putLot: null,
  seedIv: null,
  strikeIncrement: null,
  allowsCalls: true,
  allowsPuts: true,
  chainLiquidity: 'none',
  ...p,
})

export const TICKER_SEEDS: TickerSeed[] = [
  // The five-and-friends weekly universe. IVs calibrated from his fills.
  t({ symbol: 'MSFT', group: 'universe', active: true, callLot: 16, putLot: 10, seedIv: 0.27, strikeIncrement: 2.5, chainLiquidity: 'liquid' }),
  t({ symbol: 'META', group: 'universe', active: true, callLot: 5, putLot: 5, seedIv: 0.49, strikeIncrement: 5.0, chainLiquidity: 'liquid' }),
  t({ symbol: 'GOOG', group: 'universe', active: true, callLot: 12, putLot: 12, seedIv: 0.36, strikeIncrement: 2.5, chainLiquidity: 'liquid' }),
  t({ symbol: 'NVDA', group: 'universe', active: true, callLot: 3, putLot: 3, seedIv: 0.4, strikeIncrement: 2.5, chainLiquidity: 'liquid' }),
  t({ symbol: 'MU', group: 'universe', active: true, putLot: 4, seedIv: 1.4, strikeIncrement: 10.0, allowsCalls: false, chainLiquidity: 'liquid' }),
  t({ symbol: 'NOW', group: 'universe', active: true, putLot: 10, seedIv: 0.55, strikeIncrement: 2.5, allowsCalls: false, chainLiquidity: 'liquid' }),
  t({ symbol: 'UNH', group: 'universe', active: true, callLot: 2, putLot: 2, seedIv: 0.3, strikeIncrement: 5.0, chainLiquidity: 'liquid' }),

  // OWL: concentration-exit sleeve. Calls encouraged; puts blocked — the
  // position is already 28% of the book.
  t({
    symbol: 'OWL', group: 'universe', active: true, callLot: 300, seedIv: 0.35, strikeIncrement: 0.5,
    allowsPuts: false, blockedReason: 'OWL puts blocked: position is 28% of the book. Calls are the exit programme (§6).',
    chainLiquidity: 'liquid',
  }),

  // Verified chains among the holdings.
  t({ symbol: 'VOO', chainLiquidity: 'liquid' }),
  t({ symbol: 'BAM', chainLiquidity: 'thin' }),
  t({ symbol: 'NVO', chainLiquidity: 'thin' }),
  t({ symbol: 'EPR', chainLiquidity: 'thin' }),
  t({ symbol: 'BXSL', chainLiquidity: 'thin' }),
  t({ symbol: 'DEA', chainLiquidity: 'thin' }),
  t({ symbol: 'ARE', chainLiquidity: 'thin' }),

  // Holdings with no usable chain until verified.
  ...['SPYI', 'PAX', 'NVDY', 'YMAG', 'IDVO', 'MSDL', 'DIVO', 'HIW', 'XDTE', 'OTF', 'IWGFF', 'OMF', 'FEPI'].map((symbol) => t({ symbol })),

  // Blocked names. Rolling a $600 problem into $9,812 and buying novelty are
  // how these earned their rows.
  t({ symbol: 'GLD', group: 'blocked', blocked: true, blockedReason: 'Outside the process. Three short calls here were deviation losses.' }),
  t({ symbol: 'SNOW', group: 'blocked', blocked: true, blockedReason: 'Novelty trade: one put paid $2,799/contract vs the name’s usual ~$160 and lost $2,774.' }),
  t({ symbol: 'COF', group: 'blocked', blocked: true, blockedReason: 'Shares gone — no covered basis.' }),
  t({ symbol: 'PYPL', group: 'blocked', blocked: true, blockedReason: 'Shares gone — no covered basis.' }),
]

export interface HoldingSeed {
  symbol: string
  shares: number
  avgPrice: number | null
  assetClass: 'reit' | 'non_reit'
  annualDividend: number
}

/*
  24 positions. Share counts are the brief's — ALL UNVERIFIED until the
  first-run confirmation flow marks them confirmed. Avg prices are known for
  the five actively-written names; the rest are null until confirmed.
  Dividend figures for names in the imported Fidelity income summary use those
  broker numbers; others are estimates to be confirmed.
*/
export const HOLDING_SEEDS: HoldingSeed[] = [
  { symbol: 'OWL', shares: 120000, avgPrice: 12.02, assetClass: 'non_reit', annualDividend: 51125 },
  { symbol: 'MSFT', shares: 1752, avgPrice: 513.53, assetClass: 'non_reit', annualDividend: 9357 },
  { symbol: 'GOOG', shares: 1611, avgPrice: 342.88, assetClass: 'non_reit', annualDividend: 1611 },
  { symbol: 'VOO', shares: 560, avgPrice: 707.24, assetClass: 'non_reit', annualDividend: 7300 },
  { symbol: 'META', shares: 547, avgPrice: 500.44, assetClass: 'non_reit', annualDividend: 1150 },
  { symbol: 'DEA', shares: 9161, avgPrice: null, assetClass: 'reit', annualDividend: 17382 },
  { symbol: 'BAM', shares: 3889, avgPrice: null, assetClass: 'non_reit', annualDividend: 6600 },
  { symbol: 'SPYI', shares: 3752, avgPrice: null, assetClass: 'non_reit', annualDividend: 15430 },
  { symbol: 'PAX', shares: 15629, avgPrice: null, assetClass: 'non_reit', annualDividend: 8695 },
  { symbol: 'NVDY', shares: 9457, avgPrice: null, assetClass: 'non_reit', annualDividend: 26612 },
  { symbol: 'EPR', shares: 1526, avgPrice: null, assetClass: 'reit', annualDividend: 5350 },
  { symbol: 'NVO', shares: 1600, avgPrice: null, assetClass: 'non_reit', annualDividend: 2400 },
  { symbol: 'YMAG', shares: 6459, avgPrice: null, assetClass: 'non_reit', annualDividend: 7421 },
  { symbol: 'IDVO', shares: 1474, avgPrice: null, assetClass: 'non_reit', annualDividend: 4800 },
  { symbol: 'MSDL', shares: 4135, avgPrice: null, assetClass: 'non_reit', annualDividend: 5568 },
  { symbol: 'DIVO', shares: 1150, avgPrice: null, assetClass: 'non_reit', annualDividend: 2300 },
  { symbol: 'HIW', shares: 1700, avgPrice: null, assetClass: 'reit', annualDividend: 5789 },
  { symbol: 'XDTE', shares: 1100, avgPrice: null, assetClass: 'non_reit', annualDividend: 13946 },
  { symbol: 'BXSL', shares: 1693, avgPrice: null, assetClass: 'non_reit', annualDividend: 7055 },
  { symbol: 'OTF', shares: 3000, avgPrice: null, assetClass: 'non_reit', annualDividend: 4500 },
  { symbol: 'IWGFF', shares: 10000, avgPrice: null, assetClass: 'non_reit', annualDividend: 1600 },
  { symbol: 'ARE', shares: 353, avgPrice: null, assetClass: 'reit', annualDividend: 1900 },
  { symbol: 'OMF', shares: 185, avgPrice: null, assetClass: 'non_reit', annualDividend: 780 },
  { symbol: 'FEPI', shares: 210, avgPrice: null, assetClass: 'non_reit', annualDividend: 2700 },
]

/** 2026 baseline facts from the brief — shown as programme baseline, never recomputed from partial rows. */
export const BASELINE_2026 = {
  positions: 139,
  winners: 131,
  netCredit: 86457,
  cadenceWritten: 32,
  cadenceAvailable: 35,
  assignments: 14,
  assignmentsProfitable: 14,
  lossesTotal: 8,
  lossesShortCalls: 7,
} as const
