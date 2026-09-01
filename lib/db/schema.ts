import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

/* ------------------------------- universe -------------------------------- */

export const tickers = pgTable('tickers', {
  symbol: text('symbol').primaryKey(),
  group: text('group').notNull().default('holding'), // 'universe' | 'holding' | 'blocked'
  active: boolean('active').notNull().default(true),
  blocked: boolean('blocked').notNull().default(false),
  blockedReason: text('blocked_reason'),
  callLot: integer('call_lot'), // standard weekly lot sizes solved from his fills
  putLot: integer('put_lot'),
  seedIv: doublePrecision('seed_iv'),
  strikeIncrement: doublePrecision('strike_increment'),
  allowsCalls: boolean('allows_calls').notNull().default(true),
  allowsPuts: boolean('allows_puts').notNull().default(true),
  chainLiquidity: text('chain_liquidity').notNull().default('none'), // 'liquid' | 'thin' | 'none'
})

export const prices = pgTable(
  'prices',
  {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    date: date('date').notNull(),
    close: doublePrecision('close').notNull(),
    sourceUrl: text('source_url'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    needsReview: boolean('needs_review').notNull().default(false),
    /** True when the daily job failed and this row is a carried-forward previous close. */
    stale: boolean('stale').notNull().default(false),
  },
  (t) => [uniqueIndex('prices_symbol_date').on(t.symbol, t.date), index('prices_symbol').on(t.symbol)],
)

/* ------------------------------- positions ------------------------------- */

export const positions = pgTable(
  'positions',
  {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    type: text('type').notNull(), // 'call' | 'put'
    strike: doublePrecision('strike').notNull(),
    expiry: date('expiry').notNull(),
    lots: integer('lots').notNull(),
    creditPerContract: doublePrecision('credit_per_contract').notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    outcome: text('outcome'), // 'expired' | 'closed_early' | 'assigned' | 'stopped' | 'open'
    realisedPnl: doublePrecision('realised_pnl'),
    entrySpot: doublePrecision('entry_spot'),
    entryDelta: doublePrecision('entry_delta'),
    entryIv: doublePrecision('entry_iv'),
    baseRateAtEntry: doublePrecision('base_rate_at_entry'),
    isDeviation: boolean('is_deviation').notNull().default(false),
    screenshotUrl: text('screenshot_url'),
    /** 'owl_exit' marks the §6 concentration-exit sleeve; default weekly income sleeve. */
    sleeve: text('sleeve').notNull().default('weekly'),
    /** Seeded from the 2026 record (prompt-stated facts) rather than logged live. */
    seeded: boolean('seeded').notNull().default(false),
  },
  (t) => [index('positions_symbol').on(t.symbol), index('positions_open').on(t.closedAt)],
)

/* ------------------------------ weekly loop ------------------------------ */

export const weeks = pgTable(
  'weeks',
  {
    id: serial('id').primaryKey(),
    /** ISO year*100 + ISO week of the Friday, e.g. 202636. */
    weekNumber: integer('week_number').notNull(),
    fridayDate: date('friday_date').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ticketsWritten: integer('tickets_written'),
    credit: doublePrecision('credit'),
    missed: boolean('missed').notNull().default(false),
    /** Step progress for the guided sequence: closeout → direction → tickets → limits → done */
    progress: jsonb('progress').$type<Record<string, boolean>>().notNull().default({}),
    seeded: boolean('seeded').notNull().default(false),
  },
  (t) => [uniqueIndex('weeks_number').on(t.weekNumber)],
)

export const tickets = pgTable(
  'tickets',
  {
    id: serial('id').primaryKey(),
    weekId: integer('week_id')
      .notNull()
      .references(() => weeks.id),
    symbol: text('symbol').notNull(),
    type: text('type').notNull(), // 'call' | 'put'
    strike: doublePrecision('strike').notNull(),
    expiry: date('expiry').notNull(),
    lots: integer('lots').notNull(),
    modelledCredit: doublePrecision('modelled_credit').notNull(), // per contract
    modelledDelta: doublePrecision('modelled_delta').notNull(),
    baseRate: doublePrecision('base_rate'),
    baseRateWindows: integer('base_rate_windows'),
    disagreementFlag: boolean('disagreement_flag').notNull().default(false),
    /** proposed → approved | declined; approved → logged once a fill lands. */
    status: text('status').notNull().default('proposed'),
    declineReason: text('decline_reason'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    positionId: integer('position_id').references(() => positions.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** Sessions (daily job runs) elapsed since approval with no logged fill — drives the nag. */
    sessionsSinceApproval: integer('sessions_since_approval').notNull().default(0),
  },
  (t) => [index('tickets_week').on(t.weekId)],
)

/* ------------------------------- holdings -------------------------------- */

export const holdings = pgTable('holdings', {
  symbol: text('symbol').primaryKey(),
  shares: doublePrecision('shares').notNull(),
  avgPrice: doublePrecision('avg_price'),
  assetClass: text('asset_class').notNull().default('non_reit'), // 'reit' | 'non_reit'
  taxFreeShares: doublePrecision('tax_free_shares').notNull().default(0),
  taxedShares: doublePrecision('taxed_shares').notNull().default(0),
  annualDividend: doublePrecision('annual_dividend').notNull().default(0),
  confirmed: boolean('confirmed').notNull().default(false),
})

/* --------------------------- deviation ledger ---------------------------- */

export const deviations = pgTable('deviations', {
  id: serial('id').primaryKey(),
  positionId: integer('position_id').references(() => positions.id),
  ruleBroken: text('rule_broken').notNull(), // 'delta_band' | 'novelty' | 'rescue_roll' | 'missed_week' | 'stop_not_taken' | 'gate_override' | 'credit_band' | 'blocked_name'
  ruleSaid: text('rule_said').notNull(),
  actionTaken: text('action_taken').notNull(),
  reason: text('reason'),
  outcomeUsd: doublePrecision('outcome_usd'), // null until resolved — never guessed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  seeded: boolean('seeded').notNull().default(false),
})

/* ------------------------------- valuation ------------------------------- */

export const valuations = pgTable('valuations', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
  v1RangePosition: doublePrecision('v1_range_position'), // 0 = at 52w low, 1 = at high
  v2AnalystUpside: doublePrecision('v2_analyst_upside'), // consensus target ÷ spot − 1
  v3PeVsMedian: doublePrecision('v3_pe_vs_median'), // fwd P/E ÷ own 5y median − 1
  v4YieldVsMedian: doublePrecision('v4_yield_vs_median'), // yield ÷ own median − 1 (primary for REITs/BDCs)
  v5Thesis: doublePrecision('v5_thesis'), // −1 deep value … +1 rich; weighted double
  v5Rationale: text('v5_rationale'),
  inputsPopulated: integer('inputs_populated').notNull(),
  composite: doublePrecision('composite'),
  band: text('band'), // 'deep_value' | 'undervalued' | 'fair' | 'rich' | 'overvalued' | null when insufficient
  gate: text('gate').notNull(), // 'puts_only' | 'both' | 'calls_only'
  provisional: boolean('provisional').notNull().default(false),
})

/* ------------------------------ vol estimates ---------------------------- */

export const volEstimates = pgTable('vol_estimates', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  asOf: timestamp('as_of', { withTimezone: true }).notNull().defaultNow(),
  realized21d: doublePrecision('realized_21d'),
  calibratedIv: doublePrecision('calibrated_iv'),
  calibrationFills: integer('calibration_fills').notNull().default(0),
  blended: doublePrecision('blended').notNull(),
  source: text('source').notNull(), // 'seed' | 'blend' | 'realized_only' | 'calibrated_only'
})

/* -------------------------------- alerts --------------------------------- */

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  rule: text('rule').notNull(), // e.g. 'E2', 'stale_price', 'unlogged_ticket', 'digest', 'test'
  positionId: integer('position_id').references(() => positions.id),
  symbol: text('symbol'),
  urgency: text('urgency').notNull().default('normal'), // 'urgent' | 'normal'
  message: text('message').notNull(),
  deepLink: text('deep_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sendStatus: text('send_status').notNull().default('pending'), // 'pending' | 'sent' | 'failed' | 'suppressed_dedupe' | 'batched'
  sendError: text('send_error'),
})

/* -------------------------------- ai calls ------------------------------- */

export const aiCalls = pgTable('ai_calls', {
  id: serial('id').primaryKey(),
  model: text('model').notNull(),
  purpose: text('purpose').notNull(), // 'daily_prices' | 'hypothesis_check' | 'pro_prose' | 'screenshot_parse'
  requestSummary: text('request_summary'),
  responseSummary: text('response_summary'),
  ok: boolean('ok').notNull(),
  error: text('error'),
  groundingUrls: jsonb('grounding_urls').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* ------------------------------- settings -------------------------------- */

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/* --------------------------- hypothesis checks --------------------------- */

export const hypothesisChecks = pgTable('hypothesis_checks', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  verdict: text('verdict').notNull(), // 'intact' | 'watch' | 'broken'
  narrative: text('narrative').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
})
