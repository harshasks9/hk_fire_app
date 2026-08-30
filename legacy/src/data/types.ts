/* ---------------------------------------------------------------------------
   Meridian domain model.
   Every financial value carries provenance (where it came from), confidence,
   and freshness. Simple Mode and Pro Mode read the same records — they only
   differ in how much of this model they surface.
--------------------------------------------------------------------------- */

export type CurrencyCode = 'USD' | 'INR'

/** How a value entered the system and how much we trust it. */
export type Provenance =
  | 'verified' // reconciled against ≥2 sources
  | 'confirmed' // user reviewed and approved
  | 'imported' // extracted from a document, not yet reviewed
  | 'market' // live/near-live market feed
  | 'calculated' // derived from other records
  | 'estimated' // model output with assumptions
  | 'inferred' // guessed from partial data

export interface SourceRef {
  provenance: Provenance
  /** Document id, feed name, or 'user' */
  sourceId?: string
  sourceLabel: string
  asOf: string // ISO date
  stale?: boolean
  conflict?: string // human description of a conflicting source
  confidence?: number // 0..1 extraction/model confidence
}

/* -- Household -------------------------------------------------------------- */

export interface Member {
  id: string
  name: string
  short: string
  role: 'primary' | 'spouse' | 'joint' | 'entity'
  color: string
}

export type AccountType =
  | 'taxable'
  | '401k'
  | 'roth_ira'
  | 'hsa'
  | 'demat'
  | 'mf_folio'
  | 'bank'
  | 'options'

export interface Account {
  id: string
  institution: string
  name: string
  number: string // masked
  type: AccountType
  taxTreatment: 'taxable' | 'tax_deferred' | 'tax_free'
  country: 'US' | 'IN'
  currency: CurrencyCode
  ownerId: string
  costBasisMethod?: 'FIFO' | 'LIFO' | 'SpecID' | 'Average'
  lastSynced: string
  syncSource: string // e.g. document name or 'manual'
}

/* -- Instruments & positions ------------------------------------------------ */

export type AssetClass =
  | 'us_equity'
  | 'etf'
  | 'reit'
  | 'in_equity'
  | 'in_mf'
  | 'bond'
  | 'commodity'
  | 'cash'
  | 'employee_equity'
  | 'private'
  | 'real_estate'

export interface Instrument {
  symbol: string
  name: string
  assetClass: AssetClass
  sector: string
  geography: 'US' | 'India' | 'Global' | 'Intl Developed' | 'Emerging'
  currency: CurrencyCode
  price: number
  prevClose: number
  yieldPct?: number // trailing yield
  fiftyTwoWeek?: { low: number; high: number }
  peRatio?: number
  beta?: number
  nextEarnings?: string
  exDivDate?: string
  divPerShare?: number // per payment
  divFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  divGrowth5y?: number
  seed: number // price-history seed
  volatility?: number // annualized IV/HV for display
}

export interface TaxLot {
  id: string
  date: string
  qty: number
  costPerUnit: number
  source: SourceRef
}

export interface Position {
  id: string
  accountId: string
  symbol: string
  qty: number
  lots: TaxLot[]
  /** realized P&L this year, position currency */
  realizedYtd: number
  feesYtd: number
  withholdingYtd?: number
  thesis?: string
  risks?: string[]
  notes?: string
  source: SourceRef
}

/* -- Options ---------------------------------------------------------------- */

export type OptionStrategyKind =
  | 'covered_call'
  | 'cash_secured_put'
  | 'vertical_spread'
  | 'calendar_spread'
  | 'long_call'
  | 'protective_put'

export interface OptionLeg {
  id: string
  type: 'call' | 'put'
  side: 'long' | 'short'
  strike: number
  expiry: string
  contracts: number
  premium: number // per share, received(+)/paid(-) at open
  currentPrice: number // per share mark
  delta: number
  theta: number
  iv: number
}

export interface OptionStrategy {
  id: string
  accountId: string
  kind: OptionStrategyKind
  underlying: string
  legs: OptionLeg[]
  collateral?: number
  linkedPositionId?: string
  openedAt: string
  rollHistory?: { date: string; note: string; credit: number }[]
  source: SourceRef
}

/* -- Real estate ------------------------------------------------------------ */

export interface ValuationPoint {
  date: string
  value: number
  source: SourceRef
}

