import { describe, it, expect } from 'vitest'
import {
  sma, rsi, macd, bollinger, annualizedVol, betaVs, drawdowns, classifyTrend, keyLevels,
  cagr, summarizeFundamentals, dcfValue, reverseDcfImpliedGrowth, runScenarios, sensitivityTable,
  categoryScores, overallScore, dataConfidence, DEFAULT_WEIGHTS,
} from '@/research/engine'
import { activeProvider, coverageUniverse, seriesFor } from '@/research/providers'
import { FRAMEWORKS } from '@/research/frameworks'
import { AAPL_DOSSIER } from '@/research/dossiers/aapl'

describe('technical indicators', () => {
  const flat = new Array(300).fill(100)
  const rising = Array.from({ length: 300 }, (_, i) => 100 + i * 0.5)
  const falling = Array.from({ length: 300 }, (_, i) => 250 - i * 0.5)

  it('SMA equals the value for a constant series and lags a trend', () => {
    expect(sma(flat, 50)[299]).toBeCloseTo(100, 6)
    const s = sma(rising, 50)[299]!
    expect(s).toBeLessThan(rising[299])
    expect(s).toBeGreaterThan(rising[249])
  })

  it('RSI saturates at 100 for pure gains and near 0 for pure losses', () => {
    expect(rsi(rising)).toBe(100)
    expect(rsi(falling)).toBeLessThan(5)
    expect(rsi(flat)).toBeGreaterThanOrEqual(0)
  })

  it('MACD histogram is positive in an accelerating uptrend', () => {
    const accel = Array.from({ length: 300 }, (_, i) => 100 * Math.pow(1.004, i))
    expect(macd(accel).hist).toBeGreaterThan(0)
  })

  it('Bollinger %B is ~1 at the top of a rising channel and 0.5 for flat', () => {
    expect(bollinger(flat).pctB).toBeCloseTo(0.5, 1)
    expect(bollinger(rising).pctB).toBeGreaterThan(0.8)
  })

  it('beta of a series against itself is 1', () => {
    const { price } = seriesFor('AAPL')
    expect(betaVs(price, price)).toBeCloseTo(1, 6)
  })

  it('drawdowns: monotonic rise has zero drawdown; crash is captured', () => {
    expect(drawdowns(rising).maxDrawdownPct).toBeCloseTo(0, 6)
    const crash = [...rising.slice(0, 200), ...Array.from({ length: 50 }, (_, i) => 199.5 * (1 - 0.4 * (i / 49)))]
    expect(drawdowns(crash).maxDrawdownPct).toBeLessThan(-35)
  })

  it('trend classification separates regimes', () => {
    expect(classifyTrend(rising)).toMatch(/uptrend/)
    expect(classifyTrend(falling)).toMatch(/downtrend/)
  })

  it('key levels return support below and resistance above the current price', () => {
    const { price, current } = seriesFor('AAPL')
    for (const l of keyLevels(price, current)) {
      if (l.kind === 'support') expect(l.price).toBeLessThan(current)
      else expect(l.price).toBeGreaterThan(current)
    }
  })

  it('annualized volatility is positive and sane for sample series', () => {
    const { price } = seriesFor('NVDA')
    const v = annualizedVol(price.slice(-252))
    expect(v).toBeGreaterThan(5)
    expect(v).toBeLessThan(120)
  })
})

describe('fundamental math', () => {
  it('CAGR round-trips a known compounding', () => {
    expect(cagr(100, 100 * Math.pow(1.15, 5), 5)).toBeCloseTo(15, 6)
  })

  it('summarizes AAPL sample fundamentals correctly', () => {
    const f = summarizeFundamentals(AAPL_DOSSIER.financials)
    expect(f.revCagr5).toBeGreaterThan(5)
    expect(f.revCagr5).toBeLessThan(12)
    expect(f.buybackPct5).toBeLessThan(0) // buybacks shrink the count
    expect(f.fcfConversion).toBeGreaterThan(0.9) // FCF ≈ net income
    expect(f.netDebtToFcf).toBeLessThan(0) // net cash
  })
})

