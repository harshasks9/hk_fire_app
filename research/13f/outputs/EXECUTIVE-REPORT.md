# Institutional Investor Intelligence From the Top 100 13F Filers

**Executive research report — SEC Form 13F, 2013Q2 – 2026Q2, point-in-time**
Prepared 2026-10-31. Every number below is produced by the pipeline in `research/13f/` from primary SEC data
and is reproduced, with its sample size and test statistic, in `outputs/REPORT-DATA.md` and the CSV files it names.
Nothing was typed in by hand.

---

## 0. The answer in one page

**Thirteen years of filings from one hundred of the most-followed institutional managers contain almost no
return information that an outside investor could have used after the filing became public.** That is the
defensible finding, and it holds up under every check we ran: point-in-time acceptance timestamps, a
conservative quarterly execution delay, transaction costs, period-clustered statistics, a hold-out test window
(2021–2026) that was never used for design, a 10 % false-discovery-rate correction across all 37 pre-specified
tests, and a point-in-time manager universe that cannot carry survivorship bias.

What the evidence says:

1. **Following a manager's disclosed buys loses to the index.** The average new position of a Universe A
   manager trails SPY by 1.6 % over the following twelve months, with a median of −6.6 % and a 42 % chance of
   beating the index (n = 80,835 covered events). Every accumulation variant — conviction adds, multi-quarter
   accumulation, ownership acceleration, "early discovery" — is flat or negative.
2. **Zero of 37 pre-specified signal tests is validated.** Four are "promising but unproven": new positions
   sized 5–10 % of a book (+4.4 %, t = 1.7), ten or more simultaneous buyers (+4.3 %, t = 1.6, n = 568),
   accumulation into a ≥ 40 % six-month drawdown (+11.6 % mean but −6.0 % median; +25 % in training,
   −1 % in the test window), and collective distribution as an avoidance signal (−5.8 % in the test window,
   t = −4.4, but zero in training). Thirty-three are rejected.
3. **No strategy beats the index after costs.** Of ten pre-specified strategies and three portfolio designs,
   only "theme rotation" shows excess return (+11.8 % a year, alpha t = 2.7) — and it is the one strategy
   whose inputs (the theme taxonomy) were written in 2026 with full knowledge of which themes worked. We
   report it and discount it entirely. The passive "own what they own" baseline trails SPY by 2.8 % a year
   with a factor alpha of −4.1 % (t = −4.1). "Copy the best recent manager" is the worst idea tested:
   −9.0 % a year against SPY.
4. **Manager skill, as visible in 13F, does not persist.** Managers are ranked in the training window by
   the excess return of their new positions; the correlation of that ranking with the same statistic in the
   test window is **−0.20** across 74 managers. The ten best training-window managers averaged −4.6 % in the
   test window — exactly the same as the ten worst. A point-in-time skill score, recomputed every quarter,
   predicts nothing (top tercile −2.5 %, bottom tercile +0.6 %).
5. **The copy portfolios of 106 managers (including six defunct controls) contain no factor alpha.** None
   has a positive alpha with t > 2; thirty-one have negative alpha with t < −2. Only 20 % out-compounded SPY
   on price return over their own filing history.
6. **What 13F data is genuinely good for** is description, not prediction: who owns what, how concentrated
   the ownership is, when a crowd is forming or leaving, and how fast a theme's institutional breadth is
   changing. Those are useful inputs to risk management and to a watch-list. They are not a trading signal.

**Decision framework (Part 12, in full in §11):** buy nothing on the strength of 13F signals alone; use
10+-buyer consensus and 5–10 % new positions only as *screens* feeding independent work; treat collective
distribution and crowding as risk flags; monitor theme breadth; avoid single-manager following,
"best-manager" copying, activist and value-manager new positions, and low-breadth "early discovery" names.
Reliability of these conclusions: **high** for the negative findings (large samples, consistent across
windows and universes), **low** for the positive ones (small n, right-skewed, not reproduced out of sample).

---

## 1. What was built, and what was not

### 1.1 Data (Part 2)

| Item | Scope |
|---|---|
| SEC Form 13F structured data sets | 54 quarterly archives, 2013Q2 → filings through 2026-08-31 (period 2026-06-30 is the latest complete quarter) |
| Filers | 13,273 CIKs, 306,464 filer-quarters, every original 13F-HR and amendment |
| Universe A holdings | 5,352 13F-HR filings, 4.10 m holding rows, 115 filing entities for 106 managers |
| Acceptance timestamps | 10,461 filings from EDGAR submissions JSON (data.sec.gov) |
| Prices | 1.09 m CUSIP-quarters for 113,489 securities, *implied from the filings* (see 1.3) |
| Factors | Fama-French 5 + momentum, 49 industries (Dartmouth), compounded to quarters |

### 1.2 The manager universe (Part 1)

Universe A is a documented list of 100 managers (`data/universe.csv`: entity names, CIKs, EDGAR links,
filing counts, selection rationale) in eight style categories: 28 concentrated fundamental, 17 growth and
technology, 17 value and distressed, 11 activist, 10 global macro and tactical, 10 quantitative and systematic
(control), 8 broad institutional and passive (control), 5 sector specialists. Six defunct managers (Melvin,
Omega, Passport, Blue Ridge, Tiger Management, Discovery) are kept as survivorship controls. Reporting
entities that changed over time (Pershing Square's 2025 CIK, Elliott's two entities, Berkshire's single
consolidated filer) are mapped explicitly, with evidence.

