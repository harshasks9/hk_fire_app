# Five Delta

A private, single-user execution system for a weekly options income programme.
**Adherence, not analysis.** The strategy already works; every dollar lost came
from drift, novelty, rescue, or omission — so the app's job is to make executing
the rule the path of least resistance and make deviating from it require
deliberate, recorded effort.

The app is boring four days a week, and that is the design.

## The loop

Everything routes through one state machine; the home screen is always the
current state and nothing else.

| State | When | What it shows |
|---|---|---|
| **HOLD** | Mon–Thu | Usually "Nothing to do." Live positions as rows with one chip each (`Healthy` / `Watch` / `Close now`). If an exit rule fires, HOLD is replaced by exactly one instruction and one button — no other action is offered. |
| **WRITE** | Friday | A guided five-step sequence (close out → direction → tickets → limits → done) with a completion stamp. Steps cannot be skipped. A Friday that passes uncompleted is recorded as a **missed week** and counted on the scoreboard. |
| **LOG** | after fills | Enter the actual fill (form or broker screenshot parsed by Gemini into an *editable* form — never saved without confirmation). Logging records the trade, recalibrates that name's IV from a real transacted price, and updates the scoreboard. Unlogged approved tickets nag after two sessions. |

Other surfaces: the **Discipline Score** (cadence / rule / stop / capacity — four
plain fractions; P&L one level down), the **deviation ledger** (rule said, what
happened, the number), the **valuation gate** (five inputs, three required, side
only — delta picks the strike), the **OWL concentration-exit sleeve**, and a
**pro mode** per position that explains a decision already made and never opens
a new one. There is no roll button, no chain browser, no screener.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind 4 · Drizzle ORM ·
Postgres in production, embedded PGlite for local dev · Vitest ·
Vercel (hosting + cron) · Gemini (fetch and narrate only — deterministic code
in `lib/options.ts` computes every number) · CallMeBot WhatsApp (outbound only).

Every modelled figure renders with a dotted underline and the tooltip
"modelled — verify on the Fidelity chain."

## Local development

```bash
npm install
npm run db:seed        # embedded PGlite in .data/ — no external DB needed
SESSION_SECRET=dev APP_PASSWORD=dev npm run dev
```

Tests (the math module is where correctness matters — the brief's regression
`solveStrikeForDelta(513.53, 7/365, 0.27, 'call', 0.05, 2.5) → 547.5` is in
`lib/options.test.ts`):

```bash
npm test
npm run typecheck
```

Reseed from scratch: `FORCE_RESEED=1 npm run db:seed`.

## Environment variables

| Variable | Required | Where it comes from |
|---|---|---|
| `APP_PASSWORD` | yes | You choose it. Constant-time compared at login; 5 attempts / 15 min / IP. |
| `SESSION_SECRET` | yes | `openssl rand -hex 32`. Signs the 30-day httpOnly SameSite=Lax cookie. |
| `DATABASE_URL` | production | A Postgres connection string (Vercel Postgres / Neon / Supabase). Omit locally to use embedded PGlite. |
| `GEMINI_API_KEY` | for live data | [Google AI Studio](https://aistudio.google.com/apikey). Server-side only. Without it, prices go stale (and say so) — nothing breaks, nothing pretends. |
| `CALLMEBOT_PHONE` | for alerts | Your WhatsApp number in international format, e.g. `+6591234567`. |
| `CALLMEBOT_APIKEY` | for alerts | Message "I allow callmebot to send me messages" to **+34 644 44 21 48** on WhatsApp; the bot replies with your API key. Docs: callmebot.com/blog/free-api-whatsapp-messages/ |
| `CRON_SECRET` | production | `openssl rand -hex 24`. Vercel sends it as `Authorization: Bearer …` to the cron routes. |
| `APP_URL` | recommended | `https://shar.hkfire.app` — used for deep links at the end of every WhatsApp message. |

Rotating the Gemini key: create a new key in AI Studio, update `GEMINI_API_KEY`
in Vercel → Settings → Environment Variables, redeploy, then delete the old key.
The key never reaches the client; all Gemini calls run server-side and are
logged to the `ai_calls` table (visible in Settings).

## Deploying to Vercel

1. Import the repo in Vercel (framework: Next.js — zero config; `vercel.json`
   already declares the two crons: daily data job 21:15 UTC weekdays, WhatsApp
   digest 21:45 UTC).
2. Provision Postgres (Vercel Postgres/Neon) and set `DATABASE_URL` plus the
   variables above.
3. Run migrations and seed once:
   ```bash
   DATABASE_URL=... npm run db:migrate
   DATABASE_URL=... npm run db:seed
   ```
4. Add the custom domain `shar.hkfire.app` to the project.

### DNS records

At your DNS provider for `hkfire.app`:

| Type | Name | Value |
|---|---|---|
| CNAME | `shar` | `cname.vercel-dns.com` |

(If the provider refuses a CNAME here, use an A record for `shar` →
`76.76.21.21`.) Vercel provisions TLS automatically once the record resolves.

## Data honesty

- Seeded price history and holding marks are placeholders flagged as seeded
  (no grounding URL) until the daily job replaces them with grounded quotes.
  Realized vol uses grounded closes only.
- Base rates are labelled "recent regime, small sample" with the window count,
  because that is what they are.
- The 2026 record is seeded from the facts stated in the build brief (the META
  roll −$9,812, the SNOW outlier −$2,774, the August drift deltas, the Jan–Mar
  MSFT episode, 3 missed weeks). Rows are flagged `seeded`; aggregates the
  brief states (131/139, $86,457) live in settings as the baseline and are
  never recomputed from the partial row set. Unknown dollar outcomes are
  `null`, never guessed.
- All share counts are unverified until confirmed in Settings → Holdings; every
  equity-based limit says so until then.

## What I would build next

1. **A real E2 clock.** The stop rule is same-session; today the app can only
   check at the daily cron and on page loads. A lightweight intraday check
   (an extra cron at 15/30-minute intervals during market hours hitting the
   same deterministic exit evaluation) turns E2 from "seen tonight" into
   "seen in time to act", which is where the −$9,812 class of loss actually
   lives.
2. **Broker-statement import for the ledger.** The deviation ledger's power is
   the resolved dollar column; parsing monthly statements (the Moomoo/Fidelity
   formats already in the account) would fill `outcome_usd` without manual
   entry and backfill the missing 2026 rows so the monthly process-vs-deviation
   comparison stands on the full 139.
3. **Rolling 12-month base rates.** The app accumulates grounded closes from
   day one; once ~250 sessions exist, recompute breach base rates on a rolling
   window and show regime drift (recent 45-window rate vs 12-month rate) — the
   honest version of the disagreement check.
