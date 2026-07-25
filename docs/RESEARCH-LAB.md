# Equity Research Lab — Product & Engineering Documentation

The Research Lab is a module inside Meridian that runs institutional-style research over every
equity in the household portfolio and watchlist. It ships **preseeded for the existing holdings**
and is built around one non-negotiable: **no fabricated capability** — every number is either
computed by the engine or comes from a labeled, dated dataset behind a replaceable provider adapter.

## 1. Product requirements (condensed PRD)

One place to: see the research universe (portfolio + watchlist), open a full dossier per ticker
(business, financials, valuation, investor lenses, technicals, memo, news), edit and save a thesis,
compare up to five names, and understand what each position's evidence says *versus what the price
implies*. Conclusions must be traceable, uncertainty explicit, recommendations reasoned — never a
score with a hidden formula.

## 2. User journeys & information architecture

```
Research Lab (/research)          — coverage table · Investor Lens Matrix · integrity banner
 ├─ Dossier (/research/:symbol)   — tabs: Overview · Financials · Valuation · Lenses ·
 │                                        Technicals · Memo · News
 └─ Compare (/research/compare)   — up to 5 covered names, best-in-dimension highlighting
Portfolio → Position page         — deep-links into the dossier
```

Journeys: (1) *Morning check* — Lab table: scores, trend, next catalysts, status changes.
(2) *Deep read* — dossier tabs, progressive disclosure from verdict → evidence → formulas.
(3) *Thesis upkeep* — Memo tab: news mapped to assumptions, edit + save, breakers watched.
(4) *Candidate vs holding* — Compare, with the explicit rule that a higher score alone never
justifies a trade (taxes, sizing, overlap live in the portfolio command center).

## 3. Data model (`src/research/types.ts`)

`ResearchDossier` = profile (segments, geographies, moat, risks, management, accounting flags) +
`FinYear[]` (≈10y normalized fundamentals) + `ValuationBlock` (method notes, DCF inputs, scenarios,
historical bands, peers, optional SOTP) + `FrameworkEval[11]` + `Memo` (bull/base/bear, assumptions,
breakers, catalysts, leading indicators, status + rationale) + `NewsItem[]` (materiality +
assumption mapping + `SourceTag`) + insider events + authored quality scores + dated snapshots.
Every source tag carries a `ClaimKind`: verified fact / management statement / consensus / market
expectation / model inference / speculation / **sample data**.

## 4. Research-engine architecture (`src/research/engine.ts`)

Pure functions, fully unit-tested (`src/research/__tests__/engine.test.ts`):
- **Technicals**: SMA/EMA, RSI, MACD, Bollinger, close-to-close ATR (labeled approximation),
  annualized vol, beta vs benchmark, drawdown series, trend-regime classifier, clustered-extrema
  support/resistance with touch counts.
- **Fundamentals**: CAGRs, margin trends, FCF conversion, dilution, net-debt/FCF.
- **Valuation**: two-stage DCF; **reverse DCF** (bisection → price-implied growth); scenario
  engine (probability-weighted IRR/total return); growth × discount sensitivity grids.
- **Scoring**: eight category scores — quantitative ones computed, qualitative ones authored and
  *labeled* as authored — each with visible formula and inputs; user-editable weights (persisted)
  recompute the overall without touching raw research; data-confidence scoring with explicit gaps.

## 5. Scoring methodology

Categories: quality, growth, financial strength, management/capital (authored), moat (authored),
valuation, technicals, risk. Default weights 20/15/15/10/15/15/5/5 (%). Formulas render in the UI
("Show formulas & inputs"), including each input's contribution. Nothing is a black box; missing
inputs degrade the data-confidence score rather than being silently defaulted.

## 6. Data-provider strategy

`DataProvider` interface (`src/research/providers.ts`): `getDossier(symbol)` + `listCovered()`.
Shipping adapter: **bundled-sample** (8 dossiers: AAPL, NVDA, MSFT, COST, O deep/standard US;
RELIANCE, TCS India; AMD watchlist). Coverage tiers are honest: `deep` / `standard` /
`technical` (price-series analytics only) / `none` (funds & ETFs are *never* given fake
single-company research). **Features requiring licensed data** (documented, not simulated): live
quotes and corporate actions, point-in-time consensus, filing/transcript text, insider feeds,
ownership data. The Stage B backend (see `ARCHITECTURE-V1.md`) implements the `live` adapter via
SEC EDGAR + a market-data vendor + Claude for filing synthesis.

