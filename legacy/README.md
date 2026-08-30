# Meridian — Personal Wealth Operating System

A production-quality foundation for a personal financial operating system: one place to understand
**what you own, what you owe, what changed, why it changed, what income you're generating, what
needs attention, and what to consider doing** — with every important value traceable to a source
document.

Built from the revised BRD and the Simple Mode / Pro Mode PRD.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run preview    # serve the production build
```

Sign in with any credentials (passkey button skips MFA), or walk through the full onboarding flow
(Settings → "Replay onboarding").

## Product architecture

### Two modes, one data model

- **Simple Mode** — a calm daily briefing: net worth, what changed (in plain language), attention
  items (max 5), recommended actions (max 3), portfolio, income, watchlist, plan.
- **Pro Mode** — a complete wealth workstation: tax lots, TWR/MWR vs benchmark, options greeks and
  payoff diagrams, real-estate underwriting (NOI, cap rate, CoC, DSCR, LTV, IRR), syndication
  waterfalls, liability covenants, dual-jurisdiction tax, scenarios with Monte Carlo, reports,
  data-lineage and a financial inbox.

Both modes read the **same records through the same selectors** (`src/data/selectors.ts`).
Switching modes never changes a number — only how much of the model is surfaced.

### Provenance model

Every material value carries a `SourceRef`: provenance (`verified / confirmed / imported / market /
calculated / estimated / inferred`), source document id, as-of date, staleness and confidence.
The UI renders this consistently via `ProvenanceChip`, `ConfidenceMeter` and `Freshness` — nothing
relies on color alone.

### Two datasets, never mixed

**Personal mode (default)** runs on a canonical client-side store (`src/store/`): accounts, assets,
liabilities, an imported transaction ledger, goals and a watchlist — persisted to this browser under
a versioned envelope with JSON backup/restore. Every number on every personal screen derives from
these records; missing data renders as *unavailable with instructions*, never as an invented value.
The importer (`src/store/csv.ts`) parses Fidelity Accounts_History CSVs entirely in the browser:
parse → review → dedupe against the ledger → commit, with per-batch undo.

**Demo mode** is the fictional sample household, reachable only by explicit choice and framed by a
permanent warning banner. It exists to show the interface fully populated. Routes that only make
sense for the demo data (real-estate underwriting, insurance, tax sandbox…) are blocked in
personal mode rather than rendered empty-but-fake.

“Auth” is an honest device lock (optional passcode, SHA-256 hash stored locally) and says so on
screen — no fake MFA, passkeys or encryption claims. The copilot is labeled as deterministic
computation over records, not an AI model.

### Imported real datasets

Two modules carry data imported from real broker records (identifiers masked, economics verbatim),
kept strictly separate from the sample household and always labeled:

- `src/data/moomooOptionTrades.ts` — option orders transcribed from Moomoo SG monthly statements,
  rendered at the top of **Options**.
- `src/data/fidelityTrading.ts` — 14 months of Fidelity Accounts_History exports reduced to FIFO
  round trips, an options cash-flow program (settled vs live contracts), a per-symbol rotation map
  and computed strengths/weaknesses, rendered as the **Trading Review** page. Reconciliation is
  pinned by `src/data/__tests__/fidelity-trading.test.ts`.

Both modules state their data gaps explicitly instead of papering over them.

### Layout of the code

```
src/
  styles/index.css      Design tokens (light/dark), Tailwind v4 theme
  data/                 Domain types, sample dataset, FX, selectors (the "backend")
  components/           icons.tsx · ui.tsx (primitives) · charts.tsx (hand-built SVG chart kit)
                        finance.tsx (SuggestionCard, StatCard, ObligationRow, Freshness)
  state/AppContext.tsx  Mode, currency, member filter, notifications, upload simulation
  app/                  Shell, nav, search, notification centre, copilot engine + drawer, upload
  pages/                One file per screen; Simple/Pro variants share pages where they overlap
```

### Chart kit

Custom SVG charts (no chart library): area/line with tooltips, waterfall, donut, stacked bars,
monthly bars, calendar, payoff diagrams, treemap, progress rings, range bars, stacked areas.
Each is themed via CSS variables, works in dark mode, and includes an `aria-label` summary.

### Sample data

A realistic two-country household (USD base + INR): US brokerages, 401(k)/Roth, Zerodha demat,
India mutual funds, RSUs, five option strategies, three properties (one with a deliberately stale
valuation), two syndications with a pending capital call, four liabilities including a
securities-backed line, seven insurance policies, ~200 generated income events, documents with an
extraction/reconciliation pipeline, inbox issues, suggestions in four strict categories
(observation / alert / opportunity / recommendation), timeline, goals and dual-jurisdiction tax.

Deterministic seeded randomness (`src/data/rng.ts`) keeps charts stable across reloads; the app's
reference "today" is 2026-07-20.

## Key decisions & assumptions

- **Documents over screen-scraping.** The BRD's document-native positioning is the differentiator;
  the upload → classify → extract → match → reconcile → review → apply pipeline is a first-class,
  visible flow, and approval is always explicit.
- **Copilot answers only from records.** The copilot drawer computes answers from live selectors,
  cites records, separates facts / estimates / assumptions / missing data, and refuses questions it
  can't ground.
- **Recommendations are gated on data quality** (`missingData` renders an "Incomplete data" badge)
  and every one carries what/why/impact/risks/tax/liquidity/confidence/alternatives plus supporting
  records.
- **Mode is remembered per device** (localStorage), as are currency, theme and dashboard layout.
- **HashRouter** so the static build works from any host without rewrite rules.
- **Mobile**: Simple Mode gets bottom navigation with a center upload action (capture in ≤3 taps);
  Pro tables become horizontally scrollable panes; dense screens collapse to structured lists.
- Monte Carlo, IRRs and projections are labelled estimates with stated simplifications — the UI
  never presents a model output as a fact.