Universe B (`docs/UNIVERSE-B.md`) is rebuilt every quarter from *all* 13,273 filers with five rules an
investor could have applied at the time (≥ 8 consecutive filings, $0.5–150 bn, top-10 ≥ 35 % and 8–250
names, active, not a conduit or bank). Typically 700–1,300 filers are eligible per quarter; the top 100 by
scale ("B-static") and by trailing two-year copy return ("B-perf", the performance-chasing rule) form the two
point-in-time universes used to check Universe A's results for selection bias.

### 1.3 Prices: the main limitation of this run

No price vendor was available, so **quarter-end prices are implied from the filings themselves**: for each
security and quarter, the median of reported value ÷ shares across all filers holding it. This is a market
close, not an estimate — at 2026-06-30, 3,700 independent filers price Micron within 0.3 % of one another —
and it is survivorship-free by construction. Its costs are real and shape everything that follows:

* The finest observation is a quarter end. **The 5-day and 20-day horizons in the brief cannot be tested**,
  and execution is modelled at the *first quarter end after the filing's acceptance timestamp*, which is
  roughly 45 days later than a daily implementation would trade. This biases every result *against*
  finding alpha; it is the conservative choice.
* Returns are **price returns, ex-dividend**; benchmarks (SPY, QQQ, RSP, IWM) are measured identically
  from their own 13F lines, so excess returns are fair, but factor alphas (total-return factors) are biased
  down by roughly the portfolio's dividend yield net of the market's.
* Splits are detected cross-sectionally from the holders' share counts (869 detected; audit note 7 lists
  the one known miss). Post-acquisition stale lines, micro-cap remnants and warrants produce absurd implied
  prices; a coverage screen (≥ 5 holders and ≥ $50 m of 13F-reported value at entry; prices blanked when
  fewer than 5 filers hold the name) removes them. Every table shows mean, winsorised mean and median
  side by side, and every manager-event table is re-run with vanished names at −100 %.

Thirteen such data issues, with their evidence and treatment, are in `docs/AUDIT-NOTES.md`.

### 1.4 Point-in-time discipline (Part 2.1)

Signals are computed from the earliest-accepted original 13F-HR for each (manager, quarter); the 482
amendments among 5,834 universe filings are later events and never alter a signal retroactively. A signal
exists from its EDGAR acceptance timestamp; cross-manager signals exist from the last contributing filing.
Position changes are measured on split-adjusted shares, never on value. Options and principal-amount
positions (609 k rows) are typed and excluded from directional signals, not converted to delta. The 2023
unit change in the SEC data is handled per filing and verified cross-sectionally (audit note 2).

### 1.5 Statistics (Part 5)

Horizons 1/2/4/8/12 quarters (labelled 3m–36m); excess over SPY, QQQ and RSP; t-statistics clustered by
report period; 95 % confidence intervals by block bootstrap over periods; calendar-time portfolios regressed
on FF5 + momentum with Newey-West errors; training window = entries ≤ 2020-12-31, untouched test window =
entries ≥ 2021-03-31; Benjamini-Hochberg FDR at 10 % across the 37 pre-specified 12-month tests. The
validation tiers are: **Validated** (right sign, |t| ≥ 2, FDR pass, same sign in both windows, n ≥ 200);
**Promising but unproven** (right sign, |t| ≥ 1.5, n ≥ 100); **Rejected** (everything else).

---

## 2. How the managers behave (Part 2.3)

The behaviour dataset (`outputs/manager_database.csv`, one row per manager, 40 fields) shows what the
filings can and cannot tell you. Across Universe A the median manager holds a new position for about three
quarters; 45 % of new positions are still held a year later and 29 % survive eight quarters. New positions
enter at a median 0.1 % of the book and, when still held a year later, are on average 1.35× their entry weight — managers scale into what works and
cut what does not, which is exactly why *value* changes cannot be read as buying or selling. Quarterly weight
turnover ranges from 3–5 % (Daily Journal, Lindsell Train, Gardner Russo, Markel) to about 40 % (Balyasny,
Caxton, Tudor, Scion). Category averages are in REPORT-DATA.md §2.

Two practical consequences. First, the quantitative and macro managers generate most of the raw event count
(Tudor alone: 20,197 new positions) but each event carries almost no information — their holdings are
derivatives hedges and factor baskets. All consensus and crowding signals therefore exclude the two control
categories. Second, concentrated managers generate few events (Akre: 284 new positions in thirteen years),
so manager-level statistics for them are noisy; the scorecards use James-Stein shrinkage toward the
cross-manager mean with a prior weight of 40 events.

---

## 3. The signal library: what the 13F reveals and what it does not (Parts 3 and 5)

All figures: 12-month return in excess of SPY after the first quarter end following acceptance, covered
events only, Universe A excluding controls. "t" is clustered by report period. Full tables with all horizons,
QQQ and RSP excess, worst-case delisting and factor alphas: `outputs/event_study/`.

### 3.1 The base rate

The first fact to internalise is the base rate: **a randomly chosen position of a top manager trails SPY by
about 6–7 % at the median over the next year and beats it 37 % of the time.** This is not a manager
failing; it is the arithmetic of a right-skewed, cap-weighted index — most stocks underperform the index
most of the time, and the index is carried by a few. Any signal must be judged against this base rate, not
against zero, and every "mean" below is dragged up by a few large winners (§7).

### 3.2 Accumulation signals

