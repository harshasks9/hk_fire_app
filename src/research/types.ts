/* ---------------------------------------------------------------------------
   Equity Research Lab — domain model.

   DATA INTEGRITY CONTRACT
   Every dossier declares its data profile. This build ships with the
   'bundled-sample' provider: approximate historical figures authored as of
   the model cutoff, clearly labeled, never presented as live or verified.
   A licensed provider implements the same DataProvider interface and
   replaces the bundle without touching any UI or analytics code.
--------------------------------------------------------------------------- */

import type { CurrencyCode } from '@/data/types'

export type CoverageTier = 'deep' | 'standard' | 'technical' | 'none'

export type ClaimKind =
  | 'verified_fact' // from a primary filing (in live mode)
  | 'management_statement'
  | 'consensus'
  | 'market_expectation'
  | 'model_inference'
  | 'speculation'
  | 'sample_data' // bundled dataset — approximate, labeled

export interface SourceTag {
  label: string // e.g. "FY2025 10-K", "Q1 FY26 earnings call"
  date: string
  kind: ClaimKind
}

export interface DataProfile {
  provider: 'bundled-sample' | 'live'
  asOf: string
  note: string
}

/* -- Fundamentals ----------------------------------------------------------- */

/** One fiscal year, in reporting-currency billions (per-share items absolute). */
export interface FinYear {
  fy: string // label e.g. "FY2024"
  revenue: number
  grossMarginPct?: number
  ebitMarginPct?: number
  netIncome: number
  eps: number
  fcf: number
  shares: number // billions
  roicPct?: number
  netDebt?: number // negative = net cash
  sbc?: number
  dividendsPerShare?: number
  capex?: number
}

export interface SegmentSlice {
  name: string
  revenuePct: number
  note?: string
}

export interface CompanyProfile {
  name: string
  description: string // one sentence
  sector: string
  industry: string
  country: string
  currency: CurrencyCode
  unit: string // e.g. "USD billions" | "INR billions"
  benchmark: string // e.g. "SPY" | "NIFTY50"
  marketNarrative: string
  segments: SegmentSlice[]
  geographies: SegmentSlice[]
  moat: { rating: 'wide' | 'narrow' | 'none'; direction: 'strengthening' | 'stable' | 'weakening'; basis: string }
  risks: { label: string; detail: string; underappreciated?: boolean }[]
  management: { assessment: string; capitalAllocation: string; incentives?: string }
  accountingFlags: { label: string; severity: 'low' | 'medium' | 'high'; detail: string }[]
}

/* -- Valuation ---------------------------------------------------------------- */

export interface DcfInputs {
  fcf0: number // starting FCF, currency billions
  growthY1_5: number // %/yr
  growthY6_10: number
  terminalGrowth: number
  discountRate: number
  netCash: number // billions, negative = net debt
  shares: number // billions
}

export interface ScenarioCase {
  label: 'Bull' | 'Base' | 'Bear'
  narrative: string
  eps5: number // year-5 EPS (or FCF/share for REITs)
  exitMultiple: number
  probabilityPct: number
}

export interface ValuationBlock {
  methodNotes: string // why chosen methods fit / don't fit this business
  dcf: DcfInputs
  scenarios: ScenarioCase[]
  historicalMultiples: { label: string; low: number; median: number; high: number; current: number }[]
  peers: { symbol: string; name: string; multiple: number; metric: string }[]
  sotp?: { part: string; value: number; basis: string }[]
}

/* -- Investor frameworks -------------------------------------------------------- */

export type FrameworkId =
  | 'buffett'
  | 'lynch'
  | 'graham'
  | 'fisher'
  | 'marks'
  | 'greenblatt'
  | 'smith'
  | 'damodaran'
  | 'druckenmiller'
  | 'mauboussin'
  | 'chanos'

export interface FrameworkAnswer {
  q: string
  a: string
  source?: SourceTag
}

export interface FrameworkEval {
  id: FrameworkId
  score: number // 0-10
  verdict: string // one line
  applicability?: string // where the lens doesn't fit
  answers?: FrameworkAnswer[]
}

/* -- Technicals (computed) -------------------------------------------------------- */

export interface TechnicalLevel {
  price: number
  kind: 'support' | 'resistance'
  basis: string
}

/* -- Memo / thesis ------------------------------------------------------------------ */

export type ResearchStatus = 'Avoid' | 'Watch' | 'Research Further' | 'Accumulate' | 'Hold' | 'Reduce' | 'Exit'

export interface Memo {
  oneLiner: string
  narrative: string // current market narrative
  variantPerception: string
  bull: string
  base: string
  bear: string
  assumptions: string[]
  reasonsToOwn: string[]
  reasonsNotToOwn: string[]
  catalysts: { date: string; label: string; kind: 'earnings' | 'product' | 'regulatory' | 'capital' | 'macro' }[]
  thesisBreakers: string[]
  leadingIndicators: string[]
  valuationRange: { low: number; high: number }
  expectedReturnPct: { y1: number; y3: number; y5: number }
  status: ResearchStatus
  statusRationale: string
}

/* -- News & monitoring ---------------------------------------------------------------- */

export interface NewsItem {
  date: string
  title: string
  source: SourceTag
  materiality: 'material' | 'relevant' | 'noise'
  why: string
  affectsAssumption?: string // which memo assumption this maps to
}

export interface InsiderEvent {
  date: string
  who: string
  action: 'buy' | 'sell' | 'sell-10b5-1'
  valueUsd: number
  note?: string
}

/* -- Scores ------------------------------------------------------------------------------ */

export interface ScoreInput {
  label: string
  value: string // display value
  contribution: number // 0-10 sub-score
}

export interface CategoryScore {
  key: string
  label: string
  score: number // 0-10
  computed: boolean // true = derived from data by engine, false = analyst-authored
  formula: string // shown to user, never hidden
  inputs: ScoreInput[]
}

/* -- Dossier ------------------------------------------------------------------------------ */

export interface ResearchDossier {
  symbol: string
  tier: CoverageTier
  dataProfile: DataProfile
  profile: CompanyProfile
  financials: FinYear[] // oldest → newest
  estimateRevisions?: { period: string; direction: 'up' | 'down' | 'flat'; note: string }[]
  valuation: ValuationBlock
  frameworks: FrameworkEval[]
  memo: Memo
  news: NewsItem[]
  insiders?: InsiderEvent[]
  qualityScores: { key: string; label: string; score: number; basis: string }[] // analyst-authored categories
  snapshots: { date: string; status: ResearchStatus; note: string }[]
}

/** Saved user edits (device-local until the Stage B backend lands). */
export interface UserThesisState {
  editedMemo?: Partial<Memo>
  weights?: Record<string, number>
  notes?: string
  savedAt?: string
}
