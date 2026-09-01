'use server'

/*
  Server actions — the only write paths in the app. Each one is a decision
  the rules already made, being confirmed; overrides are recorded in the
  deviation ledger, not argued with.
*/
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { latestPrices, recalcVol, setSetting, volFor } from './data'
import { bsDelta } from './options'
import { computeValuation, insideDeltaBand } from './valuation'
import { completeWeek, ensureWeekRow, generateTickets, setStepDone } from './write'
import { daysBetween, nyParts } from './week'
import { sendTestAlert } from './whatsapp'
import { runHypothesisCheck, proModeProse, geminiConfigured } from './gemini'

function revalidateAll() {
  for (const p of ['/', '/write', '/log', '/scoreboard', '/deviations', '/positions', '/owl', '/settings', '/valuations']) {
    revalidatePath(p)
  }
}

/* ------------------------------ onboarding ------------------------------- */

/** One-click seed from the onboarding screen. Only ever runs on an empty database. */
export async function seedDatabase(): Promise<void> {
  const { isDatabaseEmpty } = await import('./data')
  if (!(await isDatabaseEmpty())) return
  const { runSeed } = await import('./seed/run')
  await runSeed({})
  revalidateAll()
}

/* ------------------------------- positions ------------------------------- */

/** "Mark as closed" — from the EXIT instruction or a position page. */
export async function closePosition(formData: FormData): Promise<void> {
  const db = await getDb()
  const id = Number(formData.get('positionId'))
  const rule = String(formData.get('rule') ?? '')
  const costRaw = formData.get('closeCostPerContract')
  const closeCost = costRaw != null && String(costRaw).trim() !== '' ? Number(costRaw) : null
  const rows = await db.select().from(schema.positions).where(eq(schema.positions.id, id))
  const p = rows[0]
  if (!p || p.closedAt != null) return

  const outcome = rule === 'E2' ? 'stopped' : rule === 'E3' ? 'assigned' : 'closed_early'
  const realised = closeCost != null ? Math.round((p.creditPerContract - closeCost) * p.lots * 100) / 100 : null
  await db
    .update(schema.positions)
    .set({ closedAt: new Date(), outcome, realisedPnl: realised })
    .where(eq(schema.positions.id, id))
  revalidateAll()
}

/** Log an actual broker fill (form or screenshot-prefilled — always confirmed by a human). */
export async function logFill(formData: FormData): Promise<void> {
  const db = await getDb()
  const symbol = String(formData.get('symbol') ?? '').toUpperCase().trim()
  const type = String(formData.get('type')) === 'put' ? 'put' : 'call'
  const strike = Number(formData.get('strike'))
  const expiry = String(formData.get('expiry') ?? '')
  const lots = Number(formData.get('lots'))
  const credit = Number(formData.get('creditPerContract'))
  const ticketIdRaw = formData.get('ticketId')
  const ticketId = ticketIdRaw ? Number(ticketIdRaw) : null
  if (!symbol || !isFinite(strike) || strike <= 0 || !expiry || !isFinite(lots) || lots <= 0 || !isFinite(credit) || credit <= 0) {
    return
  }

  const prices = await latestPrices()
  const spot = prices.get(symbol)?.close ?? null
  const vol = await volFor(symbol)
  const today = nyParts(new Date()).iso
  const T = Math.max(1, daysBetween(today, expiry)) / 365
  const delta = spot != null ? bsDelta(spot, strike, T, vol.blended, type) : null

  const tickerRows = await db.select().from(schema.tickers).where(eq(schema.tickers.symbol, symbol))
  const ticker = tickerRows[0]

  const inserted = await db
    .insert(schema.positions)
    .values({
      symbol, type, strike, expiry, lots,
      creditPerContract: credit,
      openedAt: new Date(),
      outcome: 'open',
      entrySpot: spot,
      entryDelta: delta,
      entryIv: vol.blended,
      isDeviation: false,
    })
    .returning({ id: schema.positions.id })
  const positionId = inserted[0]!.id

  /* Deviations are detected, recorded, and not argued with. */
  const deviations: { ruleBroken: string; ruleSaid: string; actionTaken: string }[] = []
  if (ticker?.blocked) {
    deviations.push({
      ruleBroken: 'blocked_name',
      ruleSaid: `${symbol} is blocked: ${ticker.blockedReason ?? 'outside the process'}.`,
      actionTaken: `Logged a ${symbol} ${type} fill anyway.`,
    })
  }
  if (ticker && type === 'put' && !ticker.allowsPuts) {
    deviations.push({
      ruleBroken: 'blocked_side',
      ruleSaid: `${symbol} puts are blocked: ${ticker.blockedReason ?? 'side not allowed'}.`,
      actionTaken: `Sold ${symbol} puts.`,
    })
  }
  if (delta != null && !insideDeltaBand(delta) && (ticker?.group === 'universe' || ticker == null)) {
    deviations.push({
      ruleBroken: 'delta_band',
      ruleSaid: 'Write at 3–8 delta.',
      actionTaken: `Filled at ${(Math.abs(delta) * 100).toFixed(0)} delta (modelled at entry).`,
    })
  }
  for (const d of deviations) {
    await db.insert(schema.deviations).values({ positionId, ...d, reason: null, outcomeUsd: null })
  }
  if (deviations.length > 0) {
    await db.update(schema.positions).set({ isDeviation: true }).where(eq(schema.positions.id, positionId))
  }

  if (ticketId != null) {
    await db
      .update(schema.tickets)
      .set({ status: 'logged', positionId })
      .where(eq(schema.tickets.id, ticketId))
  }

  // A real transacted price recalibrates this name's vol — the loop closing.
  try {
    await recalcVol(symbol)
  } catch {
    /* vol recalc is best-effort */
  }
  revalidateAll()
  redirect(`/positions/${positionId}`)
}