| Signal | Bucket | n | mean | median | win | t | tier |
|---|---|---|---|---|---|---|---|
| S1 new position by weight | < 0.5 % | 68,241 | −1.8 % | −7.1 % | 37 % | −0.95 | Rejected |
| | 0.5–2 % | 8,635 | −0.9 % | −5.0 % | 39 % | −0.53 | Rejected |
| | 2–5 % | 2,953 | −0.7 % | −3.1 % | 41 % | −0.42 | Rejected |
| | **5–10 %** | 756 | **+4.4 %** | −1.3 % | 44 % | 1.72 | Promising |
| | > 10 % | 250 | −0.4 % | −6.7 % | 36 % | −0.12 | Rejected |
| S2 conviction add (≥ 25 % more shares, ≥ 1 % weight) | | 10,838 | +0.9 % | −2.9 % | 41 % | 0.63 | Rejected |
| S3 consecutive accumulation | 1 quarter | 121,545 | −1.7 % | −6.3 % | 37 % | −1.09 | Rejected |
| | 2 | 40,203 | −2.2 % | −6.5 % | 37 % | −1.61 | Rejected |
| | 3 | 15,576 | −2.1 % | −7.2 % | 37 % | −1.25 | Rejected |
| | 4+ | 14,454 | −2.0 % | −6.5 % | 38 % | −1.21 | Rejected |
| S9 top-5 position vs rest | top-5 | 17,925 | −0.5 % | −2.6 % | 41 % | −0.50 | Rejected |

Position size is the only accumulation dimension with any gradient: the larger the entry weight, the less
bad the outcome, and 5–10 % entries are positive on average. But the gradient is not monotonic (> 10 %
entries are negative — these are mostly activists and single-stock vehicles), the median is negative in
every bucket, and the 5–10 % effect is +6.2 % in training and +0.2 % in the test window. **Multi-quarter
accumulation — the "conviction building" story — carries no information at all**; four or more consecutive
quarters of adding is indistinguishable from one.

### 3.3 Consensus, breadth and crowding (stock level)

| Signal | Bucket | n | mean | median | win | t | tier |
|---|---|---|---|---|---|---|---|
| S4 simultaneous buyers | 1 | 50,577 | −3.9 % | −9.1 % | 35 % | −2.39 | Rejected |
| | 2 | 23,550 | −1.7 % | −7.7 % | 37 % | −0.97 | Rejected |
| | 3–4 | 16,580 | −1.8 % | −6.3 % | 37 % | −1.04 | Rejected |
| | 5–9 | 5,339 | −0.8 % | −4.1 % | 39 % | −0.45 | Rejected |
| | **10+** | 568 | **+4.3 %** | +2.9 % | 47 % | 1.65 | Promising |
| S5 early discovery (≤ 2 holders, ≥ 1 new) | | 24,245 | −3.8 % | −9.2 % | 35 % | −2.13 | Rejected |
| S11 ownership acceleration | ≥ +3 holders | 3,993 | −0.8 % | −4.2 % | 40 % | −0.38 | Rejected |
| | ≤ −3 holders | 1,971 | +2.6 % | −4.6 % | 39 % | 0.99 | Rejected |
| S12 crowded (top 2 % by breadth) | | 3,867 | +0.1 % | −2.3 % | 42 % | 0.10 | Rejected |

Breadth is monotonic in the right direction — the more managers buy a name at once, the less it
underperforms — and only the rare 10+ case (568 stock-quarters, about eleven a quarter, essentially the
mega-caps in 2015–16, 2018, 2022–23) is positive. It is positive in both windows (+4.2 % train, +4.6 % test)
but never significant, and its factor alpha is +4.7 % (t = 1.2). The honest reading is that **a very broad
consensus among sophisticated holders is mildly informative about large, liquid names**, and nothing finer
than that is. "Early discovery" — buying what one or two managers just found — is the worst stock-level
signal in the library (−3.8 %, t = −2.1): low-breadth names are small, illiquid and mostly go nowhere.
Crowding (S12) is not a reliable warning either: crowded names did fine on average, with a factor alpha of
−2.7 % (t = −2.2) that reflects their size and momentum loadings rather than a crowding penalty.

### 3.4 Distribution signals

| Signal | Bucket | n | mean | median | win | t | tier |
|---|---|---|---|---|---|---|---|
| S6 exits | from a top-10 position | 1,839 | −1.0 % | −3.6 % | 39 % | −0.71 | Rejected |
| | other | 69,867 | −1.3 % | −6.9 % | 37 % | −0.71 | Rejected |
| S7 collective distribution (≥ 3 sellers, net ≤ −2) | | 14,149 | −2.2 % | −6.3 % | 37 % | −1.58 | Promising |

Exits are uninformative: what managers sell goes on to perform exactly like what they hold. Collective
distribution is the one *avoidance* candidate: flat in the training window (+0.7 %, t = 0.3) but strongly
negative in the test window (−5.8 %, t = −4.4, n = 6,470). Because the sign flips between windows it
cannot be called validated; it is the single most interesting thing to keep monitoring.

### 3.5 Contrarian, momentum and style

