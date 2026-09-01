/*
  Seed runner. Idempotent: refuses to run over a non-empty database unless
  force is set (which wipes and reseeds). Callable from the CLI script and
  from the onboarding screen's server action, so a fresh production database
  can be populated without ever handling the connection string by hand.

  Everything numeric here is computed by lib/options — strikes solved from
  deltas, credits from Black-Scholes at the seeded closes and calibrated IVs.
*/
import { eq } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { bsDelta, bsPrice, solveStrikeForDelta } from '../options'
import { computeValuation, provisionalRead } from '../valuation'
import { daysBetween, fridayForWeekNumber } from '../week'
import { owlExpiry, OWL_SLEEVE_DEFAULTS } from '../owl'
import { TICKER_SEEDS, HOLDING_SEEDS, BASELINE_2026 } from './universe'
import { lastNTradingDays, SEED_MARKS, SEED_PRICE_END, seedSeries } from './prices'
import { MISSED_WEEK_NUMBERS, SEED_POSITIONS, SEED_VALUATIONS, SEEDED_WEEK_COUNT } from './record'

const IV: Record<string, number> = Object.fromEntries(
  TICKER_SEEDS.filter((t) => t.seedIv != null).map((t) => [t.symbol, t.seedIv!]),
)
const INC: Record<string, number> = Object.fromEntries(
  TICKER_SEEDS.filter((t) => t.strikeIncrement != null).map((t) => [t.symbol, t.strikeIncrement!]),
)

export interface SeedResult {
  ok: boolean
  lines: string[]
}

