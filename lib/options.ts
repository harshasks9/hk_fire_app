/*
  Pure options math. Every number the app shows comes from here (or from a
  broker fill the owner typed in) — never from a language model.

  Conventions:
  - T is in YEARS: calendar days ÷ 365.
  - vol is annualized, as a fraction (0.27 = 27%).
  - Prices are PER SHARE; multiply by 100 for a contract.
  - Deltas are signed (puts negative). Use Math.abs for display.
*/

export type OptionType = 'call' | 'put'

/** Default risk-free rate when no better figure is supplied. */
export const DEFAULT_RATE = 0.04

/** Standard normal PDF. */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, |err| < 1.5e-7). */
export function normCdf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax)
  return 0.5 * (1 + sign * y)
}

function d1d2(spot: number, strike: number, T: number, vol: number, rate: number): [number, number] {
  const sqT = Math.sqrt(T)
  const d1 = (Math.log(spot / strike) + (rate + (vol * vol) / 2) * T) / (vol * sqT)
  return [d1, d1 - vol * sqT]
}

/** Black-Scholes price per share. */
export function bsPrice(
  spot: number,
  strike: number,
  T: number,
  vol: number,
  type: OptionType,
  rate: number = DEFAULT_RATE,
): number {
  if (spot <= 0 || strike <= 0) throw new Error('spot and strike must be positive')
  if (T <= 0) {
    // At expiry the option is worth intrinsic value.
    return type === 'call' ? Math.max(0, spot - strike) : Math.max(0, strike - spot)
  }
  if (vol <= 0) {
    const fwdDisc = strike * Math.exp(-rate * T)
    return type === 'call' ? Math.max(0, spot - fwdDisc) : Math.max(0, fwdDisc - spot)
  }
  const [d1, d2] = d1d2(spot, strike, T, vol, rate)
  const df = Math.exp(-rate * T)
  if (type === 'call') return spot * normCdf(d1) - strike * df * normCdf(d2)
  return strike * df * normCdf(-d2) - spot * normCdf(-d1)
}

/** Black-Scholes delta, signed: calls in (0,1), puts in (-1,0). */
export function bsDelta(
  spot: number,
  strike: number,
  T: number,
  vol: number,
  type: OptionType,
  rate: number = DEFAULT_RATE,
): number {
  if (T <= 0 || vol <= 0) {
    const itm = type === 'call' ? spot > strike : spot < strike
    return type === 'call' ? (itm ? 1 : 0) : itm ? -1 : 0
  }
  const [d1] = d1d2(spot, strike, T, vol, rate)
  return type === 'call' ? normCdf(d1) : normCdf(d1) - 1
}

/** Remaining greeks, for the pro view. Theta is per calendar day; vega per vol point (1%). */
export function bsGreeks(
  spot: number,
  strike: number,
  T: number,
  vol: number,
  type: OptionType,
  rate: number = DEFAULT_RATE,
): { delta: number; gamma: number; theta: number; vega: number } {
  if (T <= 0 || vol <= 0) {
    return { delta: bsDelta(spot, strike, T, vol, type, rate), gamma: 0, theta: 0, vega: 0 }
  }
  const [d1, d2] = d1d2(spot, strike, T, vol, rate)
  const sqT = Math.sqrt(T)
  const df = Math.exp(-rate * T)
  const gamma = normPdf(d1) / (spot * vol * sqT)
  const vega = (spot * normPdf(d1) * sqT) / 100
  const common = -(spot * normPdf(d1) * vol) / (2 * sqT)
  const thetaYear =
    type === 'call'
      ? common - rate * strike * df * normCdf(d2)
      : common + rate * strike * df * normCdf(-d2)
  return { delta: bsDelta(spot, strike, T, vol, type, rate), gamma, theta: thetaYear / 365, vega }
}

/**
 * Find the strike whose |delta| equals targetDelta, by bisection, then round
 * AWAY from the money to the nearest increment (up for calls, down for puts).
 * Rounding away keeps the realized delta at or below the target — the
 * conservative side of the rule.
 */