| Signal | Bucket | n | mean | median | win | t | tier |
|---|---|---|---|---|---|---|---|
| S8 accumulation by prior 6-month return | ≤ −40 % | 9,040 | +11.6 % | −6.0 % | 42 % | 1.55 | Promising |
| | −40..−20 % | 20,927 | −1.3 % | −9.0 % | 37 % | −0.43 | Rejected |
| | −20..0 % | 49,162 | −3.1 % | −6.9 % | 36 % | −1.92 | Rejected |
| | 0..20 % | 58,208 | −3.1 % | −5.0 % | 38 % | −2.61 | Rejected |
| | > 20 % | 43,769 | −1.1 % | −7.1 % | 37 % | −0.60 | Rejected |
| S14 accumulation by 12-1 momentum tercile | low | 58,552 | −0.7 % | −7.4 % | 37 % | −0.29 | Rejected |
| | mid | 58,705 | −3.0 % | −5.3 % | 37 % | −2.65 | Rejected |
| | high | 58,586 | −1.3 % | −6.2 % | 38 % | −0.78 | Rejected |
| S10 by manager category | Concentrated fundamental | 28,953 | +0.1 % | −3.3 % | 41 % | 0.09 | — |
| | Growth and technology | 41,582 | −0.8 % | −6.6 % | 38 % | −0.35 | — |
| | Sector specialist | 8,791 | −0.9 % | −14.2 % | 36 % | −0.24 | — |
| | Global macro and tactical | 77,976 | −2.5 % | −6.8 % | 36 % | −1.66 | — |
| | Activist | 4,383 | −3.6 % | −5.0 % | 39 % | −3.17 | — |
| | Value and distressed | 30,093 | −3.7 % | −7.3 % | 36 % | −1.97 | — |

**Contrarian accumulation is the headline that would be sold and should not be bought.** Manager buying
into a stock that fell 40 % or more over the prior two quarters shows a +11.6 % mean excess return with a
factor alpha of +8.8 % (t = 2.3) — and a median of −6.0 %, a 42 % win rate, a 21 % chance of losing more
than half against the index, and a 9 % chance of doubling. The mean is made entirely by the right tail
(without the top 5 % of events the mean is −5.4 %). It was +25 % in the training window and −1 % in the
test window. This is a small-cap reversal lottery (SMB loading 1.9), not a repeatable signal.

Style matters more than any single signal: **activists' and value managers' new positions are the only
category results significant on the wrong side** (−3.6 %, t = −3.2; −3.7 %, t = −2.0). The brief asked
whether activists lead returns: on 13F evidence, following them after the filing is a losing proposition —
the announcement effect is captured before the 13F appears.

### 3.6 Skill, divergence and style change (S13, S15)

A point-in-time skill score (James-Stein-shrunk excess return of each manager's past new positions, known
only once outcomes are realised) was computed every quarter and used to sort future events:

| Test | Bucket | n | mean | median | t |
|---|---|---|---|---|---|
| New positions by point-in-time skill tercile | high | 17,061 | −2.5 % | −7.5 % | −1.08 |
| | mid | 31,916 | −2.3 % | −8.3 % | −1.16 |
| | low | 23,780 | +0.6 % | −5.0 % | 0.26 |
| Divergence (stock level) | skilled buy, unskilled sell | 7,248 | −1.5 % | −6.5 % | −0.70 |
| | unskilled buy, skilled sell | 6,860 | −3.3 % | −7.5 % | −1.76 |
| | skilled buy only | 13,373 | −4.2 % | −9.8 % | −2.13 |
| Style change — new positions in a hyperactive quarter (≥ 2σ) | | 18,216 | +2.8 % | −3.3 % | 0.68 |
| — in a normal quarter | | 57,910 | −2.9 % | −7.6 % | −2.30 |
| Manager copy return, 4 quarters after a hyperactive quarter | | 556 | −2.3 % | −2.9 % | −0.70 |

**Past 13F skill does not predict future 13F skill.** The managers whose disclosed buys worked best in the
past did slightly worse afterwards than those whose buys worked worst; divergence between skilled and
unskilled holders carries no information either. A sudden burst of activity (S15) is weakly associated with
better new positions in that quarter but not with better subsequent performance for the manager.

### 3.7 Out of sample, costs of being wrong, and the leaderboard (Part 10)

`outputs/leaderboard.csv` ranks all 37 pre-specified 12-month tests. **Validated: 0. Promising but
unproven: 4. Rejected: 33.** Nothing survives the FDR correction (the smallest p among right-direction tests is 0.085). The
training and test windows disagree in sign for 26 of 37 tests, and in the test window — the AI-led,
rate-cycle market of 2021–26 — 22 of 37 are *negative and significant*: top-manager positions have
underperformed a cap-weighted index led by a handful of mega-caps by more than they did before. That is a
regime observation, not a flaw in the test, and it is exactly why a test window was reserved.

---

## 4. Strategies A–J, the passive baseline and the three portfolio designs (Parts 5.3, 9)

Quarterly rebalanced, long-only, equal-weight unless stated, 10 % cap, 50 names, ≥ $200 m of 13F-reported
value at the rebalance, 20 bp per side. Base run: `outputs/strategies/summary_base.csv`; sensitivities:
`outputs/validation/strategy_sensitivities*.csv`.