export async function runSeed(opts: { force?: boolean } = {}): Promise<SeedResult> {
  const db = await getDb()
  const lines: string[] = []
  const log = (s: string) => {
    lines.push(s)
    console.log(s)
  }

  const existing = await db.select({ s: schema.tickers.symbol }).from(schema.tickers).limit(1)
  if (existing.length > 0) {
    if (!opts.force) {
      log('Database is not empty — refusing to seed. Set FORCE_RESEED=1 to wipe and reseed.')
      return { ok: false, lines }
    }
    log('force — wiping…')
    await db.delete(schema.aiCalls)
    await db.delete(schema.alerts)
    await db.delete(schema.deviations)
    await db.delete(schema.tickets)
    await db.delete(schema.hypothesisChecks)
    await db.delete(schema.positions)
    await db.delete(schema.weeks)
    await db.delete(schema.valuations)
    await db.delete(schema.volEstimates)
    await db.delete(schema.prices)
    await db.delete(schema.holdings)
    await db.delete(schema.settings)
    await db.delete(schema.tickers)
  }

  /* Universe + holdings */
  await db.insert(schema.tickers).values(TICKER_SEEDS)
  await db.insert(schema.holdings).values(
    HOLDING_SEEDS.map((h) => ({
      symbol: h.symbol,
      shares: h.shares,
      avgPrice: h.avgPrice,
      assetClass: h.assetClass,
      taxFreeShares: 0,
      taxedShares: h.shares, // split unknown until confirmed in first-run flow
      annualDividend: h.annualDividend,
      confirmed: false, // all share counts unverified — badge until confirmed
    })),
  )
  log(`tickers: ${TICKER_SEEDS.length}, holdings: ${HOLDING_SEEDS.length}`)

  /* Prices: 50-day seeded series for chain names, single marks for the rest. */
  const days = lastNTradingDays(SEED_PRICE_END, 50)
  const priceRows: (typeof schema.prices.$inferInsert)[] = []
  for (const s of seedSeries()) {
    s.closes.forEach((close, i) =>
      priceRows.push({ symbol: s.symbol, date: days[i]!, close, sourceUrl: null, stale: false, needsReview: false }),
    )
  }
  for (const [symbol, close] of Object.entries(SEED_MARKS)) {
    priceRows.push({ symbol, date: SEED_PRICE_END, close, sourceUrl: null, stale: false, needsReview: false })
  }
  await db.insert(schema.prices).values(priceRows)
  log(`prices: ${priceRows.length}`)

  /* Weeks 1–35: 32 written, 3 missed (the misses get deviation rows). */
  for (let n = 202601; n <= 202600 + SEEDED_WEEK_COUNT; n++) {
    const friday = fridayForWeekNumber(n)
    const missed = MISSED_WEEK_NUMBERS.includes(n)
    await db.insert(schema.weeks).values({
      weekNumber: n,
      fridayDate: friday,
      completedAt: missed ? null : new Date(friday + 'T20:00:00Z'),
      missed,
      seeded: true,
      progress: missed ? {} : { closeout: true, direction: true, tickets: true, limits: true, done: true },
    })
    if (missed) {
      await db.insert(schema.deviations).values({
        ruleBroken: 'missed_week',
        ruleSaid: 'Write every available week. The edge is the cadence.',
        actionTaken: `Week ${n - 202600} (Friday ${friday}) passed without the sequence being completed.`,
        reason: 'Seeded from the 2026 baseline: 32 of 35 weeks written.',
        outcomeUsd: null,
        createdAt: new Date(friday + 'T21:00:00Z'),
        seeded: true,
      })
    }
  }
  log(`weeks: ${SEEDED_WEEK_COUNT} (${MISSED_WEEK_NUMBERS.length} missed)`)

  /* Historical positions + their deviation rows. */
  let posCount = 0
  for (const p of SEED_POSITIONS) {
    const iv = IV[p.symbol] ?? 0.35
    const T = Math.max(1, daysBetween(p.openedAt, p.expiry)) / 365
    const strike =
      p.strike ?? solveStrikeForDelta(p.entrySpot, T, iv, p.type, p.targetDelta!, INC[p.symbol] ?? 2.5)
    const delta = bsDelta(p.entrySpot, strike, T, iv, p.type)
    const credit = Math.round(bsPrice(p.entrySpot, strike, T, iv, p.type) * 100 * 100) / 100
    const realised =
      p.realisedPnl === 'credit' ? Math.round(credit * p.lots * 100) / 100 : p.realisedPnl
    const inserted = await db
      .insert(schema.positions)
      .values({
        symbol: p.symbol,
        type: p.type,
        strike,
        expiry: p.expiry,
        lots: p.lots,
        creditPerContract: credit,
        openedAt: new Date(p.openedAt + 'T19:00:00Z'),
        closedAt: new Date(p.expiry + 'T20:00:00Z'),
        outcome: p.outcome,
        realisedPnl: realised,
        entrySpot: p.entrySpot,
        entryDelta: delta,
        entryIv: iv,
        isDeviation: p.isDeviation,
        seeded: true,
      })
      .returning({ id: schema.positions.id })
    posCount++
    if (p.deviation) {
      await db.insert(schema.deviations).values({
        positionId: inserted[0]!.id,
        ...p.deviation,
        createdAt: new Date(p.openedAt + 'T19:00:00Z'),
        seeded: true,
      })
    }
  }
  log(`historical positions: ${posCount}`)

  /* Live open positions — written Friday 2026-08-28 at the 5-delta rule. */
  const writeDay = SEED_PRICE_END
  const expiry = '2026-09-04'
  const lastClose = (sym: string) => seedSeries().find((s) => s.symbol === sym)!.closes.at(-1)!
  const live: { symbol: string; type: 'call' | 'put'; lots: number }[] = [
    { symbol: 'MSFT', type: 'call', lots: 16 },
    { symbol: 'MSFT', type: 'put', lots: 10 },
    { symbol: 'GOOG', type: 'call', lots: 12 },
    { symbol: 'GOOG', type: 'put', lots: 12 },
    { symbol: 'META', type: 'call', lots: 5 },
    { symbol: 'NVDA', type: 'put', lots: 3 },
    { symbol: 'MU', type: 'put', lots: 4 },
  ]
  let weekCredit = 0
  for (const l of live) {
    const spot = lastClose(l.symbol)
    const iv = IV[l.symbol]!
    const T = daysBetween(writeDay, expiry) / 365
    const strike = solveStrikeForDelta(spot, T, iv, l.type, 0.05, INC[l.symbol] ?? 2.5)
    const delta = bsDelta(spot, strike, T, iv, l.type)
    const credit = Math.round(bsPrice(spot, strike, T, iv, l.type) * 100 * 100) / 100
    weekCredit += credit * l.lots
    await db.insert(schema.positions).values({
      symbol: l.symbol,
      type: l.type,
      strike,
      expiry,
      lots: l.lots,
      creditPerContract: credit,
      openedAt: new Date(writeDay + 'T19:00:00Z'),
      outcome: 'open',
      entrySpot: spot,
      entryDelta: delta,
      entryIv: iv,
      seeded: true,
    })
  }

  /* OWL exit sleeve: one live 35-DTE cycle at 17.5 delta. */
  const owlSpot = lastClose('OWL')
  const { expiry: owlExp, dte } = owlExpiry(writeDay, OWL_SLEEVE_DEFAULTS)
  const owlStrike = solveStrikeForDelta(owlSpot, dte / 365, IV.OWL ?? 0.35, 'call', OWL_SLEEVE_DEFAULTS.deltaTarget, 0.5)
  const owlCredit = Math.round(bsPrice(owlSpot, owlStrike, dte / 365, IV.OWL ?? 0.35, 'call') * 100 * 100) / 100
  await db.insert(schema.positions).values({
    symbol: 'OWL',
    type: 'call',
    strike: owlStrike,
    expiry: owlExp,
    lots: OWL_SLEEVE_DEFAULTS.lotsPerCycle,
    creditPerContract: owlCredit,
    openedAt: new Date(writeDay + 'T19:00:00Z'),
    outcome: 'open',
    entrySpot: owlSpot,
    entryDelta: bsDelta(owlSpot, owlStrike, dte / 365, IV.OWL ?? 0.35, 'call'),
    entryIv: IV.OWL ?? 0.35,
    sleeve: 'owl_exit',
    seeded: true,
  })
  log(`live positions: ${live.length + 1} (incl. OWL sleeve ${owlStrike}C ×${OWL_SLEEVE_DEFAULTS.lotsPerCycle})`)

  /* Mark week 35 written with the live book's numbers. */
  await db
    .update(schema.weeks)
    .set({ ticketsWritten: live.length, credit: Math.round(weekCredit) })
    .where(eq(schema.weeks.weekNumber, 202635))

  /* Valuation snapshots — provisional, two inputs, gate stays at Both. */
  for (const v of SEED_VALUATIONS) {
    const inputs = { v1RangePosition: v.v1, v2AnalystUpside: v.v2, v4YieldVsMedian: v.v4 }
    const res = computeValuation(inputs)
    const prov = provisionalRead(inputs)
    await db.insert(schema.valuations).values({
      symbol: v.symbol,
      v1RangePosition: v.v1,
      v2AnalystUpside: v.v2,
      v4YieldVsMedian: v.v4,
      inputsPopulated: res.inputsPopulated,
      composite: res.composite ?? prov?.composite ?? null,
      band: res.band ?? prov?.band ?? null,
      gate: res.gate,
      provisional: res.insufficient,
      snapshotAt: new Date(SEED_PRICE_END + 'T21:00:00Z'),
    })
  }
  log(`valuations: ${SEED_VALUATIONS.length} (provisional)`)

  /* Vol estimates: seed IVs, solved from his own fills. */
  for (const t of TICKER_SEEDS.filter((t) => t.seedIv != null)) {
    await db.insert(schema.volEstimates).values({
      symbol: t.symbol,
      realized21d: null,
      calibratedIv: t.seedIv,
      calibrationFills: 0,
      blended: t.seedIv!,
      source: 'seed',
    })
  }

  /* Settings */
  await db.insert(schema.settings).values([
    { key: 'baseline2026', value: BASELINE_2026 },
    { key: 'owl_sleeve', value: OWL_SLEEVE_DEFAULTS },
    { key: 'onboarding_confirmed', value: false },
  ])

  log('Seed complete.')
  return { ok: true, lines }
}
