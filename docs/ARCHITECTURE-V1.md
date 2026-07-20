# Meridian V1 — Real-Product Architecture (Stage B)

Goal: replace every simulated capability in the prototype with a real implementation, while
keeping the existing front end, design system, computation layer and tests. The client already
reads everything through `src/data/selectors.ts`; V1 swaps the hardcoded modules underneath it
for a real, per-user backend.

## Stack decision

| Concern | Choice | Why |
| --- | --- | --- |
| Hosting (web) | **Vercel** (existing `meridian` project) | Already live; static Vite SPA stays |
| Database + Auth + Storage + Functions | **Supabase** (Postgres) | One provider covers RLS-secured data, email+TOTP MFA auth, private document storage, Deno edge functions and cron; generous free tier; user owns the account |
| Document intelligence | **Anthropic API** (Claude) | Classification (Haiku) + structured extraction from PDFs/images (Sonnet) in a server-side edge function; documents never leave the user's Supabase + Anthropic call |
| Market data (US + NSE + FX) | **Twelve Data** (one key) | Free tier: 800 credits/day — enough to refresh ~30 held/watched symbols every 30 min in market hours |
| India MF NAVs | **mfapi.in / AMFI** | Free, keyless, official NAV data |
| FX fallback | **frankfurter.app** (ECB) | Free, keyless daily rates |
| Email alerts (later, M5) | Resend | Optional |

Explicitly rejected: moving to Next.js (no need — server logic fits edge functions, SPA is done),
bank screen-scraping aggregators (Plaid et al. — the BRD's document-native stance is the product).

## Data model (Postgres, all tables RLS-scoped by `household_id`)

`households`, `household_members` (links `auth.users`, role, color) ·
`accounts` (institution, type, tax treatment, country, currency, owner, cost-basis method) ·
`instruments` (symbol, class, sector, currency; global seed + per-household custom) ·
`positions` + `tax_lots` (qty, cost, acquired, **source_document_id, provenance, as_of**) ·
`option_strategies` + `option_legs` · `properties` + `property_valuations` (each valuation carries
provenance + confidence) · `syndications` + `syndication_flows` · `liabilities` · `insurance_policies` ·
`income_events` · `watchlist_items` · `goals` + `scenario_assumptions` ·
`documents` (storage path, kind, institution, period, pipeline status) ·
`extraction_fields` (field, existing, proposed, confidence, status, decision) ·
`inbox_items` · `suggestions` (with decision status) · `timeline_events` ·
`prices` (symbol, ts, price, source) · `fx_rates` · `networth_snapshots` (daily cron output) ·
`audit_log` (every mutation: actor, source, before/after refs).

The prototype's provenance model (`verified/confirmed/imported/market/calculated/estimated/inferred`
+ as-of + confidence) becomes **columns, not decoration** — every material row carries it.

## Server logic (Supabase Edge Functions)

1. **`process-document`** — triggered on upload to the private `documents` bucket:
   classify (Haiku) → extract with a JSON schema per document kind (Sonnet, PDF attached) →
   match account by number/institution → diff proposed vs existing records → write
   `extraction_fields` + duplicate/overlap checks → status `review`. Nothing mutates until the
   user approves; **approval applies changes transactionally**, stamps provenance
   `imported`→`confirmed`, and writes `audit_log` + `timeline_events`.
2. **`refresh-market-data`** — cron (pg_cron, every 30 min in US/IN market hours): quotes for all
   held + watched symbols (Twelve Data), MF NAVs (mfapi.in), FX (Twelve Data/frankfurter) →
   `prices`/`fx_rates`.
3. **`daily-snapshot`** — cron (once/day): compute household net worth server-side → `networth_snapshots`
   (real history replaces the synthetic walk, accruing from day one).
4. **`copilot`** — Claude with tool use; tools are RLS-scoped SQL RPCs (`get_positions`,
   `get_income`, `get_obligations`, `simulate_sale`, …). System prompt enforces the existing
   contract: cite records, separate facts/estimates, state assumptions, refuse when ungrounded.
5. **`suggestions-engine`** — deterministic rules replacing the hand-authored items: concentration
   vs principles, idle cash vs reserve target, TLH candidates from live lots, covenant/LTV
   monitors, renewal/premium/capital-call deadlines, stale valuations. Each rule emits the same
   structured shape the UI already renders (what/why/impact/risks/confidence/records).

## Client changes

- `src/data/*` sample modules → a **repository layer** (`src/data/repo/`) with two adapters:
  `supabase` (real) and `demo` (current in-memory dataset, kept for the marketing/demo mode and
  for tests). Selectors and every screen stay as they are.
- Auth screens wire to Supabase Auth (email+password, TOTP MFA enrolment for real; passkeys when
  Supabase WebAuthn lands). Onboarding **writes** the household it collects.
- Upload UI streams real progress from the `documents` row status; CSV/XLSX also parsed client-side
  for instant preview, then confirmed server-side.
- All CRUD forms (add account/position/lot/property/liability/policy/watchlist) write through the repo.

## Cost (monthly, one household)

| Item | Start | At scale |
| --- | --- | --- |
| Vercel | $0 (existing) | $0–20 |
| Supabase | $0 (free tier) | $25 (Pro: backups) |
| Anthropic API | ~$3–10 (10–20 docs ≈ $0.05–0.25 each; copilot ≈ $0.01–0.05/question) | ~$15–30 |
| Twelve Data | $0 (free tier) | $29 if >800 refreshes/day needed |
| **Total** | **≈ $5–10** | **≈ $70–100** |

## What Harsha provisions (one-time, ~15 minutes)

1. **Supabase**: create a project (suggest region `us-west-1`) → give me
   `SUPABASE_URL` + `anon` key (public, goes to Vercel env as `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`) and either run my migration SQL in the SQL editor or share a
   personal access token so I can push migrations + edge functions myself.
2. **Anthropic**: API key → Supabase secret `ANTHROPIC_API_KEY` (never in the browser).
3. **Twelve Data**: free key → Supabase secret `TWELVEDATA_API_KEY`.
4. **Vercel**: add the two `VITE_SUPABASE_*` env vars to the `meridian` project.

## Build order (once keys land)

- **M0 (keyless, can start immediately)**: repository layer + demo adapter refactor; full SQL
  migration files; edge-function code written and unit-tested with mocked providers.
- **M1**: Auth + onboarding-writes-real-data + all CRUD → the app is genuinely usable with real
  portfolios (CSV import included).
- **M2**: Document pipeline end-to-end (upload → extract → reconcile → approve mutates + audit).
- **M3**: Market/FX/NAV sync + real daily net-worth history.
- **M4**: Copilot with tools + rules-based suggestion engine.
- **M5**: Email/push alerts, PDF report rendering, passkeys when platform support lands.

Each milestone ships behind the existing test suites, extended per milestone (repo-adapter contract
tests, edge-function tests with fixture PDFs, E2E against a seeded Supabase branch database).
