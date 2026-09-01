/*
  State WRITE — the guided Friday sequence. Steps cannot be skipped and the
  completion (or the miss) is recorded. Tickets are GENERATED from the rules,
  never composed: valuation picks the side, delta picks the strike.
*/
import { and, eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { activeUniverse, latestPrices, latestValuation, modelTicket, volFor } from './data'
import { solveStrikeForDelta } from './options'
import { deltaTargetFor, gateFromBand, type Band, type Gate } from './valuation'
import { checkCallCoverage } from './limits'
import { daysBetween, fridayOfCurrentWeek, weekNumberForFriday } from './week'

export const WRITE_STEPS = ['closeout', 'direction', 'tickets', 'limits', 'done'] as const
export type WriteStep = (typeof WRITE_STEPS)[number]

export async function ensureWeekRow(now: Date) {
  const db = await getDb()
  const friday = fridayOfCurrentWeek(now)
  const weekNumber = weekNumberForFriday(friday)
  const existing = await db.select().from(schema.weeks).where(eq(schema.weeks.weekNumber, weekNumber))
  if (existing[0]) return existing[0]
  const inserted = await db
    .insert(schema.weeks)
    .values({ weekNumber, fridayDate: friday, progress: {} })
    .returning()
  return inserted[0]!
}

export interface DirectionRow {
  symbol: string
  band: Band | null
  gate: Gate
  insufficient: boolean
  provisionalBand: Band | null
  inputsPopulated: number
}

/** Step 2 — the valuation gate states the side for each live name. */
export async function directionRows(): Promise<DirectionRow[]> {
  const universe = await activeUniverse()
  const rows: DirectionRow[] = []
  for (const t of universe) {
    if (t.symbol === 'OWL') continue // OWL is the §6 sleeve, not a weekly name
    const v = await latestValuation(t.symbol)
    const band = (v?.band as Band | null) ?? null
    const insufficient = (v?.inputsPopulated ?? 0) < 3
    rows.push({
      symbol: t.symbol,
      band: insufficient ? null : band,
      gate: insufficient ? 'both' : gateFromBand(band),
      insufficient,
      provisionalBand: v?.provisional ? band : null,
      inputsPopulated: v?.inputsPopulated ?? 0,
    })
  }
  return rows
}

/**
 * Step 3 — generate the tickets for this week. Idempotent: existing proposed/
 * approved tickets for the week are returned untouched.
 */
export async function generateTickets(now: Date): Promise<void> {
  const db = await getDb()
  const week = await ensureWeekRow(now)
  const existing = await db.select().from(schema.tickets).where(eq(schema.tickets.weekId, week.id))
  if (existing.length > 0) return

  const prices = await latestPrices()
  const universe = await activeUniverse()
  const directions = await directionRows()
  const gateBy = new Map(directions.map((d) => [d.symbol, d]))
  const friday = fridayOfCurrentWeek(now)
  // Weekly tenor: the following Friday.
  const expiry = new Date(Date.parse(friday + 'T00:00:00Z') + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10)

  for (const t of universe) {
    if (t.symbol === 'OWL') continue
    const info = prices.get(t.symbol)
    if (!info || info.stale || info.needsReview) continue // never write against a stale price
    const dir = gateBy.get(t.symbol)
    const gate: Gate = dir?.gate ?? 'both'
    const vol = await volFor(t.symbol)

    const sides: ('call' | 'put')[] = []
    if (t.allowsCalls && t.callLot && gate !== 'puts_only') sides.push('call')
    if (t.allowsPuts && t.putLot && gate !== 'calls_only') sides.push('put')

    for (const side of sides) {
      const lots = side === 'call' ? t.callLot! : t.putLot!
      const target = deltaTargetFor(dir?.band ?? null, side)
      const strike = solveStrikeForDelta(
        info.close,
        Math.max(1, daysBetween(friday, expiry)) / 365,
        vol.blended,
        side,
        target,
        t.strikeIncrement ?? 2.5,
      )
      const figures = await modelTicket(t.symbol, side, info.close, strike, expiry, friday)
      await db.insert(schema.tickets).values({
        weekId: week.id,
        symbol: t.symbol,
        type: side,
        strike,
        expiry,
        lots,
        modelledCredit: figures.creditPerContract,
        modelledDelta: figures.delta,
        baseRate: figures.baseRate?.rate ?? null,
        baseRateWindows: figures.baseRate?.windows ?? null,
        disagreementFlag: figures.disagrees,
        status: 'proposed',
      })
    }
  }
}

export interface TicketView {
  id: number
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  lots: number
  modelledCredit: number
  modelledDelta: number
  baseRate: number | null
  baseRateWindows: number | null
  disagreementFlag: boolean
  status: string
  declineReason: string | null
  coverage: ReturnType<typeof checkCallCoverage> | null
  obligation: number
  premortem: string
}

export async function ticketsForWeek(weekId: number): Promise<TicketView[]> {
  const db = await getDb()
  const rows = await db.select().from(schema.tickets).where(eq(schema.tickets.weekId, weekId))
  const prices = await latestPrices()
  const holdings = await db.select().from(schema.holdings)
  const holdingBy = new Map(holdings.map((h) => [h.symbol, h]))

  return rows.map((t) => {
    const spot = prices.get(t.symbol)?.close ?? 0
    const movePct = spot > 0 ? Math.abs(t.strike / spot - 1) : 0
    const dte = daysBetween(new Date().toISOString().slice(0, 10), t.expiry)
    const dirWord = t.type === 'call' ? 'above' : 'below'
    const premortem =
      `Loses if ${t.symbol} closes ${dirWord} $${t.strike.toFixed(2)} — a ${(movePct * 100).toFixed(1)}% move in ${dte} days. ` +
      `Modelled delta says ${(Math.abs(t.modelledDelta) * 100).toFixed(1)}% chance.` +
      (t.baseRate != null && t.baseRateWindows != null
        ? ` In the last ${t.baseRateWindows} overlapping windows this move happened ${Math.round(t.baseRate * t.baseRateWindows)} times (${(t.baseRate * 100).toFixed(1)}%).`
        : ' No usable price history yet for a base rate.')
    return {
      id: t.id,
      symbol: t.symbol,
      type: t.type as 'call' | 'put',
      strike: t.strike,
      expiry: t.expiry,
      lots: t.lots,
      modelledCredit: t.modelledCredit,
      modelledDelta: t.modelledDelta,
      baseRate: t.baseRate,
      baseRateWindows: t.baseRateWindows,
      disagreementFlag: t.disagreementFlag,
      status: t.status,
      declineReason: t.declineReason,
      coverage:
        t.type === 'call'
          ? checkCallCoverage(t.symbol, holdingBy.get(t.symbol)?.shares ?? 0, t.lots)
          : null,
      obligation: t.type === 'put' ? t.strike * t.lots * 100 : 0,
      premortem,
    }
  })
}

/** Positions expiring this Friday — step 1's close-out list. */
export async function expiringPositions(now: Date) {
  const db = await getDb()
  const friday = fridayOfCurrentWeek(now)
  return db
    .select()
    .from(schema.positions)
    .where(and(eq(schema.positions.expiry, friday)))
    .then((rows) => rows.filter((r) => r.closedAt == null))
}

export async function setStepDone(weekId: number, step: WriteStep): Promise<void> {
  const db = await getDb()
  const rows = await db.select().from(schema.weeks).where(eq(schema.weeks.id, weekId))
  const week = rows[0]
  if (!week) return
  const progress = { ...(week.progress ?? {}), [step]: true }
  await db.update(schema.weeks).set({ progress }).where(eq(schema.weeks.id, weekId))
}

/** A step is reachable only when every earlier step is done — no skipping. */
export function firstOpenStep(progress: Record<string, boolean>): WriteStep {
  for (const s of WRITE_STEPS) if (!progress[s]) return s
  return 'done'
}

export async function completeWeek(weekId: number): Promise<{ tickets: number; credit: number }> {
  const db = await getDb()
  const approved = await db
    .select()
    .from(schema.tickets)
    .where(and(eq(schema.tickets.weekId, weekId), eq(schema.tickets.status, 'approved')))
  const credit = approved.reduce((s, t) => s + t.modelledCredit * t.lots, 0)
  await db
    .update(schema.weeks)
    .set({ completedAt: new Date(), ticketsWritten: approved.length, credit, missed: false })
    .where(eq(schema.weeks.id, weekId))
  return { tickets: approved.length, credit }
}
