import { describe, it, expect } from 'vitest'
import {
  FORENSIC_MEMOS,
  forensicMemo,
  weightedValue,
  weightedUpsidePct,
  weightedIrrPct,
  sotpTotal,
  sotpPerShare,
  aumQualityScore,
  TIER_META,
} from '@/research/forensic'

describe('forensic memo registry', () => {
  it('covers OWL and PAX and is case-insensitive on lookup', () => {
    expect(FORENSIC_MEMOS.map((m) => m.symbol).sort()).toEqual(['OWL', 'PAX'])
    expect(forensicMemo('owl')?.symbol).toBe('OWL')
    expect(forensicMemo('PaX')?.symbol).toBe('PAX')
    expect(forensicMemo('NOPE')).toBeUndefined()
  })
})

describe.each(FORENSIC_MEMOS)('$symbol memo completeness', (memo) => {
  it('carries every required artefact from the prompt output contract', () => {
    expect(memo.headlineStats.length).toBeGreaterThanOrEqual(6)
    expect(memo.quarter.length).toBeGreaterThanOrEqual(8)
    expect(memo.history.length).toBeGreaterThanOrEqual(5)
    expect(memo.bridge.terms.length).toBeGreaterThanOrEqual(5)
    expect(memo.scorecard.length).toBeGreaterThanOrEqual(6)
    expect(memo.narrative.length).toBeGreaterThanOrEqual(5)
    expect(memo.segments.length).toBeGreaterThanOrEqual(3)
    expect(memo.aumScorecard.length).toBeGreaterThanOrEqual(6)
    expect(memo.dividendCoverage.length).toBeGreaterThanOrEqual(4)
    expect(memo.peers.length).toBeGreaterThanOrEqual(5)
    expect(memo.valuation.length).toBeGreaterThanOrEqual(4)
    expect(memo.sotp.length).toBeGreaterThanOrEqual(4)
    expect(memo.implied.length).toBeGreaterThanOrEqual(5)
    expect(memo.risks.length).toBeGreaterThanOrEqual(5)
    expect(memo.conclusions).toHaveLength(12)
    expect(memo.questionsForManagement.length).toBeGreaterThanOrEqual(5)
    expect(memo.sources.length).toBeGreaterThanOrEqual(8)
  })

  it('states exactly three falsifiable predictions, each dated and thresholded', () => {
    expect(memo.predictions).toHaveLength(3)
    for (const p of memo.predictions) {
      expect(p.threshold.length).toBeGreaterThan(5)
      expect(p.by.length).toBeGreaterThan(4)
      expect(p.ifWrong.length).toBeGreaterThan(20)
    }
  })

  it('pre-commits kill criteria and names three monitoring KPIs', () => {
    expect(memo.killCriteria.length).toBeGreaterThanOrEqual(4)
    expect(memo.kpis).toHaveLength(3)
    for (const k of memo.kpis) {
      expect(k.green).toBeTruthy()
      expect(k.red).toBeTruthy()
    }
  })

  it('argues against itself before concluding', () => {
    // A red team that is shorter than the adjudication is a caricature, not a case.
    expect(memo.redTeam.case.length).toBeGreaterThan(700)
    expect(memo.redTeam.adjudication.length).toBeGreaterThan(400)
  })

  it('discloses source limitations rather than hiding them', () => {
    expect(memo.sourceCaveat.length).toBeGreaterThan(200)
    for (const s of memo.sources) {
      expect(['A', 'B', 'C', 'D']).toContain(s.tier)
    }
    // At least some sources must be primary — a memo built only on aggregators is not forensic.
    expect(memo.sources.filter((s) => s.tier === 'A').length).toBeGreaterThanOrEqual(5)
  })

  it('tags every quarter row, history row and scorecard row with a confidence tier', () => {
    const tiers = Object.keys(TIER_META)
    for (const r of memo.quarter) expect(tiers).toContain(r.tier)
    for (const r of memo.history) expect(tiers).toContain(r.tier)
    for (const r of memo.scorecard) expect(tiers).toContain(r.tier)
    for (const r of memo.segments) expect(tiers).toContain(r.tier)
    for (const r of memo.peers) expect(tiers).toContain(r.tier)
    for (const f of memo.ownership) expect(tiers).toContain(f.tier)
  })
})

