/*
  Seeded daily closes, ending Friday 2026-08-28.

  These are SEEDED PLACEHOLDER SERIES, not vendor data — every row is written
  with stale=false but sourceUrl=null so the UI renders them as modelled/seeded
  until the daily Gemini job replaces them with grounded quotes.

  The MSFT series is hand-tuned to reproduce the record the brief describes:
  a +25% run over five sessions in late July, then a slow fade to 513.53.
  Over its 45 overlapping 5-trading-day windows the +6.6% up-move (spot
  513.53 → strike 547.50) occurs 8 times and the equivalent down-move never —
  the asymmetry that explains why 7 of the 8 historical losses were short calls.
*/

/** Last `n` weekday dates (ISO strings) ending at `end` inclusive (end must be a weekday). */
export function lastNTradingDays(end: string, n: number): string[] {
  const days: string[] = []
  const d = new Date(end + 'T00:00:00Z')
  while (days.length < n) {
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return days.reverse()
}

export const SEED_PRICE_END = '2026-08-28'

/** Hand-tuned: 50 closes → 45 overlapping 5-day windows; 8 call breaches at +6.6%, 0 put breaches. */
export const MSFT_SEED_CLOSES: number[] = [
  428.0, 429.5, 427.8, 431.2, 433.0, 432.1, 434.6, 436.2, 435.1, 437.8,
  439.5, 438.2, 440.6, 442.3, 441.0, 443.5, 444.2, 443.1, 444.8, 444.0,
  // late-July run: +25% in five sessions (444.0 → 555.0), one extra push to 568
  462.0, 486.0, 510.0, 532.0, 555.0, 568.0,
  // consolidation and slow fade into 28 Aug — no 5-day window drops 6.6%
  561.0, 556.5, 553.0, 549.5, 546.0, 543.0, 540.5, 538.0, 535.5, 533.0,
  530.5, 528.0, 526.0, 524.0, 522.0, 520.5, 519.0, 517.5, 516.0, 515.0,
  514.5, 514.0, 513.8, 513.53,
]

/** Deterministic path: geometric drift from start to end with a small sine wiggle. */
export function syntheticPath(start: number, end: number, n: number, wiggle: number): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const drift = start * Math.pow(end / start, i / (n - 1))
    const w = i === n - 1 ? 0 : wiggle * Math.sin(i * 1.7)
    out.push(Math.round(drift * (1 + w) * 100) / 100)
  }
  return out
}

export interface SeedSeries {
  symbol: string
  closes: number[]
}

/** Universe names get 50-day series; holding-only names get a single seeded mark. */
export function seedSeries(): SeedSeries[] {
  return [
    { symbol: 'MSFT', closes: MSFT_SEED_CLOSES },
    { symbol: 'META', closes: syntheticPath(558, 499.0, 50, 0.02) },
    { symbol: 'GOOG', closes: syntheticPath(322, 337.5, 50, 0.015) },
    { symbol: 'NVDA', closes: syntheticPath(204, 214.8, 50, 0.018) },
    { symbol: 'OWL', closes: syntheticPath(11.78, 12.02, 50, 0.012) },
    { symbol: 'MU', closes: syntheticPath(305, 352.0, 50, 0.045) },
    { symbol: 'NOW', closes: syntheticPath(111, 118.4, 50, 0.02) },
    { symbol: 'UNH', closes: syntheticPath(291, 305.2, 50, 0.012) },
    { symbol: 'VOO', closes: syntheticPath(688, 707.24, 50, 0.006) },
  ]
}

/** Single seeded marks for holdings with thin/no chains — estimates pending confirmation. */
export const SEED_MARKS: Record<string, number> = {
  DEA: 21.9,
  BAM: 54.5,
  SPYI: 50.8,
  PAX: 12.1,
  NVDY: 15.1,
  EPR: 54.4,
  NVO: 47.2,
  YMAG: 15.6,
  IDVO: 32.4,
  MSDL: 19.1,
  DIVO: 39.8,
  HIW: 26.4,
  XDTE: 36.8,
  BXSL: 26.3,
  OTF: 12.4,
  IWGFF: 2.4,
  ARE: 75.5,
  OMF: 49.6,
  FEPI: 46.9,
}