| Strategy | Rule | CAGR | SPY same period | Excess | Sharpe | Max DD | FF6 alpha (t) | Turnover/yr |
|---|---|---|---|---|---|---|---|---|
| A | consensus accumulation, top 30, hold 2q | 11.4 % | 11.8 % | −0.5 % | 0.53 | −46 % | −1.8 % (−0.9) | 1.1× |
| B | new positions ≥ 2 % of a book, hold 4q | 11.2 % | 12.4 % | −1.2 % | 0.55 | −32 % | −0.2 % (−0.1) | 1.8× |
| C | copy the best trailing-2-year manager, hold 1q | 3.4 % | 12.4 % | **−9.0 %** | 0.18 | −38 % | −3.5 % (−0.5) | 2.4× |
| D | ≥ 3 consecutive quarters of adding, hold 2q | 10.4 % | 12.0 % | −1.5 % | 0.46 | −39 % | −1.6 % (−0.5) | 1.3× |
| E | emerging ownership (≤ 3 → ≥ +2 holders), hold 4q | 7.5 % | 11.8 % | −4.4 % | 0.33 | −52 % | −3.9 % (−1.7) | 2.0× |
| F | contrarian smart money (≥ 20 % drawdown), hold 4q | 7.5 % | 11.8 % | −4.3 % | 0.33 | −50 % | +0.4 % (0.1) | 1.6× |
| G | theme rotation (top-3 themes by net buyers), hold 1q | 24.3 % | 12.4 % | +11.8 % | 0.81 | −48 % | +8.7 % (2.7) | 2.4× |
| H | specialist-manager signal by industry | not run — sector map pending (see §10) | | | | | | |
| I | ensemble z-score of A, B, D, E, hold 2q | 12.3 % | 12.4 % | −0.1 % | 0.58 | −39 % | −1.4 % (−0.7) | 1.7× |
| J | A minus collective-distribution names | 9.9 % | 11.8 % | −1.9 % | 0.47 | −47 % | −2.3 % (−1.1) | 1.5× |
| Passive | everything they own, value-weighted, 200 names | 9.6 % | 12.4 % | −2.8 % | 0.52 | −34 % | **−4.1 % (−4.1)** | 0.6× |
| Design A | long-term compounders (≥ 8q, ≥ 3 holders, a top-5 holder) | 12.4 % | 13.5 % | −1.1 % | 0.65 | −30 % | −2.3 % (−1.5) | 0.4× |
| Design B | accumulation + positive 12-1 momentum | 9.7 % | 12.0 % | −2.3 % | 0.45 | −45 % | −4.8 % (−2.2) | 1.4× |
| Design C | themes in adoption stage 2–3 | 17.3 % | 11.8 % | +5.5 % | 0.56 | **−71 %** | +4.8 % (0.7) | 1.7× |

Reading the table:

* **Everything built from manager decisions alone (A–F, I, J, Designs A–B) trails SPY by 0.1–9.0 % a
  year**, with higher volatility and deeper drawdowns than the index. The ensemble (I) matches the index
  before its own costs and loses to it after. Removing collectively-distributed names from the consensus
  book (J vs A) *hurt* by 1.5 % a year over the full sample, even though the distribution signal looks
  useful in the test window — a reminder of how little a 1–2 % event-level effect survives portfolio
  construction and turnover.
* **The passive baseline is the most important row.** Owning what the hundred managers own, weighted by
  their holdings, rebalanced once a quarter with 60 % annual turnover, has a *negative* factor alpha of
  4.1 % a year with t = −4.1. After controlling for market, size, value, profitability, investment and
  momentum exposure, the aggregate top-manager portfolio destroys value relative to its factor
  exposures — a result consistent with the academic literature on institutional holdings and with the
  managers' own net-of-fee records.
* **"Copy the best manager" (C) is the worst strategy tested.** Selecting each quarter the manager with the
  best trailing two-year copy return and holding its top-20 book returned 3.4 % a year against 12.4 % for
  SPY. Performance chasing at the manager level is actively harmful, which is the same lesson as §3.6.
* **Theme rotation (G) and the theme design (C) are the only positive rows and both are contaminated by
  hindsight.** The 23-theme taxonomy and its 715 member securities were written in 2026; "AI compute",
  "semis packaging" and "data-centre power" are in the taxonomy *because* they worked. The stage model and
  net-buyer ranking are point-in-time, but the membership is not. Design C also carried a 71 % drawdown.
  Both results are reported for completeness and excluded from any recommendation (§6 shows what can be
  salvaged).

### 4.1 Sensitivities (Part 5.5)

<!-- SENSITIVITIES -->

---

## 5. Manager scorecards (Part 6)

`outputs/scorecard/manager_scorecard.csv` scores all 106 managers on two independent axes:

* **Investor quality** — what copying the whole disclosed book would have earned: copy CAGR vs SPY over
  the same quarters, hit rate, factor alpha of the copy series, maximum drawdown.
* **13F signal quality** — what the *changes* were worth: shrunk 12-month excess return after new
  positions, after conviction adds, and (sign-flipped) after exits; the number of market regimes
  (2013–19, 2020, 2021–22, 2023–26) in which the manager's new positions were positive.

The two axes are only loosely related (correlation 0.36), and the second is where a 13F reader would look.

