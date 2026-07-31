import type { ForensicMemo } from './types'
import { OWL_MEMO } from './owl'
import { PAX_MEMO } from './pax'

export * from './types'

export const FORENSIC_MEMOS: ForensicMemo[] = [OWL_MEMO, PAX_MEMO]

export function forensicMemo(symbol: string): ForensicMemo | undefined {
  return FORENSIC_MEMOS.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase())
}

/** Probability-weighted fair value across the memo's scenarios. */
export function weightedValue(memo: ForensicMemo): number {
  return memo.scenarios.reduce((sum, s) => sum + s.probability * s.targetPrice, 0)
}

/** Upside to the probability-weighted fair value, in percent. */
export function weightedUpsidePct(memo: ForensicMemo): number {
  return ((weightedValue(memo) - memo.price) / memo.price) * 100
}

/** Probability-weighted expected five-year annualised return, in percent. */
export function weightedIrrPct(memo: ForensicMemo): number {
  return memo.scenarios.reduce((sum, s) => sum + s.probability * s.fiveYrIrrPct, 0)
}

/** Sum of the sum-of-the-parts components, in $m. */
export function sotpTotal(memo: ForensicMemo): number {
  return memo.sotp.reduce((sum, r) => sum + r.value, 0)
}

/** Sum-of-the-parts value per diluted share. */
export function sotpPerShare(memo: ForensicMemo): number {
  return sotpTotal(memo) / memo.dilutedShares
}

/** Mean of the AUM quality scorecard, 0-10. */
export function aumQualityScore(memo: ForensicMemo): number {
  if (!memo.aumScorecard.length) return 0
  return memo.aumScorecard.reduce((s, r) => s + r.score, 0) / memo.aumScorecard.length
}

/** Share of tiered facts that are A or B (i.e. reported or our own arithmetic on reported figures). */
export function primarySourceSharePct(memo: ForensicMemo): number {
  const tiers = memo.sources.map((s) => s.tier)
  if (!tiers.length) return 0
  return (tiers.filter((t) => t === 'A' || t === 'B').length / tiers.length) * 100
}
