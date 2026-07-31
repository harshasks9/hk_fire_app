import type { ForensicMemo } from './types'

/**
 * Patria Investments (NASDAQ: PAX) — forensic memorandum.
 * Cut as of 31 July 2026, the morning Q2 2026 was released.
 *
 * Same tier discipline as the Blue Owl memo (docs/FORENSIC-ASSET-MANAGER-PROMPT.md §1).
 */
export const PAX_MEMO: ForensicMemo = {
  symbol: 'PAX',
  name: 'Patria Investments Limited',
  exchange: 'NASDAQ',
  asOf: '2026-07-31',
  latestPeriod: 'Q2 2026 (reported 31 July 2026)',
  headline:
    'Five and a half years of relentless platform building that has produced almost no per-share earnings growth — a genuinely cheap stock whose discount is half deserved and half mistake.',
  rating: 'Moderately undervalued',
  horizon: '3–5 years',
  positionSizing: '1–2% of a diversified equity book. The valuation supports more; the five-year conversion record does not.',
  ratingChangesAt: {
    upgrade: 'Below $9.00, or on two consecutive years of DE per share growing faster than 10%.',
    downgrade: 'Above $16.00 without evidence that FRE margin has stabilised above 55%.',
  },

  price: 11.37,
  priceAsOf: 'Early July 2026',
  dilutedShares: 158.4,
  marketCap: 1.80,
  netDebt: 0.25,
  dividendPs: 0.65,
  dividendYieldPct: 5.72,

  headlineStats: [
    { label: 'Price / FY26E FRE per share', value: '7.7×', sub: '$11.37 ÷ $1.48 (guidance midpoint)', tier: 'B', tone: 'gain' },
    { label: 'Price / DE per share', value: '8.9×', sub: '$11.37 ÷ $1.28 annualised', tier: 'B', tone: 'gain' },
    { label: 'Dividend yield', value: '5.7%', sub: '$0.1625 per quarter', tier: 'A', tone: 'gain' },
    { label: 'Dividend as % of DE', value: '51%', sub: 'Comfortably covered — unlike Blue Owl', tier: 'B', tone: 'gain' },
    { label: 'FRE growth', value: '+24%', sub: 'Q2 2026 YoY, $46.1m → $57.1m', tier: 'A', tone: 'gain' },
    { label: 'FRE margin', value: '54.0%', sub: 'Down from 58.9% in FY2025', tier: 'A', tone: 'loss' },
    { label: 'Permanent capital', value: '22%', sub: '$11bn of $48.9bn fee-earning AUM', tier: 'A', tone: 'warn' },
    { label: 'DE per share since 2021', value: '+24%', sub: '$1.02 → $1.27 over four years, while FRE rose 135%', tier: 'B', tone: 'loss' },
  ],

  debate: {
    marketBelieves:
      'That Patria is a well-run Latin American manager whose growth is bought rather than earned, and whose shareholders never see it. The evidence is on the tape: fee-earning AUM has compounded to $48.9bn, fee-related earnings have grown 135% since 2021, and the stock is 33% below its $17.00 IPO price. At 7.7× fee-related earnings — the cheapest listed alternative manager we can find — the market is saying that Patria converts fee growth into shareholder earnings so poorly that the fee growth barely matters.',
    mustGoRight:
      'The conversion has to change. FRE must grow to the $225–245m guided for 2026 and beyond while the margin stabilises above 54%, the three 2026 acquisitions must integrate without further margin dilution, and performance-related earnings — absent for three years — must actually arrive from the maturing Infrastructure and Private Equity vintages. On those, $11.37 is materially too low.',
    underestimated:
      'The fee stream itself is better than the price implies. FRE grew 24% year on year and 13% sequentially, fee-earning AUM 32%, and management raised $4.5bn in the first half against a full-year target it now expects to exceed. Patria is domiciled in the Cayman Islands with a very low effective tax rate, its dividend is covered at roughly half of distributable earnings, and it has no gated vehicles, no redemption queue and no leveraged balance sheet — the three things destroying sentiment in the US managers. It trades at a third of Ares\' multiple with a comparable FRE growth rate.',
    deRating:
      'The five-year record is genuinely damning and it is not a mystery. Distributable earnings per share were $1.023 in 2021 and $1.270 in 2025 — a 5.5% annual growth rate over a period in which fee-related earnings grew 135% and the platform roughly quintupled. Every dollar of fee growth has been offset by the disappearance of performance income, by dilution of 2.8% a year, and now by an FRE margin falling 490bp as acquisitions consolidate. If that pattern holds, 7.7× is not cheap; it is the correct price for a business that grows everything except the number shareholders own.',
    swingFactors: [
      'Whether the FRE margin stabilises. It fell from 58.9% (FY2025) to 54.0% (Q2 2026) — nearly five points — as acquired businesses consolidated at lower margins.',
      'Whether performance-related earnings return. Patria realised roughly $110m against a $180m 2023–2025 target; the entire 2021→2025 per-share stagnation traces to this line.',
      'Whether the acquisition cadence stops. Three deals closed or signed for 2026 alone, each adding fee-earning AUM and each adding shares, non-controlling interests and deferred consideration.',
    ],
    bearsBestFact:
      'In 2021 Patria earned $1.023 of distributable earnings per share on $86.0m of fee-related earnings. In 2025 it earned $1.270 per share on $202.5m. Fee-related earnings grew 135%; the shareholder\'s earnings grew 24%. That is not a cycle — it is four consecutive years of the same leak.',
  },

  quarterNarrative:
    'A strong operating quarter with one clear blemish. Fee-related earnings of $57.1m grew 24% year on year and 13% sequentially, fee-earning AUM reached $48.9bn (+32%), and distributable earnings of $0.32 per share put the company comfortably inside its full-year FRE guidance of $225–245m. Fundraising of $2.3bn brought the half-year to $4.5bn, which management says will exceed the full-year target. The blemish is the margin: 54.0% against 58.9% for FY2025, and the explanation is structural rather than seasonal — Solis, RBR and WP Global consolidated at lower margins than the legacy platform. Growth that arrives at a 54% margin instead of a 59% margin is worth roughly 8% less per dollar of revenue, and this is the third consecutive year in which acquired growth has diluted the earning quality of the base.',

  quarter: [
    { metric: 'Fee-earning AUM', latest: '$48.9bn', yoy: '+32%', qoq: '+7%', driver: 'Acquisition', verdict: 'Improved', tier: 'A', note: 'Includes $11bn (22%) in permanent-capital vehicles. Solis ($3.5bn) and RBR ($1.3bn) closed in Q1 2026.' },
    { metric: 'Fee-related earnings', latest: '$57.1m', yoy: '+24%', qoq: '+13%', driver: 'Mixed', verdict: 'Improved', tier: 'A', note: 'Q2 2025 was $46.1m. Genuine growth, but the acquired share of it is material.' },
    { metric: 'FRE margin', latest: '54.0%', yoy: 'n/d', qoq: 'n/d', driver: 'Acquisition', verdict: 'Deteriorated', tier: 'A', note: 'FY2025 was 58.9%; FY2023 60%. A 490bp decline is the most economically significant number in the release.' },
    { metric: 'FRE revenue (derived)', latest: '≈$105.7m', yoy: 'n/d', qoq: 'n/d', driver: 'Mixed', verdict: 'Improved', tier: 'B', note: 'Derived: $57.1m ÷ 54.0%. Implies a blended fee rate of ~0.87% on fee-earning AUM — roughly 40% below Blue Owl\'s ~1.42%.' },
    { metric: 'Distributable earnings', latest: '$50.7m / $0.32', yoy: 'n/d', qoq: 'n/d', driver: 'Recurring', verdict: 'Improved', tier: 'A', note: 'DE is now 89% of FRE. In 2021 it was 164% — the entire difference is the disappearance of performance income.' },
    { metric: 'GAAP net income to Patria', latest: '$10.5m', yoy: '−19% (from $12.9m)', qoq: 'n/d', driver: 'Mixed', verdict: 'Deteriorated', tier: 'A', note: 'GAAP is 21% of DE — a far smaller adjustment gap than Blue Owl\'s 3%, which is a point in Patria\'s favour on earnings quality.' },
    { metric: 'Capital raised', latest: '$2.3bn', yoy: 'n/d', qoq: '−(from $2.2bn H1 pace)', driver: 'Recurring', verdict: 'Improved', tier: 'A', note: '$4.5bn year to date; management expects to exceed the full-year target.' },
    { metric: 'Permanent capital', latest: '$11bn (22% of FEAUM)', yoy: 'n/d', qoq: 'n/d', driver: 'Acquisition', verdict: 'Improved', tier: 'A', note: 'Rising via RBR REITs and the Bancolombia real-estate platform, but still a quarter of Blue Owl\'s 85% of fees.' },
    { metric: 'Dividend declared', latest: '$0.1625', yoy: 'flat', qoq: 'flat', driver: 'One-off', verdict: 'In line', tier: 'A', note: '$0.65 annualised, ~51% of annualised DE. Record date 10 August 2026.' },
    { metric: 'FY2026 FRE guidance', latest: '$225–245m ($1.42–1.54/sh)', yoy: '+11–21%', qoq: 'reaffirmed', driver: 'Recurring', verdict: 'In line', tier: 'A', note: 'H1 FRE of ~$107.6m annualises to $215m, so the guidance requires a second-half ramp — deliverable, but not yet delivered.' },
  ],

  trajectory: {
    labels: ['FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025', 'Q2 26 ann.'],
    frePs: [0.62, 0.88, 0.99, 1.11, 1.28, 1.44],
    dePs: [1.02, 1.00, 1.26, 1.24, 1.27, 1.28],
  },

  indexed: {
    labels: ['FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025', 'LTM'],
    aum: [100, 151, 172, 198, 235, 250],
    dePs: [100, 98, 123, 121, 124, 125],
  },

  history: [
    { period: 'IPO (Jan 2021)', aum: 12.7, fpaum: null, frePs: null, dePs: null, freMarginPct: null, dividendPs: null, shares: null, tier: 'A', note: '34.6m Class A shares at $17.00 on Nasdaq, 22–26 January 2021. AUM of $12.7bn as of 30 September 2020 across 16 active funds.' },
    { period: 'FY2021', aum: 26.0, fpaum: null, frePs: 0.62, dePs: 1.023, freMarginPct: 59, dividendPs: null, shares: 138.1, tier: 'B', note: 'Moneda combination closed September 2021, funded ~60% stock / ~40% cash — AUM from $16bn to $26bn. FRE $86.0m; DE $141.3m. Share count derived as $141.3m ÷ $1.023.' },
    { period: 'FY2022', aum: null, fpaum: null, frePs: 0.88, dePs: 1.00, freMarginPct: 57, dividendPs: null, shares: 147.1, tier: 'B', note: 'FRE $130.0m (+51%); DE $147.1m. Per-share DE fell year on year despite a 51% rise in fee earnings — the pattern begins here.' },
    { period: 'FY2023', aum: null, fpaum: null, frePs: 0.99, dePs: 1.26, freMarginPct: 60, dividendPs: null, shares: 149.2, tier: 'B', note: 'FRE $147.7m (+14%); DE $188m. Best FRE margin of the series. Credit Suisse Brazil real estate (~US$130m) and Bancolombia (51%) added.' },
    { period: 'FY2024', aum: null, fpaum: 32.9, frePs: 1.11, dePs: 1.24, freMarginPct: 57, dividendPs: null, shares: 152.6, tier: 'B', note: 'FRE $170.1m (+15%); DE $189.2m — per-share DE fell again. abrdn European private equity closed April 2024 (~£100m total consideration).' },
    { period: 'FY2025', aum: null, fpaum: 40.8, frePs: 1.28, dePs: 1.27, freMarginPct: 58.9, dividendPs: 0.65, shares: 158.2, tier: 'A', note: 'FRE $202.5m (+19%); DE $200.9m. Record organic fundraising of $7.7bn, over $1bn above target. DE and FRE converge — performance income is now effectively absent.' },
    { period: 'Q2 2026 (ann.)', aum: 60.0, fpaum: 48.9, frePs: 1.44, dePs: 1.28, freMarginPct: 54.0, dividendPs: 0.65, shares: 158.4, tier: 'B', note: 'Annualised from the quarter. Total AUM approximate — $59.3bn was reported for Q1 2026. FY26 FRE guidance $225–245m.' },
  ],

  bridge: {
    period: 'FY2021 → FY2025',
    terms: [
      { label: 'Starting DE per share (FY2021)', value: '$1.023', effect: 'neutral', detail: 'Tier A: DE $141.3m on 138.1m derived shares.' },
      { label: 'FRE growth, +135%', value: '+$1.36', effect: 'positive', detail: 'Tier A: FRE $86.0m → $202.5m. Applied at the 2021 DE/FRE conversion ratio of 164%.' },
      { label: 'Share issuance, +14.6%', value: '−$0.28', effect: 'negative', detail: 'Tier B: 138.1m → 158.2m derived shares, ~2.8% a year. Moneda was ~60% stock; subsequent deals added more.' },
      { label: 'Collapse in DE/FRE conversion, 164% → 99%', value: '−$0.83', effect: 'negative', detail: 'Tier B. The dominant term by a wide margin. Performance-related earnings that contributed roughly $0.40 per share in 2021 contribute approximately nothing in 2025, and corporate/interest/tax costs have risen against a larger, more acquisitive base.' },
      { label: 'FRE margin, 59% → 58.9%', value: '$0.00', effect: 'neutral', detail: 'Tier A. Flat across the period — the operating leverage a five-fold platform expansion should have produced never appeared. It has since gone the wrong way, to 54.0% in Q2 2026.' },
      { label: 'Ending DE per share (FY2025)', value: '$1.270', effect: 'neutral', detail: 'Tier A: DE $200.9m ÷ 158.2m shares.' },
    ],
    conclusion:
      'Patria added $1.36 per share of fee-related earning power over four years and handed back $1.11 of it — $0.83 through the collapse of performance income and rising below-the-line cost, $0.28 through share issuance. Net per-share progress was 24% over four years, or 5.5% a year, against fee-related earnings growth of 135% and a platform that roughly quintupled. This is the cleanest example we have seen of aggregate growth failing to reach the listed share, and it is entirely visible in the company\'s own reported numbers.',
  },

  scorecard: [
    { commitment: 'Fee-earning AUM of $35bn by end-2025 (2022 Investor Day)', target: '$35bn', actual: '$40.8bn', status: 'Exceeded', note: 'Beaten by 17% — but Solis, RBR, WP Global, abrdn, Credit Suisse Brazil and Bancolombia all contributed. Organic fundraising of $7.7bn in 2025 was itself a record, so this is not purely bought.', tier: 'A' },
    { commitment: 'Total AUM of $50bn by end-2025', target: '$50bn', actual: '≈$55bn; $59.3bn at Q1 2026', status: 'Exceeded', note: 'Comfortably met.', tier: 'C' },
    { commitment: 'FRE above $200m by 2025, from $130m in 2022', target: '>$200m', actual: '$202.5m', status: 'Met', note: 'Met precisely at the line, three years after the target was set. A 15%+ annualised path was promised; 16% was delivered.', tier: 'A' },
    { commitment: 'Performance-related earnings of $180m cumulative, 2023–2025', target: '$180m', actual: '≈$110m realised', status: 'Behind plan', note: 'A shortfall of roughly 40%. Management subsequently reframed to "$120–140m over the next three years", which is a target being rolled forward rather than met. This single line explains the per-share stagnation.', tier: 'C' },
    { commitment: 'FRE margin', target: 'Maintain ~57–60% through scaling', actual: '59% → 58.9% → 54.0% (Q2 2026)', status: 'Behind plan', note: 'Held for four years, then broke. Scale produced no operating leverage and acquisitions are now consuming margin.', tier: 'A' },
    { commitment: 'Per-share value creation', target: 'Implicit in every Investor Day', actual: 'DE per share $1.023 → $1.270 (+24% over four years)', status: 'Behind plan', note: 'FRE indexed to 250 against DE per share indexed to 125 (FY2021 = 100). Shareholders received exactly half the platform\'s progress.', tier: 'B' },
    { commitment: 'Shareholder return since listing', target: '$17.00 IPO price, January 2021', actual: '$11.37 plus an estimated $3.0–3.4 of cumulative dividends', status: 'Behind plan', note: 'Approximately −13% to −16% total return over five and a half years, roughly −2.5% to −3% annualised. Tier D on the dividend accumulation.', tier: 'D' },
    { commitment: '$70bn target by end-2027', target: '$70bn', actual: '$48.9bn FEAUM at Q2 2026; $47.4bn pro-forma at YE2025', status: 'On track', note: 'Requires ~20% annual growth from here. Achievable at the current 32% rate — but note how much of that rate is acquired.', tier: 'C' },
  ],

  narrative: [
    {
      claim: '"On pace to exceed our full-year fundraising target" — CEO, Q2 2026',
      support: '$2.3bn raised in the quarter, $4.5bn year to date, following a record $7.7bn of organic fundraising in 2025 that itself beat target by over $1bn.',
      contradiction: 'The 2025 record was against a target set when the platform was materially smaller. $4.5bn in H1 against $7.7bn for the whole of 2025 is roughly the same pace on a much larger fee-earning base — flat on a percentage-of-AUM basis.',
      verdict: 'True and creditable in absolute terms. But fundraising velocity relative to the size of the platform has not improved, which is what would be required to accelerate organic growth.',
      challenged: true,
    },
    {
      claim: 'Fee-related earnings grew 24% year on year — the platform is compounding.',
      support: '$46.1m → $57.1m, with fee-earning AUM up 32%. Both figures are reported and unambiguous.',
      contradiction: 'FRE grew 24% while the margin fell 490bp from the FY2025 level. Had the FY2025 margin been maintained, the same revenue would have produced roughly $62m of FRE. Roughly a fifth of the potential FRE growth was consumed by margin dilution from the acquisitions that produced the AUM growth.',
      verdict: 'The growth is real. The quality of it declined in the same quarter it was reported, and the release led with the former.',
      challenged: true,
    },
    {
      claim: '$11bn, or 22%, of fee-earning AUM is in permanent-capital vehicles.',
      support: 'Genuinely improving — RBR REITs and the Bancolombia real-estate platform are structurally permanent, and Patria has no gated vehicles or redemption queue.',
      contradiction: '22% against Blue Owl\'s 85% of management fees. Nearly four-fifths of Patria\'s fee base is finite-life capital that must be re-raised, in Latin American markets, in local currencies, on a roughly five-to-seven-year cycle.',
      verdict: 'Directionally positive and correctly disclosed. But the duration profile is materially weaker than the US peers, and the valuation should — and does — reflect it.',
      challenged: true,
    },
    {
      claim: 'Three acquisitions position Patria for its $70bn target.',
      support: 'Solis ($3.5bn fee-earning AUM, 51%), RBR REITs (~$1.3bn permanent capital) and WP Global ($1.8bn) took pro-forma fee-earning AUM to $47.4bn entering 2026.',
      contradiction: 'Each deal adds fee-earning AUM and simultaneously adds shares, non-controlling interests (Solis at 51%, Bancolombia at 51%) and deferred consideration. The 2021–2025 record shows this cadence producing 5.5% annual per-share DE growth.',
      verdict: 'The target will probably be hit. The relevant question — never addressed in the release — is what per-share distributable earnings will be when it is. On the historic conversion rate, $70bn of fee-earning AUM implies roughly $1.60–1.75 of DE per share, not the $2.50+ the AUM figure suggests.',
      challenged: true,
    },
    {
      claim: 'Performance-related earnings will arrive as vintages mature — "$120–140m over the next three years".',
      support: 'Infrastructure and Private Equity vintages from 2017–2019 are at natural realisation age, and the 2024 Aguas Pacifico sale ($41m of PRE in Q4 2024) proves the carry is real when exits happen.',
      contradiction: 'The prior version of this promise was $180m over 2023–2025, against roughly $110m realised. The new target covers a later three-year window at a lower annual rate. Latin American exit markets have not co-operated, and the target has now been reset once.',
      verdict: 'Treat as an option, not an expectation. We capitalise expected performance revenue at 5× and haircut the guided range by 40% in the sum-of-the-parts. A manager whose carry target has been reset once should not have the second version taken at face value.',
      challenged: true,
    },
    {
      claim: 'Patria is a diversified, six-vertical platform.',
      support: 'Infrastructure, Credit, Real Estate, Private Equity, GPMS/Solutions and Public Equities — genuine breadth for a manager of this size, across Brazil, Chile, Colombia and now Europe and the US.',
      contradiction: 'The company reports a single operating segment, so strategy-level fee rates, margins and FRE contributions are not disclosed. An investor cannot tell which vertical earns 1.5% and which earns 0.4%, or where the 490bp of margin went.',
      verdict: 'Diversification is real; disclosure is not. This is the single biggest gap between what Patria is and what an outside investor can verify, and it is a legitimate reason for part of the valuation discount.',
      challenged: true,
    },
  ],

  segments: [
    { name: 'Private Equity', aum: 'n/d', mgmtFee: 'n/d', share: 25, feeRate: '~1.2–1.5% (est.)', duration: 'Finite life, 8–10 years', organic: 'Organic core plus abrdn, WP Global', multipleView: 'Market', comment: 'The legacy franchise and the source of whatever carry eventually arrives. Also the vertical most exposed to Latin American exit markets, which have been effectively shut since 2022.', tier: 'D' },
    { name: 'Infrastructure', aum: 'n/d', mgmtFee: 'n/d', share: 22, feeRate: '~1.2–1.5% (est.)', duration: 'Finite life, long', organic: 'Organic', multipleView: 'Premium', comment: 'Best realised track record — Aguas Pacifico produced $41m of performance earnings in a single quarter in 2024. Long duration, contracted revenue, and the most credible source of the guided $120–140m of future carry.', tier: 'D' },
    { name: 'Credit', aum: 'n/d', mgmtFee: 'n/d', share: 20, feeRate: '~0.6–0.9% (est.)', duration: 'Mixed', organic: 'Heavily acquired — Moneda, Solis (51%)', multipleView: 'Discount', comment: 'Lower fee rate, and the 51% ownership of Solis means a chunk of the economics leaks to non-controlling interests before reaching the listed share.', tier: 'D' },
    { name: 'Real Estate', aum: 'n/d', mgmtFee: 'n/d', share: 18, feeRate: '~0.8–1.1% (est.)', duration: 'Permanent (REITs) and finite', organic: 'Acquired — Credit Suisse Brazil, Bancolombia (51%), RBR', multipleView: 'Premium', comment: 'The source of most of the $11bn of permanent capital. Structurally the best duration in the group; also the most acquired, at three deals in three years.', tier: 'D' },
    { name: 'GPMS / Solutions and Public Equities', aum: 'n/d', mgmtFee: 'n/d', share: 15, feeRate: '~0.3–0.6% (est.)', duration: 'Short to medium', organic: 'Mixed', multipleView: 'Discount', comment: 'Lowest fee rate and, in public equities, the most redeemable capital on the platform. The mix shift towards these verticals is a plausible partial explanation for the blended fee rate of ~0.87%.', tier: 'D' },
  ],

  aumScorecard: [
    { dimension: 'Fee rate', score: 4, basis: 'Blended ~0.87% (derived: $105.7m of FRE revenue annualised ÷ $48.9bn), roughly 40% below Blue Owl\'s ~1.42%.' },
    { dimension: 'Duration', score: 4, basis: 'Only 22% permanent capital; the balance is finite-life and must be re-raised on a five-to-seven-year cycle.' },
    { dimension: 'Redeemability (liability side)', score: 9, basis: 'No gated vehicles, no redemption queue, no repurchase caps. In 2026 this is worth a great deal and the market is giving no credit for it.' },
    { dimension: 'Deployment optionality', score: 5, basis: 'Not disclosed at the granularity Blue Owl provides. Pro-forma fee-earning AUM of $47.4bn versus $48.9bn actual suggests the acquired pipeline has largely converted.' },
    { dimension: 'Organic vs. acquired origin', score: 3, basis: 'Moneda, Credit Suisse Brazil, Bancolombia, abrdn, Solis, RBR, WP Global — seven transactions in five years. Organic fundraising is genuine ($7.7bn in 2025) but acquisitions set the AUM trajectory.' },
    { dimension: 'Geographic and currency concentration', score: 3, basis: 'Predominantly Latin America with revenue in USD and costs and assets substantially in BRL, CLP and COP. Reported growth carries an FX translation risk not present in the US peers.' },
    { dimension: 'Margin quality', score: 5, basis: '54.0% and falling; no operating leverage was captured across a five-fold expansion of the platform.' },
    { dimension: 'Disclosure quality', score: 2, basis: 'A single reportable segment. No strategy-level fee rates, margins or FRE contribution — the reader cannot locate the margin decline.' },
  ],
  aumScorecardNote:
    'Patria\'s capital is lower-fee, shorter-duration and more concentrated than the US peers\', and its disclosure is materially thinner. But it scores at the top of our sample on the one dimension that defined 2026: there is no redemption queue, no gate, and no vehicle running at a repurchase cap. An investor buying Patria is buying weaker capital with a cleaner liability structure — the exact inverse of the Blue Owl trade.',

  redemptions: null,
  redemptionNote:
    'Not applicable, and that is a genuine positive worth stating explicitly. Patria operates no perpetual semi-liquid vehicles of the kind that imposed repurchase caps across the US private-credit complex in 2026. Its public-equities capital is redeemable but small, and its private funds are finite-life with contractual lock-ups. The liability-side risk here is re-raising capital on schedule in Latin American markets, not defending a gate — a slower-burning risk with far less headline and mark-to-market violence.',

  dividendCoverage: [
    { year: 'FY2022', dePs: 1.00, dividendPs: 0.50, payoutPct: 50, note: 'Estimated dividend (tier D); Patria has consistently targeted roughly half of distributable earnings.' },
    { year: 'FY2023', dePs: 1.26, dividendPs: 0.60, payoutPct: 48, note: 'Tier D on the dividend.' },
    { year: 'FY2024', dePs: 1.24, dividendPs: 0.62, payoutPct: 50, note: 'Tier D on the dividend.' },
    { year: 'FY2025', dePs: 1.27, dividendPs: 0.65, payoutPct: 51, note: '$0.1625 per quarter — tier A for the current rate.' },
    { year: 'FY2026E', dePs: 1.28, dividendPs: 0.65, payoutPct: 51, note: 'Rate maintained; annualised from the Q2 2026 declaration.' },
  ],
  dividendNote:
    'The direct contrast with Blue Owl, and the most underrated fact about Patria. The dividend has been covered roughly two times over for the entire public life of the company, leaving genuine retained distributable earnings each year. The problem is what that retention has bought: seven acquisitions in five years that grew fee-related earnings 135% and distributable earnings per share 24%. Patria has the capital-allocation *capacity* that Blue Owl lacks, and has deployed it at a poor per-share return. Prior-year dividends are tier D — reconstructed from the payout policy rather than quoted — and should be read as approximate.',

  earningsBridge: [
    { label: 'FRE', value: 57.1 },
    { label: 'Perf. income', value: 8 },
    { label: 'Corp. & interest', value: -7 },
    { label: 'Tax & other', value: -7.4 },
    { label: 'DE', value: 50.7, isTotal: true },
  ],
  earningsBridgeNote:
    'FRE of $57.1m and DE of $50.7m are tier A; the three intermediate lines are tier D, sized to reconcile the disclosed anchors. The structurally important observation is the trend in the conversion ratio, which is tier B and fully sourced: DE was 164% of FRE in 2021, 113% in 2022, 127% in 2023, 111% in 2024, 99% in 2025 and 89% in Q2 2026. A ratio above 100% means performance income was adding materially to shareholder earnings; below 100% means below-the-line costs now exceed whatever carry is being realised. Patria has crossed from one regime to the other, and the crossing — not fee growth — is what has determined the share price for five years. Separately, GAAP net income attributable to Patria of $10.5m is 21% of distributable earnings. That is a much smaller adjustment gap than Blue Owl\'s 3%, and it means Patria\'s non-GAAP metrics are doing considerably less work.',

  ownership: [
    { k: 'Diluted shares (derived)', v: '158.4m', tier: 'B', period: 'Q2 2026', note: 'Derived: DE $50.7m ÷ $0.32 per share.' },
    { k: 'Share count at listing (derived)', v: '138.1m', tier: 'B', period: 'FY2021', note: 'Derived: DE $141.3m ÷ $1.023 per share.' },
    { k: 'Cumulative dilution since 2021', v: '+14.6%', tier: 'B', note: '≈2.8% a year, from acquisition equity (Moneda was ~60% stock) and compensation.' },
    { k: 'IPO offering', v: '34.6m Class A shares at $17.00', tier: 'A', period: 'January 2021', note: 'Priced above the range on Nasdaq; trading began 22 January 2021.' },
    { k: 'Market capitalisation', v: '$1.80bn', tier: 'B', note: '$11.37 × 158.4m derived shares.' },
    { k: 'Non-controlling interests', v: 'Solis 49%, Bancolombia 49%', tier: 'A', note: 'Two consolidated platforms where roughly half the economics accrue outside the listed share.' },
    { k: 'Deferred acquisition consideration', v: 'abrdn: £20m + interest at year two, £20m at year three (performance-linked)', tier: 'A', note: 'Plus undisclosed deferred elements on Solis, RBR and WP Global.' },
    { k: 'Control structure', v: 'Founder-controlled dual class', tier: 'C', note: 'Cayman-domiciled with a founder-controlled voting structure. Alignment is high; minority protection is correspondingly low.' },
  ],
  ownershipNote:
    'Dilution here is slower than Blue Owl\'s in percentage terms but arguably more consequential, because it is attached to acquisitions whose return on consideration has been poor. The cleanest test available: Patria has issued roughly 20m shares (14.6%) and spent an identifiable ~$400m+ of cash on acquisitions since 2021, and distributable earnings per share rose from $1.023 to $1.270. Whatever the acquired platforms earn gross, the return on total consideration measured at the per-share line is in the low single digits. The consolidation of Solis and Bancolombia at 51% compounds this: fee-earning AUM is reported at 100% while roughly half the economics of those platforms accrue to the minority partner.',

  peers: [
    { ticker: 'PAX', name: 'Patria Investments', marketCap: 1.80, fre: 235, freGrowthPct: 24, freMarginPct: 54.0, pFre: 7.7, divYieldPct: 5.7, permCapital: '22% of FEAUM', tier: 'B', note: 'Cheapest in the group on every multiple. Also the smallest, least liquid, least diversified geographically and thinnest on disclosure.' },
    { ticker: 'OWL', name: 'Blue Owl Capital', marketCap: 14.67, fre: 1573, freGrowthPct: 9, freMarginPct: 58.5, pFre: 9.3, divYieldPct: 9.8, permCapital: '85% of fees', tier: 'B', note: 'The nearest comparison on cheapness. Better capital, worse liability structure, uncovered dividend. See the companion memo.' },
    { ticker: 'ARES', name: 'Ares Management', marketCap: 42.14, fre: 1856, freGrowthPct: 26, freMarginPct: null, pFre: 22.7, divYieldPct: null, permCapital: 'High', tier: 'C', note: 'Q1 2026 FRE $464m (+26%); AUM $644bn. Almost identical FRE growth rate to Patria at three times the multiple — the clearest evidence of an emerging-market and scale discount.' },
    { ticker: 'TPG', name: 'TPG Inc.', marketCap: 15.92, fre: 988, freGrowthPct: 36, freMarginPct: 44, pFre: 16.1, divYieldPct: 5.4, permCapital: 'Lower', tier: 'C', note: 'Faster FRE growth but a 44% margin — ten points below Patria\'s already-depressed 54%. Trades at 2.1× Patria\'s multiple.' },
    { ticker: 'HLNE', name: 'Hamilton Lane', marketCap: null, fre: 345, freGrowthPct: 25, freMarginPct: 50, pFre: null, divYieldPct: 2.7, permCapital: 'Low', tier: 'C', note: 'The closest structural analogue: fee-centric, solutions-heavy, no balance sheet. FY2026 FRE $345m (+25%) on $142bn of AUM.' },
    { ticker: 'STEP', name: 'StepStone Group', marketCap: 5.47, fre: null, freGrowthPct: null, freMarginPct: null, pFre: null, divYieldPct: 2.6, permCapital: 'Low', tier: 'C', note: 'A $5.47bn market capitalisation for a private-markets solutions business — three times Patria\'s, on a broadly comparable fee model.' },
  ],
  peerNote:
    'Patria grows fee-related earnings at 24% — within two points of Ares — at a 54% margin that exceeds TPG\'s 44%, and trades at 7.7× against their 22.7× and 16.1×. Three things justify a discount, and only three. Duration: 22% permanent capital against "high" for Ares. Geography and currency: Latin American markets, local-currency assets, and an exit environment that has been closed for years. Disclosure: a single reportable segment, which makes independent verification of platform economics impossible. What does *not* justify the discount is the growth rate, the margin, the dividend coverage, or the liability structure — on all four Patria is at or above the group. A warranted discount to Ares of 50–55% implies 10–11× FRE, against 7.7× on offer. A price/fee-earning-AUM cross-check says the same thing: Patria trades at 3.7% of fee-earning AUM against Blue Owl\'s 7.7%, but earns 0.87% on that capital against Blue Owl\'s 1.42% — adjusted for the fee rate, Patria is still the cheaper capital base.',

  valuation: [
    { name: 'A — Normalised FRE multiple', approach: 'FY2026E FRE per share of $1.48 (guidance midpoint $235m) × 9–13×, anchored on a 50–55% discount to Ares for duration, geography and disclosure.', low: 13.3, base: 16.3, high: 19.2, note: 'Uses company guidance rather than our own forecast, which is the most defensible input available. Weight 35%.' },
    { name: 'B — Distributable earnings / yield', approach: 'DE per share of $1.28 annualised × 9–12×; cross-checked against the $0.65 dividend at a 4.5–5.5% required yield.', low: 11.5, base: 13.4, high: 15.4, note: 'The sceptic\'s method, and deliberately so — it values what has actually reached shareholders rather than what the fee line promises. At a 5.5% required dividend yield the value is $11.82, barely above today\'s price. Weight 35%.' },
    { name: 'C — Sum of the parts', approach: 'Recurring FRE stream at 11×, plus haircut carry, plus balance sheet, less net debt, deferred consideration and non-controlling interests.', low: 12.1, base: 14.5, high: 17.2, note: 'The only method that explicitly charges Patria for the Solis and Bancolombia minorities and the abrdn earn-outs. Weight 30%.' },
    { name: 'D — Price / fee-earning AUM (cross-check only)', approach: 'Market cap ÷ FEAUM = 3.7% ($1.80bn ÷ $48.9bn) against a blended fee rate of ~0.87%.', low: 0, base: 0, high: 0, note: 'Not used in the weighted value. Half of Blue Owl\'s 7.7% on a fee rate 40% lower — so on a fee-rate-adjusted basis Patria is roughly 20% cheaper still. Supportive, too crude to size on.' },
  ],

  sotp: [
    { component: 'Recurring fee stream', basis: 'FY2026E FRE of $235m (guidance midpoint)', multiple: '11× FRE', value: 2585 },
    { component: 'Expected performance revenues', basis: 'Guided $120–140m over three years, haircut 40% for a target already reset once', multiple: '5×, discounted', value: 75 },
    { component: 'Balance-sheet investments and GP commitments', basis: 'Seed and co-investment positions', multiple: 'At estimated carrying value', value: 150 },
    { component: 'Net debt', basis: 'Acquisition-related borrowings, estimated', multiple: '—', value: -250 },
    { component: 'Deferred acquisition consideration', basis: 'abrdn £40m of staged payments plus estimated Solis / RBR / WP Global deferrals', multiple: '—', value: -150 },
    { component: 'Non-controlling interests', basis: 'Solis 49%, Bancolombia 49% — economics reported in FEAUM but not owned', multiple: '—', value: -120 },
  ],

  implied: [
    { variable: 'Normalised FRE per share', impliedByPrice: '$1.04 at 11×', ourView: '$1.42–1.54 guided for FY2026', assessment: 'Aggressive' },
    { variable: 'DE per share growth', impliedByPrice: '≈0% in perpetuity at a 9% required return', ourView: '5.5% delivered over five years; 8–10% achievable if the margin stabilises', assessment: 'Aggressive' },
    { variable: 'FRE multiple', impliedByPrice: '7.7×, a 66% discount to Ares', ourView: '10–11× warranted (a 50–55% discount)', assessment: 'Aggressive' },
    { variable: 'FRE margin', impliedByPrice: 'Continued decline below 54%', ourView: 'Stabilises at 54–56% once the 2026 acquisitions annualise', assessment: 'Reasonable' },
    { variable: 'Performance-related earnings', impliedByPrice: 'Zero, permanently', ourView: 'Zero is too harsh, but the guided $120–140m deserves a 40% haircut given the reset', assessment: 'Reasonable' },
    { variable: 'Dividend', impliedByPrice: 'A 5.7% yield implies doubt about growth, not about coverage', ourView: 'Covered at ~51% of DE with genuine retention capacity', assessment: 'Aggressive' },
    { variable: 'Latin American exit markets', impliedByPrice: 'Closed indefinitely', ourView: 'Cyclically closed; the 2024 Aguas Pacifico realisation shows the carry is real when they open', assessment: 'Reasonable' },
  ],

  scenarios: [
    {
      name: 'Bear',
      probability: 0.30,
      narrative:
        'The margin decline continues below 50% as the 2026 acquisitions prove harder to integrate than the previous six. Latin American exit markets stay shut, performance-related earnings never arrive, and the guided $120–140m is reset a second time. A regional currency shock cuts reported fee-earning AUM in dollar terms. Fundraising slows as finite-life funds come up for re-raise into a weak local institutional bid, and FRE stalls near $200m. The market applies a structural emerging-market discount and 7× to a flat earnings stream.',
      assumptions: [
        { k: 'Gross fundraising', v: '$4–6bn p.a. (from $9bn+ pace)' },
        { k: 'Fee-earning AUM', v: 'Flat to −5% in USD terms' },
        { k: 'FRE margin', v: '50%' },
        { k: 'FRE (2031)', v: '$200m, $1.20 per share' },
        { k: 'DE per share (2031)', v: '$1.10' },
        { k: 'Dividend', v: 'Held at $0.65 — coverage permits it' },
        { k: 'Exit multiple', v: '7× DE' },
      ],
      targetPrice: 8.80,
      threeYrIrrPct: -6,
      fiveYrIrrPct: -1.9,
    },
    {
      name: 'Base',
      probability: 0.50,
      narrative:
        'FY2026 FRE lands inside the $225–245m guidance and the margin stabilises at 54–56% as the acquisitions annualise. The acquisition cadence slows — the $70bn target is reached with more organic contribution than the last three years. Performance income returns at roughly two-thirds of the guided rate as the 2017–2019 Infrastructure vintages exit. FRE per share compounds at about 10% a year, dilution slows to under 2%, and the multiple re-rates modestly from 7.7× to 10.5× as a second and third year of double-digit per-share growth breaks the five-year pattern.',
      assumptions: [
        { k: 'Gross fundraising', v: '$9–11bn p.a.' },
        { k: 'Fee-earning AUM', v: '+15% CAGR, reaching the $70bn target around 2028' },
        { k: 'FRE margin', v: '55%' },
        { k: 'FRE (2031)', v: '$390m, $2.38 per share' },
        { k: 'DE per share (2031)', v: '$2.05' },
        { k: 'Dividend', v: 'Grows with DE to ~$1.00' },
        { k: 'Exit multiple', v: '10.5× DE' },
      ],
      targetPrice: 14.75,
      threeYrIrrPct: 19,
      fiveYrIrrPct: 18,
    },
    {
      name: 'Bull',
      probability: 0.20,
      narrative:
        'Latin American capital markets reopen, the accumulated carry across Infrastructure and Private Equity realises at or above the guided range, and performance income returns as a recurring contributor rather than an episodic one — restoring the DE/FRE conversion ratio towards 120%. The permanent-capital share rises past 35% on continued real-estate REIT growth, the margin recovers to 58%, and international investors re-rate an emerging-market manager compounding fee earnings at 20%+ with a covered dividend. The multiple closes half the gap to Hamilton Lane.',
      assumptions: [
        { k: 'Gross fundraising', v: '$13–15bn p.a.' },
        { k: 'Fee-earning AUM', v: '+20% CAGR' },
        { k: 'FRE margin', v: '58%' },
        { k: 'FRE (2031)', v: '$500m, $3.05 per share' },
        { k: 'DE per share (2031)', v: '$2.60' },
        { k: 'Dividend', v: 'Grows to ~$1.30' },
        { k: 'Exit multiple', v: '13× DE' },
      ],
      targetPrice: 24.00,
      threeYrIrrPct: 32,
      fiveYrIrrPct: 28.2,
    },
  ],

  sensitivity: {
    rowLabel: 'Normalised FRE per share',
    colLabel: 'FRE multiple',
    rows: ['$1.20', '$1.35', '$1.48', '$1.65', '$1.85'],
    cols: ['7×', '9×', '11×', '13×', '15×'],
    values: [
      [8.4, 10.8, 13.2, 15.6, 18.0],
      [9.5, 12.2, 14.9, 17.6, 20.3],
      [10.4, 13.3, 16.3, 19.2, 22.2],
      [11.6, 14.9, 18.2, 21.5, 24.8],
      [13.0, 16.7, 20.4, 24.1, 27.8],
    ],
  },

  redTeam: {
    case:
      'The entire bull case rests on a multiple re-rating that five and a half years of evidence says will not happen — and the evidence is not ambiguous. Distributable earnings per share were $1.023 in 2021 and $1.270 in 2025. Four years, 5.5% a year, over a period in which management quintupled the platform, completed seven acquisitions and grew fee-related earnings 135%. The stock is down 33% from its IPO price and total return is negative. Every year the story is that scale will bring operating leverage; the FRE margin was 59% in 2021 and is 54% today. Every year the story is that carry is about to arrive; the $180m three-year target produced $110m and was quietly reset to $120–140m over a *later* three years. Meanwhile the company reports one segment, so no outside investor can verify which vertical is earning what, or where five points of margin went. It consolidates Solis and Bancolombia at 51% — reporting 100% of their fee-earning AUM while owning half the economics — which flatters every AUM-based metric in the deck, including the $70bn target. And the business is a Latin American manager with dollar-reported revenue and local-currency assets, run by a founder-controlled dual-class structure that leaves minority holders no recourse if the acquisition cadence continues. 7.7× is not a discount waiting to close. It is the market correctly capitalising a management team that has demonstrated, repeatedly, that it will convert shareholder capital into AUM rather than into per-share earnings.',
    adjudication:
      'This is the stronger of the two red teams in this pair, and we accept most of it. The per-share record is exactly as stated and it is the reason Patria is sized at 1–2% rather than the 3–4% the raw multiple would suggest. We accept the carry-reset point in full and have haircut the guided range by 40%. We accept the consolidation point and have deducted $120m for the Solis and Bancolombia minorities in the sum-of-the-parts — very few sell-side models do. We accept that single-segment reporting is a legitimate, permanent component of the discount rather than a temporary one. Where we disagree is on what has actually changed. The 2021→2025 stagnation has a single dominant cause, and it is arithmetically identifiable: the DE/FRE conversion ratio fell from 164% to 99%, contributing −$0.83 per share against +$1.36 from fee growth. That collapse cannot repeat, because performance income is already at approximately zero — the ratio cannot fall another 65 points from 99%. From here, per-share DE growth converges on FRE per share growth minus dilution: roughly 12–14% less 2%, or 10–12%. The bear case correctly describes the last five years and incorrectly extrapolates the mechanism, because the mechanism has already fully played out. The margin is the live question, and it is the first kill criterion.',
  },

  predictions: [
    { claim: 'FRE margin stabilises rather than continuing to fall', threshold: '≥54.0% in each of Q3 and Q4 2026', by: 'FY2026 results (February 2027)', ifWrong: 'Acquisitions are structurally lower-margin rather than temporarily dilutive; the FRE multiple in method A is too high and base case falls towards $12.' },
    { claim: 'FY2026 FRE lands inside guidance', threshold: '$225–245m ($1.42–1.54 per share)', by: 'FY2026 results (February 2027)', ifWrong: 'A first guidance miss would confirm that acquired growth is not additive at the earnings line and would justify the market\'s scepticism outright.' },
    { claim: 'Per-share distributable earnings finally break the five-year pattern', threshold: 'FY2027 DE per share ≥ $1.55 (+21% on FY2025)', by: 'FY2027 results (February 2028)', ifWrong: 'The conversion argument in our adjudication is wrong, the discount is permanent, and the position should be exited regardless of multiple.' },
  ],

  killCriteria: [
    'FRE margin below 52% for two consecutive quarters — the operating leverage assumption underpinning every valuation method here.',
    'A second reset of the performance-related earnings target, or a third consecutive year with PRE below $30m.',
    'Another acquisition above $150m of consideration before FY2027 per-share DE growth exceeds 10% — capital allocation would be confirmed as AUM-seeking rather than value-seeking.',
    'Diluted share count rising above 170m (from 158.4m) without a commensurate rise in DE per share.',
    'Fee-earning AUM falling in USD terms for two consecutive quarters, whether from FX or from failed re-raises.',
  ],

  risks: [
    { risk: 'FRE margin continues to fall', mechanism: 'Each acquisition consolidates at a lower margin than the legacy platform; the 2026 cohort cost 490bp.', severity: 'High', quantified: 'Every 100bp of margin is ~$2m of quarterly FRE, ~$0.05 per share annually' },
    { risk: 'Performance income never returns', mechanism: 'Latin American exit markets have been effectively shut since 2022; the carry target has already been reset once.', severity: 'High', quantified: 'The guided $120–140m is ~$0.76–0.88 per share of cumulative value; we carry only $75m in the SOTP' },
    { risk: 'Currency translation', mechanism: 'Revenue is reported in USD while assets, fee bases and costs are substantially BRL, CLP and COP.', severity: 'Medium', quantified: 'A 15% BRL depreciation would cut reported fee-earning AUM by an estimated 8–10%' },
    { risk: 'Continued acquisition cadence', mechanism: 'Seven deals in five years produced 5.5% annual per-share DE growth. More of the same produces more of the same.', severity: 'Medium', quantified: 'Historic return on acquisition consideration at the per-share line is low single digits' },
    { risk: 'Minority-interest leakage', mechanism: 'Solis and Bancolombia consolidate at 51%; reported fee-earning AUM includes 100% of platforms half-owned.', severity: 'Medium', quantified: 'Estimated $120m of value, ~$0.76 per share, deducted in the SOTP' },
    { risk: 'Re-raise risk on finite-life funds', mechanism: '78% of fee-earning AUM must be re-raised on a five-to-seven-year cycle into a concentrated regional institutional bid.', severity: 'Medium', quantified: 'A 20% shortfall on a re-raise cycle would cost ~$25–30m of annual FRE' },
    { risk: 'Disclosure opacity', mechanism: 'Single-segment reporting prevents independent verification of strategy-level economics.', severity: 'Low', quantified: 'Not quantifiable — it is a permanent component of the multiple, not an event risk' },
  ],

  kpis: [
    { kpi: 'FRE margin', why: 'The variable that broke this quarter and the one every valuation method depends on. It is also the cleanest test of whether the acquisition strategy adds or subtracts value.', green: '≥55% and stable', red: '<52% for two consecutive quarters' },
    { kpi: 'Distributable earnings per share, year on year', why: 'The number that has not grown for five years. Fee-earning AUM, FRE and fundraising have all been strong throughout that period and told investors nothing.', green: '≥10% growth', red: 'Below 5% for a third consecutive year' },
    { kpi: 'Realised performance-related earnings against the $120–140m three-year target', why: 'The single line that explains the 2021–2025 stagnation, and the cheapest source of upside if it turns.', green: '≥$40m a year', red: 'A second reset of the target' },
  ],

  conclusions: [
    { q: 'What is normalised earning power today?', a: 'Fee-related earnings of $225–245m ($1.42–1.54 per share) on company guidance, and distributable earnings of roughly $1.28 per share annualised from Q2 2026, on 158.4m derived diluted shares. We use $1.48 of FRE and $1.28 of DE as the normalised inputs.' },
    { q: 'What percentage of earnings is recurring?', a: 'Effectively 100% — and that is a problem, not a virtue. Performance-related earnings have fallen from contributing roughly $0.40 per share in 2021 to approximately nothing in 2025. The earnings are recurring because the variable component has disappeared, not because it has been replaced.' },
    { q: 'How good is the fee-paying AUM relative to peers?', a: 'Below average on fee rate (~0.87% against Blue Owl\'s ~1.42%), below average on duration (22% permanent), below average on disclosure (a single reportable segment) — and best in the group on liability structure, with no gates, no queues and no repurchase caps. Weaker capital, cleaner obligations.' },
    { q: 'How much growth since listing reached the public share?', a: 'Half, at best. Fee-related earnings indexed to 250 against distributable earnings per share at 125 (FY2021 = 100). In cash terms: FRE grew 135% and DE per share grew 24% over four years, or 5.5% a year. Including dividends, the total return since the $17.00 IPO is roughly −13% to −16%.' },
    { q: 'Has capital allocation been disciplined?', a: 'No. Seven acquisitions in five years, roughly 20m shares issued and $400m+ of identifiable cash consideration, delivered 5.5% annual per-share distributable earnings growth. The dividend has been covered twice over throughout, so the retention was genuine — it was deployed poorly. This is the central charge against management and it is supported by their own reported figures.' },
    { q: 'Does the latest quarter strengthen or weaken the thesis?', a: 'Both, and roughly in balance. FRE +24%, fee-earning AUM +32%, fundraising ahead of target and guidance reaffirmed — the operating quarter was strong. The 490bp margin decline to 54.0% is the third consecutive year of acquisitions diluting earning quality, and it is precisely the mechanism the bear case describes. Net: neutral to marginally negative.' },
    { q: 'What does the price already assume?', a: '7.7× fee-related earnings — a 66% discount to Ares, which grows FRE at a nearly identical rate — implies roughly zero perpetual growth in distributable earnings per share, zero value for the guided $120–140m of carry, and continued margin erosion. The market is extrapolating the 2021–2025 conversion failure indefinitely.' },
    { q: 'Most defensible base-case value per share?', a: '$14.75. Weighted 35% on 11× normalised FRE of $1.48 ($16.28), 35% on 10.5× normalised DE of $1.28 ($13.44), and 30% on a sum-of-the-parts that charges for the minorities and the deferred consideration ($14.46).' },
    { q: 'Bear and bull values?', a: 'Bear $8.80 (30% probability) — the margin keeps falling, carry never arrives, an FX shock, 7× on flat earnings. Bull $24.00 (20%) — Latin American exits reopen, the conversion ratio recovers towards 120%, and the multiple closes half the gap to Hamilton Lane. Probability-weighted: $14.82, roughly 30% above the current price.' },
    { q: 'Expected annualised return including dividends?', a: 'Probability-weighted, approximately 14% over five years and 15% over three. The base case returns roughly 18% annualised. Note the asymmetry: even the bear case only returns about −2% a year over five years, because the covered 5.7% dividend does most of the defensive work.' },
    { q: 'What would invalidate the thesis?', a: 'FRE margin below 52% for two consecutive quarters; a second reset of the performance-earnings target; another acquisition above $150m before per-share growth exceeds 10%; share count above 170m without matching DE per share; or fee-earning AUM falling in USD terms for two quarters.' },
    { q: 'Three KPIs to monitor each quarter?', a: 'FRE margin; year-on-year distributable earnings per share; realised performance-related earnings against the $120–140m three-year target.' },
  ],

  questionsForManagement: [
    'FRE margin fell from 58.9% in FY2025 to 54.0% in Q2 2026. How much of that is Solis, RBR and WP Global consolidating at lower margins, how much is integration cost that reverses, and where does the margin settle once the 2026 cohort annualises?',
    'The 2022 Investor Day targeted $180m of performance-related earnings for 2023–2025 and roughly $110m was realised. What specifically caused the shortfall, and what is different about the $120–140m now guided for the next three years?',
    'Distributable earnings per share were $1.023 in 2021 and $1.270 in 2025 while fee-related earnings grew 135%. What is management\'s own bridge for that gap, and what per-share distributable earnings does the $70bn fee-earning AUM target imply?',
    'Patria reports a single operating segment. What are fee rates, FRE margins and FRE contribution by vertical, and will the company begin disclosing them?',
    'Fee-earning AUM includes 100% of Solis and the Bancolombia platform, both owned 51%. What is fee-earning AUM on an economic-ownership basis, and what proportion of reported FRE accrues to non-controlling interests?',
    'What is the aggregate cash and share consideration paid for all acquisitions since the IPO, and what incremental fee-related earnings do those acquired businesses contribute today?',
    'What are the total remaining deferred and contingent acquisition obligations, by year, across abrdn, Solis, RBR and WP Global?',
    'What proportion of the $48.9bn of fee-earning AUM comes up for re-raise in the next three years, and what is the historic re-up rate by vertical?',
  ],

  sourceCaveat:
    'As with the Blue Owl memo, direct retrieval of filings, the IR site and SEC EDGAR was blocked by this environment\'s network egress policy; every figure was obtained through search-surfaced content from Patria\'s own releases and earnings calls and is tiered accordingly. Patria\'s disclosure is materially thinner than Blue Owl\'s to begin with — it reports a single operating segment, so no strategy-level fee rate, margin or FRE contribution exists in any public document. The segment table in this memo is therefore tier D throughout and should be read as an informed allocation, not as reported data. One internal consistency check worth stating: the derived share counts for every year (DE dollars ÷ DE per share, both tier A) form a monotonically rising series from 138.1m to 158.4m consistent with the known equity consideration in the Moneda transaction, which materially raises confidence in the dilution analysis. Items flagged and unverified: total AUM by year, net debt, balance-sheet investments, deferred acquisition consideration beyond the disclosed abrdn schedule, and dividends before FY2025.',

  sources: [
    { label: 'Q2 2026 results — FRE $57.1m, margin 54.0%, FEAUM $48.9bn, DE $50.7m / $0.32, dividend $0.1625', publisher: 'Patria Investments / GlobeNewswire', period: 'Q2 2026', tier: 'A', url: 'https://www.globenewswire.com/news-release/2026/07/31/3336661/0/en/Patria-Reports-Second-Quarter-2026-Earnings-Results.html' },
    { label: 'FY2025 results — FRE $202.5m (margin 58.9%), DE $200.9m / $1.27, FEAUM $40.8bn, $7.7bn organic', publisher: 'Patria Investments / 6-K', period: 'FY2025', tier: 'A', url: 'https://ir.patria.com/news-releases/news-release-details/patria-reports-fourth-quarter-full-year-2025-earnings-results' },
    { label: 'FY2024 results — FRE $170.1m (margin 57%), DE $189.2m / $1.24', publisher: 'Patria Investments / 6-K (SEC)', period: 'FY2024', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1825570/000162828025005023/patriareportsfourthquart.htm' },
    { label: 'FY2023 results — FRE $147.7m (margin 60%), DE $188m / $1.26', publisher: 'Patria Investments', period: 'FY2023', tier: 'A', url: 'https://ir.patria.com/news-releases/news-release-details/patria-reports-fourth-quarter-full-year-2023-earnings-results/' },
    { label: 'FY2022 and FY2021 results — FRE $130.0m and $86.0m; DE $147.1m / $1.00 and $141.3m / $1.023', publisher: 'Patria Investments / 6-K (SEC)', period: 'FY2021–22', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1825570/000095010322002520/dp167108_ex9901.htm' },
    { label: 'FY2025 20-F — deal history, AUM metrics, risk factors', publisher: 'Patria Investments / SEC', period: 'FY2025', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/0001825570/000207097926000201/pax-20251231.htm' },
    { label: 'IPO pricing — 34.6m Class A shares at $17.00; AUM $12.7bn at 30 Sep 2020', publisher: 'Patria Investments / SEC 6-K', period: 'January 2021', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1825570/000095010321000977/dp144796_ex9901.htm' },
    { label: '2022 Investor Day targets — FEAUM $35bn, AUM $50bn, FRE >$200m by 2025, PRE $180m', publisher: 'Patria Investments earnings calls', period: '2022–2024', tier: 'C' },
    { label: 'Acquisition terms — Moneda, Credit Suisse Brazil, Bancolombia, abrdn', publisher: 'Patria Investments press releases / Reuters', period: '2021–2024', tier: 'A' },
    { label: 'Solis, RBR REITs and WP Global — closings and fee-earning AUM added; $47.4bn pro-forma; $70bn target', publisher: 'Patria Q4 2025 earnings call', period: 'February 2026', tier: 'C' },
    { label: 'Q1 2026 results — total AUM $59.3bn', publisher: 'Patria Investments / 6-K (SEC)', period: 'Q1 2026', tier: 'C', url: 'https://www.sec.gov/Archives/edgar/data/0001825570/000162828026031676/patriareportsfirstquarte.htm' },
    { label: 'Share price $11.37, market capitalisation ~$1.84bn, dividend yield 5.7%', publisher: 'Market data aggregators', period: 'Early July 2026', tier: 'C' },
    { label: 'Peer data — Ares, TPG, Hamilton Lane, StepStone', publisher: 'Company releases via secondary aggregators', period: 'Q1–Q2 2026', tier: 'C' },
  ],
}
