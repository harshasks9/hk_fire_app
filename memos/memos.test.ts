/**
 * The prompt's output contract, as executable tests. Every memo must carry every required
 * artefact, and its arithmetic is re-derived here independently of the data it states.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
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
} from './index.ts'

/** Same tolerance as vitest's toBeCloseTo: |a − b| < 10^−digits / 2. */
function closeTo(actual: number, expected: number, digits = 2, msg?: string) {
  assert.ok(Math.abs(actual - expected) < 10 ** -digits / 2, msg ?? `expected ${actual} to be within ${10 ** -digits / 2} of ${expected}`)
}

describe('forensic memo registry', () => {
  it('covers OWL and PAX and is case-insensitive on lookup', () => {
    assert.deepEqual(FORENSIC_MEMOS.map((m) => m.symbol).sort(), ['OWL', 'PAX'])
    assert.equal(forensicMemo('owl')?.symbol, 'OWL')
    assert.equal(forensicMemo('PaX')?.symbol, 'PAX')
    assert.equal(forensicMemo('NOPE'), undefined)
  })
})

for (const memo of FORENSIC_MEMOS) {
  describe(`${memo.symbol} memo completeness`, () => {
    it('carries every required artefact from the prompt output contract', () => {
      assert.ok(memo.headlineStats.length >= 6)
      assert.ok(memo.quarter.length >= 8)
      assert.ok(memo.history.length >= 5)
      assert.ok(memo.bridge.terms.length >= 5)
      assert.ok(memo.scorecard.length >= 6)
      assert.ok(memo.narrative.length >= 5)
      assert.ok(memo.segments.length >= 3)
      assert.ok(memo.aumScorecard.length >= 6)
      assert.ok(memo.dividendCoverage.length >= 4)
      assert.ok(memo.peers.length >= 5)
      assert.ok(memo.valuation.length >= 4)
      assert.ok(memo.sotp.length >= 4)
      assert.ok(memo.implied.length >= 5)
      assert.ok(memo.risks.length >= 5)
      assert.equal(memo.conclusions.length, 12)
      assert.ok(memo.questionsForManagement.length >= 5)
      assert.ok(memo.sources.length >= 8)
    })

    it('states exactly three falsifiable predictions, each dated and thresholded', () => {
      assert.equal(memo.predictions.length, 3)
      for (const p of memo.predictions) {
        assert.ok(p.threshold.length > 5)
        assert.ok(p.by.length > 4)
        assert.ok(p.ifWrong.length > 20)
      }
    })

    it('pre-commits kill criteria and names three monitoring KPIs', () => {
      assert.ok(memo.killCriteria.length >= 4)
      assert.equal(memo.kpis.length, 3)
      for (const k of memo.kpis) {
        assert.ok(k.green)
        assert.ok(k.red)
      }
    })

    it('argues against itself before concluding', () => {
      // A red team that is shorter than the adjudication is a caricature, not a case.
      assert.ok(memo.redTeam.case.length > 700)
      assert.ok(memo.redTeam.adjudication.length > 400)
    })

    it('discloses source limitations rather than hiding them', () => {
      assert.ok(memo.sourceCaveat.length > 200)
      for (const s of memo.sources) assert.ok(['A', 'B', 'C', 'D'].includes(s.tier))
      // At least some sources must be primary — a memo built only on aggregators is not forensic.
      assert.ok(memo.sources.filter((s) => s.tier === 'A').length >= 5)
    })

    it('tags every quarter row, history row and scorecard row with a confidence tier', () => {
      const tiers = Object.keys(TIER_META)
      for (const r of memo.quarter) assert.ok(tiers.includes(r.tier))
      for (const r of memo.history) assert.ok(tiers.includes(r.tier))
      for (const r of memo.scorecard) assert.ok(tiers.includes(r.tier))
      for (const r of memo.segments) assert.ok(tiers.includes(r.tier))
      for (const r of memo.peers) assert.ok(tiers.includes(r.tier))
      for (const f of memo.ownership) assert.ok(tiers.includes(f.tier))
    })
  })

  describe(`${memo.symbol} internal arithmetic`, () => {
    const bear = memo.scenarios.find((s) => s.name === 'Bear')!
    const base = memo.scenarios.find((s) => s.name === 'Base')!
    const bull = memo.scenarios.find((s) => s.name === 'Bull')!

    it('scenario probabilities sum to one', () => {
      closeTo(memo.scenarios.reduce((s, x) => s + x.probability, 0), 1, 6)
    })

    it('orders bear < base < bull on both value and return', () => {
      assert.ok(bear.targetPrice < base.targetPrice)
      assert.ok(base.targetPrice < bull.targetPrice)
      assert.ok(bear.fiveYrIrrPct < base.fiveYrIrrPct)
      assert.ok(base.fiveYrIrrPct < bull.fiveYrIrrPct)
    })

    it('states a bear case that is a genuine downturn, not a slower base case', () => {
      // Must imply a loss from the current price over five years.
      assert.ok(bear.fiveYrIrrPct < 0)
      assert.ok(bear.targetPrice < memo.price)
    })

    it('computes a probability-weighted value consistent with the scenario set', () => {
      const wv = weightedValue(memo)
      assert.ok(wv > Math.min(...memo.scenarios.map((s) => s.targetPrice)))
      assert.ok(wv < Math.max(...memo.scenarios.map((s) => s.targetPrice)))
      closeTo(weightedUpsidePct(memo), ((wv - memo.price) / memo.price) * 100, 6)
    })

    it('produces an expected return inside the scenario range', () => {
      const irr = weightedIrrPct(memo)
      assert.ok(irr > Math.min(...memo.scenarios.map((s) => s.fiveYrIrrPct)))
      assert.ok(irr < Math.max(...memo.scenarios.map((s) => s.fiveYrIrrPct)))
    })

    it('derives a sum-of-the-parts per-share value that lands inside the bear-to-bull range', () => {
      const ps = sotpPerShare(memo)
      closeTo(ps, sotpTotal(memo) / memo.dilutedShares, 6)
      assert.ok(ps > memo.scenarios[0].targetPrice)
      assert.ok(ps < memo.scenarios[2].targetPrice)
    })

    it('charges the sum-of-the-parts for claims ahead of common shareholders', () => {
      // Debt, deferred consideration, minorities, TRA — a SOTP with no negative lines is not a SOTP.
      assert.ok(memo.sotp.some((r) => r.value < 0))
    })

    it('reconciles market capitalisation with price and diluted shares', () => {
      // dilutedShares is in millions, marketCap in $bn.
      closeTo((memo.price * memo.dilutedShares) / 1000, memo.marketCap, 1)
    })

    it('reconciles dividend yield with the declared dividend and price', () => {
      closeTo((memo.dividendPs / memo.price) * 100, memo.dividendYieldPct, 1)
    })

    it('reports payout ratios consistent with the DE and dividend it lists', () => {
      for (const d of memo.dividendCoverage) {
        if (d.dePs === null || d.dividendPs === null || d.payoutPct === null) continue
        closeTo((d.dividendPs / d.dePs) * 100, d.payoutPct, 0, `${memo.symbol} ${d.year} payout`)
      }
    })

    it('keeps the FRE-to-DE bridge additive', () => {
      const steps = memo.earningsBridge.filter((b) => !b.isTotal)
      const total = memo.earningsBridge.find((b) => b.isTotal)!
      closeTo(steps.reduce((s, b) => s + b.value, 0), total.value, 1)
    })

    it('keeps the per-share trajectory series aligned and positive', () => {
      const { labels, frePs, dePs } = memo.trajectory
      assert.equal(frePs.length, labels.length)
      assert.equal(dePs.length, labels.length)
      for (const v of [...frePs, ...dePs]) assert.ok(v > 0)
    })

    it('indexes both series from a common base of 100', () => {
      const { labels, aum, dePs } = memo.indexed
      assert.equal(aum.length, labels.length)
      assert.equal(dePs.length, labels.length)
      assert.equal(aum[0], 100)
      assert.equal(dePs[0], 100)
    })

    it('sizes the sensitivity grid consistently', () => {
      const { rows, cols, values } = memo.sensitivity
      assert.equal(values.length, rows.length)
      for (const r of values) assert.equal(r.length, cols.length)
      // Value must rise monotonically across the multiple axis...
      for (const r of values) for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1])
      // ...and down the earnings axis.
      for (let c = 0; c < cols.length; c++) for (let r = 1; r < values.length; r++) assert.ok(values[r][c] > values[r - 1][c])
    })

    it('keeps AUM quality scores inside the declared 0-10 scale', () => {
      for (const r of memo.aumScorecard) {
        assert.ok(r.score >= 0 && r.score <= 10)
        assert.ok(r.basis.length > 20)
      }
      const mean = aumQualityScore(memo)
      assert.ok(mean > 0 && mean < 10)
    })

    it('never leaves a history gap silently interpolated', () => {
      // Nulls are permitted and rendered as "—"; what is not permitted is a fabricated zero.
      for (const h of memo.history) {
        for (const v of [h.aum, h.fpaum, h.frePs, h.dePs, h.freMarginPct, h.dividendPs, h.shares]) {
          if (v !== null) assert.ok(v > 0)
        }
      }
    })

    it('challenges management claims rather than restating them', () => {
      // At least half the narrative table must find contradicting evidence, or it is not adversarial.
      const challenged = memo.narrative.filter((n) => n.challenged).length
      assert.ok(challenged / memo.narrative.length >= 0.5)
      for (const n of memo.narrative) {
        assert.ok(n.support.length > 40)
        assert.ok(n.contradiction.length > 40)
        assert.ok(n.verdict.length > 30)
      }
    })

    it('gives an unhedged rating with an explicit price at which it changes', () => {
      assert.ok(['Materially undervalued', 'Moderately undervalued', 'Fairly valued', 'Moderately overvalued', 'Materially overvalued'].includes(memo.rating))
      assert.ok(memo.ratingChangesAt.upgrade)
      assert.ok(memo.ratingChangesAt.downgrade)
      assert.ok(memo.positionSizing.length > 30)
    })

    it('includes itself in its own peer table so the comparison is anchored', () => {
      assert.ok(memo.peers.some((p) => p.ticker === memo.symbol))
    })
  })
}