/** Step 1 of the sequence: resolve an expiring position with the rule that applies. */
export async function confirmExpiry(formData: FormData): Promise<void> {
  const db = await getDb()
  const id = Number(formData.get('positionId'))
  const rows = await db.select().from(schema.positions).where(eq(schema.positions.id, id))
  const p = rows[0]
  if (!p || p.closedAt != null) return
  const prices = await latestPrices()
  const spot = prices.get(p.symbol)?.close ?? null
  const otm = spot != null ? (p.type === 'call' ? spot < p.strike : spot > p.strike) : null

  const costRaw = formData.get('closeCostPerContract')
  const closeCost = costRaw != null && String(costRaw).trim() !== '' ? Number(costRaw) : null

  let outcome: string
  let realised: number | null
  if (otm !== false) {
    // OTM (or unknown price, human confirmed): expires, full credit kept. Rule E4.
    outcome = 'expired'
    realised = Math.round(p.creditPerContract * p.lots * 100) / 100
  } else if (p.type === 'put') {
    // ITM put: take delivery. Premium kept; share P&L lives in the broker. Rule E3.
    outcome = 'assigned'
    realised = Math.round(p.creditPerContract * p.lots * 100) / 100
  } else {
    outcome = 'closed_early'
    realised = closeCost != null ? Math.round((p.creditPerContract - closeCost) * p.lots * 100) / 100 : null
  }
  await db
    .update(schema.positions)
    .set({ closedAt: new Date(), outcome, realisedPnl: realised })
    .where(eq(schema.positions.id, id))
  revalidatePath('/write')
  revalidatePath('/')
}

/* ---------------------------- write sequence ----------------------------- */

export async function startWriteSequence(): Promise<void> {
  await ensureWeekRow(new Date())
  await generateTickets(new Date())
  revalidatePath('/write')
  redirect('/write')
}

export async function confirmCloseoutStep(formData: FormData): Promise<void> {
  const weekId = Number(formData.get('weekId'))
  await setStepDone(weekId, 'closeout')
  revalidatePath('/write')
}

/** Confirm the gate's side, or override it with a typed reason (a ledger row). */
export async function confirmDirection(formData: FormData): Promise<void> {
  const db = await getDb()
  const symbol = String(formData.get('symbol'))
  const override = String(formData.get('override') ?? '') === '1'
  const reason = String(formData.get('reason') ?? '').trim()
  const gateSaid = String(formData.get('gateSaid') ?? '')
  if (override) {
    if (!reason) return // an override without a typed reason does not exist
    await db.insert(schema.deviations).values({
      ruleBroken: 'gate_override',
      ruleSaid: `Valuation gate for ${symbol}: ${gateSaid}.`,
      actionTaken: `Overrode the gate for this week's ${symbol} tickets.`,
      reason,
      outcomeUsd: null,
    })
  }
  const weekId = Number(formData.get('weekId'))
  const confirmed = ((await getSettingMap(weekId)) ?? {}) as Record<string, boolean>
  confirmed[symbol] = true
  await setSetting(`direction_confirmed_${weekId}`, confirmed)
  revalidatePath('/write')
}

