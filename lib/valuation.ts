/*
  Valuation picks the SIDE; delta picks the STRIKE. These stay orthogonal.

  Five inputs, each shown separately, never a black box:
    v1 — 52-week range position (0 = at low, 1 = at high)
    v2 — analyst consensus target upside (target ÷ spot − 1)
    v3 — forward P/E vs the name's own 5-year median (ratio − 1)
    v4 — dividend yield vs its own median (ratio − 1) — the PRIMARY input for
         REITs, BDCs and yield vehicles, where a P/E means nothing
    v5 — the owner's own thesis (−1 deep value … +1 rich), weighted DOUBLE and
         requiring a written rationale

  Fewer than three populated inputs ⇒ no band, gate defaults to BOTH SIDES.
  (A two-input version collapsed everything to Fair — worse than no model.)
*/

export type Band = 'deep_value' | 'undervalued' | 'fair' | 'rich' | 'overvalued'
export type Gate = 'puts_only' | 'both' | 'calls_only'

export interface ValuationInputs {
  v1RangePosition?: number | null
  v2AnalystUpside?: number | null
  v3PeVsMedian?: number | null
  v4YieldVsMedian?: number | null
  v5Thesis?: number | null
  v5Rationale?: string | null
}

export interface ValuationResult {
  inputsPopulated: number
  composite: number | null // −1 (deep value) … +1 (overvalued)
  band: Band | null
  gate: Gate
  insufficient: boolean
  /** Per-input normalized richness scores, for the always-visible breakdown. */
  components: { key: string; label: string; raw: number | null; score: number | null; weight: number }[]
}

const clamp = (x: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, x))

/** Map each raw input to a richness score in [−1, +1]. */
function scores(i: ValuationInputs) {
  return [
    {
      key: 'v1',
      label: '52-week range position',
      raw: i.v1RangePosition ?? null,
      // 0.5 of range = neutral; at the high = +1, at the low = −1
      score: i.v1RangePosition == null ? null : clamp((i.v1RangePosition - 0.5) * 2),
      weight: 1,
    },
    {
      key: 'v2',
      label: 'Analyst consensus target',
      raw: i.v2AnalystUpside ?? null,
      // 15% upside ≈ fairly cheap; −15% (trading above target) ≈ rich
      score: i.v2AnalystUpside == null ? null : clamp(-i.v2AnalystUpside / 0.15),
      weight: 1,
    },
    {
      key: 'v3',
      label: 'Forward P/E vs own 5-yr median',
      raw: i.v3PeVsMedian ?? null,
      score: i.v3PeVsMedian == null ? null : clamp(i.v3PeVsMedian / 0.3),
      weight: 1,
    },
    {
      key: 'v4',
      label: 'Dividend yield vs own median',
      raw: i.v4YieldVsMedian ?? null,
      // Yield ABOVE its median = cheap ⇒ negative richness
      score: i.v4YieldVsMedian == null ? null : clamp(-i.v4YieldVsMedian / 0.25),
      weight: 1,
    },
    {
      key: 'v5',
      label: 'Owner thesis (weighted double)',
      raw: i.v5Thesis ?? null,
      score: i.v5Thesis == null ? null : clamp(i.v5Thesis),
      weight: 2,
    },
  ]
}

export function bandFromComposite(c: number): Band {
  if (c <= -0.5) return 'deep_value'
  if (c <= -0.2) return 'undervalued'
  if (c < 0.2) return 'fair'
  if (c < 0.5) return 'rich'
  return 'overvalued'
}

export function gateFromBand(band: Band | null): Gate {
  if (band === 'deep_value' || band === 'undervalued') return 'puts_only'
  if (band === 'rich' || band === 'overvalued') return 'calls_only'
  return 'both'
}

export function computeValuation(inputs: ValuationInputs): ValuationResult {
  const comps = scores(inputs)
  // A thesis without a written rationale does not count as populated.
  const usable = comps.filter(
    (c) => c.score != null && (c.key !== 'v5' || Boolean(inputs.v5Rationale?.trim())),
  )
  const populated = usable.length
  if (populated < 3) {
    return {
      inputsPopulated: populated,
      composite: null,
      band: null,
      gate: 'both',
      insufficient: true,
      components: comps,
    }
  }
  const wSum = usable.reduce((s, c) => s + c.weight, 0)
  const composite = usable.reduce((s, c) => s + c.score! * c.weight, 0) / wSum
  const band = bandFromComposite(composite)
  return {
    inputsPopulated: populated,
    composite,
    band,
    gate: gateFromBand(band),
    insufficient: false,
    components: comps,
  }
}

/**
 * A provisional read from fewer than three inputs — shown as information,
 * never as a gate. This is how the 28-Aug bands (MSFT rich, META cheap) are
 * surfaced while the gate stays at Both sides.
 */
export function provisionalRead(inputs: ValuationInputs): { composite: number; band: Band } | null {
  const comps = scores(inputs).filter((c) => c.score != null)
  if (comps.length === 0) return null
  const wSum = comps.reduce((s, c) => s + c.weight, 0)
  const composite = comps.reduce((s, c) => s + c.score! * c.weight, 0) / wSum
  return { composite, band: bandFromComposite(composite) }
}

/**
 * Valuation may shade the strike target by one increment — to ~7 delta — when
 * deep value meets puts or overvalued meets calls. NEVER past 8 delta.
 */
export function deltaTargetFor(band: Band | null, type: 'call' | 'put'): number {
  const base = 0.05
  if (band === 'deep_value' && type === 'put') return 0.07
  if (band === 'overvalued' && type === 'call') return 0.07
  return base
}

/** The hard bound. 3–8 delta is the rule; outside it is a recorded deviation. */
export const DELTA_BAND = { min: 0.03, max: 0.08 } as const

export function insideDeltaBand(delta: number): boolean {
  const a = Math.abs(delta)
  return a >= DELTA_BAND.min - 1e-9 && a <= DELTA_BAND.max + 1e-9
}

export const BAND_LABELS: Record<Band, string> = {
  deep_value: 'Deep value',
  undervalued: 'Undervalued',
  fair: 'Fair',
  rich: 'Rich',
  overvalued: 'Overvalued',
}

export const GATE_LABELS: Record<Gate, string> = {
  puts_only: 'Puts only — assignment is the goal',
  both: 'Both sides',
  calls_only: 'Calls only — happy to be trimmed',
}