describe.each(FORENSIC_MEMOS)('$symbol internal arithmetic', (memo) => {
  it('scenario probabilities sum to one', () => {
    const total = memo.scenarios.reduce((s, x) => s + x.probability, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it('orders bear < base < bull on both value and return', () => {
    const bear = memo.scenarios.find((s) => s.name === 'Bear')!
    const base = memo.scenarios.find((s) => s.name === 'Base')!
    const bull = memo.scenarios.find((s) => s.name === 'Bull')!
    expect(bear.targetPrice).toBeLessThan(base.targetPrice)
    expect(base.targetPrice).toBeLessThan(bull.targetPrice)
    expect(bear.fiveYrIrrPct).toBeLessThan(base.fiveYrIrrPct)
    expect(base.fiveYrIrrPct).toBeLessThan(bull.fiveYrIrrPct)
  })

  it('states a bear case that is a genuine downturn, not a slower base case', () => {
    const bear = memo.scenarios.find((s) => s.name === 'Bear')!
    // Must imply a loss from the current price over five years.
    expect(bear.fiveYrIrrPct).toBeLessThan(0)
    expect(bear.targetPrice).toBeLessThan(memo.price)
  })

  it('computes a probability-weighted value consistent with the scenario set', () => {
    const wv = weightedValue(memo)
    const lo = Math.min(...memo.scenarios.map((s) => s.targetPrice))
    const hi = Math.max(...memo.scenarios.map((s) => s.targetPrice))
    expect(wv).toBeGreaterThan(lo)
    expect(wv).toBeLessThan(hi)
    expect(weightedUpsidePct(memo)).toBeCloseTo(((wv - memo.price) / memo.price) * 100, 6)
  })

  it('produces an expected return inside the scenario range', () => {
    const irr = weightedIrrPct(memo)
    expect(irr).toBeGreaterThan(Math.min(...memo.scenarios.map((s) => s.fiveYrIrrPct)))
    expect(irr).toBeLessThan(Math.max(...memo.scenarios.map((s) => s.fiveYrIrrPct)))
  })

  it('derives a sum-of-the-parts per-share value that lands inside the bear-to-bull range', () => {
    const ps = sotpPerShare(memo)
    expect(ps).toBeCloseTo(sotpTotal(memo) / memo.dilutedShares, 6)
    expect(ps).toBeGreaterThan(memo.scenarios[0].targetPrice)
    expect(ps).toBeLessThan(memo.scenarios[2].targetPrice)
  })

  it('charges the sum-of-the-parts for claims ahead of common shareholders', () => {
    // Debt, deferred consideration, minorities, TRA — a SOTP with no negative lines is not a SOTP.
    expect(memo.sotp.some((r) => r.value < 0)).toBe(true)
  })

  it('reconciles market capitalisation with price and diluted shares', () => {
    // dilutedShares is in millions, marketCap in $bn.
    const implied = (memo.price * memo.dilutedShares) / 1000
    expect(implied).toBeCloseTo(memo.marketCap, 1)
  })

  it('reconciles dividend yield with the declared dividend and price', () => {
    expect((memo.dividendPs / memo.price) * 100).toBeCloseTo(memo.dividendYieldPct, 1)
  })

  it('reports payout ratios consistent with the DE and dividend it lists', () => {
    for (const d of memo.dividendCoverage) {
      if (d.dePs === null || d.dividendPs === null || d.payoutPct === null) continue
      expect((d.dividendPs / d.dePs) * 100).toBeCloseTo(d.payoutPct, 0)
    }
  })

  it('keeps the FRE-to-DE bridge additive', () => {
    const steps = memo.earningsBridge.filter((b) => !b.isTotal)
    const total = memo.earningsBridge.find((b) => b.isTotal)!
    expect(steps.reduce((s, b) => s + b.value, 0)).toBeCloseTo(total.value, 1)
  })

  it('keeps the per-share trajectory series aligned and positive', () => {
    const { labels, frePs, dePs } = memo.trajectory
    expect(frePs).toHaveLength(labels.length)
    expect(dePs).toHaveLength(labels.length)
    for (const v of [...frePs, ...dePs]) expect(v).toBeGreaterThan(0)
  })

  it('indexes both series from a common base of 100', () => {
    const { labels, aum, dePs } = memo.indexed
    expect(aum).toHaveLength(labels.length)
    expect(dePs).toHaveLength(labels.length)
    expect(aum[0]).toBe(100)
    expect(dePs[0]).toBe(100)
  })

  it('sizes the sensitivity grid consistently', () => {
    const { rows, cols, values } = memo.sensitivity
    expect(values).toHaveLength(rows.length)
    for (const r of values) expect(r).toHaveLength(cols.length)
    // Value must rise monotonically across the multiple axis.
    for (const r of values) {
      for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1])
    }
    // ...and down the earnings axis.
    for (let c = 0; c < cols.length; c++) {
      for (let r = 1; r < values.length; r++) expect(values[r][c]).toBeGreaterThan(values[r - 1][c])
    }
  })

  it('keeps AUM quality scores inside the declared 0-10 scale', () => {
    for (const r of memo.aumScorecard) {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(10)
      expect(r.basis.length).toBeGreaterThan(20)
    }
    const mean = aumQualityScore(memo)
    expect(mean).toBeGreaterThan(0)
    expect(mean).toBeLessThan(10)
  })

  it('never leaves a history gap silently interpolated', () => {
    // Nulls are permitted and rendered as "—"; what is not permitted is a fabricated zero.
    for (const h of memo.history) {
      for (const v of [h.aum, h.fpaum, h.frePs, h.dePs, h.freMarginPct, h.dividendPs, h.shares]) {
        if (v !== null) expect(v).toBeGreaterThan(0)
      }
    }
  })

  it('challenges management claims rather than restating them', () => {
    // At least half the narrative table must find contradicting evidence, or it is not adversarial.
    const challenged = memo.narrative.filter((n) => n.challenged).length
    expect(challenged / memo.narrative.length).toBeGreaterThanOrEqual(0.5)
    for (const n of memo.narrative) {
      expect(n.support.length).toBeGreaterThan(40)
      expect(n.contradiction.length).toBeGreaterThan(40)
      expect(n.verdict.length).toBeGreaterThan(30)
    }
  })

  it('gives an unhedged rating with an explicit price at which it changes', () => {
    expect([
      'Materially undervalued',
      'Moderately undervalued',
      'Fairly valued',
      'Moderately overvalued',
      'Materially overvalued',
    ]).toContain(memo.rating)
    expect(memo.ratingChangesAt.upgrade).toBeTruthy()
    expect(memo.ratingChangesAt.downgrade).toBeTruthy()
    expect(memo.positionSizing.length).toBeGreaterThan(30)
  })

  it('includes itself in its own peer table so the comparison is anchored', () => {
    expect(memo.peers.some((p) => p.ticker === memo.symbol)).toBe(true)
  })
})

describe('cross-memo consistency', () => {
  it('quotes the same shared peers identically across both memos', () => {
    const [owl, pax] = [forensicMemo('OWL')!, forensicMemo('PAX')!]
    for (const ticker of ['ARES', 'TPG', 'HLNE', 'STEP']) {
      const a = owl.peers.find((p) => p.ticker === ticker)
      const b = pax.peers.find((p) => p.ticker === ticker)
      if (!a || !b) continue
      expect(a.marketCap).toBe(b.marketCap)
      expect(a.fre).toBe(b.fre)
      expect(a.freGrowthPct).toBe(b.freGrowthPct)
    }
  })

  it('cross-references each subject in the other memo with matching valuation figures', () => {
    const [owl, pax] = [forensicMemo('OWL')!, forensicMemo('PAX')!]
    const owlInPax = pax.peers.find((p) => p.ticker === 'OWL')!
    const paxInOwl = owl.peers.find((p) => p.ticker === 'PAX')!
    expect(owlInPax.marketCap).toBeCloseTo(owl.marketCap, 1)
    expect(paxInOwl.marketCap).toBeCloseTo(pax.marketCap, 1)
    expect(owlInPax.divYieldPct).toBeCloseTo(owl.dividendYieldPct, 0)
    expect(paxInOwl.divYieldPct).toBeCloseTo(pax.dividendYieldPct, 0)
  })

  it('applies the same analytical template to both companies', () => {
    const [owl, pax] = [forensicMemo('OWL')!, forensicMemo('PAX')!]
    expect(owl.conclusions.map((c) => c.q)).toEqual(pax.conclusions.map((c) => c.q))
  })
})