export interface DirectProperty {
  id: string
  name: string
  kind: 'primary_residence' | 'rental_residential' | 'rental_commercial'
  address: string
  country: 'US' | 'IN'
  currency: CurrencyCode
  ownerId: string
  ownershipPct: number
  purchaseDate: string
  purchasePrice: number
  improvements: { date: string; label: string; amount: number }[]
  valuations: ValuationPoint[]
  mortgageId?: string
  monthlyRent?: number
  tenant?: { name: string; leaseEnd: string; monthsOccupied: number }
  occupancyPct?: number
  monthlyCosts: { label: string; amount: number }[] // taxes, insurance, hoa, mgmt, maintenance
  propertyTaxAnnual: number
  insuranceAnnual: number
  nextObligation?: { label: string; date: string; amount: number }
  source: SourceRef
}

export interface Syndication {
  id: string
  name: string
  sponsor: string
  legalEntity: string
  strategy: string
  ownerId: string
  currency: CurrencyCode
  committed: number
  called: number
  distributions: { date: string; amount: number; type: 'income' | 'return_of_capital' | 'gain' }[]
  navValue: number
  navDate: string
  preferredReturnPct: number
  waterfall: string
  promotePct: number
  underwrittenIrr: number
  currentIrr?: number
  equityMultipleTarget: number
  occupancyPct?: number
  expectedExit: string
  nextCapitalCall?: { date: string; amount: number }
  latestUpdate: { date: string; summary: string }
  taxDocs: string[]
  source: SourceRef
}

/* -- Liabilities ------------------------------------------------------------ */

export type LiabilityKind = 'mortgage' | 'loan_against_securities' | 'auto' | 'heloc'

export interface Liability {
  id: string
  kind: LiabilityKind
  name: string
  lender: string
  currency: CurrencyCode
  ownerId: string
  originalPrincipal: number
  balance: number
  ratePct: number
  rateType: 'fixed' | 'floating'
  rateIndex?: string
  monthlyPayment: number
  nextPaymentDate: string
  originDate: string
  maturityDate: string
  collateralRef?: { type: 'property' | 'securities'; id: string; label: string }
  covenants?: string[]
  marginMaintenancePct?: number
  source: SourceRef
}

/* -- Insurance -------------------------------------------------------------- */

export interface InsurancePolicy {
  id: string
  kind: 'term_life' | 'health' | 'home' | 'auto' | 'endowment' | 'umbrella'
  insurer: string
  policyNumber: string
  insured: string // member name or property
  ownerId: string
  currency: CurrencyCode
  coverage: number
  premium: number
  premiumFrequency: 'monthly' | 'quarterly' | 'annual'
  renewalDate?: string
  maturityDate?: string
  surrenderValue?: number
  maturityValue?: number
  status: 'active' | 'lapse_risk' | 'grace_period'
  beneficiary?: string
  riders?: string[]
  exclusions?: string[]
  source: SourceRef
}

/* -- Income ------------------------------------------------------------------ */

export type IncomeType =
  | 'dividend'
  | 'reit_distribution'
  | 'interest'
  | 'option_premium'
  | 'rent'
  | 'syndication_distribution'
  | 'mf_dividend'

export interface IncomeEvent {
  id: string
  date: string
  type: IncomeType
  sourceLabel: string // e.g. 'SCHD', 'Maple Grove Duplex'
  symbol?: string
  accountId?: string
  amount: number
  currency: CurrencyCode
  status: 'received' | 'expected' | 'missed'
  taxTreatment?: 'qualified' | 'ordinary' | 'tax_free' | 'return_of_capital'
  withholding?: number
}

/* -- Documents --------------------------------------------------------------- */

export type DocumentKind =
  | 'brokerage_statement'
  | 'tax_return'
  | 'capital_gains_statement'
  | 'mortgage_statement'
  | 'bank_statement'
  | 'insurance_policy'
  | 'mf_statement'
  | 'property_record'
  | 'rental_agreement'
  | 'capital_call_notice'
  | 'distribution_statement'
  | 'sponsor_report'
  | 'salary_statement'
  | 'rsu_statement'
  | 'appraisal'

export type DocStage =
  | 'uploaded'
  | 'classified'
  | 'extracting'
  | 'matching'
  | 'reconciling'
  | 'review'
  | 'applied'
  | 'failed'

export interface ExtractedField {
  field: string
  existing: string | null
  proposed: string
  confidence: number
  status: 'match' | 'new' | 'conflict' | 'low_confidence'
  impact?: string
}

