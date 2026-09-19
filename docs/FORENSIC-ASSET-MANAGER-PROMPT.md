# Forensic Investment Analysis — Listed Alternative Asset Manager (v2)

A reusable, parameterised research prompt. `v1` was a 16-section brief written specifically for Blue
Owl. `v2` generalises it, closes the analytical gaps that v1 left open, and makes the output
contract checkable rather than aspirational.

**Parameters:** `{{TICKER}}` · `{{COMPANY}}` · `{{EXCHANGE}}` · `{{AS_OF_DATE}}`

---

## What changed from v1, and why

| # | Gap in v1 | Fix in v2 |
|---|---|---|
| 1 | Hard-coded to one issuer | Parameterised; peer set derived from the subject's own economics |
| 2 | Demanded filings but gave no protocol when filings are unreachable | §1 Source-access protocol + mandatory **Confidence Ledger** (tiers A–D) and a rule that no valuation conclusion may rest on tier C/D alone |
| 3 | Asked for "per-share progress" without specifying the arithmetic | §5 mandates an explicit **per-share bridge identity**, so leakage between AUM growth and per-share earnings is located, not asserted |
| 4 | Never tested the dividend against distributable earnings | §7 makes **payout vs. DE per share, by year** a required table. For yield-supported alt managers this is frequently the single most important number |
| 5 | Treated AUM as an asset-side question only | §8 adds the **liability side of AUM**: redemption mechanics, repurchase caps, gates, queues, NAV marks, and the fee consequence of a fulfilled redemption |
| 6 | 16 sections with heavy overlap (§2/§5/§6/§16 all restate the thesis) | Consolidated to 12 sections; the thesis is stated once and then tested |
| 7 | No falsifiability | §11 requires three **dated, falsifiable predictions** with numeric thresholds, plus pre-committed kill criteria |
| 8 | No adversarial step, despite asking for an "adversarial memo" | §10 requires an explicit **red-team memo** against your own conclusion, then adjudication |
| 9 | Invited unbounded length | Word budgets per section; tables preferred to prose; false precision prohibited |
| 10 | Stopped at a rating | §12 requires rating **plus** horizon, position size, and the price at which the rating changes |
| 11 | Silent on rounding and error bars | §1 requires figures to be carried at disclosed precision, with error bars where a derived number is sensitive to rounding |
| 12 | "Do not hedge" could push false confidence | §12 separates *conviction in the conclusion* from *precision of the estimate* — you may be decisive and still state a wide value range |

---

## The prompt

You are a senior public-markets analyst covering listed alternative asset managers. Produce a
forensic investment memorandum on **{{COMPANY}} ({{EXCHANGE}}: {{TICKER}})** as of
**{{AS_OF_DATE}}**, written for an investment committee that will vote on it.

Evaluate the company strictly on alternative-asset-manager economics — fee-paying capital, fee
rates, fee-related earnings, distributable earnings, performance revenues, capital formation and
duration, deployment, balance-sheet exposure, incentive economics, and value per diluted share.
Do not import SaaS, industrial, bank, or index-relative frameworks.

Answer four questions:

1. What has fundamentally changed in the business over the last twelve months?
2. What has the public shareholder actually received since listing?
3. How durable and economically real are the reported earnings?
4. What is the equity worth today, and what does the current price already assume?

### 1 · Source-access protocol and the Confidence Ledger

Work from primary documents where you can reach them: the latest annual report and 10-K/20-F, the
latest quarterly release and 10-Q/6-K, the earnings presentation and supplement, the full earnings
call transcript including Q&A, the four preceding quarters, the listing/IPO/merger materials, proxy
or remuneration filings, and material transaction announcements. Use peer disclosures for
comparison. Prefer filings over aggregators wherever both exist.

**If a source cannot be retrieved, say so in the memo — do not silently substitute.** Tag every
material figure:

| Tier | Meaning | Permitted use |
|---|---|---|
| **A** | Quoted from a company filing or release you actually read | Any conclusion |
| **B** | Derived by you by arithmetic from tier-A figures (show the arithmetic) | Any conclusion, if the arithmetic is shown |
| **C** | Reported by a secondary source citing the company | Supporting evidence only |
| **D** | Your estimate or assumption | Scenario inputs only; never a headline claim |

