import { describe, it, expect } from 'vitest'
import { evaluatePosition, urgentSignal } from '../lib/exits'
import {
  computeValuation,
  deltaTargetFor,
  gateFromBand,
  insideDeltaBand,
  provisionalRead,
} from '../lib/valuation'
import { checkCallCoverage, checkLimits, ticketToDrop } from '../lib/limits'
import {
  cadenceComponent,
  disciplineScore,
  ruleComponent,
  ruleTrend,
  stopComponent,
} from '../lib/discipline'
import { fridayForWeekNumber, fridayOfCurrentWeek, weekNumberForFriday, daysBetween } from '../lib/week'
import { owlSleeveView } from '../lib/owl'
import { firstOpenStep } from '../lib/write'

const basePos = {
  id: 1,
  symbol: 'MSFT',
  type: 'call' as const,
  strike: 520,
  expiry: '2026-09-04',
  lots: 16,
  creditPerContract: 40,
  entryDelta: 0.05,
}

describe('exit rules', () => {
  it('E2: short call at ≥3× credit is urgent, close-this-session, and mentions no roll', () => {
    // Spot through the strike → the modelled mid explodes past 3× a $40 credit.
    const s = evaluatePosition(basePos, 535, 0.27, '2026-08-31', false)
    expect(s.signal?.rule).toBe('E2')
    expect(s.signal?.urgent).toBe(true)
    expect(s.chip).toBe('close_now')
    expect(s.signal?.detail).toContain('No roll')
  })

  it('E3: short put at ≥3× credit is NOT urgent and is not styled as a problem', () => {
    const s = evaluatePosition(
      { ...basePos, type: 'put', strike: 520, creditPerContract: 40 },
      505,
      0.27,
      '2026-08-31',
      false,
    )
    expect(s.signal?.rule).toBe('E3')
    expect(s.signal?.urgent).toBe(false)
    expect(s.chip).toBe('watch')
    expect(s.signal?.detail).toContain('profitable')
  })

  it('E1: mid decayed to ≤20% of credit suggests buying the strike back', () => {
    const s = evaluatePosition(
      { ...basePos, strike: 640, creditPerContract: 40 },
      500,
      0.2,
      '2026-09-01',
      false,
    )
    expect(s.signal?.rule).toBe('E1')
    expect(s.signal?.urgent).toBe(false)
  })

  it('E4: expired out of the money → do nothing', () => {
    const s = evaluatePosition(basePos, 500, 0.27, '2026-09-05', false)
    expect(s.signal?.rule).toBe('E4')
    expect(s.chip).toBe('healthy')
  })

  it('E5: delta drift above 15 on a 5-delta write → review', () => {
    const s = evaluatePosition(
      { ...basePos, strike: 530, creditPerContract: 300, entryDelta: 0.05 },
      525,
      0.27,
      '2026-08-31',
      false,
    )
    expect(['E5', 'E2']).toContain(s.signal?.rule)
  })

  it('E6: broken hypothesis beats everything', () => {
    const s = evaluatePosition(
      { ...basePos, hypothesisVerdict: 'broken' },
      500,
      0.27,
      '2026-08-31',
      false,
    )
    expect(s.signal?.rule).toBe('E6')
    expect(s.signal?.urgent).toBe(true)
  })

  it('a stale price never fires an urgent E2', () => {
    const s = evaluatePosition(basePos, 535, 0.27, '2026-08-31', true)
    expect(s.signal?.rule).not.toBe('E2')
  })

  it('urgentSignal prefers E2 over other urgent rules', () => {
    const e2 = evaluatePosition(basePos, 535, 0.27, '2026-08-31', false)
    const e6 = evaluatePosition({ ...basePos, id: 2, hypothesisVerdict: 'broken' }, 500, 0.27, '2026-08-31', false)
    expect(urgentSignal([e6, e2])?.rule).toBe('E2')
  })
})