**Copy-portfolio results (investor quality).** No manager's copy portfolio has a positive FF6 alpha with
t > 2. Thirty-one have significantly negative alpha, led by the passive giants (BlackRock, State Street,
Vanguard, Geode: alpha −1.8 to −2.8 % a year, t ≈ −4.5 to −7.4, which is the dividend-yield artefact of
price returns plus their non-US and bond sleeves) and by the defunct controls (Blue Ridge −13.2 %, Omega
−9.7 %, Passport −8.7 %, Discovery −7.7 %). Only 21 of 106 copy portfolios out-compounded SPY on price return
over their own history; the median shortfall is 1.7 % a year. The best copy records are concentrated in two
places: sector specialists in biotech (Perceptive, RA Capital, Baker Bros — very high, very noisy, and in
RA Capital's case paired with the worst new-position record in the universe) and a few growth and macro
managers (Whale Rock 22.7 % CAGR vs 12.4 %, Duquesne 19.1 %, Scion 25.3 % over 32 quarters), none
significant after factor adjustment.

**New-position results (13F signal quality).** Ranked by the excess return of their new positions
(≥ 150 events), the top of the table is Whale Rock (+12.3 %, t = 2.2), Altimeter (+11.6 %, t = 1.7),
Duquesne (+8.2 %, t = 2.6), Coatue (+7.5 %), Sachem Head (+6.2 %), Brave Warrior (+6.0 %), Lone Pine
(+5.2 %), Akre (+5.1 %, t = 2.6, and the only one of these with a *positive median*), Soroban (+4.5 %,
median +4.2 %). The bottom is Icahn (−13.4 %), Elliott (−11.5 %, t = −5.2), Durable (−10.6 %), Fairholme,
Tweedy Browne, Greenlight, Oaktree, JANA (−5.6 to −6.7 %). Three managers have t > 2 on the positive side,
fourteen have t < −2 on the negative side, out of 76 with enough events — a distribution a little *worse*
than chance would produce if no manager had any skill.

**Persistence is the test that matters, and it fails.** Across 74 managers with enough events in both
windows, the correlation between training-window and test-window new-position excess return is −0.20. The
best ten in training averaged −4.6 % in the test window; so did the worst ten. By calendar year, only 7 of 74
managers beat a 50 % hit rate against SPY in more than half the years they were active (Lone Pine 8 of 11,
Soroban 8 of 11, Markel 7 of 11, Whale Rock 7 of 12), which is about what a coin would deliver.

**Which 13F signals are reliable for which managers?** Within this evidence: for a handful of managers (Whale Rock, Altimeter, Duquesne, Lone Pine, Soroban — positive in three of
four regimes; Markel in all four at a modest +3 %; Akre with t = 2.6 and a positive median) *new positions*
have been informative — these are the only manager-specific signals we would keep on a watch-list, with the explicit caveat that the same
screen applied in 2020 would have picked a different set. Conviction adds are informative for no one
(the best shrunk estimates — RA Capital, Whale Rock, Davis, Sachem Head at +12 to +14 % — rest on 81–234
events each and come from managers whose plain new positions are flat or negative). Exits are informative for no one.

---

## 6. Themes and the adoption cycle (Part 4)

Twenty-three themes in six parent groups (`data/themes.csv`; membership by issuer-name rules and manual
additions, `data/theme_rules.csv`, 715 securities) are scored every quarter on institutional breadth
(holders among Universe A), four-quarter breadth change, two-quarter net buyers, and ownership
concentration (HHI), and placed in one of five adoption stages: 1 pioneer (≤ 5 holders, rising), 2 early
adoption (breadth rising, net buyers positive), 3 acceleration (breadth jump ≥ 5 in four quarters),
4 consensus (high breadth, slowing), 5 distribution (breadth falling, net sellers). Stage 0 is "no signal".

**Stage returns (equal-weight theme members, 12-month SPY excess, 1,107 theme-quarters):**

| Stage | n | mean | median | win | t (clustered) |
|---|---|---|---|---|---|
| 0 no signal | 614 | +14.0 % | +6.0 % | 55 % | 5.6 |
| 1 pioneer | 22 | +31.9 % | −9.9 % | 41 % | 1.1 |
| 2 early adoption | 42 | +10.7 % | −0.5 % | 50 % | 1.9 |
| 3 acceleration | 76 | +15.5 % | +5.9 % | 57 % | 3.1 |
| 4 consensus | 93 | +9.7 % | +9.7 % | 59 % | 2.7 |
| 5 distribution | 260 | +11.0 % | +4.4 % | 48 % | 4.1 |

Two things are visible at once. First, *every* stage, including "no signal" and "distribution", beats SPY
by around 10–15 % a year — because the themes themselves were chosen in 2026 knowing they had won. That
is hindsight, and it is why Strategy G's +11.8 % cannot be used. Second, within that contaminated
baseline, **the stage ordering is the one the adoption model predicts**: acceleration (stage 3) and
consensus (stage 4) have the highest win rates and medians; distribution (stage 5) has the lowest win rate
(48 %) and over two years the lowest excess return; pioneer-stage themes have a huge mean, a negative
median and a 41 % win rate — the lottery profile again. The stage model has some descriptive validity; the
theme list has none as a forecast.

**Historical cases (Part 4.3).** The pipeline dates each theme's first stage-2/3 signal and the first
investable quarter end after it (`outputs/themes/theme_cases.csv`). For cloud computing, e-commerce and
semis the first signal falls in 2014-06-30 — the first quarter in which a four-quarter breadth change can be
computed — so the onsets are left-censored by the data start and tell us nothing about lead times. The
cleaner cases are **AI compute** (first acceleration signal 2016-06-30, public 2016-08-15, investable
2016-09-30 at 18 holders; +65 % vs SPY +16 % over the next year, +128 % vs +37 % over three), **nuclear**
(2015-06-30, six holders, +46 % vs +52 % over three years — early, and wrong for years) and **data-centre
power** (2014-12-31, +16 % vs +27 % over three years — too early by nearly a decade). Peak breadth came
7–12 years after the first signal in every case. The lesson is the one the brief anticipated: 13F breadth
identifies a theme's *institutional* adoption, which can lead or lag price by years.

**Current cycle (2026-06-30).** Stage 3 (accelerating): **AI networking and memory** only (28 holders, +5
in four quarters, +8 net buyers over two). Stage 0 with rising breadth: AI compute (40 holders, +4, +6 net
buyers — but 28 reducers against 21 initiators; the crowd is rotating within it), digital payments (50,
+5), robotics (19, +4 breadth, −7 net buyers). Stage 5 (distribution): cloud computing (45 holders, −23 net
buyers over two quarters — the broadest selling in the taxonomy), cybersecurity (−14), banks (−13),
EM consumption (−12), enterprise AI software (−11), streaming (−10), nuclear (−9), managed care (−9),
e-commerce (−8), healthcare/obesity (−5). The managers are, in aggregate, moving money from software,
cloud and cyber into memory, networking and the physical AI supply chain.

---

## 7. Attribution and case studies (Part 7)

**Where the returns come from.** For each strategy the top 5 % of names account for 42–98 % of the total
contribution (A: 59 %, B: 76 %, E: 95 %, F: 98 %, G: 42 %); for Strategy C the top 5 % contribute more than
the total (150 %) because everything else lost money. At event level, the mean 12-month excess return of
every positive-looking signal turns negative when its top 5 % of events are removed (5–10 % new positions:
+3.2 % → −5.0 %; conviction adds +0.9 % → −6.4 %; 10+ consensus +4.3 % → −1.0 %; contrarian +11.6 % →
−5.4 %). **13F following is a strategy of many small losses and rare large wins**; its "edge", where any
exists, is a right tail that a portfolio with a 10 % cap and 50 names mostly cannot capture.

**The most crowded consensus events** (`attribution/cases_most_crowded_consensus.csv`): Alphabet in
2022Q3 (34 buyers, +34 % vs SPY over the next year), Amazon 2022Q2 (32 buyers, −7 %), Facebook 2018Q1 (28
buyers, −9 %), Facebook 2021Q1 (25 buyers, **−42 %**), Alphabet 2015Q4 (26, −3 %), Allergan 2015Q2 (24,
−28 %), Alibaba 2014Q3 (23, −21 %), Meta 2023Q3 (23, +42 %). Mega-cap consensus is a coin flip that pays
when it coincides with a drawdown (2022) and loses when it coincides with a top (2018, 2021).

**The largest new positions ever disclosed** (`cases_largest_new_positions.csv`): Scion's 100 % GEO Group
(−13 % at 12 months), Pabrai's 81 % Alpha Metallurgical (−43 % / −93 % at 24 months), Maverick's 47 %
Coupang (−58 %), Baker Bros' 37 % Seagen (−39 %), Soros's 35 % Rivian (−60 % / −94 %), TCI's 35 % Altaba
(−13 % / −89 %). Of the fifteen largest, two were positive at two years. **Very large single-name bets by
famous managers have been, on 13F evidence, a reliable warning**, which is why the > 10 % bucket is
negative despite the 5–10 % bucket being positive.

**Early discovery** (`cases_early_discovery_paths.csv`): of 123 names that went from ≤ 2 universe holders
to ≥ 10, the median two-year excess return from the first signal was +15 %, and the list includes Nvidia
(signal 2013Q3 at 2 holders; +545 % vs SPY over three years), Broadcom, S&P Global, Lam Research — and
also AMD (−36 % at two years before +172 % at three), AppLovin (−44 %), General Electric. But these 123 are
the survivors of 24,245 early-candidate events, and the population mean is −3.8 %. The successes are
real, identifiable only in hindsight, and swamped by the failures.

**Manager calls** (`cases_best_worst_calls.csv`, `cases_manager_hit_rate_by_year.csv`): the best
two-year calls (new positions ≥ 2 % of a book) are Coatue's Roku in 2018 (+934 % vs SPY), Eminence's and
Duquesne's Vertiv in 2022, Sachem Head's and Light Street's Sea in 2019, Pennant's EchoStar, Scion's
Cenovus, Altimeter's Pinduoduo; the worst are biotech (RA Capital's 89bio, Veru), fallen growth (Farfetch,
LivePerson, Tilray, Super Micro) and Abrams' Bristol-Myers and Pacific Drilling (−140 to −150 % relative over
two years). No manager's
year-by-year hit rate is stable enough to distinguish from noise (§5).

