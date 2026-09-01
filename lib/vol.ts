/*
  Volatility blend: 30% realized (21-day annualized from stored closes) +
  70% IV calibrated from the owner's actual logged fills (most recent five).
  Calibrated IV is the highest-quality signal in the system because a fill is
  a real transacted price, not a screen quote or a model.
*/
import { impliedVol, realizedVol } from './options'

export interface FillForCalibration {
  spot: number // underlying close on fill date
  strike: number
  T: number // years to expiry at fill
  type: 'call' | 'put'
  pricePerShare: number // actual credit per share
}

export interface VolBlend {
  realized21d: number | null
  calibratedIv: number | null
  calibrationFills: number
  blended: number
  source: 'blend' | 'realized_only' | 'calibrated_only' | 'seed'
}

export function calibratedIvFromFills(fills: FillForCalibration[]): { iv: number; used: number } | null {
  const ivs: number[] = []
  for (const f of fills.slice(0, 5)) {
    const iv = impliedVol(f.pricePerShare, f.spot, f.strike, f.T, f.type)
    if (iv != null && iv > 0.01 && iv < 4) ivs.push(iv)
  }
  if (ivs.length === 0) return null
  return { iv: ivs.reduce((s, v) => s + v, 0) / ivs.length, used: ivs.length }
}

export function blendVol(
  closes: number[],
  fills: FillForCalibration[],
  seedIv: number | null,
): VolBlend {
  const rv = realizedVol(closes, 21)
  const cal = calibratedIvFromFills(fills)
  // Seed IV was itself solved from his fills, so it stands in for the
  // calibrated leg until five live fills accumulate.
  const calibrated = cal?.iv ?? seedIv ?? null

  if (rv != null && calibrated != null) {
    return {
      realized21d: rv,
      calibratedIv: calibrated,
      calibrationFills: cal?.used ?? 0,
      blended: 0.3 * rv + 0.7 * calibrated,
      source: cal ? 'blend' : 'seed',
    }
  }
  if (calibrated != null) {
    return { realized21d: rv, calibratedIv: calibrated, calibrationFills: cal?.used ?? 0, blended: calibrated, source: cal ? 'calibrated_only' : 'seed' }
  }
  if (rv != null) {
    return { realized21d: rv, calibratedIv: null, calibrationFills: 0, blended: rv, source: 'realized_only' }
  }
  // Nothing at all — a conservative default, flagged by source.
  return { realized21d: null, calibratedIv: null, calibrationFills: 0, blended: 0.35, source: 'seed' }
}
