/*
  The daily job (weekdays, after the close):
    1. fetch + validate closes (Gemini fetches, deterministic code validates)
    2. carry stale prices forward as stale — never served as current
    3. recompute vol blends
    4. evaluate exit rules → alerts (urgent E2/E6 now, the rest to the digest)
    5. mark missed weeks and nag unlogged tickets
    6. Mondays: hypothesis checks for open names
*/
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { fetchDailyQuotes, geminiConfigured, runHypothesisCheck, validateQuote } from './gemini'
import { queueAlert } from './whatsapp'
import { latestPrices, recalcVol } from './data'
import { getHomeState } from './state'
import { fridayOfCurrentWeek, nyParts, weekNumberForFriday } from './week'

export interface DailyJobReport {
  fetched: number
  storedFresh: number
  flaggedReview: number
  markedStale: string[]
  exitAlerts: number
  missedWeeks: number[]
  nags: number
  hypothesisChecks: number
  errors: string[]
}

export async function runDailyJob(now = new Date()): Promise<DailyJobReport> {
  const db = await getDb()
  const report: DailyJobReport = {
    fetched: 0, storedFresh: 0, flaggedReview: 0, markedStale: [],
    exitAlerts: 0, missedWeeks: [], nags: 0, hypothesisChecks: 0, errors: [],
  }
  const today = nyParts(now)
  const isWeekday = today.dow >= 1 && today.dow <= 5

  /* 1–2: prices */
  if (isWeekday) {
    const tickers = await db.select().from(schema.tickers)
    const wanted = tickers.filter((t) => !t.blocked).map((t) => t.symbol)
    const previous = await latestPrices()
    if (geminiConfigured() && wanted.length > 0) {
      const quotes = await fetchDailyQuotes(wanted, today.iso)
      if ('error' in quotes) {
        report.errors.push(`price fetch failed: ${quotes.error}`)
        await markAllStale(wanted, report)
      } else {
        report.fetched = quotes.length
        const got = new Set<string>()
        for (const q of quotes) {
          const prev = previous.get(q.symbol)?.close ?? null
          const v = validateQuote(q, prev, today.iso)
          if (!v.ok) {
            report.errors.push(`${q.symbol}: ${v.reason}`)
            continue
          }
          got.add(q.symbol)
          await db
            .insert(schema.prices)
            .values({
              symbol: q.symbol, date: q.date, close: q.close,
              sourceUrl: q.sourceUrl, needsReview: v.needsReview, stale: false,
            })
            .onConflictDoUpdate({
              target: [schema.prices.symbol, schema.prices.date],
              set: { close: q.close, sourceUrl: q.sourceUrl, needsReview: v.needsReview, stale: false, fetchedAt: new Date() },
            })
          if (v.needsReview) report.flaggedReview++
          else report.storedFresh++
        }
        const missing = wanted.filter((s) => !got.has(s) && previous.has(s))
        await markAllStale(missing, report)
      }
    } else if (!geminiConfigured()) {
      report.errors.push('GEMINI_API_KEY not set — prices not refreshed')
      await markAllStale(wanted.filter((s) => previous.has(s)), report)
    }
    if (report.markedStale.length > 0) {
      await queueAlert({
        rule: 'stale_price',
        symbol: report.markedStale.join(','),
        urgency: 'normal',
        message: `Price refresh failed for ${report.markedStale.length} name(s): ${report.markedStale.slice(0, 6).join(', ')}${report.markedStale.length > 6 ? '…' : ''}. Previous closes carried forward as STALE.`,
        deepLinkPath: '/settings',
      })
    }

    /* 3: vols for the active universe */
    const universe = tickers.filter((t) => t.group === 'universe' && t.active)
    for (const t of universe) {
      try {
        await recalcVol(t.symbol)
      } catch (err) {
        report.errors.push(`vol ${t.symbol}: ${String(err).slice(0, 120)}`)
      }
    }

    /* one "session" has elapsed for approved-but-unlogged tickets */
    await db
      .update(schema.tickets)
      .set({ sessionsSinceApproval: sql`${schema.tickets.sessionsSinceApproval} + 1` })
      .where(eq(schema.tickets.status, 'approved'))
  }

  /* 4: exit rules — reuse the state machine's evaluation */
  const state = await getHomeState()
  for (const s of state.statuses) {
    const sig = s.signal
    if (!sig) continue
    if (s.stale) continue // stale prices never alert
    await queueAlert({
      rule: sig.rule,
      positionId: sig.positionId,
      symbol: s.position.symbol,
      urgency: sig.urgent ? 'urgent' : 'normal',
      message: `${sig.instruction} ${sig.detail}`,
      deepLinkPath: `/positions/${sig.positionId}`,
    })
    report.exitAlerts++
  }

  /* 5a: missed weeks — any past Friday whose sequence was never completed */
  const currentFriday = fridayOfCurrentWeek(now)
  const currentWeekNumber = weekNumberForFriday(currentFriday)
  const openWeeks = await db
    .select()
    .from(schema.weeks)
    .where(and(isNull(schema.weeks.completedAt), eq(schema.weeks.missed, false), lt(schema.weeks.weekNumber, currentWeekNumber)))
  for (const w of openWeeks) {
    await db.update(schema.weeks).set({ missed: true }).where(eq(schema.weeks.id, w.id))
    await db.insert(schema.deviations).values({
      ruleBroken: 'missed_week',
      ruleSaid: 'Write every available week. The edge is the cadence.',
      actionTaken: `Friday ${w.fridayDate} passed without the sequence being completed.`,
      reason: null,
      outcomeUsd: null,
    })
    await queueAlert({
      rule: 'missed_week',
      urgency: 'normal',
      message: `Week ${w.weekNumber % 100} was not written — recorded as missed on the scoreboard.`,
      deepLinkPath: '/scoreboard',
    })
    report.missedWeeks.push(w.weekNumber)
  }

  /* 5b: unlogged fills nag */
  for (const t of state.unloggedTickets) {
    await queueAlert({
      rule: 'unlogged_ticket',
      positionId: null,
      symbol: t.label.split(' ')[0],
      urgency: 'normal',
      message: `Approved ticket ${t.label} has no logged fill after two sessions. Log it or decline it.`,
      deepLinkPath: '/log',
    })
    report.nags++
  }

  /* 6: Monday hypothesis checks for names with open positions */
  if (today.dow === 1 && geminiConfigured()) {
    const open = await db.select().from(schema.positions).where(isNull(schema.positions.closedAt))
    const symbols = [...new Set(open.map((p) => p.symbol))]
    for (const sym of symbols) {
      const pos = open.filter((p) => p.symbol === sym)
      const summary = pos
        .map((p) => `short ${p.type} ${p.strike} exp ${p.expiry} ×${p.lots}`)
        .join('; ')
      const res = await runHypothesisCheck(sym, summary)
      if ('error' in res) {
        report.errors.push(`hypothesis ${sym}: ${res.error}`)
      } else {
        report.hypothesisChecks++
        if (res.verdict === 'broken') {
          await queueAlert({
            rule: 'E6',
            symbol: sym,
            urgency: 'urgent',
            message: `Hypothesis check on ${sym} returned BROKEN: ${res.narrative}`,
            deepLinkPath: '/',
          })
        }
      }
    }
  }

  return report
}

async function markAllStale(symbols: string[], report: DailyJobReport): Promise<void> {
  const db = await getDb()
  for (const s of symbols) {
    const latest = await db
      .select()
      .from(schema.prices)
      .where(eq(schema.prices.symbol, s))
      .orderBy(desc(schema.prices.date))
      .limit(1)
    if (latest[0] && !latest[0].stale) {
      await db.update(schema.prices).set({ stale: true }).where(eq(schema.prices.id, latest[0].id))
      report.markedStale.push(s)
    }
  }
}
