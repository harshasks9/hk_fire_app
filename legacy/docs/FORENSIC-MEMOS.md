# Forensic memoranda module

Adversarial investment-committee memoranda on listed alternative asset managers, published at
`/research/forensic` and linked from the sidebar in both Simple and Pro mode.

Shipping with two subjects, both cut on **31 July 2026**:

| | Blue Owl (NYSE: OWL) | Patria (NASDAQ: PAX) |
|---|---|---|
| Latest period | Q2 2026, reported 30 Jul 2026 | Q2 2026, reported 31 Jul 2026 |
| Price | $9.35 | $11.37 |
| Rating | Moderately undervalued | Moderately undervalued |
| Base case | $11.00 | $14.75 |
| Central finding | Dividend has exceeded distributable earnings since 2025 | DE per share grew 24% while FRE grew 135% |

## Why this is separate from the Research Lab

The Research Lab (`/research`) runs a scoring and valuation **engine** over a bundled sample
dataset. These memos are **authored research over real, dated company disclosures** — a different
epistemic contract, so they get a different surface, a different integrity banner, and their own
confidence-tier system. The two must not be confused, which is why the Lab links to the memos
through a distinct card rather than folding them into the coverage table.

## Confidence tiers

Every material figure is tagged, per `FORENSIC-ASSET-MANAGER-PROMPT.md` §1:

| Tier | Meaning | Permitted use |
|---|---|---|
| **A** | Quoted from a company release, filing or earnings call | Any conclusion |
| **B** | Our arithmetic on tier-A inputs, calculation shown | Any conclusion |
| **C** | Secondary source citing the company | Supporting evidence only |
| **D** | Our estimate or model assumption | Scenario inputs only |

**No valuation conclusion in either memo rests on a tier C or D figure alone.** Each memo opens
with a non-dismissible banner naming what could not be retrieved, and closes with a full
confidence ledger.

### Source-access constraint

Both memos were researched in an environment whose network egress policy blocked direct retrieval
of SEC EDGAR, the companies' IR sites and the earnings-deck PDFs. Figures were obtained through
search-surfaced content from the companies' own releases, filings and calls. Both memos state this
in full and tier accordingly. Two internal consistency checks are documented in the Blue Owl memo
because they materially raise confidence in the derived quarterly series — the four assembled 2025
quarterly FRE figures sum exactly to the reported full year, as do the four DE figures.

## Layout of the code

```
docs/FORENSIC-ASSET-MANAGER-PROMPT.md   The versioned methodology (v2) and its changelog vs v1
src/research/forensic/
  types.ts        ForensicMemo — the analytical template both subjects fill
  owl.ts          Blue Owl memorandum
  pax.ts          Patria memorandum
  index.ts        Registry + derived maths (weighted value, IRR, SOTP, AUM quality)
src/pages/research/
  ForensicIndexPage.tsx   Landing: memo cards, side-by-side table, "if forced to own one"
  ForensicMemoPage.tsx    18-section renderer, driven entirely by the data model
```

Adding a third subject means writing one `ForensicMemo` object and adding it to `FORENSIC_MEMOS`.
The renderer, the comparison table and the test suite all pick it up with no further changes — and
the test suite will then hold it to the same standard as the first two.

## What the tests enforce

`src/research/__tests__/forensic.test.ts` (54 tests) treats the prompt's output contract as
executable. It asserts each memo carries every required artefact, states exactly three dated and
thresholded predictions, pre-commits kill criteria, and argues a red-team case against its own
conclusion that is longer than the adjudication of it. It also re-derives the arithmetic
independently: market capitalisation against price × diluted shares, dividend yield against the
declared dividend, every payout ratio against its own DE and dividend, the FRE→DE waterfall's
additivity, the sum-of-the-parts per-share value landing inside the bear-to-bull range, scenario
probabilities summing to one, a bear case that actually loses money, and monotonicity across both
axes of each sensitivity grid. Cross-memo tests confirm shared peers are quoted identically in both
and that both answer the same twelve questions.

`e2e/forensic.spec.ts` (10 tests) covers navigation from both modes, full render of every section,
the quarter-table expansion, the unknown-ticker fallback, section jump-links (which are buttons,
not anchors — an `href="#id"` would clobber the HashRouter route), and a responsive guard asserting
zero horizontal page overflow at 390 / 768 / 1366 px.

## Chart-kit changes

`AreaChart` gained an optional `valueFormat` prop. The default axis formatter is a compact money
formatter, which rounds per-share values (`$0.22`) to `$0` and mislabels index points as dollars.
`valueFormat` overrides formatting on both the axis and the tooltip; omitting it preserves the
previous behaviour exactly, so no existing chart changed.

## Revalidation

Both memos were re-tested on 2026-08-28 against data published after their 2026-07-31 cut, following
the protocol in §Revalidation of the prompt. The pass is stored on the memo as `revalidation` and
rendered directly under the masthead, because a reader arriving at a month-old memo needs the delta
before any conclusion below it.

The result was asymmetric and worth recording. Neither company reported new results, and no operating
figure in either memo deteriorated. Blue Owl re-rated 29.5% on a Q2 revenue beat, a guidance comment
that was *already in the original memo*, and two sell-side target raises — carrying it from 9.3× to
12.0× fee-related earnings, which is precisely the multiple recovery the base case had been waiting
for, arriving before the redemption evidence it was conditioned on. That put the shares above their
own probability-weighted value of $10.85, so the rating moved to fairly valued. Patria moved 2.6% and
held its rating, with one genuinely unhelpful new fact: management now guides the FY2026 FRE margin to
stay below its 58–60% target, which corroborates the memo's central diagnosis while sitting exactly on
the 54.0% floor of its own first prediction.

The pass also failed one of our own controls. The OWL downgrade trigger had been set at $13.50 — 23%
above the base case and 24% above the weighted value — so it did not fire on a move that inverted the
valuation. The trigger was reset and the error is disclosed in the memo rather than argued around.
Two unit tests now enforce the invariant directly: no memo may be rated undervalued while trading
above its own weighted value, or overvalued while trading below it.
