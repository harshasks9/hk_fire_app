/*
  The seeded 2026 record. Everything here comes from facts stated in the
  build brief or the imported broker data — the row-level 139-trade record is
  not available, so rows the brief names are seeded (flagged seeded=true) and
  aggregates the brief states live in BASELINE_2026, never recomputed from
  this partial set. Dollar outcomes are seeded ONLY where the brief states
  them (META −9,812, SNOW −2,774); unknown outcomes stay null — never guessed.
*/

export interface SeedPosition {
  symbol: string
  type: 'call' | 'put'
  /** Explicit strike, or a delta the seeder solves a strike from. */
  strike?: number
  targetDelta?: number
  openedAt: string // Friday of the write
  expiry: string
  lots: number
  entrySpot: number
  outcome: 'expired' | 'closed_early' | 'assigned' | 'stopped' | 'open'
  realisedPnl: number | null | 'credit' // 'credit' = winner, keep the full credit
  isDeviation: boolean
  deviation?: {
    ruleBroken: string
    ruleSaid: string
    actionTaken: string
    reason: string | null
    outcomeUsd: number | null
  }
}

const fridayPlus7 = (f: string) =>
  new Date(Date.parse(f + 'T00:00:00Z') + 7 * 86_400_000).toISOString().slice(0, 10)

const wk = (openedAt: string, p: Omit<SeedPosition, 'openedAt' | 'expiry'>): SeedPosition => ({
  ...p,
  openedAt,
  expiry: fridayPlus7(openedAt),
})

/* --- Jan–Mar MSFT: eleven calls sold into the $505 → $357 decline, three puts.
       The backtest page runs the valuation gate backwards over these — at those
       spots the gate reads deep value, puts only, and blocks every call. --- */
const JAN_MAR_SPOTS = [505, 493, 480, 466, 452, 438, 424, 410, 396, 382, 368]
const JAN_MAR_FRIDAYS = [
  '2026-01-09', '2026-01-16', '2026-01-23', '2026-01-30', '2026-02-06', '2026-02-13',
  '2026-02-20', '2026-02-27', '2026-03-06', '2026-03-13', '2026-03-20',
]
const msftJanMarCalls: SeedPosition[] = JAN_MAR_FRIDAYS.map((f, i) =>
  wk(f, {
    symbol: 'MSFT', type: 'call', targetDelta: 0.05, lots: 16,
    entrySpot: JAN_MAR_SPOTS[i]!, outcome: 'expired', realisedPnl: 'credit', isDeviation: false,
  }),
)
const msftJanMarPuts: SeedPosition[] = ['2026-01-23', '2026-02-20', '2026-03-13'].map((f, i) =>
  wk(f, {
    symbol: 'MSFT', type: 'put', targetDelta: 0.05, lots: 10,
    entrySpot: [480, 424, 382][i]!, outcome: 'expired', realisedPnl: 'credit', isDeviation: false,
  }),
)

/* --- June–July: the rule holding. Fills sat at 2–6 delta. --- */
const JUN_JUL: { f: string; msft: number; goog: number }[] = [
  { f: '2026-06-19', msft: 428.0, goog: 322.0 },
  { f: '2026-06-26', msft: 434.6, goog: 325.1 },
  { f: '2026-07-03', msft: 439.5, goog: 327.9 },
  { f: '2026-07-10', msft: 441.0, goog: 330.2 },
  { f: '2026-07-17', msft: 444.0, goog: 332.6 },
  { f: '2026-07-24', msft: 568.0, goog: 334.8 },
]
const junJulWrites: SeedPosition[] = JUN_JUL.flatMap(({ f, msft, goog }) => [
  wk(f, { symbol: 'MSFT', type: 'call', targetDelta: 0.04, lots: 16, entrySpot: msft, outcome: 'expired', realisedPnl: 'credit', isDeviation: false }),
  wk(f, { symbol: 'MSFT', type: 'put', targetDelta: 0.04, lots: 10, entrySpot: msft, outcome: 'expired', realisedPnl: 'credit', isDeviation: false }),
  wk(f, { symbol: 'GOOG', type: 'call', targetDelta: 0.05, lots: 12, entrySpot: goog, outcome: 'expired', realisedPnl: 'credit', isDeviation: false }),
])

/* --- August: the drift. Fills at 19, 22, 31, 34 and 36 delta. The fatter
       credit made it feel like it was working; two of the eight losses came
       from here. Individual dollar outcomes are not in the brief → null. --- */