---

## 8. Current intelligence: what the filings say now (Part 8)

Latest complete quarter: **2026-06-30** (81 of 81 still-active Universe A managers filed by the 2026-08-14
deadline). No filings for 2026-09-30 exist in the SEC data sets yet (due 2026-11-16), so there is no
"early filings" section this quarter. Full tables: `outputs/current/`.

**Top accumulation (composite of buyer breadth, conviction adds, ownership acceleration and
skill-weighted buyers; ≥ 3 buyers):** AMD (13 buyers incl. Coatue, Duquesne, Whale Rock, Harris; +8
holders in a quarter; +309 % over the prior year), Seagate (10 buyers, +5 holders, +569 %), Lam Research,
Intel (15 buyers, +7 holders), Micron (9 buyers, +837 %), Alphabet (14 buyers but 24 reducers), Fabrinet,
Flowserve, Rocket, Delta, Hut 8, AstraZeneca, Relay, Repligen, Meta, Sunbelt, Thermo Fisher, CoreWeave, Bank
of America. **Historical calibration for these buyer counts is −1 % mean / −4 % median** (3–9 buyers) and
+4 % / +3 % (10+). The top of this list is a late-stage, post-tripling chase into the AI memory and
semiconductor-equipment complex by growth and macro managers; the calibration says to expect index-like or
worse results from it.

**Top distribution warnings (≥ 3 sellers, ranked by breadth of selling, net sellers, big cuts and
skill-weighted sellers):** TSMC (22 reducers, 9 big cuts, net −13, after +111 %), Alphabet (24 reducers,
net −11, after +103 %), Broadcom (13 reducers, 4 exits), Applied Materials (after +295 %), AppLovin,
Spotify, Shopify, Uber, Oracle, ASML, Analog Devices, EchoStar, Disney, Roblox (6 exits, holders 12 → 6),
Netflix, Sea, Microsoft (18 reducers), MercadoLibre, Alibaba, MongoDB. The pattern is profit-taking in the
2025–26 semiconductor winners and broad exits from consumer internet and software.