describe('valuation gate', () => {
  it('requires three populated inputs — two collapse to Both sides with no band', () => {
    const r = computeValuation({ v1RangePosition: 0.8, v2AnalystUpside: 0.03 })
    expect(r.insufficient).toBe(true)
    expect(r.band).toBeNull()
    expect(r.gate).toBe('both')
    // …but the provisional read still says MSFT is expensive.
    expect(provisionalRead({ v1RangePosition: 0.8, v2AnalystUpside: 0.03 })?.band).toBe('rich')
  })

  it('a thesis without a written rationale does not count as populated', () => {
    const r = computeValuation({ v1RangePosition: 0.8, v2AnalystUpside: 0.03, v5Thesis: 0.5 })
    expect(r.insufficient).toBe(true)
    const r2 = computeValuation({
      v1RangePosition: 0.8,
      v2AnalystUpside: 0.03,
      v5Thesis: 0.5,
      v5Rationale: 'priced for perfection',
    })
    expect(r2.insufficient).toBe(false)
  })

  it('deep value gates to puts only; overvalued to calls only; fair to both', () => {
    expect(gateFromBand('deep_value')).toBe('puts_only')
    expect(gateFromBand('overvalued')).toBe('calls_only')
    expect(gateFromBand('fair')).toBe('both')
  })

  it('MSFT at $357 in March reads deep value on range position + thesis + analyst target', () => {
    const r = computeValuation({
      v1RangePosition: 0.02,
      v2AnalystUpside: 0.35,
      v5Thesis: -0.8,
      v5Rationale: 'sold 2% above the 52-week low',
    })
    expect(r.band).toBe('deep_value')
    expect(r.gate).toBe('puts_only')
  })

  it('valuation shades the strike one increment, never past 8 delta', () => {
    expect(deltaTargetFor('deep_value', 'put')).toBe(0.07)
    expect(deltaTargetFor('overvalued', 'call')).toBe(0.07)
    expect(deltaTargetFor('deep_value', 'call')).toBe(0.05)
    expect(deltaTargetFor('fair', 'put')).toBe(0.05)
    expect(insideDeltaBand(0.08)).toBe(true)
    expect(insideDeltaBand(0.081)).toBe(false)
    expect(insideDeltaBand(0.19)).toBe(false)
  })
})

describe('limits', () => {
  const holdings = [
    { symbol: 'OWL', shares: 120000, mark: 12.02 },
    { symbol: 'MSFT', shares: 1752, mark: 513.53 },
    { symbol: 'VOO', shares: 560, mark: 707.24 },
    { symbol: 'GOOG', shares: 1611, mark: 337.5 },
    { symbol: 'META', shares: 547, mark: 499 },
    { symbol: 'REST', shares: 100000, mark: 16.3 }, // stand-in for the long tail
  ]

  it('L4 flags OWL (and MSFT) against the live 15% line from day one', () => {
    const checks = checkLimits([], holdings, 0)
    const l4 = checks.find((c) => c.id === 'L4')!
    expect(l4.ok).toBe(false)
    expect(l4.detail).toContain('OWL')
  })

  it('L1 aggregate put obligation binds at $1.25m', () => {
    const open = [
      { symbol: 'MSFT', type: 'put' as const, strike: 480, lots: 20 }, // $960k
      { symbol: 'GOOG', type: 'put' as const, strike: 310, lots: 10 }, // $310k
    ]
    const l1 = checkLimits(open, holdings, 0).find((c) => c.id === 'L1')!
    expect(l1.ok).toBe(false)
  })

  it('L8: two E2 stops in a week pauses writing', () => {
    expect(checkLimits([], holdings, 1).find((c) => c.id === 'L8')!.ok).toBe(true)
    expect(checkLimits([], holdings, 2).find((c) => c.id === 'L8')!.ok).toBe(false)
  })

  it('MSFT coverage: 1,752 shares warns at 17 lots and blocks at 18', () => {
    expect(checkCallCoverage('MSFT', 1752, 16).level).toBe('ok')
    expect(checkCallCoverage('MSFT', 1752, 17).level).toBe('warn')
    expect(checkCallCoverage('MSFT', 1752, 18).level).toBe('block')
  })

  it('META coverage: 547 shares caps at 5 — the historical 6th lot was 53 shares naked', () => {
    expect(checkCallCoverage('META', 547, 5).level).toBe('warn')
    expect(checkCallCoverage('META', 547, 6).level).toBe('block')
    expect(checkCallCoverage('META', 547, 6).detail).toContain('53')
  })

  it('ticketToDrop names the ticket whose removal restores the limits', () => {
    const open = [{ symbol: 'MSFT', type: 'put' as const, strike: 480, lots: 20 }] // $960k standing
    const proposed = [
      { symbol: 'GOOG', type: 'put' as const, strike: 310, lots: 12 }, // $372k → breaches L1
      { symbol: 'NVDA', type: 'put' as const, strike: 195, lots: 3 }, // $58.5k
    ]
    const drop = ticketToDrop(proposed, open, holdings)
    expect(drop).not.toBeNull()
    expect(proposed[drop!.index]!.symbol).toBe('GOOG')
    expect(drop!.why).toContain('GOOG')
  })
})

