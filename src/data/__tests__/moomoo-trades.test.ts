import { describe, it, expect } from 'vitest'
import {
  IMPORTED_OPTION_TRADES, IMPORTED_OPTION_HOLDINGS, IMPORTED_SUMMARY, IMPORTED_DATA_GAPS,
} from '@/data/moomooOptionTrades'

/* These tests pin the imported trade log to the broker's own statement totals.
   If anyone edits a transcribed number, a check here should break. */

describe('Moomoo imported option trades — statement consistency', () => {
  it('every trade: gross = price × qty × 100 and net = gross − fees (broker rows)', () => {
    for (const t of IMPORTED_OPTION_TRADES) {
      expect(t.gross, `${t.underlying} ${t.expiry}`).toBeCloseTo(t.price * t.qty * 100, 2)
      expect(t.net, `${t.underlying} ${t.expiry}`).toBeCloseTo(t.gross - t.fees, 2)
      if (t.fills) expect(t.fills.reduce((s, f) => s + f, 0)).toBe(t.qty)
    }
  })

  it('June statement USD sell totals reconcile: 7 fills, $1,801 gross, $45.88 fees, $1,755.12 net', () => {
    const june = IMPORTED_OPTION_TRADES.filter((t) => t.orderDate.startsWith('2026-06'))
    const fills = june.reduce((s, t) => s + (t.fills?.length ?? 1), 0)
    expect(fills).toBe(7)
    expect(june.reduce((s, t) => s + t.gross, 0)).toBeCloseTo(1_801.0, 2)
    expect(june.reduce((s, t) => s + t.fees, 0)).toBeCloseTo(45.88, 2)
    expect(june.reduce((s, t) => s + t.net, 0)).toBeCloseTo(1_755.12, 2)
  })

  it('May statement: single order, $1,260 gross, $14.92 fees, $1,245.08 net', () => {
    const may = IMPORTED_OPTION_TRADES.filter((t) => t.orderDate.startsWith('2026-05'))
    expect(may).toHaveLength(1)
    expect(may[0].gross).toBeCloseTo(1_260, 2)
    expect(may[0].net).toBeCloseTo(1_245.08, 2)
  })

  it('outcomes: five puts expired worthless, one open at the Jun 30 statement', () => {
    expect(IMPORTED_SUMMARY.expiredWorthlessCount).toBe(5)
    expect(IMPORTED_SUMMARY.openCount).toBe(1)
    const open = IMPORTED_OPTION_TRADES.find((t) => t.outcome === 'open_at_last_statement')!
    expect(open.underlying).toBe('MSFT')
    expect(open.expiry).toBe('2026-07-06')
    // every expiry outcome is dated on/after its expiry
    for (const t of IMPORTED_OPTION_TRADES) {
      if (t.outcomeDate) expect(t.outcomeDate >= t.expiry || t.outcomeDate === t.expiry).toBe(true)
    }
  })

  it('summary aggregates equal the sum of rows (never hand-entered)', () => {
    const gross = IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.gross, 0)
    const fees = IMPORTED_OPTION_TRADES.reduce((s, t) => s + t.fees, 0)
    expect(IMPORTED_SUMMARY.grossPremium).toBeCloseTo(gross, 2)
    expect(IMPORTED_SUMMARY.fees).toBeCloseTo(fees, 2)
    expect(IMPORTED_SUMMARY.netPremium).toBeCloseTo(gross - fees, 2)
    expect(IMPORTED_SUMMARY.contracts).toBe(49)
  })

  it('LEAPS holdings carry marks but honestly-unknown cost basis', () => {
    expect(IMPORTED_OPTION_HOLDINGS).toHaveLength(2)
    for (const h of IMPORTED_OPTION_HOLDINGS) {
      expect(h.markValue).toBeCloseTo(h.markPrice * h.qty * 100, 1)
      expect(h.costBasis).toBeNull()
    }
  })

  it('data gaps are declared, including the unknown July outcome', () => {
    expect(IMPORTED_DATA_GAPS.some((g) => g.includes('Jul 2026'))).toBe(true)
    expect(IMPORTED_DATA_GAPS.some((g) => g.includes('cost basis'))).toBe(true)
  })
})
