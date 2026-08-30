import { describe, it, expect } from 'vitest'
import { fmtMoney, fmtPct, fmtNum, daysUntil, relDate, isoAddDays, TODAY } from '@/lib/format'

describe('reference date', () => {
  it('is pinned to 2026-07-20 so all derived data is deterministic', () => {
    expect(TODAY.toISOString().slice(0, 10)).toBe('2026-07-20')
  })
})

describe('fmtMoney', () => {
  it('formats whole USD amounts >= 1000 without decimals', () => {
    expect(fmtMoney(1234.56)).toBe('$1,235')
  })
  it('keeps cents for small amounts', () => {
    expect(fmtMoney(450.5)).toBe('$450.50')
  })
  it('uses a typographic minus for negatives', () => {
    expect(fmtMoney(-450.5)).toBe('−$450.50')
  })
  it('compacts thousands and millions', () => {
    expect(fmtMoney(25_000, 'USD', { compact: true })).toBe('$25.0K')
    expect(fmtMoney(2_540_000, 'USD', { compact: true })).toBe('$2.54M')
  })
  it('uses crore notation for large INR values', () => {
    expect(fmtMoney(16_200_000, 'INR', { compact: true })).toBe('₹1.62 Cr')
  })
  it('renders an explicit plus sign when requested', () => {
    expect(fmtMoney(500, 'USD', { sign: true })).toBe('+$500.00')
  })
})

describe('fmtPct / fmtNum', () => {
  it('formats percentages with sign control', () => {
    expect(fmtPct(-3.14159, { decimals: 2 })).toBe('−3.14%')
    expect(fmtPct(5, { sign: true })).toBe('+5.0%')
  })
  it('formats numbers with fixed decimals', () => {
    expect(fmtNum(1234.5678)).toBe('1,234.57')
  })
})

describe('date helpers', () => {
  it('computes day distances from the reference date', () => {
    expect(daysUntil('2026-07-24')).toBe(4)
    expect(daysUntil('2026-07-19')).toBe(-1)
    expect(daysUntil('2026-07-20')).toBe(0)
  })
  it('renders relative descriptions', () => {
    expect(relDate('2026-07-21')).toBe('tomorrow')
    expect(relDate('2026-07-19')).toBe('yesterday')
    expect(relDate('2026-07-25')).toBe('in 5d')
  })
  it('adds days across month boundaries', () => {
    expect(isoAddDays('2026-07-30', 5)).toBe('2026-08-04')
  })
})
