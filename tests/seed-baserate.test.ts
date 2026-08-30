import { describe, it, expect } from 'vitest'
import { baseRateBreach, modelDisagrees, bsDelta } from '../lib/options'
import { MSFT_SEED_CLOSES, lastNTradingDays, seedSeries } from '../lib/seed/prices'

describe('seeded MSFT series reproduces the record in the brief', () => {
  const moveToStrike = 547.5 / 513.53 - 1 // +6.615%

  it('has 50 closes ending at 513.53 with the +25% five-session run', () => {
    expect(MSFT_SEED_CLOSES).toHaveLength(50)
    expect(MSFT_SEED_CLOSES[MSFT_SEED_CLOSES.length - 1]).toBe(513.53)
    // 444.0 → 555.0 across five sessions = +25%
    expect(555.0 / 444.0).toBeCloseTo(1.25, 3)
  })

  it('call breach base rate is 8 of 45 windows (17.8%)', () => {
    const res = baseRateBreach(MSFT_SEED_CLOSES, 5, moveToStrike, 'call')
    expect(res.windows).toBe(45)
    expect(res.breaches).toBe(8)
    expect(res.rate).toBeCloseTo(8 / 45, 6)
  })

  it('put breach base rate is 0 — the asymmetry behind E2', () => {
    const res = baseRateBreach(MSFT_SEED_CLOSES, 5, moveToStrike, 'put')
    expect(res.breaches).toBe(0)
  })

  it('history disagrees with the ~4.7% modelled delta by more than 2×', () => {
    const modelled = bsDelta(513.53, 547.5, 7 / 365, 0.27, 'call')
    const base = baseRateBreach(MSFT_SEED_CLOSES, 5, moveToStrike, 'call')
    expect(modelDisagrees(modelled, base)).toBe(true)
    expect(base.rate / modelled).toBeGreaterThan(3)
    expect(base.rate / modelled).toBeLessThan(4.5)
  })
})

describe('seed helpers', () => {
  it('lastNTradingDays returns weekdays ending at the requested Friday', () => {
    const days = lastNTradingDays('2026-08-28', 50)
    expect(days).toHaveLength(50)
    expect(days[days.length - 1]).toBe('2026-08-28')
    for (const d of days) {
      const dow = new Date(d + 'T00:00:00Z').getUTCDay()
      expect(dow).toBeGreaterThan(0)
      expect(dow).toBeLessThan(6)
    }
  })

  it('every synthetic series is positive and ends on its target', () => {
    for (const s of seedSeries()) {
      expect(s.closes).toHaveLength(50)
      for (const c of s.closes) expect(c).toBeGreaterThan(0)
    }
  })
})
