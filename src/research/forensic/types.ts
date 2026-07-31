/**
 * Forensic asset-manager memoranda — data model.
 *
 * These memos are authored research output, not engine output. Every figure carries a
 * confidence tier so the UI can show the reader exactly what is quoted, what is derived
 * arithmetic, what is second-hand and what is an assumption. Tiers follow
 * docs/FORENSIC-ASSET-MANAGER-PROMPT.md §1.
 */

/** A — filing/release quote · B — our arithmetic on tier-A inputs · C — secondary source · D — our estimate */
export type Tier = 'A' | 'B' | 'C' | 'D'

export const TIER_META: Record<Tier, { label: string; short: string; desc: string }> = {
  A: { label: 'Reported', short: 'A', desc: 'Quoted from a company release, filing or earnings call' },
  B: { label: 'Derived', short: 'B', desc: 'Our arithmetic on reported figures — calculation shown' },
  C: { label: 'Secondary', short: 'C', desc: 'Reported by a third party citing the company; supporting evidence only' },
  D: { label: 'Estimate', short: 'D', desc: 'Our assumption or model input; never a headline claim' },
}

export type Rating =
  | 'Materially undervalued'
  | 'Moderately undervalued'
  | 'Fairly valued'
  | 'Moderately overvalued'
  | 'Materially overvalued'

export interface Fact {
  /** Short label, e.g. "FRE per share" */
  k: string
  /** Formatted value exactly as we intend to publish it */
  v: string
  tier: Tier
  /** Reporting period the figure belongs to, e.g. "Q2 2026" */
  period?: string
  /** Calculation or caveat — required in practice for tier B and D */
  note?: string
}

export interface HeadlineStat {
  label: string
  value: string
  sub?: string
  tier: Tier
  tone?: 'neutral' | 'gain' | 'loss' | 'warn'
}

/** One row of the quarter-in-context table. */
export interface QuarterRow {
  metric: string
  latest: string
  yoy: string
  qoq: string
  /** recurring | acquisition | timing | one-off | mixed */
  driver: 'Recurring' | 'Acquisition' | 'Timing' | 'One-off' | 'Mixed'
  verdict: 'Improved' | 'In line' | 'Deteriorated' | 'Deferred' | 'Pulled forward'
  tier: Tier
  note?: string
}

/** Annual / baseline history. Nulls render as "—" and are never interpolated. */
export interface HistoryRow {
  period: string
  aum: number | null
  fpaum: number | null
  frePs: number | null
  dePs: number | null
  freMarginPct: number | null
  dividendPs: number | null
  shares: number | null
  note?: string
  tier: Tier
}

export interface BridgeTerm {
  label: string
  value: string
  effect: 'positive' | 'negative' | 'neutral'
  detail: string
}

export interface ScorecardRow {
  commitment: string
  target: string
  actual: string
  status: 'Exceeded' | 'On track' | 'Met' | 'Behind plan' | 'Achieved by acquisition' | 'No longer measurable'
  note: string
  tier: Tier
}

export interface NarrativeRow {
  claim: string
  support: string
  contradiction: string
  verdict: string
  /** true when the contradicting evidence wins */
  challenged: boolean
}

export interface SegmentRow {
  name: string
  aum: string
  mgmtFee: string
  share: number
  feeRate: string
  duration: string
  organic: string
  multipleView: 'Premium' | 'Market' | 'Discount'
  comment: string
  tier: Tier
}

export interface ScoreRow {
  dimension: string
  score: number // 0-10
  basis: string
}

export interface DividendRow {
  year: string
  dePs: number | null
  dividendPs: number | null
  payoutPct: number | null
  note?: string
}

export interface RedemptionRow {
  vehicle: string
  size: string
  requested: string
  cap: string
  fulfilled: string
  trend: string
}

export interface PeerRow {
  ticker: string
  name: string
  marketCap: number | null // $bn
  fre: number | null // $m, annualised run-rate
  freGrowthPct: number | null
  freMarginPct: number | null
  pFre: number | null
  divYieldPct: number | null
  permCapital: string
  tier: Tier
  note?: string
}

export interface SotpRow {
  component: string
  basis: string
  multiple: string
  value: number // $m, negative for claims
}

export interface ValuationMethod {
  name: string
  approach: string
  low: number
  base: number
  high: number
  note: string
}

export interface ImpliedRow {
  variable: string
  impliedByPrice: string
  ourView: string
  assessment: 'Conservative' | 'Reasonable' | 'Aggressive'
}

export interface Scenario {
  name: 'Bear' | 'Base' | 'Bull'
  probability: number
  narrative: string
  assumptions: { k: string; v: string }[]
  targetPrice: number
  fiveYrIrrPct: number
  threeYrIrrPct: number
}

export interface SensitivityGrid {
  rowLabel: string
  colLabel: string
  rows: string[]
  cols: string[]
  /** values[rowIdx][colIdx] — value per share */
  values: number[][]
}

export interface Prediction {
  claim: string
  threshold: string
  by: string
  ifWrong: string
}

export interface RiskRow {
  risk: string
  mechanism: string
  severity: 'High' | 'Medium' | 'Low'
  quantified: string
}

export interface KpiRow {
  kpi: string
  why: string
  green: string
  red: string
}

export interface Source {
  label: string
  publisher: string
  period: string
  url?: string
  tier: Tier
}

export interface ForensicMemo {
  symbol: string
  name: string
  exchange: string
  /** Date the analysis was cut */
  asOf: string
  /** Latest reported period covered */
  latestPeriod: string
  /** One-line thesis */
  headline: string
  rating: Rating
  horizon: string
  positionSizing: string
  ratingChangesAt: { upgrade: string; downgrade: string }

  price: number
  priceAsOf: string
  dilutedShares: number // millions, fully diluted economic
  marketCap: number // $bn
  netDebt: number | null // $bn, null when not reliably disclosed in our sources
  dividendPs: number
  dividendYieldPct: number

  headlineStats: HeadlineStat[]

  debate: {
    marketBelieves: string
    mustGoRight: string
    underestimated: string
    deRating: string
    swingFactors: string[]
    bearsBestFact: string
  }

  quarter: QuarterRow[]
  quarterNarrative: string

  /** Per-share trajectory chart — last 8+ quarters */
  trajectory: { labels: string[]; frePs: number[]; dePs: number[] }
  /** AUM vs per-share DE, indexed to listing = 100 */
  indexed: { labels: string[]; aum: number[]; dePs: number[] }

  history: HistoryRow[]
  bridge: { period: string; terms: BridgeTerm[]; conclusion: string }
  scorecard: ScorecardRow[]
  narrative: NarrativeRow[]
  segments: SegmentRow[]
  aumScorecard: ScoreRow[]
  aumScorecardNote: string
  redemptions: RedemptionRow[] | null
  redemptionNote: string
  dividendCoverage: DividendRow[]
  dividendNote: string
  earningsBridge: { label: string; value: number; isTotal?: boolean }[]
  earningsBridgeNote: string
  ownership: Fact[]
  ownershipNote: string
  peers: PeerRow[]
  peerNote: string
  valuation: ValuationMethod[]
  sotp: SotpRow[]
  implied: ImpliedRow[]
  scenarios: Scenario[]
  sensitivity: SensitivityGrid
  redTeam: { case: string; adjudication: string }
  predictions: Prediction[]
  killCriteria: string[]
  risks: RiskRow[]
  kpis: KpiRow[]
  conclusions: { q: string; a: string }[]
  questionsForManagement: string[]
  sources: Source[]
  /** Explicit statement of what we could and could not retrieve */
  sourceCaveat: string
}