describe('discipline score', () => {
  it('cadence counts written over available', () => {
    const weeks = Array.from({ length: 35 }, (_, i) => ({
      weekNumber: 202601 + i,
      completedAt: [6, 18, 29].includes(i) ? null : new Date(),
      missed: [6, 18, 29].includes(i),
    }))
    const c = cadenceComponent(weeks)
    expect(c.numerator).toBe(32)
    expect(c.denominator).toBe(35)
  })

  it('rule component catches the August drift', () => {
    const jun = Array.from({ length: 10 }, () => ({ entryDelta: 0.04, openedAt: new Date('2026-06-15'), type: 'call' as const }))
    const aug = [0.19, 0.22, 0.31, 0.34, 0.36, 0.05, 0.04].map((d) => ({ entryDelta: d, openedAt: new Date('2026-08-10'), type: 'call' as const }))
    const trend = ruleTrend([...jun, ...aug])
    const june = trend.find((t) => t.month === '2026-06')!
    const august = trend.find((t) => t.month === '2026-08')!
    expect(june.value).toBe(1)
    expect(august.value!).toBeLessThan(0.3)
  })

  it('unmeasured components read null, never a fake 100%', () => {
    expect(stopComponent([]).value).toBeNull()
    expect(ruleComponent([]).value).toBeNull()
    const s = disciplineScore([stopComponent([])])
    expect(s.overall).toBeNull()
  })
})

describe('week arithmetic', () => {
  it('week numbers round-trip through Fridays', () => {
    expect(fridayForWeekNumber(202601)).toBe('2026-01-02')
    expect(fridayForWeekNumber(202635)).toBe('2026-08-28')
    expect(weekNumberForFriday('2026-08-28')).toBe(202635)
    expect(weekNumberForFriday('2026-09-04')).toBe(202636)
  })

  it('fridayOfCurrentWeek: a Sunday belongs to the coming Friday', () => {
    // 2026-08-30 is a Sunday; its write-Friday is 2026-09-04.
    expect(fridayOfCurrentWeek(new Date('2026-08-30T15:00:00Z'))).toBe('2026-09-04')
    // A Friday is its own write day.
    expect(fridayOfCurrentWeek(new Date('2026-09-04T15:00:00Z'))).toBe('2026-09-04')
    // Saturday rolls into the NEXT week.
    expect(fridayOfCurrentWeek(new Date('2026-09-05T15:00:00Z'))).toBe('2026-09-11')
  })

  it('daysBetween is calendar days', () => {
    expect(daysBetween('2026-08-28', '2026-09-04')).toBe(7)
  })
})

describe('OWL sleeve', () => {
  it('frames the position as a concentration exit with the brief’s arithmetic', () => {
    const v = owlSleeveView(12.02, 120000, 5_150_000, 0.35, '2026-08-28')
    expect(v.exposurePct).toBeGreaterThan(0.27)
    expect(v.strike).toBeCloseTo(13.5, 5)
    expect(v.trimPriceVsSpotPct).toBeGreaterThan(0.1)
    expect(v.dte).toBeGreaterThanOrEqual(30)
    expect(v.dte).toBeLessThanOrEqual(45)
    expect(v.sharesTrimmedIfCalled).toBe(30000)
    expect(v.excessShares).toBeGreaterThan(50000) // well above the 15% line
  })
})

describe('write sequence', () => {
  it('steps cannot be skipped', () => {
    expect(firstOpenStep({})).toBe('closeout')
    expect(firstOpenStep({ closeout: true })).toBe('direction')
    expect(firstOpenStep({ closeout: true, direction: true, tickets: true })).toBe('limits')
    expect(firstOpenStep({ closeout: true, direction: true, tickets: true, limits: true, done: true })).toBe('done')
  })
})