describe('cross-memo consistency', () => {
  const owl = forensicMemo('OWL')!
  const pax = forensicMemo('PAX')!

  it('quotes the same shared peers identically across both memos', () => {
    for (const ticker of ['ARES', 'TPG', 'HLNE', 'STEP']) {
      const a = owl.peers.find((p) => p.ticker === ticker)
      const b = pax.peers.find((p) => p.ticker === ticker)
      if (!a || !b) continue
      assert.equal(a.marketCap, b.marketCap)
      assert.equal(a.fre, b.fre)
      assert.equal(a.freGrowthPct, b.freGrowthPct)
    }
  })

  it('cross-references each subject in the other memo with matching valuation figures', () => {
    const owlInPax = pax.peers.find((p) => p.ticker === 'OWL')!
    const paxInOwl = owl.peers.find((p) => p.ticker === 'PAX')!
    closeTo(owlInPax.marketCap!, owl.marketCap, 1)
    closeTo(paxInOwl.marketCap!, pax.marketCap, 1)
    closeTo(owlInPax.divYieldPct!, owl.dividendYieldPct, 0)
    closeTo(paxInOwl.divYieldPct!, pax.dividendYieldPct, 0)
  })

  it('applies the same analytical template to both companies', () => {
    assert.deepEqual(
      owl.conclusions.map((c) => c.q),
      pax.conclusions.map((c) => c.q),
    )
  })
})

