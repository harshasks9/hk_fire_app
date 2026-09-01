/*
  The whole app is one loop with three states. This module decides which one
  the home screen shows and assembles everything it needs.

  EXIT  — an exit rule fired: one instruction, one button, nothing else.
  WRITE — Friday, sequence not yet completed: the guided checklist.
  HOLD  — Monday–Thursday (and a completed Friday): "Nothing to do."
*/
import { and, desc, eq, gte, isNotNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import {
  activeUniverse,
  allHoldings,
  isDatabaseEmpty,
  latestHypothesis,
  latestPrices,
  openPositions,
  volFor,
  type PriceInfo,
} from './data'
import { evaluatePosition, urgentSignal, type ExitSignal, type PositionStatus } from './exits'
import { checkLimits, type HoldingLite, type LimitCheck } from './limits'
import {
  cadenceComponent,
  capacityComponent,
  disciplineScore,
  ruleComponent,
  stopComponent,
  type DisciplineScore,
} from './discipline'
import { fridayOfCurrentWeek, isFridayNY, nyParts, weekNumberForFriday } from './week'

export interface HomeState {
  kind: 'EXIT' | 'WRITE' | 'HOLD' | 'EMPTY'
  todayNy: string
  urgent: ExitSignal | null
  statuses: PositionStatus[]
  limits: LimitCheck[]
  l4Detail: string | null
  discipline: DisciplineScore
  week: { number: number; friday: string; completed: boolean; isFriday: boolean }
  writingPaused: boolean
  unloggedTickets: { id: number; label: string; approvedAt: string }[]
  staleSymbols: string[]
  unconfirmedHoldings: number
  equity: number
}

export async function holdingsWithMarks(prices: Map<string, PriceInfo>): Promise<(HoldingLite & { confirmed: boolean; annualDividend: number; assetClass: string })[]> {
  const holdings = await allHoldings()
  return holdings.map((h) => ({
    symbol: h.symbol,
    shares: h.shares,
    mark: prices.get(h.symbol)?.close ?? h.avgPrice ?? 0,
    confirmed: h.confirmed,
    annualDividend: h.annualDividend,
    assetClass: h.assetClass,
  }))
}

async function e2StopsThisWeek(todayNy: string): Promise<number> {
  const db = await getDb()
  const friday = fridayOfCurrentWeek(new Date())
  const weekStart = new Date(Date.parse(friday + 'T00:00:00Z') - 6 * 86_400_000)
  const rows = await db
    .select()
    .from(schema.positions)
    .where(
      and(
        eq(schema.positions.outcome, 'stopped'),
        isNotNull(schema.positions.closedAt),
        gte(schema.positions.closedAt, weekStart),
      ),
    )
  return rows.length
}

async function computeDiscipline(): Promise<DisciplineScore> {
  const db = await getDb()
  const weeks = await db.select().from(schema.weeks)
  const positions = await db
    .select({
      entryDelta: schema.positions.entryDelta,
      openedAt: schema.positions.openedAt,
      type: schema.positions.type,
    })
    .from(schema.positions)

  // Stop component: E2 alerts vs same-NY-day closes of their positions.
  const e2Alerts = await db.select().from(schema.alerts).where(eq(schema.alerts.rule, 'E2'))
  const stopEvents = await Promise.all(
    e2Alerts
      .filter((a) => a.positionId != null)
      .map(async (a) => {
        const pos = await db
          .select()
          .from(schema.positions)
          .where(eq(schema.positions.id, a.positionId!))
        const p = pos[0]
        const taken =
          p?.closedAt != null &&
          nyParts(p.closedAt).iso === nyParts(a.createdAt).iso &&
          p.outcome === 'stopped'
        return { triggeredAt: a.createdAt, takenSameSession: Boolean(taken) }
      }),
  )

  // Capacity: coverable shares (holdings with a usable chain) vs shares covered by open calls.
  const prices = await latestPrices()
  const tickers = await db.select().from(schema.tickers)
  const chainBy = new Map(tickers.map((t) => [t.symbol, t.chainLiquidity]))
  const holdings = await holdingsWithMarks(prices)
  const open = await openPositions()
  const coveredBy = new Map<string, number>()
  for (const p of open) {
    if (p.type === 'call') coveredBy.set(p.symbol, (coveredBy.get(p.symbol) ?? 0) + p.lots * 100)
  }
  let coverable = 0
  let covered = 0
  for (const h of holdings) {
    if ((chainBy.get(h.symbol) ?? 'none') === 'none') continue
    const c = Math.floor(h.shares / 100) * 100
    coverable += c
    covered += Math.min(c, coveredBy.get(h.symbol) ?? 0)
  }

  return disciplineScore([
    cadenceComponent(weeks.map((w) => ({ weekNumber: w.weekNumber, completedAt: w.completedAt, missed: w.missed }))),
    ruleComponent(
      positions
        .filter((p) => p.entryDelta != null)
        .map((p) => ({ entryDelta: p.entryDelta, openedAt: p.openedAt, type: p.type as 'call' | 'put' })),
    ),
    stopComponent(stopEvents),
    capacityComponent(covered, coverable),
  ])
}

export async function getHomeState(): Promise<HomeState> {
  const now = new Date()
  const todayNy = nyParts(now).iso
  const db = await getDb()

  if (await isDatabaseEmpty()) {
    return {
      kind: 'EMPTY',
      todayNy,
      urgent: null,
      statuses: [],
      limits: [],
      l4Detail: null,
      discipline: disciplineScore([]),
      week: { number: 0, friday: '', completed: false, isFriday: false },
      writingPaused: false,
      unloggedTickets: [],
      staleSymbols: [],
      unconfirmedHoldings: 0,
      equity: 0,
    }
  }

  const prices = await latestPrices()
  const open = await openPositions()

  // Evaluate every open position against the exit rules.
  const statuses: PositionStatus[] = []
  for (const p of open) {
    const info = prices.get(p.symbol)
    const vol = await volFor(p.symbol)
    const hyp = await latestHypothesis(p.symbol)
    statuses.push(
      evaluatePosition(
        {
          id: p.id,
          symbol: p.symbol,
          type: p.type as 'call' | 'put',
          strike: p.strike,
          expiry: p.expiry,
          lots: p.lots,
          creditPerContract: p.creditPerContract,
          entryDelta: p.entryDelta,
          hypothesisVerdict: (hyp?.verdict as 'intact' | 'watch' | 'broken' | undefined) ?? null,
        },
        info?.close ?? null,
        vol.blended,
        todayNy,
        info?.stale ?? true,
      ),
    )
  }
  const urgent = urgentSignal(statuses)

  const holdings = await holdingsWithMarks(prices)
  const stops = await e2StopsThisWeek(todayNy)
  const limits = checkLimits(
    open.map((p) => ({ symbol: p.symbol, type: p.type as 'call' | 'put', strike: p.strike, lots: p.lots })),
    holdings,
    stops,
  )
  const l4 = limits.find((l) => l.id === 'L4')
  const equity = holdings.reduce((s, h) => s + h.shares * h.mark, 0)

  const friday = fridayOfCurrentWeek(now)
  const weekNumber = weekNumberForFriday(friday)
  const weekRows = await db.select().from(schema.weeks).where(eq(schema.weeks.weekNumber, weekNumber))
  const weekRow = weekRows[0]
  const weekCompleted = weekRow?.completedAt != null

  // Approved tickets with no logged fill after two sessions nag on HOLD.
  const nagTickets = await db
    .select()
    .from(schema.tickets)
    .where(and(eq(schema.tickets.status, 'approved'), gte(schema.tickets.sessionsSinceApproval, 2)))
    .orderBy(desc(schema.tickets.approvedAt))
  const unloggedTickets = nagTickets.map((t) => ({
    id: t.id,
    label: `${t.symbol} ${t.strike}${t.type === 'call' ? 'C' : 'P'} ×${t.lots}`,
    approvedAt: t.approvedAt?.toISOString().slice(0, 10) ?? '',
  }))

  const staleSymbols = [...prices.entries()].filter(([, v]) => v.stale).map(([k]) => k)
  const unconfirmed = (await allHoldings()).filter((h) => !h.confirmed).length
  const discipline = await computeDiscipline()
  const writingPaused = !(limits.find((l) => l.id === 'L8')?.ok ?? true)

  const isFri = isFridayNY(now)
  let kind: HomeState['kind'] = 'HOLD'
  if (urgent) kind = 'EXIT'
  else if (isFri && !weekCompleted) kind = 'WRITE'

  return {
    kind,
    todayNy,
    urgent,
    statuses,
    limits,
    l4Detail: l4 && !l4.ok ? l4.detail : null,
    discipline,
    week: { number: weekNumber, friday, completed: weekCompleted, isFriday: isFri },
    writingPaused,
    unloggedTickets,
    staleSymbols,
    unconfirmedHoldings: unconfirmed,
    equity,
  }
}
