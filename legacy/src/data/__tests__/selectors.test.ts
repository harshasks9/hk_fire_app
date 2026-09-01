import { describe, it, expect } from 'vitest'
import {
  positionMetrics,
  groupedPositions,
  netWorthSnapshot,
  allocationBy,
  incomeAgg,
  liabilityTotals,
  upcomingObligations,
  dataCompleteness,
  cashTotal,
} from '@/data/selectors'

describe('positionMetrics', () => {
  const rows = positionMetrics('USD')

  it('computes value and cost basis from lots (AAPL @ Fidelity)', () => {
    const aapl = rows.find((r) => r.position.id === 'pos-aapl-fid')!
    expect(aapl.qty).toBe(220)
    expect(aapl.value).toBeCloseTo(220 * 232.14, 2)
    // 80×52.30 + 60×132.50 + 80×171.20
    expect(aapl.cost).toBeCloseTo(25_830, 2)
    expect(aapl.unrealized).toBeCloseTo(aapl.value - aapl.cost, 6)
  })

  it('converts INR positions into the display currency', () => {
    const rel = rows.find((r) => r.position.id === 'pos-rel-zer')!
    expect(rel.nativeCurrency).toBe('INR')
    expect(rel.nativeValue).toBeCloseTo(420 * 2954.5, 2)
    expect(rel.value).toBeCloseTo(rel.nativeValue / 86.8, 2)
  })

  it('weights sum to 100% of the filtered universe', () => {
    const total = rows.reduce((s, r) => s + r.weightPct, 0)
    expect(total).toBeCloseTo(100, 6)
  })

  it('supports member filtering — Meera owns only Roth + MF folio positions', () => {
    const meera = positionMetrics('USD', { memberId: 'm-meera' })
    expect(meera.length).toBeGreaterThan(0)
    expect(meera.every((r) => r.ownerId === 'm-meera')).toBe(true)
  })
})

describe('groupedPositions', () => {
  const groups = groupedPositions('USD')

  it('merges the same symbol across accounts (NVDA: Fidelity 400 + IBKR 300)', () => {
    const nvda = groups.find((g) => g.symbol === 'NVDA')!
    expect(nvda.qty).toBe(700)
    expect(nvda.accounts).toHaveLength(2)
  })

  it('keeps the weakest provenance and the oldest as-of when merging — honesty over optimism', () => {
    const nvda = groups.find((g) => g.symbol === 'NVDA')!
    expect(nvda.provenance).toBe('imported') // IBKR leg is only imported
    expect(nvda.asOf).toBe('2026-06-30') // older of the two sources
  })
})

describe('netWorthSnapshot', () => {
  const snap = netWorthSnapshot('USD')

  it('total is exactly assets minus liabilities', () => {
    expect(snap.total).toBeCloseTo(snap.assets - snap.liabilities, 6)
  })

  it('assets decompose into investable + cash + real estate + private', () => {
    expect(snap.assets).toBeCloseTo(snap.investable + snap.cash + snap.realEstateValue + snap.privateValue, 6)
  })

  it('is currency-invariant: INR total equals USD total at the spot rate', () => {
    const inr = netWorthSnapshot('INR')
    expect(inr.total).toBeCloseTo(snap.total * 86.8, 0)
  })

  it('household total exceeds any single member view', () => {
    const solo = netWorthSnapshot('USD', { memberId: 'm-meera' })
    expect(solo.total).toBeLessThan(snap.total)
    expect(solo.total).toBeGreaterThan(0)
  })
})

describe('allocationBy', () => {
  it('asset-class slices sum to 100%', () => {
    const alloc = allocationBy('assetClass', 'USD')
    const pct = alloc.reduce((s, a) => s + a.pct, 0)
    expect(pct).toBeCloseTo(100, 6)
  })

  it('includeNonPortfolio folds cash, property and private value into the mix', () => {
    const base = allocationBy('assetClass', 'USD')
    const full = allocationBy('assetClass', 'USD', {}, { includeNonPortfolio: true })
    expect(full.find((a) => a.key === 'real_estate')).toBeTruthy()
    expect(base.find((a) => a.key === 'real_estate')).toBeFalsy()
  })

  it('currency exposure covers both USD and INR', () => {
    const cur = allocationBy('currency', 'USD', {}, { includeNonPortfolio: true })
    const keys = cur.map((c) => c.key)
    expect(keys).toContain('USD')
    expect(keys).toContain('INR')
  })
})

describe('incomeAgg', () => {
  const agg = incomeAgg('USD')

  it('year total equals the sum of the monthly buckets', () => {
    const monthSum = agg.byMonth.reduce((s, m) => s + m.received + m.expected, 0)
    expect(agg.forwardAnnual).toBeCloseTo(monthSum, 4)
  })

  it('nothing is "received" after the reference date, and next payment is in the future', () => {
    expect(agg.next).not.toBeNull()
    expect(agg.next!.date > '2026-07-20').toBe(true)
    // months after July can only hold expected income
    for (const m of agg.byMonth.slice(7)) expect(m.received).toBe(0)
  })

  it('July has both received and still-expected income at mid-month reference', () => {
    expect(agg.monthReceived).toBeGreaterThan(0)
    expect(agg.monthExpected).toBeGreaterThan(0)
  })
})

describe('liabilities & obligations', () => {
  it('aggregates balances and computes a sane blended rate', () => {
    const t = liabilityTotals('USD')
    expect(t.balance).toBeGreaterThan(1_000_000)
    expect(t.weightedRate).toBeGreaterThan(3)
    expect(t.weightedRate).toBeLessThan(8)
  })

  it('upcoming obligations are all in the future and sorted ascending', () => {
    const obs = upcomingObligations()
    expect(obs.length).toBeGreaterThan(4)
    for (const o of obs) expect(o.date >= '2026-07-20').toBe(true)
    const sorted = [...obs].sort((a, b) => a.date.localeCompare(b.date))
    expect(obs).toEqual(sorted)
  })
})

describe('data quality', () => {
  it('completeness stays within bounds and reports open issues', () => {
    const dq = dataCompleteness()
    expect(dq.pct).toBeGreaterThan(0)
    expect(dq.pct).toBeLessThanOrEqual(100)
    expect(dq.verifiedPct).toBeLessThanOrEqual(100)
    expect(dq.issues).toBeGreaterThan(0)
  })

  it('cash totals convert consistently', () => {
    const usd = cashTotal('USD')
    const inr = cashTotal('INR')
    expect(inr).toBeCloseTo(usd * 86.8, 0)
  })
})