describe('valuation', () => {
  const inp = { fcf0: 100, growthY1_5: 8, growthY6_10: 5, terminalGrowth: 3, discountRate: 9, netCash: 50, shares: 10 }

  it('DCF value moves the right way with each assumption', () => {
    const base = dcfValue(inp)
    expect(dcfValue({ ...inp, growthY1_5: 12 })).toBeGreaterThan(base)
    expect(dcfValue({ ...inp, discountRate: 11 })).toBeLessThan(base)
    expect(dcfValue({ ...inp, terminalGrowth: 4 })).toBeGreaterThan(base)
    expect(dcfValue({ ...inp, netCash: 100 })).toBeCloseTo(base + 5, 6) // +50 cash / 10 shares
  })

  it('reverse DCF recovers the growth that produces a given price', () => {
    const g = 14
    const price = dcfValue({ ...inp, growthY1_5: g, growthY6_10: g / 2 })
    expect(reverseDcfImpliedGrowth(price, inp)).toBeCloseTo(g, 1)
  })

  it('scenario expected value is the probability-weighted mean', () => {
    const scen = runScenarios(100, [
      { label: 'Bull', narrative: '', eps5: 10, exitMultiple: 20, probabilityPct: 50 }, // 200 → +100%
      { label: 'Bear', narrative: '', eps5: 5, exitMultiple: 10, probabilityPct: 50 }, // 50 → −50%
    ])
    expect(scen.expectedReturn).toBeCloseTo(25, 6)
    expect(scen.cases[0].irrPct).toBeCloseTo((Math.pow(2, 1 / 5) - 1) * 100, 4)
  })

  it('sensitivity table is monotonic in growth and discount rate', () => {
    const t = sensitivityTable(inp, [4, 8, 12], [8, 10])
    expect(t[0][2]).toBeGreaterThan(t[0][0]) // more growth, more value
    expect(t[1][1]).toBeLessThan(t[0][1]) // higher discount, less value
  })
})

describe('scoring & coverage', () => {
  it('produces bounded, transparent category scores with inputs and formulas', () => {
    const { price, bench, current } = seriesFor('AAPL')
    const scores = categoryScores(AAPL_DOSSIER, current, price, bench)
    expect(scores.length).toBe(8)
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0)
      expect(s.score).toBeLessThanOrEqual(10)
      expect(s.formula.length).toBeGreaterThan(5)
      expect(s.inputs.length).toBeGreaterThan(0)
    }
    const overall = overallScore(scores, DEFAULT_WEIGHTS)
    expect(overall).toBeGreaterThan(0)
    expect(overall).toBeLessThanOrEqual(10)
  })

  it('changing weights changes the overall score without touching category scores', () => {
    const { price, bench, current } = seriesFor('AAPL')
    const scores = categoryScores(AAPL_DOSSIER, current, price, bench)
    const a = overallScore(scores, DEFAULT_WEIGHTS)
    const b = overallScore(scores, { ...DEFAULT_WEIGHTS, valuation: 60 })
    expect(a).not.toBeCloseTo(b, 3)
  })

  it('every dossier has all 11 framework lenses and a full memo', () => {
    for (const sym of activeProvider.listCovered()) {
      const d = activeProvider.getDossier(sym)!
      expect(d.frameworks.length, sym).toBe(FRAMEWORKS.length)
      expect(d.memo.thesisBreakers.length, sym).toBeGreaterThan(0)
      expect(d.memo.assumptions.length, sym).toBeGreaterThan(2)
      expect(d.valuation.scenarios.length, sym).toBe(3)
      expect(d.dataProfile.provider).toBe('bundled-sample')
      for (const fw of d.frameworks) {
        expect(fw.score, `${sym}:${fw.id}`).toBeGreaterThanOrEqual(0)
        expect(fw.score, `${sym}:${fw.id}`).toBeLessThanOrEqual(10)
        expect(fw.verdict.length, `${sym}:${fw.id}`).toBeGreaterThan(10)
      }
    }
  })

  it('coverage universe spans portfolio + watchlist with honest tiers', () => {
    const rows = coverageUniverse()
    expect(rows.some((r) => r.symbol === 'AAPL' && r.tier === 'deep' && r.inPortfolio)).toBe(true)
    expect(rows.some((r) => r.symbol === 'AMD' && r.onWatchlist && !r.inPortfolio)).toBe(true)
    // ETFs must NOT get fake fundamental coverage
    const voo = rows.find((r) => r.symbol === 'VOO')!
    expect(voo.dossier).toBeNull()
    expect(voo.note).toContain('not applicable')
    // Uncovered single stocks get technical tier at most
    const googl = rows.find((r) => r.symbol === 'GOOGL')!
    expect(googl.tier).toBe('technical')
  })

  it('data confidence discloses the bundled-sample gap', () => {
    const conf = dataConfidence(AAPL_DOSSIER)
    expect(conf.pct).toBeLessThanOrEqual(100)
    expect(conf.gaps.some((g) => g.includes('sample'))).toBe(true)
  })
})