/**
 * The revalidation log is the part of a memo most exposed to motivated reasoning:
 * it is written after the price has moved, by the author of the original call.
 * These tests hold it to the same arithmetic the rest of the memo answers to.
 */
describe('revalidation', () => {
  it('has been re-tested against data published since the original cut', () => {
    for (const memo of FORENSIC_MEMOS) assert.ok(memo.revalidation)
  })

  for (const memo of FORENSIC_MEMOS.filter((m) => m.revalidation)) {
    const r = memo.revalidation!
    describe(memo.symbol, () => {
      it('revalidates the cut the memo actually carries', () => {
        assert.equal(r.originalAsOf, memo.asOf)
        assert.ok(Date.parse(r.asOf) > Date.parse(r.originalAsOf))
      })

      it('quotes the live price and rating the rest of the memo is written against', () => {
        closeTo(r.priceNow, memo.price, 2)
        assert.equal(r.ratingNow, memo.rating)
      })

      it('quotes the probability-weighted value the scenarios actually produce', () => {
        closeTo(r.weightedValue, weightedValue(memo), 1)
      })

      it('records what did not move as well as what did', () => {
        assert.ok(r.changes.length >= 3)
        assert.ok(r.unchanged.length >= 3)
        assert.ok(r.triggerNote.length > 120)
        for (const c of r.changes) assert.ok(c.note.length > 20)
      })

      it('grades every prediction once a revalidation pass has run', () => {
        for (const p of memo.predictions) {
          assert.ok(p.status)
          assert.ok(p.statusNote!.length > 20)
        }
      })
    })
  }

  /**
   * The invariant that the 28 August pass existed to enforce. A memo may not call a
   * stock undervalued while quoting a price above its own probability-weighted value —
   * which is exactly the state OWL was left in by the price move, and exactly what a
   * loosely-set downgrade trigger would have allowed to stand.
   */
  it('never rates a memo undervalued while it trades above its own weighted value', () => {
    for (const memo of FORENSIC_MEMOS) {
      if (memo.price > weightedValue(memo)) assert.doesNotMatch(memo.rating, /undervalued/i)
    }
  })

  it('never rates a memo overvalued while it trades below its own weighted value', () => {
    for (const memo of FORENSIC_MEMOS) {
      if (memo.price < weightedValue(memo)) assert.doesNotMatch(memo.rating, /overvalued/i)
    }
  })
})