async function getSettingMap(weekId: number): Promise<Record<string, boolean> | null> {
  const { getSetting } = await import('./data')
  return getSetting<Record<string, boolean>>(`direction_confirmed_${weekId}`)
}

export async function completeDirectionStep(formData: FormData): Promise<void> {
  const weekId = Number(formData.get('weekId'))
  await setStepDone(weekId, 'direction')
  revalidatePath('/write')
}

export async function approveTicket(formData: FormData): Promise<void> {
  const db = await getDb()
  const id = Number(formData.get('ticketId'))
  const rows = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id))
  const t = rows[0]
  if (!t || t.status !== 'proposed') return
  // The disagreement flag demands an explicit second confirmation.
  if (t.disagreementFlag && String(formData.get('acceptDisagreement') ?? '') !== '1') return
  await db
    .update(schema.tickets)
    .set({ status: 'approved', approvedAt: new Date(), sessionsSinceApproval: 0 })
    .where(eq(schema.tickets.id, id))
  revalidatePath('/write')
}

export async function declineTicket(formData: FormData): Promise<void> {
  const db = await getDb()
  const id = Number(formData.get('ticketId'))
  const reason = String(formData.get('reason') ?? '').trim() || null
  await db.update(schema.tickets).set({ status: 'declined', declineReason: reason }).where(eq(schema.tickets.id, id))
  revalidatePath('/write')
}

export async function completeTicketsStep(formData: FormData): Promise<void> {
  const db = await getDb()
  const weekId = Number(formData.get('weekId'))
  const open = await db
    .select()
    .from(schema.tickets)
    .where(and(eq(schema.tickets.weekId, weekId), eq(schema.tickets.status, 'proposed')))
  if (open.length > 0) return // every ticket needs a yes or a no
  await setStepDone(weekId, 'tickets')
  revalidatePath('/write')
}

export async function completeLimitsStep(formData: FormData): Promise<void> {
  const weekId = Number(formData.get('weekId'))
  await setStepDone(weekId, 'limits')
  revalidatePath('/write')
}

export async function finishWeek(formData: FormData): Promise<void> {
  const weekId = Number(formData.get('weekId'))
  await completeWeek(weekId)
  await setStepDone(weekId, 'done')
  revalidateAll()
}

/* ------------------------------- valuation ------------------------------- */

/** Map of the plain-language view options to the −1…+1 thesis scale. */
const VIEW_SCALE: Record<string, number> = {
  very_cheap: -0.8,
  cheap: -0.4,
  fair: 0,
  expensive: 0.4,
  very_expensive: 0.8,
}

/**
 * Save a valuation snapshot from plain broker-page numbers (52-week low/high,
 * analyst target, P/E now vs typical, yield now vs typical, own view). The
 * abstract fractions the gate runs on are computed here, never typed by hand.
 */