export interface DocumentRecord {
  id: string
  name: string
  kind: DocumentKind
  institution: string
  accountId?: string
  uploadedAt: string
  periodStart?: string
  periodEnd?: string
  stage: DocStage
  fileType: 'pdf' | 'csv' | 'xlsx' | 'image'
  pages?: number
  summary?: string
  extracted?: ExtractedField[]
  positionsFound?: number
  transactionsFound?: number
  cashBalancesFound?: number
  netImpact?: number // in doc currency
  currency?: CurrencyCode
  duplicateOf?: string
  auditTrail?: { date: string; actor: string; action: string }[]
}

/* -- Inbox / data-quality issues --------------------------------------------- */

export type InboxKind =
  | 'missing_cost_basis'
  | 'conflicting_values'
  | 'stale_valuation'
  | 'unknown_instrument'
  | 'unmatched_transaction'
  | 'duplicate_account'
  | 'ambiguous_ownership'
  | 'overlapping_periods'
  | 'missing_document'

export interface InboxItem {
  id: string
  kind: InboxKind
  severity: 'high' | 'medium' | 'low'
  simpleTitle: string // plain language
  proTitle: string
  detail: string
  entityRef?: string // e.g. position id / property id
  entityLabel?: string
  createdAt: string
  status: 'open' | 'resolved' | 'deferred' | 'ignored'
  options: ('accept' | 'edit' | 'merge' | 'split' | 'ignore' | 'defer' | 'revert')[]
  resolution?: string
}

/* -- Suggestions -------------------------------------------------------------- */

export type SuggestionCategory = 'observation' | 'alert' | 'opportunity' | 'recommendation'

export interface Suggestion {
  id: string
  category: SuggestionCategory
  title: string
  what: string
  why: string
  action?: string
  impact?: string
  impactValue?: number // USD est.
  risks?: string[]
  taxNote?: string
  liquidityNote?: string
  confidence: number
  supportingRecords: { label: string; ref: string }[]
  missingData?: string[]
  alternatives?: string[]
  createdAt: string
  status: 'open' | 'accepted' | 'dismissed' | 'snoozed' | 'saved' | 'sent_to_advisor' | 'done_externally'
  urgency?: 'today' | 'this_week' | 'this_month' | 'no_rush'
  assumptions?: string[]
  calculations?: { label: string; value: string }[]
}

/* -- Timeline ----------------------------------------------------------------- */

export type TimelineKind =
  | 'market'
  | 'contribution'
  | 'withdrawal'
  | 'income'
  | 'debt'
  | 'valuation'
  | 'document'
  | 'correction'
  | 'decision'
  | 'recommendation'

export interface TimelineEvent {
  id: string
  date: string
  kind: TimelineKind
  title: string
  narrative: string // Simple-mode explanation
  amount?: number
  currency?: CurrencyCode
  attribution?: { account?: string; asset?: string; currencyImpact?: number }
  refDoc?: string
}

/* -- Goals & planning ---------------------------------------------------------- */

export interface Goal {
  id: string
  name: string
  icon: string
  targetAmount: number
  targetDate: string
  currency: CurrencyCode
  currentFunding: number
  monthlyContribution: number
  onTrack: 'on_track' | 'at_risk' | 'off_track'
  projectionNote: string
  adjustment?: string
  linkedAccounts: string[]
}

export interface ScenarioAssumptions {
  inflationPct: number
  usReturnPct: number
  inReturnPct: number
  incomeGrowthPct: number
  spendingGrowthPct: number
  retirementAge: number
  withdrawalRatePct: number
  lifeExpectancy: number
  propertyAppreciationPct: number
  vacancyPct: number
  usdInrDriftPct: number
}

/* -- Watchlist ----------------------------------------------------------------- */

export interface WatchlistItem {
  id: string
  symbol: string
  targetPrice: number
  note: string
  alertOn: boolean
  addedAt: string
  thesis?: string
  entryCriteria?: string[]
  exitCriteria?: string[]
  proposedSize?: number // USD
}

/* -- Tax ------------------------------------------------------------------------ */

export interface TaxSummary {
  year: number
  jurisdiction: 'US' | 'IN'
  estimatedObligation: number
  currency: CurrencyCode
  provenance: Provenance
  realizedStGains: number
  realizedLtGains: number
  unrealizedStGains: number
  unrealizedLtGains: number
  carryForwardLosses: number
  harvestableLosses: number
  foreignWithholding: number
  deadlines: { label: string; date: string; done?: boolean }[]
  missingDocs: string[]
  residencyDays?: number
  advisorNotes?: string[]
}

/* -- Net worth history ----------------------------------------------------------- */

export interface NetWorthPoint {
  date: string
  total: number
  investable: number
  realEstateEquity: number
  privateValue: number
  cash: number
  liabilities: number
}