Rules: carry figures at the precision the company disclosed and no further. Where a derived number
is sensitive to the issuer's rounding (per-share metrics reported to the cent are the usual
offender), state the error bar rather than a false point estimate. **No valuation conclusion may
rest on a tier-C or tier-D figure alone.** Publish the ledger as an appendix.

### 2 · The investment question (≤400 words)

Open with the debate, not a company description. State what the market appears to believe, what
must go right to justify today's price, what the market may be underestimating, what would make the
business structurally deserve a lower multiple, and the two or three variables that will determine
the return. Name the bear case's strongest single fact.

### 3 · Economic reconstruction of the business

Rebuild the company by strategy, not by reported segment label. For each material platform give:
AUM; fee-paying AUM; the share that is permanent or long-dated; effective management-fee rate;
gross and net organic flows; deployment; realisations; FRE contribution and margin; performance
fees and accrued carry; principal/balance-sheet exposure; fund-level leverage; pipeline;
product, client and channel concentration; and sensitivity to credit conditions, transaction
activity, rates and asset values. Separate organic growth from acquired growth explicitly.

Conclude with a ranking: which platforms deserve a premium multiple, which deserve a discount, and
why — in fee-rate, duration and cyclicality terms.

### 4 · Historical model

One table: listing baseline, each fiscal year since listing, each of the last four quarters, and
the latest period. Rows: total AUM · fee-paying AUM · permanent/long-dated capital · management
fees · FRE · FRE margin · performance revenues · distributable earnings · net flows · gross
fundraising · deployment · diluted economic share count · stock-based compensation · dividends ·
net debt · **FRE per diluted share** · **DE per diluted share**.

Where definitions changed, restate and bridge. Never compare across a definition change without
flagging it. If a figure is unavailable, leave the cell empty and mark it — do not interpolate.

### 5 · Per-share bridge (mandatory arithmetic)

Aggregate growth is not shareholder return. Decompose it. For the period since listing and for the
latest twelve months, show:

```
DE/share growth  ≈  FPAUM growth
                 ×  change in effective fee rate
                 ×  change in FRE margin
                 ×  change in the DE/FRE conversion ratio
                 ÷  (1 + diluted share-count growth)
```

Quantify each term. State in one sentence where the growth leaked: fee-rate mix, margin,
below-the-FRE-line costs (tax, interest, corporate), or share issuance. Then answer directly:

- Has value per public share increased since listing, on price and on total return?
- How much of the growth was organic and how much was purchased?
- What return has the company earned on acquisition consideration, measured against the earnings
  actually added?
- Has business mix, earnings quality and predictability improved or deteriorated?

### 6 · The latest quarter in context (≤700 words + tables)

Never assess the quarter alone. For each major metric show: the result, year-over-year, sequential,
versus prior guidance or consensus, the four-quarter trajectory, and progress against targets set
at or since listing. Attribute each result to recurring economics, acquisition, timing,
accounting, or one-off.

Separate what genuinely improved · what merely met expectations · what deteriorated · what was
deferred rather than lost · what was pulled forward · what management emphasised that deserves
scepticism · what analysts pressed on · what management did not answer · and how the language,
confidence and disclosure changed versus prior calls.

Then produce the table **Management Narrative vs. Economic Reality** — claim · supporting evidence
· contradicting or qualifying evidence · your verdict.

### 7 · Earnings quality, conversion and dividend coverage

Bridge GAAP net income → FRE → DE → cash actually available to common holders, reconciling
stock-based compensation, intangible amortisation, acquisition-related items, tax receivable
agreement flows, non-controlling interests, and any legacy partnership structure.

Determine which adjustments are genuinely non-economic, which excluded costs recur, whether SBC is
treated too generously, and whether DE fairly represents the economics available to the public
share. Then present, **by fiscal year**:

| Year | DE/share | Dividend/share | Payout % of DE | Buyback net of issuance | Total capital returned vs. DE |
|---|---|---|---|---|---|

If payout has exceeded DE in any year, quantify the gap, identify what funded it, and state the
consequence for leverage, buyback capacity, or future dividend growth. Close with normalised
sustainable FRE, DE, DE per share, and free cash available for dividends, buybacks, debt reduction
and acquisitions.

### 8 · Capital quality — both sides of the balance

**Asset side.** Break fee-paying AUM down by strategy, fee rate, duration, permanent vs. finite,
deployment status, fee holiday/ramp, investor type, geography, and organic vs. acquired origin.
Value announced-but-not-yet-fee-paying capital explicitly, with a probability and a timing lag.