const driftDeviation = (delta: number) => ({
  ruleBroken: 'delta_band',
  ruleSaid: 'Write at 3–8 delta; valuation may shade to 7, never past 8.',
  actionTaken: `Wrote at ${Math.round(delta * 100)} delta.`,
  reason: 'Seeded from the 2026 record — the August drift.',
  outcomeUsd: null,
})
const augustDrift: SeedPosition[] = [
  wk('2026-07-31', { symbol: 'MSFT', type: 'call', targetDelta: 0.19, lots: 16, entrySpot: 553.0, outcome: 'expired', realisedPnl: 'credit', isDeviation: true, deviation: driftDeviation(0.19) }),
  wk('2026-08-07', { symbol: 'MSFT', type: 'call', targetDelta: 0.34, lots: 16, entrySpot: 540.5, outcome: 'closed_early', realisedPnl: null, isDeviation: true, deviation: driftDeviation(0.34) }),
  wk('2026-08-07', { symbol: 'GOOG', type: 'call', targetDelta: 0.22, lots: 12, entrySpot: 336.0, outcome: 'expired', realisedPnl: 'credit', isDeviation: true, deviation: driftDeviation(0.22) }),
  wk('2026-08-14', { symbol: 'GOOG', type: 'call', targetDelta: 0.31, lots: 12, entrySpot: 338.2, outcome: 'expired', realisedPnl: 'credit', isDeviation: true, deviation: driftDeviation(0.31) }),
  wk('2026-08-21', { symbol: 'GOOG', type: 'call', targetDelta: 0.36, lots: 12, entrySpot: 340.0, outcome: 'closed_early', realisedPnl: null, isDeviation: true, deviation: driftDeviation(0.36) }),
]
const augustCompliant: SeedPosition[] = ['2026-07-31', '2026-08-07', '2026-08-14', '2026-08-21'].flatMap((f, i) => [
  wk(f, { symbol: 'MSFT', type: 'put', targetDelta: 0.05, lots: 10, entrySpot: [553.0, 540.5, 526.0, 519.0][i]!, outcome: 'expired', realisedPnl: 'credit', isDeviation: false }),
  wk(f, { symbol: 'NVDA', type: 'put', targetDelta: 0.05, lots: 3, entrySpot: [206, 208, 211, 213][i]!, outcome: 'expired', realisedPnl: 'credit', isDeviation: false }),
])

/* --- The named catastrophes. --- */
const namedRows: SeedPosition[] = [
  // The META roll: a stop became a rescue became −$9,812.
  {
    symbol: 'META', type: 'call', strike: 545, openedAt: '2026-05-15', expiry: '2026-05-22',
    lots: 6, entrySpot: 530, outcome: 'closed_early', realisedPnl: -9812, isDeviation: true,
    deviation: {
      ruleBroken: 'rescue_roll',
      ruleSaid: 'E2: short call at 3× credit closes the same session. No roll.',
      actionTaken: 'Rolled the loser instead of taking the stop. (Also 6 lots against 547 shares — 53 shares naked.)',
      reason: 'Seeded from the 2026 record — the META roll.',
      outcomeUsd: -9812,
    },
  },
  // SNOW: two in-character trades and one novelty outlier.
  { symbol: 'SNOW', type: 'put', strike: 130, openedAt: '2026-04-10', expiry: '2026-04-17', lots: 1, entrySpot: 145, outcome: 'expired', realisedPnl: 140, isDeviation: false },
  { symbol: 'SNOW', type: 'put', strike: 135, openedAt: '2026-05-08', expiry: '2026-05-15', lots: 1, entrySpot: 150, outcome: 'expired', realisedPnl: 184, isDeviation: false },
  {
    symbol: 'SNOW', type: 'put', strike: 190, openedAt: '2026-07-17', expiry: '2026-07-31',
    lots: 1, entrySpot: 196, outcome: 'closed_early', realisedPnl: -2774, isDeviation: true,
    deviation: {
      ruleBroken: 'novelty',
      ruleSaid: 'Trade the universe. Credit far outside a name’s band is a warning, not a gift.',
      actionTaken: 'Sold a SNOW put for $2,799/contract when the name’s other two paid $140 and $184.',
      reason: 'Seeded from the 2026 record — the SNOW credit outlier.',
      outcomeUsd: -2774,
    },
  },
  // Three GLD short calls — outside the process; dollar outcomes pending entry.
  ...(['2026-02-06', '2026-02-20', '2026-03-06'] as const).map((f, i): SeedPosition => ({
    symbol: 'GLD', type: 'call', strike: [400, 420, 465][i]!, openedAt: f, expiry: fridayPlus7(f),
    lots: 1, entrySpot: [392, 412, 455][i]!, outcome: 'closed_early', realisedPnl: null, isDeviation: true,
    deviation: {
      ruleBroken: 'blocked_name',
      ruleSaid: 'GLD is outside the process.',
      actionTaken: 'Sold a GLD call.',
      reason: 'Seeded from the 2026 record — outcome to be entered.',
      outcomeUsd: null,
    },
  })),
]

export const SEED_POSITIONS: SeedPosition[] = [
  ...msftJanMarCalls,
  ...msftJanMarPuts,
  ...junJulWrites,
  ...augustDrift,
  ...augustCompliant,
  ...namedRows,
]

/** Weeks 1–35 of 2026: 32 written, 3 missed. Which three were missed is not
    in the brief; these placeholders carry the count and are flagged seeded. */
export const MISSED_WEEK_NUMBERS = [202607, 202619, 202630]
export const SEEDED_WEEK_COUNT = 35

/** Provisional 28-Aug valuation reads — two inputs each, so the gate stays at
    Both sides; the read is information, not a gate. */
export const SEED_VALUATIONS: {
  symbol: string
  v1: number | null
  v2: number | null
  v4: number | null
}[] = [
  { symbol: 'MSFT', v1: 0.8, v2: 0.03, v4: null }, // the most expensive thing in the book
  { symbol: 'META', v1: 0.21, v2: 0.22, v4: null }, // the cheapest — 27% below its high
  { symbol: 'GOOG', v1: 0.55, v2: 0.08, v4: null },
  { symbol: 'NVDA', v1: 0.58, v2: 0.05, v4: null },
  { symbol: 'MU', v1: 0.52, v2: 0.02, v4: null },
  { symbol: 'NOW', v1: 0.44, v2: 0.09, v4: null },
  { symbol: 'UNH', v1: 0.47, v2: 0.06, v4: null },
  { symbol: 'OWL', v1: 0.4, v2: null, v4: 0.05 }, // yield vs own median is the primary input here
]