export function solveStrikeForDelta(
  spot: number,
  T: number,
  vol: number,
  type: OptionType,
  targetDelta: number,
  increment: number,
  rate: number = DEFAULT_RATE,
): number {
  if (targetDelta <= 0 || targetDelta >= 1) throw new Error('targetDelta must be in (0,1)')
  if (increment <= 0) throw new Error('increment must be positive')
  // |delta| falls monotonically as the strike moves out of the money.
  let lo: number
  let hi: number
  if (type === 'call') {
    lo = spot // |delta| ≈ 0.5+ here
    hi = spot * Math.exp(8 * vol * Math.sqrt(T)) // far OTM, |delta| ≈ 0
  } else {
    lo = spot * Math.exp(-8 * vol * Math.sqrt(T))
    hi = spot
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const d = Math.abs(bsDelta(spot, mid, T, vol, type, rate))
    if (type === 'call') {
      if (d > targetDelta) lo = mid
      else hi = mid
    } else {
      if (d > targetDelta) hi = mid
      else lo = mid
    }
  }
  const exact = (lo + hi) / 2
  const rounded =
    type === 'call'
      ? Math.ceil(exact / increment - 1e-9) * increment
      : Math.floor(exact / increment + 1e-9) * increment
  // Guard float artifacts like 547.4999999.
  return Math.round(rounded / increment) * increment
}

/** Implied vol from a transacted price, by bisection. Returns null if the price is outside no-arbitrage bounds. */
export function impliedVol(
  price: number,
  spot: number,
  strike: number,
  T: number,
  type: OptionType,
  rate: number = DEFAULT_RATE,
): number | null {
  if (T <= 0 || price <= 0) return null
  const intrinsic = bsPrice(spot, strike, T, 1e-9, type, rate)
  const max = bsPrice(spot, strike, T, 5, type, rate)
  if (price <= intrinsic || price >= max) return null
  let lo = 1e-4
  let hi = 5
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (bsPrice(spot, strike, T, mid, type, rate) > price) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/**
 * Annualized return on collateral. For a cash-secured put the collateral is
 * the strike; for a covered call it is the share value backing the contract.
 */
export function returnOnCollateral(
  creditPerShare: number,
  collateralPerShare: number,
  calendarDays: number,
): number {
  if (collateralPerShare <= 0 || calendarDays <= 0) return 0
  return (creditPerShare / collateralPerShare) * (365 / calendarDays)
}

/** Annualized realized vol from daily closes: stdev of log returns over the last `lookback` sessions × √252. */
export function realizedVol(closes: number[], lookback = 21): number | null {
  const usable = closes.filter((c) => c > 0)
  if (usable.length < lookback + 1) return null
  const window = usable.slice(-(lookback + 1))
  const rets: number[] = []
  for (let i = 1; i < window.length; i++) rets.push(Math.log(window[i]! / window[i - 1]!))
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length
  const varSum = rets.reduce((s, r) => s + (r - mean) * (r - mean), 0) / (rets.length - 1)
  return Math.sqrt(varSum) * Math.sqrt(252)
}

export interface BaseRateResult {
  windows: number
  breaches: number
  rate: number
  /** Honest label: these windows overlap and are dominated by recent regime. */
  caveat: string
}

/**
 * Historical base rate of a breach: over every overlapping `horizon`-trading-day
 * window in `closes` (oldest first), how often did the underlying move at least
 * `movePct` in the direction that breaches the strike?
 *
 * A short call is breached by an UP move (any close in the window ≥ start × (1+movePct));
 * a short put by a DOWN move. movePct is a positive fraction, e.g. 0.066.
 */
export function baseRateBreach(
  closes: number[],
  horizon: number,
  movePct: number,
  type: OptionType,
): BaseRateResult {
  const usable = closes.filter((c) => c > 0)
  let windows = 0
  let breaches = 0
  for (let i = 0; i + horizon < usable.length; i++) {
    windows++
    const start = usable[i]!
    let breached = false
    for (let j = i + 1; j <= i + horizon; j++) {
      const move = usable[j]! / start - 1
      if (type === 'call' ? move >= movePct : move <= -movePct) {
        breached = true
        break
      }
    }
    if (breached) breaches++
  }
  return {
    windows,
    breaches,
    rate: windows > 0 ? breaches / windows : 0,
    caveat: `recent regime, small sample — ${windows} overlapping windows, autocorrelated`,
  }
}

/**
 * The disagreement check: when history breaches at more than twice the modelled
 * delta, the model is not describing this stock in this regime. Requires a
 * minimum window count so noise can't trip it.
 */
export function modelDisagrees(modelDelta: number, baseRate: BaseRateResult, minWindows = 20): boolean {
  if (baseRate.windows < minWindows) return false
  return baseRate.rate > 2 * Math.abs(modelDelta) && baseRate.breaches >= 2
}