**Liability side — required, and the section v1 omitted.** For every semi-liquid or perpetual
vehicle: subscription trend, redemption/repurchase requests as a percentage of shares or NAV, the
contractual cap, whether the cap was hit, proration actually applied, queue carried forward,
concentration of redeeming holders, NAV mark behaviour versus traded comparables, and the
management-fee consequence of each dollar fulfilled. State plainly whether "permanent capital"
survives contact with a redemption cycle.

Produce an **AUM quality scorecard** built on economics — fee rate, duration, redeemability,
deployment status, concentration, origin — not headline scale.

### 9 · Investment performance, franchise durability, incentives and risk

Assess realised gross and net returns by strategy against benchmarks and vintage peers; loss
ratios, non-accruals, markdowns, defaults; PIK income and its trend; leverage; concentration;
fund-level liquidity; re-up rates; deployment discipline; and behaviour in stress. Fundraising
success is not evidence of investment quality — do not treat it as such.

Then analyse alignment: voting control, insider ownership, float structure, non-controlling
interests, exchangeable units, SBC, acquisition equity, compensation design, TRA obligations,
related-party transactions, buybacks against dilution, and share-count evolution since listing.
Compute the annual dilution rate and the value transferred through equity compensation. Value the
company on **fully diluted economic ownership**, not basic shares.

Then risk: corporate leverage and maturities, interest expense, acquisition liabilities, seed and
GP commitments, guarantees, insurance/annuity exposure, TRA, counterparty and principal risk,
fund-level risk that could migrate to the manager reputationally, dividend commitments, and
liquidity through a fundraising downturn. Model lower fundraising, slower deployment, fee
compression, credit losses, delayed realisations, weaker performance fees, margin pressure,
integration failure, and sector-wide multiple compression.

### 10 · Peers, valuation, scenarios, and red team

**Peers** chosen for business-model relevance, not market cap. Table: market cap · EV · fee-paying
AUM · FRE · FRE growth · FRE margin · DE · organic net flows · permanent-capital mix · dividend
yield · EV/FRE · P/FRE · P/DE · DE yield · price/fee-paying AUM · expected growth · premium or
discount. Never compare headline P/E without adjusting for FRE mix, performance-fee dependence,
balance-sheet intensity, permanent-capital share, organic growth, credit and insurance
concentration, structure, tax, and dilution. Explain the warranted premium or discount to each peer.

**Valuation** by four complementary methods, each with its own multiple logic: (a) normalised
forward FRE × justified multiple, with a sensitivity ladder; (b) distributable earnings — P/DE, DE
yield, and dividend-growth capacity, with recurring DE separated from volatile performance
earnings; (c) sum-of-the-parts — recurring fee stream, expected carry, balance-sheet investments,
less net debt, acquisition liabilities, TRA, NCI and other non-common claims; (d) fee-paying AUM
economics as a cross-check only, derived from fee rates and margins, never as a flat percentage of
AUM. Then reverse-engineer the current price: what FRE growth, margin, fundraising, fee-paying AUM
and exit multiple does it imply, and are those assumptions conservative, reasonable or aggressive?

**Scenarios** — bear, base, bull, five years, each specifying gross fundraising, net organic flows,
deployment, fee-paying AUM, management-fee growth, FRE margin, FRE, DE, performance earnings,
share-count growth, dividend growth, exit multiple, implied equity value, value per diluted share,
and expected annualised total return from today's price. The bear case must be a genuine industry
and execution downturn, not a slower base case. The bull case must specify the operational events
required and why they are feasible. Show sensitivity to FRE growth, margin, multiple, dilution, fee
compression, fundraising conversion and performance fees.

**Red team.** Write the strongest available memo *against* your conclusion — at least 250 words,
using the best facts the other side has, not a caricature. Then adjudicate: which of its points you
accept, which you reject, and what evidence would settle each.

### 11 · Falsifiable predictions and kill criteria

