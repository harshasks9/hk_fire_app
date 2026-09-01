# Meridian — Test Plan & Coverage

Two automated suites verify the product end to end:

- **Unit** (`npm run test:unit`, Vitest) — 58 tests over the shared financial computation layer.
  These lock down the numbers both modes render.
- **End-to-end** (`npm run test:e2e`, Playwright/Chromium) — 49 tests that drive the built app in a
  real browser against `vite preview`, across Simple + Pro modes, desktop + mobile viewports.

Run everything with `npm test`. All 107 tests pass as of the commit introducing them.

## Unit test cases (what the numbers must obey)

| Area | Cases |
| --- | --- |
| Formatting (`format.test.ts`) | Pinned reference date; USD/INR formatting incl. crore notation; typographic minus; compact K/M; percent signs; day-distance and relative-date helpers |
| FX & determinism (`fx-rng.test.ts`) | Round-trip currency conversion at spot; seeded PRNG stability; `walkTo` ends exactly at target (charts can't drift between renders) |
| Selectors (`selectors.test.ts`) | Position value/cost from tax lots (hand-computed AAPL case); INR→display conversion; portfolio weights sum to 100%; member filtering; symbol grouping keeps **weakest provenance + oldest as-of**; net worth ≡ assets − liabilities and decomposes exactly; currency invariance of net worth; allocation slices sum to 100%; income year total ≡ monthly buckets, no "received" after the reference date; blended liability rate bounds; obligations all future + sorted; data-completeness bounds |
| Options & property (`options-property.test.ts`) | Covered-call premium/P&L/breakeven and **high assignment risk when ITM ≤ 7 days**; CSP max loss; credit-spread max loss = width − credit; urgency sort; premium YTD ties to income records ($6,800); Austin duplex equity/NOI/cap-rate/DSCR/LTV/cost-basis (hand-computed); primary residence has no rent metrics; amortization first-payment split, monotonic balance, growing principal share; interest-only PAL never amortizes |
| Copilot, notifications, suggestions (`copilot-notifications.test.ts`) | Intent matching incl. refusal of ungroundable questions; every intent answers with headline + facts + citations in both currencies; estimates/assumptions/missing-data separation; notifications all navigable; all four suggestion categories present; every suggestion carries what/why/confidence/supporting records; incomplete-data recommendations are flagged |

## End-to-end test cases (what the user must be able to do)

| Flow | Cases |
| --- | --- |
| **Auth** | Unauthenticated redirect to sign-in; password → MFA (6-digit) → dashboard; inline validation; passkey path; new users land in onboarding |
| **Onboarding** | Full 12-screen Simple walk (one question per screen) ending on a live dashboard; US+India residency callout; choosing Pro reveals the optional precision-setup step (cost basis, benchmarks, precedence) |
| **Simple home** | Answers the four PRD questions; attention list hard-capped at 5; ≤ 3 recommendations; plain-language "why it changed" |
| **Mode & context switching** | Simple ↔ Pro on the same route with consistent totals; USD → INR re-denomination; household member filter |
| **Global systems** | ⌘K search → position page; notification centre navigation; copilot answers with facts/estimates split + record citations + follow-ups; copilot refuses ungroundable questions |
| **Portfolio** | Simple grouping + asset-class filter; Pro account filter (row count check), sortable table, column chooser; position detail with lots/term badges/linked options/multi-broker provenance; graceful not-found state |
| **Documents** | Upload pipeline stage-by-stage to review handoff; review with side-by-side fields, field-level keep/accept, approve → applied + audit entry; library filtering by document kind |
| **Inbox** | Pro issue detail + accept-proposed → resolved; Simple Mode plain-language "Needs Review"; suggestion explanation, accept, undo |
| **Income** | Calendar month navigation + day focus filtering; Pro stream analytics (yield-on-cost, tax treatment) |
| **Watchlist** | Target distance; convert-to-position without re-entry; Pro entry/exit criteria + overlap warnings |
| **Options** | Urgent assignment risk visible in **both** modes; Pro legs/greeks/payoff/roll history/expiry scenarios |
| **Real estate & private** | Property story + underwriting + hold-vs-sell; stale-valuation warning surfaced loudly; syndication capital account, waterfall, capital call, NAV honesty note |
| **Liabilities & insurance** | PAL margin covenant monitor + prepayment scenario; LIC lapse-risk alert; umbrella coverage gap |
| **Tax & planning** | Jurisdiction toggle with estimate labelling; TLH candidates; sale-scenario sandbox recomputation; goals with at-risk honesty; Monte Carlo success odds; timeline date-comparison + event filtering |
| **Customization & exports** | Dashboard module removal persisted across reload + reset; overview CSV export; reports CSV download with correct filename |
| **Mobile (390×844)** | Bottom nav + center upload FAB; More-sheet navigation; document capture in ≤ 3 taps; net worth + attention visible |
| **Settings** | Dark-mode toggle applies to the document root; security posture (MFA/passkey/sessions) present; sign-out returns to the auth wall |

## Known intentional behaviors the tests assert

- Merged positions inherit the *weakest* provenance and the *oldest* as-of date — the UI must
  never look more certain than its worst source.
- Months after the reference date can hold only *expected* income.
- The interest-only pledged asset line is never charted as amortizing.
- The copilot never answers a question it cannot ground in records.
