/*
  Aggregate limits, computed from LIVE equity, never from constants.

  L1 aggregate short-put obligation ≤ $1,250,000
  L2 ≤ 12 concurrent positions
  L3 ≤ $400,000 single-name put obligation
  L4 ≤ 15% single-name exposure (OWL and MSFT breach this today — shown on
      the home screen from day one)
  L7 ≤ 5 live underlyings
  L8 two E2 stops inside a week pauses writing
  (L5/L6 are not part of the v2 rulebook; numbering kept to match it.)

  Coverage: a covered call needs 100 shares per contract. MSFT 1,752 shares
  supports 17 contracts — warn at 17, block at 18. META 547 supports 5 — cap 5.
*/

export interface OpenPositionLite {
  symbol: string
  type: 'call' | 'put'
  strike: number
  lots: number
}

export interface HoldingLite {
  symbol: string
  shares: number
  mark: number // latest close (or avg price when no close exists)
}

export interface LimitCheck {
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L7' | 'L8'
  label: string
  used: number
  bound: number
  ok: boolean
  detail: string
}

export const LIMITS = {
  putObligationAggregate: 1_250_000,
  concurrentPositions: 12,
  putObligationSingleName: 400_000,
  singleNameExposurePct: 0.15,
  liveUnderlyings: 5,
  e2StopsPerWeekPause: 2,
} as const

export function putObligation(p: OpenPositionLite): number {
  return p.type === 'put' ? p.strike * p.lots * 100 : 0
}

export function equityFromHoldings(holdings: HoldingLite[]): number {
  return holdings.reduce((s, h) => s + h.shares * h.mark, 0)
}

export function checkLimits(
  open: OpenPositionLite[],
  holdings: HoldingLite[],
  e2StopsThisWeek: number,
): LimitCheck[] {
  const equity = equityFromHoldings(holdings)
  const l4Bound = equity * LIMITS.singleNameExposurePct

  const aggPut = open.reduce((s, p) => s + putObligation(p), 0)
  const byNamePut = new Map<string, number>()
  for (const p of open) {
    if (p.type === 'put') byNamePut.set(p.symbol, (byNamePut.get(p.symbol) ?? 0) + putObligation(p))
  }
  const worstPutName = [...byNamePut.entries()].sort((a, b) => b[1] - a[1])[0]

  const exposures = holdings
    .map((h) => ({ symbol: h.symbol, value: h.shares * h.mark }))
    .sort((a, b) => b.value - a.value)
  const breaches = exposures.filter((e) => e.value > l4Bound)

  const underlyings = new Set(open.map((p) => p.symbol))

  return [
    {
      id: 'L1',
      label: 'Aggregate short-put obligation',
      used: aggPut,
      bound: LIMITS.putObligationAggregate,
      ok: aggPut <= LIMITS.putObligationAggregate,
      detail: `$${Math.round(aggPut).toLocaleString()} of $${LIMITS.putObligationAggregate.toLocaleString()}`,
    },
    {
      id: 'L2',
      label: 'Concurrent positions',
      used: open.length,
      bound: LIMITS.concurrentPositions,
      ok: open.length <= LIMITS.concurrentPositions,
      detail: `${open.length} of ${LIMITS.concurrentPositions}`,
    },
    {
      id: 'L3',
      label: 'Single-name put obligation',
      used: worstPutName?.[1] ?? 0,
      bound: LIMITS.putObligationSingleName,
      ok: (worstPutName?.[1] ?? 0) <= LIMITS.putObligationSingleName,
      detail: worstPutName
        ? `${worstPutName[0]} $${Math.round(worstPutName[1]).toLocaleString()} of $${LIMITS.putObligationSingleName.toLocaleString()}`
        : 'no short puts',
    },
    {
      id: 'L4',
      label: 'Single-name exposure ≤ 15% of equity',
      used: exposures[0]?.value ?? 0,
      bound: l4Bound,
      ok: breaches.length === 0,
      detail:
        breaches.length === 0
          ? `largest ${exposures[0]?.symbol ?? '—'} ${equity > 0 ? (((exposures[0]?.value ?? 0) / equity) * 100).toFixed(1) : '0'}%`
          : breaches
              .map((b) => `${b.symbol} ${((b.value / equity) * 100).toFixed(1)}%`)
              .join(', ') + ` — 15% line is $${Math.round(l4Bound).toLocaleString()}`,
    },
    {
      id: 'L7',
      label: 'Live underlyings',
      used: underlyings.size,
      bound: LIMITS.liveUnderlyings,
      ok: underlyings.size <= LIMITS.liveUnderlyings,
      detail: `${underlyings.size} of ${LIMITS.liveUnderlyings} (${[...underlyings].join(', ') || 'none'})`,
    },
    {
      id: 'L8',
      label: 'E2 stops this week',
      used: e2StopsThisWeek,
      bound: LIMITS.e2StopsPerWeekPause,
      ok: e2StopsThisWeek < LIMITS.e2StopsPerWeekPause,
      detail:
        e2StopsThisWeek >= LIMITS.e2StopsPerWeekPause
          ? `${e2StopsThisWeek} E2 stops this week — writing is PAUSED`
          : `${e2StopsThisWeek} of ${LIMITS.e2StopsPerWeekPause}`,
    },
  ]
}

export interface CoverageCheck {
  symbol: string
  coverable: number // floor(shares / 100)
  proposedLots: number
  level: 'ok' | 'warn' | 'block'
  detail: string
}

/** Warn when a write uses every coverable contract; block when it exceeds them. */
export function checkCallCoverage(symbol: string, shares: number, proposedLots: number): CoverageCheck {
  const coverable = Math.floor(shares / 100)
  const spare = shares - proposedLots * 100
  if (proposedLots > coverable) {
    return {
      symbol,
      coverable,
      proposedLots,
      level: 'block',
      detail: `${proposedLots} lots needs ${proposedLots * 100} shares; only ${shares} held — ${proposedLots * 100 - shares} would be naked. Blocked.`,
    }
  }
  if (proposedLots === coverable) {
    return {
      symbol,
      coverable,
      proposedLots,
      level: 'warn',
      detail: `${proposedLots} lots uses every coverable share (${spare} spare) — at the coverage ceiling.`,
    }
  }
  return { symbol, coverable, proposedLots, level: 'ok', detail: `${proposedLots} of ${coverable} coverable; ${spare} shares spare.` }
}

/** Which ticket to drop when a limit binds: the largest obligation first, and why. */
export function ticketToDrop(
  proposed: OpenPositionLite[],
  open: OpenPositionLite[],
  holdings: HoldingLite[],
): { index: number; why: string } | null {
  for (let drop = -1; drop < proposed.length; drop++) {
    const kept = proposed.filter((_, i) => i !== drop)
    const checks = checkLimits([...open, ...kept], holdings, 0).filter((c) => c.id !== 'L4' && c.id !== 'L8')
    if (checks.every((c) => c.ok)) {
      if (drop === -1) return null
      const t = proposed[drop]!
      return {
        index: drop,
        why: `Dropping ${t.symbol} ${t.strike} ${t.type} ×${t.lots} brings every aggregate limit back inside its bound.`,
      }
    }
  }
  // No single drop fixes it — drop the largest put obligation and re-run.
  const worst = proposed
    .map((p, i) => ({ i, ob: putObligation(p) }))
    .sort((a, b) => b.ob - a.ob)[0]
  if (!worst || worst.ob === 0) return null
  const t = proposed[worst.i]!
  return { index: worst.i, why: `No single drop clears the limits; start with the largest obligation — ${t.symbol} ${t.strike} ${t.type} ×${t.lots}.` }
}
