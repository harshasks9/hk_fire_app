# Forensic memoranda

Adversarial investment-committee memoranda on listed alternative asset managers, published
as plain static pages: an index at `/`, one page per memo at `/owl/` and `/pax/`, and the
methodology at `/methodology.md`.

Two subjects, both cut on **31 July 2026**, revalidated on **28 August 2026** and again on
**20 September 2026**, when the four v3 chapters were added:

| | Blue Owl (NYSE: OWL) | Patria (NASDAQ: PAX) |
|---|---|---|
| Latest period | Q2 2026, reported 30 Jul 2026 | Q2 2026, reported 31 Jul 2026 |
| Price at cut → Aug → Sep | $9.35 → $12.11 → $9.88 | $11.37 → $11.66 → $11.17 |
| Rating at cut → Aug → Sep | Mod. undervalued → Fairly valued → Mod. undervalued | Moderately undervalued (held twice) |
| Base case | $11.00 | $14.75 |
| Central finding | Dividend has exceeded distributable earnings since 2025 | DE per share grew 24% while FRE grew 135% |

## Confidence tiers

Every material figure is tagged, per `FORENSIC-ASSET-MANAGER-PROMPT.md` §1:

| Tier | Meaning | Permitted use |
|---|---|---|
| **A** | Quoted from a company release, filing or earnings call | Any conclusion |
| **B** | Our arithmetic on tier-A inputs, calculation shown | Any conclusion |
| **C** | Secondary source citing the company | Supporting evidence only |
| **D** | Our estimate or model assumption | Scenario inputs only |

**No valuation conclusion in either memo rests on a tier C or D figure alone.** Each memo
opens with a banner naming what could not be retrieved, and closes with a full confidence
ledger.

### Source-access constraint

Both memos were researched in an environment whose network egress policy blocked direct
retrieval of SEC EDGAR, the companies' IR sites and the earnings-deck PDFs. Figures were
obtained through search-surfaced content from the companies' own releases, filings and
calls. Both memos state this in full and tier accordingly. Two internal consistency checks
are documented in the Blue Owl memo because they materially raise confidence in the derived
quarterly series — the four assembled 2025 quarterly FRE figures sum exactly to the reported
full year, as do the four DE figures.

## Layout of the code

```
docs/FORENSIC-ASSET-MANAGER-PROMPT.md   The versioned methodology (v3) and its changelogs (v2→v3, v1→v2)
memos/
  types.ts        ForensicMemo — the analytical template both subjects fill
  owl.ts          Blue Owl memorandum (the v2 sections and the chain of revalidation passes)
  pax.ts          Patria memorandum
  owl.expansion.ts, pax.expansion.ts
                  The v3 chapters: history, multiple history, wide peer group, yield comparison
  index.ts        Registry + derived maths (weighted value, IRR, SOTP, AUM quality)
  memos.test.ts   The output contract, as tests
build.ts          Data model → HTML. 22 sections per memo, driven entirely by the data
```

The renderer is a single script with no runtime dependencies. Charts are inline SVG drawn
at build time; tables are tables. Adding a third subject means writing one `ForensicMemo`
object and adding it to `FORENSIC_MEMOS` — the index, the memo page, the comparison table
and the tests all pick it up with no further changes.

## What the tests enforce

`memos/memos.test.ts` treats the prompt's output contract as executable. It asserts each
memo carries every required artefact, states exactly three dated and thresholded
predictions, pre-commits kill criteria, and argues a red-team case against its own
conclusion that is longer than the adjudication of it. It also re-derives the arithmetic
independently: market capitalisation against price × diluted shares, dividend yield against
the declared dividend, every payout ratio against its own DE and dividend, the FRE→DE
waterfall's additivity, the sum-of-the-parts per-share value landing inside the bear-to-bull
range, scenario probabilities summing to one, a bear case that actually loses money, and
monotonicity across both axes of each sensitivity grid. Cross-memo tests confirm shared
peers are quoted identically in both and that both answer the same twelve questions.

The v3 chapters have their own invariants: the chain of passes is chronological and each
pass starts at the previous pass's closing rating and price; the multiple history and the
listed-life table end at the price the memo states; every P/FRE in the wide peer table
re-derives from market capitalisation and annualised FRE; the fee-base slices sum to 100%
and the required yield they build exceeds the lowest sovereign yield on the ladder; and the
thirteen peers are quoted identically in both expansions.

`site.test.ts` renders both pages and the index and checks every section, every source and
every prediction made it onto the page, with nothing left as `undefined` or `NaN` — including
the four v3 chapters, the five charts, and every earlier revalidation pass, which stays on
the page collapsed beneath the latest one.

## Revalidation

Both memos were re-tested on 2026-08-28 against data published after their 2026-07-31 cut,
following the protocol in §Revalidation of the prompt. The pass is stored on the memo as
`revalidation` and rendered directly under the masthead, because a reader arriving at a
month-old memo needs the delta before any conclusion below it.

The result was asymmetric and worth recording. Neither company reported new results, and no
operating figure in either memo deteriorated. Blue Owl re-rated 29.5% on a Q2 revenue beat, a
guidance comment that was *already in the original memo*, and two sell-side target raises —
carrying it from 9.3× to 12.0× fee-related earnings, which is precisely the multiple recovery
the base case had been waiting for, arriving before the redemption evidence it was
conditioned on. That put the shares above their own probability-weighted value of $10.85, so
the rating moved to fairly valued. Patria moved 2.6% and held its rating, with one genuinely
unhelpful new fact: management now guides the FY2026 FRE margin to stay below its 58–60%
target, which corroborates the memo's central diagnosis while sitting exactly on the 54.0%
floor of its own first prediction.

The pass also failed one of our own controls. The OWL downgrade trigger had been set at
$13.50 — 23% above the base case and 24% above the weighted value — so it did not fire on a
move that inverted the valuation. The trigger was reset and the error is disclosed in the
memo rather than argued around. Two tests now enforce the invariant directly: no memo may be
rated undervalued while trading above its own weighted value, or overvalued while trading
below it.

### The September pass and the v3 expansion

The 2026-09-20 pass measured against the August pass, per the chain-of-passes rule added to
the protocol in v3, and the August pass stays on each page beneath it, unchanged. Again no
operating figure printed for either company. Blue Owl gave back the whole August re-rating
and more — $12.11 to $9.88 — crossing the $10.50 upgrade line set in August, so the rating
returned to moderately undervalued on the same facts that supported it in July; the August
trigger, unlike the July one, worked as designed. Patria drifted 4% lower to $11.17 as two
Underperform initiations took consensus to "Reduce", and held its rating. One correction to
our own record was found while assembling the dividend history and is logged as a
revalidation item: Blue Owl's FY2022 dividend was $0.46, not $0.56.

The four chapters added to each memo answer the questions the v2 template could not: where
the company came from and what it promised at listing (§19), what the market has paid per
dollar of DE at every dated point since listing and how much of the total return was earnings
against multiple (§20), where the subject sits among thirteen listed alternative managers and
what the group's dispersion is actually explained by (§21), and — because permanent capital
is a duration claim — what yield the fee base should require when each slice is priced off the
bond ladder, and what that yield says the shares are worth with no growth (§22). Every rung of
the yield ladder and every peer row is tiered and dated; every derived number on those pages
is computed at render time from its inputs and re-derived in the tests.