Three dated, numeric, checkable predictions (e.g. "FRE per share ≥ $X in Q_ 20__, reported by
date"). For each, state what you expect, the threshold, and what being wrong would imply.

Then pre-commit kill criteria: the specific observations that would invalidate the thesis and cause
you to exit regardless of price. Vague criteria ("deteriorating fundamentals") are not acceptable.

### 12 · Conclusions

Answer directly and numerically: normalised earning power today · the recurring share of earnings ·
fee-paying AUM quality versus peers · how much growth since listing reached the public share ·
whether capital allocation has been disciplined · whether the latest quarter strengthens or weakens
the thesis · what the price already assumes · the most defensible base-case value per share · bear
and bull values · expected three- and five-year annualised return including dividends · what would
invalidate the thesis · the three KPIs to monitor each quarter.

Give one rating: **materially undervalued · moderately undervalued · fairly valued · moderately
overvalued · materially overvalued** — plus holding horizon, position size as a percentage of a
diversified equity book, and the price at which the rating changes in each direction.

Be decisive about the *conclusion* and honest about the *precision*: a wide value range with a
clear rating is correct; a narrow range you cannot defend is not.

### Output contract

Sections in order: 1 Executive summary (one page) · 2 Valuation and market-implied expectations ·
3 What changed this quarter · 4 Twelve-month trajectory · 5 Progress since listing · 6 Business-line
economics · 7 Capital quality, both sides · 8 Investment performance and durability · 9 Earnings
quality and the GAAP bridge · 10 Ownership, incentives, dilution · 11 Peers and valuation ·
12 Scenarios · 13 Red team and adjudication · 14 Risks, predictions, kill criteria · 15 Monitoring
dashboard · 16 Recommendation · Appendix: Confidence Ledger and unanswered questions for management.

Required artefacts: historical table · per-share bridge · guidance scorecard · Management Narrative
vs. Economic Reality · dividend-coverage table · AUM quality scorecard · redemption table where
applicable · peer table · sum-of-the-parts · scenario and sensitivity tables · confidence ledger ·
three falsifiable predictions · kill criteria.

### Standards

Test management language rather than repeating it. Never equate AUM growth with value creation.
Never value non-fee-paying AUM as if it were earning today. Never ignore SBC, acquisition
consideration, exchangeable units, or dilution. Never capitalise volatile performance revenue at
the recurring-FRE multiple. Never assume permanent capital is riskless or infinitely durable — test
it against the redemption record. Reconstruct the economics yourself rather than importing
consensus. Skip SWOT, Five Forces, macro essays and industry boilerplate. Quantify every material
conclusion, show the arithmetic, challenge inconsistencies between filings, presentation, prepared
remarks and Q&A, and say clearly when the disclosure does not support a precise answer.

Prose budget: no section over 700 words except the executive summary. Prefer a table to a paragraph.

## Revalidation protocol

A memo is a dated claim, and a dated claim that is never re-tested is a marketing document. When
re-running a memo against data published after its cut, produce a **revalidation log** and place it
at the top of the memo, above every conclusion it might change.

The log must contain, in this order:

1. **A one-line verdict** that can be read alone, stating whether the thesis survived and why.
2. **The four numbers that decide the rating**: price at the cut, price now, the probability-weighted
   value, and the price expressed as a percentage of that value.
3. **What moved** — a table of item / value at cut / value now / effect on the thesis, each tiered.
   Grade the effect on the *thesis*, not on the share price: a price rise that removes a discount is
   `Weakens`, not `Supports`.
4. **What did not move.** Mandatory. A log that reports only movement is a sales document. State
   explicitly which operating figures are unchanged, and flag any information the market appears to
   have re-rated on that was *already in the original memo* — that distinction separates new evidence
   from sentiment.
5. **A status on every prediction**: `Too early`, `On track`, `At threshold`, `Off track`,
   `Resolved — correct`, or `Resolved — wrong`, each with the figure that decided it.
6. **An audit of your own triggers.** State whether the pre-committed rating triggers fired. If the
   rating changes while a trigger did *not* fire, say so and explain why the trigger was mis-set
   rather than hiding behind its letter. A downgrade trigger set above the probability-weighted value
   is not a discipline; it is a licence, and it should be reset in the same pass.

Two rules govern the rating itself:

- **A memo may not be rated undervalued while quoting a price above its own probability-weighted
  value**, nor overvalued while trading below it. If price has moved through the valuation, the rating
  moves with it — the scenarios do not get quietly marked up to preserve the call.
- **Do not revise scenario targets on the basis of commentary alone.** Reported figures move targets;
  management guidance, sell-side price targets and share-price momentum do not. If a guidance raise
  would lift the base case, state the condition and the date on which it would be tested instead of
  pre-emptively marking to it.