export async function saveValuation(formData: FormData): Promise<void> {
  const db = await getDb()
  const symbol = String(formData.get('symbol'))
  const num = (k: string): number | null => {
    const v = String(formData.get(k) ?? '').trim()
    if (v === '') return null
    const n = Number(v)
    return isFinite(n) ? n : null
  }

  const raw = {
    low52: num('low52'),
    high52: num('high52'),
    currentPrice: num('currentPrice'),
    targetPrice: num('targetPrice'),
    fwdPe: num('fwdPe'),
    typicalPe: num('typicalPe'),
    yieldNow: num('yieldNow'),
    yieldTypical: num('yieldTypical'),
    view: String(formData.get('view') ?? '').trim(),
    viewWhy: String(formData.get('viewWhy') ?? '').trim(),
  }

  const { latestPrices: lp } = await import('./data')
  const spot = raw.currentPrice ?? (await lp()).get(symbol)?.close ?? null

  const v1 =
    raw.low52 != null && raw.high52 != null && raw.high52 > raw.low52 && spot != null
      ? Math.min(1, Math.max(0, (spot - raw.low52) / (raw.high52 - raw.low52)))
      : null
  const v2 = raw.targetPrice != null && spot != null && spot > 0 ? raw.targetPrice / spot - 1 : null
  const v3 =
    raw.fwdPe != null && raw.typicalPe != null && raw.typicalPe > 0 ? raw.fwdPe / raw.typicalPe - 1 : null
  const v4 =
    raw.yieldNow != null && raw.yieldTypical != null && raw.yieldTypical > 0
      ? raw.yieldNow / raw.yieldTypical - 1
      : null
  const v5 = raw.view in VIEW_SCALE ? VIEW_SCALE[raw.view]! : null

  const inputs = {
    v1RangePosition: v1,
    v2AnalystUpside: v2,
    v3PeVsMedian: v3,
    v4YieldVsMedian: v4,
    v5Thesis: v5,
    v5Rationale: raw.viewWhy || null,
  }
  const res = computeValuation(inputs)
  // Keep the raw numbers so the form prefills with what was actually typed.
  await setSetting(`valuation_raw_${symbol}`, raw)
  await db.insert(schema.valuations).values({
    symbol,
    v1RangePosition: inputs.v1RangePosition,
    v2AnalystUpside: inputs.v2AnalystUpside,
    v3PeVsMedian: inputs.v3PeVsMedian,
    v4YieldVsMedian: inputs.v4YieldVsMedian,
    v5Thesis: inputs.v5Thesis,
    v5Rationale: inputs.v5Rationale,
    inputsPopulated: res.inputsPopulated,
    composite: res.composite,
    band: res.band,
    gate: res.gate,
    provisional: res.insufficient,
  })
  revalidatePath('/valuations')
  revalidatePath('/write')
}

/* ------------------------------- holdings -------------------------------- */

export async function confirmHolding(formData: FormData): Promise<void> {
  const db = await getDb()
  const symbol = String(formData.get('symbol'))
  const shares = Number(formData.get('shares'))
  const taxFree = Number(formData.get('taxFreeShares') ?? 0)
  if (!isFinite(shares) || shares < 0) return
  await db
    .update(schema.holdings)
    .set({
      shares,
      taxFreeShares: isFinite(taxFree) ? taxFree : 0,
      taxedShares: shares - (isFinite(taxFree) ? taxFree : 0),
      confirmed: true,
    })
    .where(eq(schema.holdings.symbol, symbol))
  revalidateAll()
}

/* ------------------------------ deviations ------------------------------- */

export async function resolveDeviation(formData: FormData): Promise<void> {
  const db = await getDb()
  const id = Number(formData.get('deviationId'))
  const outcome = Number(formData.get('outcomeUsd'))
  if (!isFinite(outcome)) return
  await db.update(schema.deviations).set({ outcomeUsd: outcome }).where(eq(schema.deviations.id, id))
  revalidatePath('/deviations')
}

/* -------------------------------- misc ----------------------------------- */

export async function testAlert(): Promise<void> {
  await sendTestAlert()
  revalidatePath('/settings')
}

export async function runHypothesisNow(formData: FormData): Promise<void> {
  const symbol = String(formData.get('symbol'))
  const summary = String(formData.get('summary') ?? symbol)
  if (geminiConfigured()) await runHypothesisCheck(symbol, summary)
  revalidatePath(`/positions/${String(formData.get('positionId') ?? '')}`)
}

export async function generateProse(formData: FormData): Promise<void> {
  const positionId = String(formData.get('positionId') ?? '')
  const context = String(formData.get('context') ?? '')
  if (geminiConfigured()) {
    const res = await proModeProse(context)
    if (typeof res === 'string') await setSetting(`prose_${positionId}`, res)
  }
  revalidatePath(`/positions/${positionId}`)
}

export async function setOwlTrimTarget(formData: FormData): Promise<void> {
  const lots = Number(formData.get('lotsPerCycle'))
  const { getSetting } = await import('./data')
  const cfg = (await getSetting<Record<string, number>>('owl_sleeve')) ?? {}
  if (isFinite(lots) && lots > 0 && lots <= 1200) {
    await setSetting('owl_sleeve', { ...cfg, lotsPerCycle: Math.round(lots) })
  }
  revalidatePath('/owl')
}
