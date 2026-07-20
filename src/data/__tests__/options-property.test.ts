import { describe, it, expect } from 'vitest'
import { allStrategyMetrics, strategyMetrics, optionsPremiumYtd, propertyMetrics } from '@/data/selectors'
import { OPTION_STRATEGIES } from '@/data/options'
import { amortize, LIABILITIES } from '@/data/liabilities'

describe('option strategy metrics', () => {
  const byId = (id: string) => strategyMetrics(OPTION_STRATEGIES.find((s) => s.id === id)!)

  it('covered call (AAPL): premium, P&L, breakeven and urgent assignment risk', () => {
    const m = byId('opt-aapl-cc')
    expect(m.netPremium).toBeCloseTo(680, 2) // 3.40 × 2 × 100
    expect(m.currentValue).toBeCloseTo(820, 2) // 4.10 × 2 × 100
    expect(m.pnl).toBeCloseTo(-140, 2)
    expect(m.daysToExpiry).toBe(4)
    expect(m.breakeven).toBeCloseTo(232.14 - 3.4, 2)
    // ITM ($232.14 > $230 strike) with ≤7 days left → must surface as high risk
    expect(m.assignmentRisk).toBe('high')
    expect(m.actionNeeded).toBeTruthy()
  })

  it('cash-secured put (GOOGL): defined max loss and breakeven below strike', () => {
    const m = byId('opt-googl-csp')
    expect(m.netPremium).toBeCloseTo(620, 2)
    expect(m.maxLoss).toBeCloseTo(165 * 200 - 620, 2)
    expect(m.breakeven).toBeCloseTo(165 - 3.1, 2)
    expect(m.assignmentRisk).toBe('low') // OTM, 18 days out
  })

  it('put credit spread (SPY): max loss bounded by width minus credit', () => {
    const m = byId('opt-spy-vert')
    expect(m.netPremium).toBeCloseTo((6.4 - 3.1) * 200, 2) // 660
    expect(m.maxLoss).toBeCloseTo(20 * 200 - 660, 2) // 3340
    expect(m.breakeven).toBeCloseTo(530 - 660 / 200, 2) // 526.70
  })

  it('sorts strategies by urgency (days to expiry) with the risky one first', () => {
    const all = allStrategyMetrics()
    expect(all[0].strategy.id).toBe('opt-aapl-cc')
    const dtes = all.map((m) => m.daysToExpiry)
    expect(dtes).toEqual([...dtes].sort((a, b) => a - b))
  })

  it('premium collected YTD matches the recorded income events exactly', () => {
    expect(optionsPremiumYtd('USD')).toBeCloseTo(6_800, 2)
  })
})

describe('real-estate underwriting (Austin duplex)', () => {
  const m = propertyMetrics('prop-austin')!

  it('equity = value − mortgage', () => {
    expect(m.currentValue).toBe(692_000)
    expect(m.mortgageBalance).toBe(396_400)
    expect(m.equity).toBe(295_600)
  })

  it('cash flow chain: occupancy-adjusted rent − costs − debt service', () => {
    expect(m.monthlyRent).toBeCloseTo(4_350 * 0.96, 2)
    expect(m.monthlyCosts).toBe(1_858)
    expect(m.monthlyCashFlow).toBeCloseTo(4_176 - 1_858 - 2_022, 2)
  })

  it('NOI, cap rate, DSCR and LTV are internally consistent', () => {
    expect(m.noiAnnual).toBeCloseTo((4_176 - 1_858) * 12, 2)
    expect(m.capRatePct).toBeCloseTo((m.noiAnnual / 692_000) * 100, 4)
    expect(m.dscr).toBeCloseTo((4_176 - 1_858) / 2_022, 4)
    expect(m.ltvPct).toBeCloseTo((396_400 / 692_000) * 100, 4)
    expect(m.totalCostBasis).toBe(562_000)
  })

  it('primary residence has no rent-derived metrics', () => {
    const seattle = propertyMetrics('prop-seattle')!
    expect(seattle.cashOnCashPct).toBeNull()
    expect(seattle.dscr).toBeNull()
    expect(seattle.equity).toBeCloseTo(1_180_000 - 604_200, 2)
  })
})

describe('amortization schedule', () => {
  it('first payment splits into interest at the note rate plus principal', () => {
    const seattle = LIABILITIES.find((l) => l.id === 'liab-seattle')!
    const sched = amortize(seattle, 12)
    const firstInterest = 604_200 * (3.125 / 100 / 12)
    expect(sched[0].interest).toBeCloseTo(firstInterest, 2)
    expect(sched[0].principal).toBeCloseTo(2_896 - firstInterest, 2)
  })

  it('balance declines monotonically and principal share grows', () => {
    const seattle = LIABILITIES.find((l) => l.id === 'liab-seattle')!
    const sched = amortize(seattle, 240)
    for (let i = 1; i < sched.length; i++) {
      expect(sched[i].balance).toBeLessThan(sched[i - 1].balance)
    }
    expect(sched[sched.length - 1].principal).toBeGreaterThan(sched[0].principal)
  })

  it('interest-only PAL never amortizes — the UI must not chart it as if it did', () => {
    const pal = LIABILITIES.find((l) => l.id === 'liab-pal')!
    // Guard used by the UI before rendering an amortization chart
    expect(pal.monthlyPayment * 12).toBeLessThanOrEqual(pal.balance * (pal.ratePct / 100) + 1)
  })
})
