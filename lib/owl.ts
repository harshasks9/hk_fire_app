/*
  OWL is an exit programme, not a premium trade. At $12 with 50-cent strikes a
  7-day 5-delta call is worth about a dollar a contract — not a business. The
  honest framing: OWL is ~28% of the book, in breach of the 15% concentration
  limit, and getting trimmed is the DESIRED outcome. So this sleeve writes
  30–45 DTE calls at 15–20 delta and labels assignment as progress.
*/
import { bsDelta, bsPrice, solveStrikeForDelta } from './options'
import { daysBetween } from './week'

export interface OwlSleeveConfig {
  dteMin: number
  dteMax: number
  deltaTarget: number // 0.15–0.20
  lotsPerCycle: number
  targetPct: number // the concentration line, 0.15
}

export const OWL_SLEEVE_DEFAULTS: OwlSleeveConfig = {
  dteMin: 30,
  dteMax: 45,
  deltaTarget: 0.175,
  lotsPerCycle: 300,
  targetPct: 0.15,
}

export interface OwlSleeveView {
  spot: number
  shares: number
  positionValue: number
  equity: number
  exposurePct: number
  targetPct: number
  /** Dollars and shares above the 15% line. */
  excessValue: number
  excessShares: number
  /** The next cycle's modelled ticket. */
  expiry: string
  dte: number
  strike: number
  delta: number
  creditPerContract: number
  creditPerCycle: number
  annualizedCredit: number
  /** Chance this cycle trims (≈ |delta| as a rough assignment proxy). */
  trimChance: number
  sharesTrimmedIfCalled: number
  trimPriceVsSpotPct: number
}

/** Next Friday at least `dteMin` days out, at most `dteMax` (falls back to dteMin+). */
export function owlExpiry(todayIso: string, cfg: OwlSleeveConfig): { expiry: string; dte: number } {
  const start = new Date(todayIso + 'T00:00:00Z')
  for (let d = cfg.dteMin; d <= cfg.dteMax + 6; d++) {
    const cand = new Date(start.getTime() + d * 86_400_000)
    if (cand.getUTCDay() === 5) return { expiry: cand.toISOString().slice(0, 10), dte: d }
  }
  const fallback = new Date(start.getTime() + cfg.dteMin * 86_400_000)
  return { expiry: fallback.toISOString().slice(0, 10), dte: cfg.dteMin }
}

export function owlSleeveView(
  spot: number,
  shares: number,
  equity: number,
  vol: number,
  todayIso: string,
  cfg: OwlSleeveConfig = OWL_SLEEVE_DEFAULTS,
): OwlSleeveView {
  const { expiry, dte } = owlExpiry(todayIso, cfg)
  const T = dte / 365
  const strike = solveStrikeForDelta(spot, T, vol, 'call', cfg.deltaTarget, 0.5)
  const delta = bsDelta(spot, strike, T, vol, 'call')
  const credit = bsPrice(spot, strike, T, vol, 'call') * 100
  const positionValue = shares * spot
  const exposurePct = equity > 0 ? positionValue / equity : 0
  const lineValue = equity * cfg.targetPct
  const excessValue = Math.max(0, positionValue - lineValue)
  const excessShares = spot > 0 ? Math.ceil(excessValue / spot) : 0
  return {
    spot,
    shares,
    positionValue,
    equity,
    exposurePct,
    targetPct: cfg.targetPct,
    excessValue,
    excessShares,
    expiry,
    dte,
    strike,
    delta,
    creditPerContract: credit,
    creditPerCycle: credit * cfg.lotsPerCycle,
    annualizedCredit: credit * cfg.lotsPerCycle * (365 / dte),
    trimChance: Math.abs(delta),
    sharesTrimmedIfCalled: cfg.lotsPerCycle * 100,
    trimPriceVsSpotPct: spot > 0 ? strike / spot - 1 : 0,
  }
}
