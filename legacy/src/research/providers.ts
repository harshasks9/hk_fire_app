import type { CoverageTier, ResearchDossier, UserThesisState } from './types'
import { AAPL_DOSSIER } from './dossiers/aapl'
import { NVDA_DOSSIER } from './dossiers/nvda'
import { RELIANCE_DOSSIER } from './dossiers/reliance'
import { AMD_DOSSIER } from './dossiers/amd'
import { MSFT_DOSSIER, COST_DOSSIER, TCS_DOSSIER, O_DOSSIER } from './dossiers/standard'
import { POSITIONS } from '@/data/portfolio'
import { WATCHLIST, anyInstrument } from '@/data/watchlist'
import { INSTRUMENTS, priceHistory } from '@/data/instruments'

/* ---------------------------------------------------------------------------
   Data-provider adapter layer.

   The application talks to `DataProvider` only. This build registers the
   'bundled-sample' provider. A licensed provider (e.g. an SEC/EDGAR +
   market-data integration behind the Stage B backend) implements the same
   interface and is swapped in via `activeProvider` — no UI changes needed.

   Features that REQUIRE licensed data (documented, not simulated here):
   live quotes & corporate actions, point-in-time consensus estimates,
   full filing text & transcripts, insider transactions feed, ownership data.
--------------------------------------------------------------------------- */

export interface DataProvider {
  id: 'bundled-sample' | 'live'
  label: string
  getDossier(symbol: string): ResearchDossier | null
  listCovered(): string[]
}

const DOSSIERS: Record<string, ResearchDossier> = {
  AAPL: AAPL_DOSSIER,
  NVDA: NVDA_DOSSIER,
  RELIANCE: RELIANCE_DOSSIER,
  AMD: AMD_DOSSIER,
  MSFT: MSFT_DOSSIER,
  COST: COST_DOSSIER,
  TCS: TCS_DOSSIER,
  O: O_DOSSIER,
}

export const sampleProvider: DataProvider = {
  id: 'bundled-sample',
  label: 'Bundled sample dataset',
  getDossier: (symbol) => DOSSIERS[symbol] ?? null,
  listCovered: () => Object.keys(DOSSIERS),
}

/** The live provider is intentionally unimplemented in this build. */
export const liveProvider: DataProvider = {
  id: 'live',
  label: 'Licensed data provider (not configured)',
  getDossier: () => null,
  listCovered: () => [],
}

export const activeProvider: DataProvider = sampleProvider

/* -- Coverage universe -------------------------------------------------------- */

export interface CoverageRow {
  symbol: string
  name: string
  tier: CoverageTier
  inPortfolio: boolean
  onWatchlist: boolean
  isFund: boolean
  dossier: ResearchDossier | null
  note?: string
}

const FUND_CLASSES = new Set(['etf', 'in_mf', 'bond', 'commodity'])

/** The research universe = portfolio holdings + watchlist, deduplicated. */
export function coverageUniverse(): CoverageRow[] {
  const held = new Set(POSITIONS.map((p) => p.symbol))
  const watched = new Set(WATCHLIST.map((w) => w.symbol))
  const symbols = [...new Set([...held, ...watched])]
  return symbols
    .map((symbol) => {
      const inst = anyInstrument(symbol)
      const dossier = activeProvider.getDossier(symbol)
      const isFund = inst ? FUND_CLASSES.has(inst.assetClass) : false
      let tier: CoverageTier = dossier?.tier ?? 'none'
      let note: string | undefined
      if (!dossier) {
        if (isFund) {
          tier = 'none'
          note = 'Fund/ETF — single-company fundamental research not applicable; see portfolio-level analytics'
        } else if (inst && priceHistory(symbol).length > 0) {
          tier = 'technical'
          note = 'Technical coverage only — fundamental dossier requires the live data provider'
        } else {
          note = 'Not covered — add via the live data provider'
        }
      }
      return {
        symbol,
        name: inst?.name ?? symbol,
        tier,
        inPortfolio: held.has(symbol),
        onWatchlist: watched.has(symbol),
        isFund,
        dossier,
        note,
      }
    })
    .sort((a, b) => {
      const rank: Record<CoverageTier, number> = { deep: 0, standard: 1, technical: 2, none: 3 }
      return rank[a.tier] - rank[b.tier] || a.symbol.localeCompare(b.symbol)
    })
}

/* -- User research state (device-local until the Stage B backend) -------------- */

const KEY = (symbol: string) => `meridian.research.${symbol}`

export function loadUserState(symbol: string): UserThesisState {
  try {
    return JSON.parse(localStorage.getItem(KEY(symbol)) ?? '{}')
  } catch {
    return {}
  }
}

export function saveUserState(symbol: string, state: UserThesisState) {
  localStorage.setItem(KEY(symbol), JSON.stringify({ ...state, savedAt: new Date().toISOString() }))
}

const WEIGHTS_KEY = 'meridian.research.weights'

export function loadWeights(): Record<string, number> | null {
  try {
    return JSON.parse(localStorage.getItem(WEIGHTS_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveWeights(w: Record<string, number>) {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(w))
}

/** Price + benchmark series for a symbol (sample market data). */
export function seriesFor(symbol: string): { price: number[]; bench: number[]; current: number } {
  const price = priceHistory(symbol, 380)
  const inst = anyInstrument(symbol)
  const benchSym = inst?.currency === 'INR' ? 'HDFCIDX' : 'SPY'
  const bench = priceHistory(benchSym in INSTRUMENTS ? benchSym : 'SPY', 380)
  return { price, bench, current: inst?.price ?? price[price.length - 1] }
}
