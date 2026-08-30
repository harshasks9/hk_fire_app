import { describe, it, expect } from 'vitest'
import {
  bsPrice,
  bsDelta,
  bsGreeks,
  solveStrikeForDelta,
  impliedVol,
  returnOnCollateral,
  realizedVol,
  baseRateBreach,
  modelDisagrees,
  normCdf,
} from './options'

describe('normCdf', () => {
  it('matches known values', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7)
    expect(normCdf(1.6449)).toBeCloseTo(0.95, 4)
    expect(normCdf(-1.6449)).toBeCloseTo(0.05, 4)
    expect(normCdf(3)).toBeCloseTo(0.99865, 4)
  })
})

describe('bsPrice / bsDelta', () => {
  it('satisfies put-call parity', () => {
    const S = 100, K = 95, T = 30 / 365, vol = 0.3, r = 0.04
    const c = bsPrice(S, K, T, vol, 'call', r)
    const p = bsPrice(S, K, T, vol, 'put', r)
    expect(c - p).toBeCloseTo(S - K * Math.exp(-r * T), 6)
  })

  it('returns intrinsic value at expiry', () => {
    expect(bsPrice(110, 100, 0, 0.3, 'call')).toBe(10)
    expect(bsPrice(90, 100, 0, 0.3, 'put')).toBe(10)
    expect(bsPrice(90, 100, 0, 0.3, 'call')).toBe(0)
  })

  it('call delta in (0,1), put delta in (-1,0), and call − put = 1', () => {
    const S = 500, K = 520, T = 7 / 365, vol = 0.27
    const dc = bsDelta(S, K, T, vol, 'call')
    const dp = bsDelta(S, K, T, vol, 'put')
    expect(dc).toBeGreaterThan(0)
    expect(dc).toBeLessThan(1)
    expect(dp).toBeLessThan(0)
    expect(dp).toBeGreaterThan(-1)
    expect(dc - dp).toBeCloseTo(1, 8)
  })

  it('price falls as a call strike rises', () => {
    const p1 = bsPrice(500, 510, 7 / 365, 0.3, 'call')
    const p2 = bsPrice(500, 530, 7 / 365, 0.3, 'call')
    expect(p1).toBeGreaterThan(p2)
  })
})

describe('solveStrikeForDelta — the regression from the brief', () => {
  it('MSFT: spot 513.53, 7 days, 27% vol, 5-delta call, 2.5 increment → 547.5', () => {
    const strike = solveStrikeForDelta(513.53, 7 / 365, 0.27, 'call', 0.05, 2.5)
    expect(strike).toBe(547.5)
    const delta = bsDelta(513.53, strike, 7 / 365, 0.27, 'call')
    expect(delta).toBeGreaterThan(0.044)
    expect(delta).toBeLessThan(0.05)
    const credit = bsPrice(513.53, strike, 7 / 365, 0.27, 'call') * 100
    // The brief says ≈ $37/contract.
    expect(credit).toBeGreaterThan(30)
    expect(credit).toBeLessThan(45)
  })

  it('rounds AWAY from the money: put strikes round down', () => {
    const put = solveStrikeForDelta(513.53, 7 / 365, 0.27, 'put', 0.05, 2.5)
    // Exact solve then floor to increment; realized |delta| must be ≤ target.
    expect(put % 2.5).toBeCloseTo(0, 9)
    expect(Math.abs(bsDelta(513.53, put, 7 / 365, 0.27, 'put'))).toBeLessThanOrEqual(0.05)
    expect(put).toBeLessThan(513.53)
  })

  it('rounded call strike keeps realized delta at or below target', () => {
    for (const target of [0.03, 0.05, 0.08]) {
      const k = solveStrikeForDelta(342.88, 7 / 365, 0.36, 'call', target, 2.5)
      expect(Math.abs(bsDelta(342.88, k, 7 / 365, 0.36, 'call'))).toBeLessThanOrEqual(target + 1e-9)
    }
  })
})