## 7. API design (live mode, Stage B)

`GET /research/universe` → coverage rows · `GET /research/:symbol` → dossier JSON (versioned) ·
`POST /research/:symbol/refresh` → job id (modular: `{modules: ["financials","technicals",...]}`) ·
`GET /research/:symbol/snapshots` · `PUT /research/:symbol/thesis` (user memo overlay) ·
`PUT /research/weights`. All responses carry `dataProfile` + per-claim source tags; snapshots are
immutable and dated.

## 8. Screen-by-screen UX spec

- **Lab**: integrity banner (non-dismissible) · universe filters (all/portfolio/watchlist) ·
  table (tier, held, overall score, primary-method value vs price, trend, status, next catalyst,
  freshness) · Investor Lens Matrix heatmap with per-cell verdicts on hover.
- **Dossier / Overview**: one-liner, narrative *vs* variant perception, segment & geography mixes,
  moat + risks (underappreciated flagged), management, forensic notes, score breakdown with
  editable weights + formulas, data-confidence gaps, research timeline.
- **Financials**: 5-stat summary, revenue/profitability bars, FCF chart, full history table
  (estimates marked "e"), consensus revisions labeled *Consensus*.
- **Valuation**: method-fit note first; DCF lab (sliders, live value, reset), sensitivity grid,
  reverse-DCF implied expectations with verdict badge, bull/base/bear cards + weighted EV
  (labeled model inference), historical bands, peers, SOTP where relevant.
- **Lenses**: contradiction callout (best vs worst lens), 11 framework cards → questions,
  evidence with claim-kind tags, applicability caveats.
- **Technicals**: honest approximation note, six-stat header, price vs SMA-200, 52-week range,
  Bollinger %B, key levels with basis, bull/neutral/bear cases **with invalidation levels and
  reliability**, relative strength, drawdown profile.
- **Memo**: editable bull/base/bear (device-persisted, revert-to-baseline), reasons for/against,
  assumptions, thesis breakers, evidence-vs-assumption diff, verdict + rationale, catalyst
  timeline, leading indicators, private notes.
- **News**: materiality triage (noise filtered by default), why-it-matters, assumption mapping,
  insider activity, claim-type legend, research disclaimer.
- **Compare**: chip-select up to 5, 15 dimensions, best-in-dimension highlighting, explicit
  "score ≠ trade" footer.

## 9–10. Implementation & seed data

Implemented in `src/research/**` + `src/pages/research/**`, reusing Meridian's design system and
chart kit; routes wired into the Pro navigation. Preseeded from the household's actual records:
every portfolio symbol and watchlist name appears in the universe with its honest tier.

## 11. Test cases & acceptance criteria

20 engine unit tests (indicator regimes, DCF monotonicity, reverse-DCF round-trip, scenario EV
math, sensitivity monotonicity, score bounds/transparency, dossier completeness — all 11 lenses,
breakers, scenarios — coverage honesty for ETFs, data-confidence disclosure) + 11 E2E tests
(banner, tiers, filters, weight persistence, DCF slider recompute, lens evidence, technicals
honesty, memo edit/persist/revert, news mapping, compare, honest not-covered state, position-page
deep link). Acceptance = all green (`npm test`), plus: no screen presents sample data as live, and
every score can be traced to formula + inputs in ≤ 2 clicks.

## 12. Deployment

No new infrastructure: builds with the existing Vite bundle, deploys through the existing
Vercel git integration. Live-mode deployment lands with Stage B (Supabase + providers).

## 13. Roadmap

- **MVP (this build)**: everything above on the bundled-sample adapter.
- **V2 (Stage B backend)**: live adapter (EDGAR + market data + Claude filing synthesis),
  scheduled refresh jobs with module-level rerun, versioned snapshots server-side, real consensus
  and insider feeds, alerting on thesis breakers, PDF/exports, editable peer groups.
- **Advanced**: portfolio-level factor/correlation integration, expectations-investing base-rate
  library, transcript-language drift analysis, scuttlebutt evidence lockers, multi-model AI
  routing per module.