**Disagreements (both sides active):** Amazon (23 increasing, 19 reducing; skilled buyers 0.12 vs sellers
0.01), Microsoft (16 vs 18), Meta (12 vs 15 — skilled sellers outweigh), Alphabet (10 vs 24), Visa, Nvidia
(11 vs 13, skilled buyers ahead), UnitedHealth (7 new, 6 increasing vs 9 reducing after +33 %), TSMC,
Broadcom, AMD. Given §3.6, the skill weighting should be read as a tie-break, not a forecast.

---

## 9. What the backtests prove and what they do not (Part 11)

**They prove**, with large samples and consistency across windows, universes, horizons and benchmarks:
that single-manager disclosed buys, however sized, sequenced or categorised, do not beat the index after
the filing is public; that past 13F skill does not predict future 13F skill; that copy portfolios carry
negative factor alpha; that performance-chasing at the manager level is destructive; and that breadth-based
signals are monotonic but only informative at extremes too rare to build a portfolio on.

**They do not prove** that the four "promising" signals are worthless — only that this data cannot
establish them. Nor can they say anything about intra-quarter execution (the daily engine in `bt_core.py`
is written and untested for lack of prices), dividends, short-side implementation, option positions, or the
2013-and-earlier record of these managers. Factor alphas are price-return alphas against total-return
factors and are biased down by roughly 1–2 % a year for dividend-paying books.

**The main things that could change the conclusions**, in order of likelihood: (1) daily prices, which
would cut the execution delay from ~45 days to one and recover whatever information decays inside the
first weeks after a filing — the literature suggests this is where most 13F value sits, and it is
precisely what a retail follower cannot capture either; (2) total-return data, which would raise every
alpha by the dividend differential and flatter value managers; (3) an options-aware treatment of the macro
managers; (4) a longer history.

---

## 10. Open items and limitations

* **Strategy H and industry specialisation (S10b)** require the CUSIP → ticker → SIC map; the OpenFIGI
  mapping of 27,287 CUSIPs was still running at the time of writing (rate-limited to 250 per minute without
  a key). The code path (`sector_map.py`, the sector hit-rate in `scorecard.py`, Strategy H) is complete and
  runs unchanged once the map exists.
* No daily horizons; no dividends; no short side; quarterly execution only (§1.3).
* Theme membership is hindsight (§6). A point-in-time taxonomy would have to be reconstructed from
  contemporaneous sources quarter by quarter; nothing in the SEC data supports that.
* Universe A is biased by construction; Universe B results (§4.1) are the check.
* The TSLA 2020 5:1 split was not detected (audit note 7); one known, 2–3 quarter distortion.
* Multiple-testing control is applied to the 37 pre-specified 12-month tests; the other horizons, the
  manager-level and S13/S15 tables are exploratory and labelled as such.

---

## 11. Decision framework (Part 12)

**What to buy on the strength of 13F data alone: nothing.** No signal, strategy or manager passes the
validation bar, and the best-looking candidates are right-tail lotteries or hindsight.

**What to use as screens (reliability: low; evidence: right sign in both windows, not significant):**
* names with **ten or more** Universe A buyers in the same quarter (about eleven a quarter; +4 % mean, +3 %
  median; essentially large caps in drawdowns);
* **new positions sized 5–10 %** of a concentrated manager's book (+4 % mean, slightly negative median;
  about 60 a year);
* new positions by the few managers whose disclosed buys have worked across three of four regimes (Whale
  Rock, Altimeter, Duquesne, Lone Pine, Soroban; Markel; Akre), knowing that this list is itself the product
  of a selection that did not persist historically.

**What to treat as risk flags (reliability: moderate for the test window, unproven overall):**
* **collective distribution** (≥ 3 sellers, net ≤ −2 among qualifying managers): −5.8 % (t = −4.4) in
  2021–26; today's list is led by TSMC, Alphabet, Broadcom, Applied Materials, Spotify, Shopify, Uber;
* **very large single-name bets** (> 10 % of a book) by any manager;
* **theme breadth in distribution** (stage 5): cloud, cybersecurity, banks, EM consumption, enterprise AI
  software, streaming.

**What to monitor (descriptive use, reliability: high as description, none as forecast):** institutional
breadth and its rate of change by theme (AI networking/memory is the only accelerating theme; AI compute is
rotating internally); disagreements among the broadest holders (Amazon, Microsoft, Meta, Nvidia); the
quarterly manager database for changes in concentration and turnover.

**What to avoid:** following individual manager buys of any size below 5 %; "conviction building" and
ownership-acceleration stories; early-discovery names with one or two holders; activists' and value
managers' new positions after the filing; copying the best recent manager; crowding as a sell signal;
anything built on a theme list written after the fact.

**Why:** the filing arrives 45 days late, the market has already priced the announcement effects, the
average top-manager position trails a cap-weighted index like any other stock, and whatever skill exists
is not visible in the holdings changes at a quarterly frequency, after costs.

**How reliable is this conclusion?** High for the negatives: they rest on 80,000–360,000 events, hold in
both windows, in Universe A and B, against SPY, QQQ and RSP, with and without the worst-case delisting
assumption. Low for the positives: n of a few hundred, medians near zero or negative, and no out-of-sample
confirmation. A defensible finding that 13F tracking provides no meaningful incremental alpha is what the
evidence supports.
