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
* **Identifiers**: CUSIP → current ticker via OpenFIGI; ticker histories and corporate actions from the
  price vendor; unmapped CUSIPs are counted and reported, not dropped silently.
* **Prices**: Tiingo adjusted closes (splits and dividends), including delisted tickers, so the stock
  universe is survivorship-free to the extent the vendor's delisting coverage allows (reported).
* **Factors**: Fama-French 5 factors + momentum, daily; 49 industry portfolios; SIC codes from EDGAR.

## 2. Universes

* **A — today's top 100** (data/universe.csv): selection criteria and evidence per manager. Biased by
  construction (reputation and survival are known today); used for the current intelligence report and
  as the first-pass test.
* **B — point-in-time** (docs/UNIVERSE-B.md): re-selected every quarter from all filers using only
  filings and prices available then. The decisive test of manager-selection bias.
* **Controls**: quantitative/platform and broad/passive managers are tracked but excluded from
  "qualifying manager" signals; defunct managers are kept.

## 3. Execution model

A filing accepted at time T is bought at the first session close strictly after T (same-day close only if
accepted before 15:45 ET), plus `lag_sessions` (default 1). Sensitivities: 0 and 5 sessions. Costs: 20 bp
per side default; 10 / 40 / 80 bp sensitivities. Liquidity screen: 63-day average dollar volume ≥ $5m
at the rebalance date. Position cap 10 %, name cap per strategy. Dividends reinvested. Long-only unless
stated; short-side tests model borrow and shortability separately and are reported as such.

## 4. Statistics

* Forward returns at 5d / 20d / 3m / 6m / 12m / 24m / 36m, absolute and in excess of SPY, QQQ, RSP and the
  FF49 industry where mapped.
* Overlapping observations: t-statistics are clustered by report period; 95 % CIs by block bootstrap over
  report periods. N and the number of period clusters are always shown.
* Factor adjustment: calendar-time equal-weight portfolios regressed on FF5 + Mom with Newey-West (6
  lags) errors.
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