describe('impliedVol', () => {
  it('round-trips a Black-Scholes price', () => {
    const S = 513.53, K = 547.5, T = 7 / 365, vol = 0.27
    const price = bsPrice(S, K, T, vol, 'call')
    const iv = impliedVol(price, S, K, T, 'call')
    expect(iv).not.toBeNull()
    expect(iv!).toBeCloseTo(vol, 4)
  })

  it('rejects prices outside no-arbitrage bounds', () => {
    expect(impliedVol(0, 500, 520, 7 / 365, 'call')).toBeNull()
    expect(impliedVol(600, 500, 520, 7 / 365, 'call')).toBeNull()
  })
})

describe('returnOnCollateral', () => {
  it('annualizes a weekly credit', () => {
    // $0.37 credit on a $547.50-collateral put over 7 days ≈ 3.5% annualized
    const roc = returnOnCollateral(0.37, 547.5, 7)
    expect(roc).toBeCloseTo((0.37 / 547.5) * (365 / 7), 8)
  })
  it('is zero on bad inputs', () => {
    expect(returnOnCollateral(1, 0, 7)).toBe(0)
    expect(returnOnCollateral(1, 100, 0)).toBe(0)
  })
})

describe('realizedVol', () => {
  it('returns null with too little history', () => {
    expect(realizedVol([100, 101, 102])).toBeNull()
  })
  it('computes an annualized figure on synthetic data', () => {
    // Constant 1% daily moves → stdev of alternating ±1% log returns ≈ 1% × √252
    const closes: number[] = [100]
    for (let i = 0; i < 30; i++) closes.push(closes[i]! * (i % 2 === 0 ? 1.01 : 0.99))
    const rv = realizedVol(closes, 21)
    expect(rv).not.toBeNull()
    expect(rv!).toBeGreaterThan(0.1)
    expect(rv!).toBeLessThan(0.25)
  })
})

describe('baseRateBreach', () => {
  it('counts overlapping windows where any close breaches the move', () => {
    // 10 flat closes then a 10% jump held: up-moves of 10% appear only in
    // windows that straddle the jump.
    const closes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 110, 110, 110, 110, 110]
    const res = baseRateBreach(closes, 5, 0.099, 'call')
    expect(res.windows).toBe(10) // starts at indices 0..9, each with 5 later closes
    expect(res.breaches).toBe(5) // starts at indices 5..9 reach the 110 close
    expect(baseRateBreach(closes, 5, 0.099, 'put').breaches).toBe(0)
  })

  it('a put breach needs a down move', () => {
    const closes = [100, 100, 100, 100, 100, 100, 90, 90, 90, 90, 90, 90]
    const res = baseRateBreach(closes, 5, 0.099, 'put')
    expect(res.breaches).toBeGreaterThan(0)
    expect(baseRateBreach(closes, 5, 0.099, 'call').breaches).toBe(0)
  })
})

describe('modelDisagrees', () => {
  it('flags when history exceeds twice the modelled delta', () => {
    const base = { windows: 45, breaches: 8, rate: 8 / 45, caveat: '' }
    expect(modelDisagrees(0.047, base)).toBe(true)
    expect(modelDisagrees(0.1, base)).toBe(false)
  })
  it('does not flag on tiny samples', () => {
    const base = { windows: 6, breaches: 2, rate: 1 / 3, caveat: '' }
    expect(modelDisagrees(0.05, base)).toBe(false)
  })
})

describe('greeks sanity', () => {
  it('theta is negative for a short-dated OTM call, vega positive', () => {
    const g = bsGreeks(513.53, 547.5, 7 / 365, 0.27, 'call')
    expect(g.theta).toBeLessThan(0)
    expect(g.vega).toBeGreaterThan(0)
    expect(g.gamma).toBeGreaterThan(0)
  })
})
