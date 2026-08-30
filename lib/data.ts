/*
  Server-side data access. Pages and actions read through here; deterministic
  code in lib/* computes every number that comes out.
*/
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import { blendVol, type VolBlend } from './vol'
import { baseRateBreach, bsDelta, bsPrice, type BaseRateResult, type OptionType } from './options'
import { daysBetween } from './week'

export interface PriceInfo {
  close: number
  date: string
  stale: boolean
  needsReview: boolean
  seeded: boolean // no grounded source URL yet
}

export async function latestPrices(): Promise<Map<string, PriceInfo>> {
  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.prices)
    .orderBy(asc(schema.prices.symbol), desc(schema.prices.date))
  const out = new Map<string, PriceInfo>()
  for (const r of rows) {
    if (!out.has(r.symbol)) {
      out.set(r.symbol, {
        close: r.close,
        date: r.date,
        stale: r.stale,
        needsReview: r.needsReview,
        seeded: r.sourceUrl == null,
      })
    }
  }
  return out
}

/** Ascending closes for a symbol (oldest first). */
export async function closesFor(symbol: string, limit = 260): Promise<number[]> {
  const db = await getDb()
  const rows = await db
    .select({ close: schema.prices.close, date: schema.prices.date })
    .from(schema.prices)
    .where(eq(schema.prices.symbol, symbol))
    .orderBy(desc(schema.prices.date))
    .limit(limit)
  return rows.reverse().map((r) => r.close)
}

/** Closes that came from a grounded fetch (not seeded) — the only ones realized vol may use. */
export async function groundedClosesFor(symbol: string, limit = 260): Promise<number[]> {
  const db = await getDb()
  const rows = await db
    .select({ close: schema.prices.close, sourceUrl: schema.prices.sourceUrl })
    .from(schema.prices)
    .where(eq(schema.prices.symbol, symbol))
    .orderBy(desc(schema.prices.date))
    .limit(limit)
  return rows
    .reverse()
    .filter((r) => r.sourceUrl != null)
    .map((r) => r.close)
}

export async function tickerBySymbol(symbol: string) {
  const db = await getDb()
  const rows = await db.select().from(schema.tickers).where(eq(schema.tickers.symbol, symbol))
  return rows[0] ?? null
}

export async function activeUniverse() {
  const db = await getDb()
  return db
    .select()
    .from(schema.tickers)
    .where(and(eq(schema.tickers.group, 'universe'), eq(schema.tickers.active, true)))
    .orderBy(asc(schema.tickers.symbol))
}

export async function allHoldings() {
  const db = await getDb()
  return db.select().from(schema.holdings).orderBy(asc(schema.holdings.symbol))
}

export async function openPositions() {
  const db = await getDb()
  return db
    .select()
    .from(schema.positions)
    .where(isNull(schema.positions.closedAt))
    .orderBy(asc(schema.positions.expiry))
}

export async function latestValuation(symbol: string) {
  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.valuations)
    .where(eq(schema.valuations.symbol, symbol))
    .orderBy(desc(schema.valuations.snapshotAt))
    .limit(1)
  return rows[0] ?? null
}

export async function latestHypothesis(symbol: string) {
  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.hypothesisChecks)
    .where(eq(schema.hypothesisChecks.symbol, symbol))
    .orderBy(desc(schema.hypothesisChecks.checkedAt))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Volatility for a symbol: latest stored estimate, else blend on the fly.
 * Realized leg uses only grounded closes; the calibrated leg falls back to the
 * seed IV (itself solved from his fills).
 */
export async function volFor(symbol: string): Promise<VolBlend & { asOf: Date | null }> {
  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.volEstimates)
    .where(eq(schema.volEstimates.symbol, symbol))
    .orderBy(desc(schema.volEstimates.asOf))
    .limit(1)
  const stored = rows[0]
  if (stored) {
    return {
      realized21d: stored.realized21d,
      calibratedIv: stored.calibratedIv,
      calibrationFills: stored.calibrationFills,
      blended: stored.blended,
      source: stored.source as VolBlend['source'],
      asOf: stored.asOf,
    }
  }
  const ticker = await tickerBySymbol(symbol)
  const grounded = await groundedClosesFor(symbol)
  return { ...blendVol(grounded, [], ticker?.seedIv ?? null), asOf: null }
}

/** Recompute and store the vol blend for a symbol from grounded closes + recent logged fills. */
export async function recalcVol(symbol: string): Promise<void> {
  const db = await getDb()
  const ticker = await tickerBySymbol(symbol)
  const grounded = await groundedClosesFor(symbol)
  const fills = await db
    .select()
    .from(schema.positions)
    .where(and(eq(schema.positions.symbol, symbol), eq(schema.positions.seeded, false)))
    .orderBy(desc(schema.positions.openedAt))
    .limit(5)
  const calInputs = fills
    .filter((f) => f.entrySpot != null && f.entrySpot > 0 && f.creditPerContract > 0)
    .map((f) => ({
      spot: f.entrySpot!,
      strike: f.strike,
      T: Math.max(1, daysBetween(f.openedAt.toISOString().slice(0, 10), f.expiry)) / 365,
      type: f.type as OptionType,
      pricePerShare: f.creditPerContract / 100,
    }))
  const blend = blendVol(grounded, calInputs, ticker?.seedIv ?? null)
  await db.insert(schema.volEstimates).values({
    symbol,
    realized21d: blend.realized21d,
    calibratedIv: blend.calibratedIv,
    calibrationFills: blend.calibrationFills,
    blended: blend.blended,
    source: blend.source,
  })
}

export interface ModelledTicketFigures {
  strike: number
  delta: number
  creditPerContract: number
  breakRequiredPct: number
  baseRate: BaseRateResult | null
  disagrees: boolean
}

/** Deterministic pre-mortem figures for a proposed write. */
export async function modelTicket(
  symbol: string,
  type: OptionType,
  spot: number,
  strike: number,
  expiryIso: string,
  todayIso: string,
): Promise<ModelledTicketFigures> {
  const vol = await volFor(symbol)
  const T = Math.max(1, daysBetween(todayIso, expiryIso)) / 365
  const delta = bsDelta(spot, strike, T, vol.blended, type)
  const credit = bsPrice(spot, strike, T, vol.blended, type) * 100
  const movePct = Math.abs(strike / spot - 1)
  const closes = await closesFor(symbol)
  const horizon = Math.max(2, Math.min(10, Math.round(daysBetween(todayIso, expiryIso) * (5 / 7))))
  const baseRate = closes.length >= horizon + 10 ? baseRateBreach(closes, horizon, movePct, type) : null
  const { modelDisagrees } = await import('./options')
  return {
    strike,
    delta,
    creditPerContract: credit,
    breakRequiredPct: movePct,
    baseRate,
    disagrees: baseRate ? modelDisagrees(delta, baseRate) : false,
  }
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDb()
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, key))
  return (rows[0]?.value as T | undefined) ?? null
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } })
}

/** True when the tickers table is empty — the empty database onboards, it doesn't crash. */
export async function isDatabaseEmpty(): Promise<boolean> {
  const db = await getDb()
  const rows = await db.select({ symbol: schema.tickers.symbol }).from(schema.tickers).limit(1)
  return rows.length === 0
}
