# Methodology

## 0. The question

Not "which famous investor made the most money", but: **what information in institutional 13F
disclosures could an outside investor have converted into returns after the filing became public,
after costs, and after controlling for what the market already paid for (beta, size, value, momentum,
quality, sector)?** Every signal below is a hypothesis to be rejected until the evidence says otherwise.

## 1. Data and point-in-time integrity

* **Holdings**: SEC Form 13F structured data sets (all filers, all 13F-HR / 13F-HR/A, 2013Q2 → latest).
  The INFOTABLE is kept exactly as published. Values are converted to dollars per the SEC's unit switch on
  2023-01-03, and each filing's unit is verified cross-sectionally (`unit_fix`).
* **Availability**: the EDGAR *acceptance timestamp* of each filing (data.sec.gov), not the report date and
  not the filing date. A signal exists from that timestamp forward. Cross-sectional signals (consensus,
  breadth) exist from the last contributing filing's acceptance.
* **Originals and amendments**: the earliest-accepted 13F-HR for a (CIK, period) is the signal source.
  Restatements and new-holdings amendments are later events and never retroactively change a signal.
  `amended_later` lets the validation step test sensitivity to filings that were later corrected.
* **Position changes** are measured on split-adjusted shares, never on market value.
* **Identifiers**: CUSIP is the primary key throughout (it is what filers report). CUSIP → ticker via
  OpenFIGI is used only for the industry map (sector benchmarks, specialist tests); unmapped CUSIPs are
  counted and reported, not dropped silently.
* **Prices — what was actually built.** No price vendor was available in this run, so quarter-end prices
  are *implied from the 13F filings themselves*: for each CUSIP and quarter, the median of value ÷ shares
  across every filer that reported the security (positions ≥ $200k, ≥ 3 such holders, dispersion filter).
  Splits are detected cross-sectionally from the holders' share-count jumps between quarters and prices are
  put on a single split-adjusted basis (docs/AUDIT-NOTES.md, notes 5–7). Consequences, all reported with the
  results: (a) returns are *price* returns, ex-dividend, and the benchmarks (SPY, QQQ, RSP, IWM) are
  measured the same way from their own 13F lines; (b) the finest observation is a quarter end, so the 5-day
  and 20-day horizons in the brief are **not testable** and the execution model is quarterly (below);
  (c) a quarter-end price implied by fewer than 5 filers is blanked (stale lines after acquisitions, note 13);
  (d) the price universe is every CUSIP any filer reported, which is survivorship-free by construction, but
  a delisted name's final payout is unknown — forward returns truncate at the last covered price and every
  event table is re-run with vanished names at −100 % (worst case).
* **Factors**: Fama-French 5 factors + momentum (daily, compounded to quarters); 49 industry portfolios;
  SIC codes from EDGAR submissions JSON.

## 2. Universes

* **A — today's top 100** (data/universe.csv): selection criteria and evidence per manager. Biased by
  construction (reputation and survival are known today); used for the current intelligence report and
  as the first-pass test.
* **B — point-in-time** (docs/UNIVERSE-B.md): re-selected every quarter from all filers using only
  filings and prices available then. The decisive test of manager-selection bias.
* **Controls**: quantitative/platform and broad/passive managers are tracked but excluded from
  "qualifying manager" signals; defunct managers are kept.

## 3. Execution model (as implemented)

A filing accepted at time T is bought at the **first quarter end strictly after T** at that quarter end's
13F-implied price. For a normal filing (period t, accepted ~45 days later) that is the end of quarter t+1
— roughly 45 days of additional delay over daily execution, which biases every result *against* finding
alpha and is the conservative choice given the data. Sensitivity: +1 further quarter of lag. Costs: 20 bp
per side default; 10 / 40 / 80 bp sensitivities. Liquidity screen: ≥ $200m of total 13F-reported value in
the security at the rebalance. Position cap 10 %, 50 names (200 for the passive baseline). Price returns,
no dividends (benchmarks likewise). Long-only; "distribution" signals are tested as avoidance, not shorts.

## 4. Statistics

* Forward returns at 1 / 2 / 4 / 8 / 12 quarters (labelled 3m / 6m / 12m / 24m / 36m), absolute and in excess
  of SPY, QQQ and RSP (equal-weight S&P 500); 5d / 20d are not observable on quarterly prices.
* Every event table requires ≥ 5 13F holders and ≥ $50m of 13F-reported value in the security at entry
  (the coverage screen, audit note 12) and reports the mean, a 1 %/99 % winsorised mean and the median.
* Overlapping observations: t-statistics are clustered by report period; 95 % CIs by block bootstrap over
  report periods. N and the number of period clusters are always shown.
* Factor adjustment: calendar-time equal-weight portfolios (Jaffe–Mandelker) regressed on quarterly FF5 + Mom
  with Newey-West (2 lags) errors. Because the portfolio is a price-return series and the factors are
  total-return, the alphas are biased down by the portfolio's dividend yield net of the market's.
* **Pre-specified vs post-hoc**: signals S1–S15 and strategies A–J were written down (this file, the
  `event_study.py` docstring) before any return was computed. Anything added after seeing results is
  labelled `post-hoc` in the outputs and excluded from the leaderboard's "validated" tier.
* **Multiple testing**: Benjamini-Hochberg FDR at 10 % across the full set of pre-specified tests.
* **Out of sample**: the sample is split at 2020-12-31. Training/validation 2013Q3–2020Q4 (with rolling
  walk-forward inside it); untouched test 2021Q1–2026Q2 — chosen because it contains the 2022 rate
  cycle and the AI-led market, i.e. regimes unlike the training window. A strategy's parameters are fixed
  on the training window and reported once on the test window.
* **Robustness**: exclude the 50 largest stocks; exclude the 10 most-followed managers; Universe A vs B;
  costs and lags; regimes (2013–19, COVID 2020, 2022 rate cycle, 2023–26).

## 5. What is *not* inferred

Intra-quarter timing or prices; short positions; option directionality (puts/calls are typed and
excluded from directional signals); cash; derivatives; causation from correlation.
