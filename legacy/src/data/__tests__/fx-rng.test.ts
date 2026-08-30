import { describe, it, expect } from 'vitest'
import { convert, FX_RATES } from '@/data/fx'
import { walkTo, mulberry32 } from '@/data/rng'

describe('currency conversion', () => {
  it('is identity for same currency', () => {
    expect(convert(1234, 'USD', 'USD')).toBe(1234)
  })
  it('round-trips through the spot rate', () => {
    expect(convert(1, 'USD', 'INR')).toBeCloseTo(FX_RATES.INR, 6)
    expect(convert(FX_RATES.INR, 'INR', 'USD')).toBeCloseTo(1, 6)
    const roundTrip = convert(convert(5000, 'USD', 'INR'), 'INR', 'USD')
    expect(roundTrip).toBeCloseTo(5000, 6)
  })
})

describe('deterministic randomness', () => {
  it('mulberry32 produces a stable sequence for a seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('walkTo always ends exactly at the target value', () => {
    const w = walkTo(1234.56, 100, 7)
    expect(w).toHaveLength(100)
    expect(w[w.length - 1]).toBeCloseTo(1234.56, 6)
  })
  it('walkTo is reproducible — charts cannot flicker between renders', () => {
    expect(walkTo(500, 50, 11)).toEqual(walkTo(500, 50, 11))
  })
})
