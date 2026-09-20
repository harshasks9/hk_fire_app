import type { Expansion } from './types.ts'

/**
 * Patria Investments (NASDAQ: PAX) — the v3 chapters. Cut 20 September 2026.
 *
 * Patria's listed history is thinner in our sources than Blue Owl's: year-end prices for
 * 2021–2023 could not be retrieved and are left empty rather than estimated. The 2024 and
 * 2025 year-ends are tier B, chained back from the annual total returns that were
 * retrievable and the dividends paid, and carry roughly ±$0.50.
 */
export const PAX_EXPANSION: Expansion = {
  asOf: '2026-09-20',

  history: {
    provenance: [
      { when: '1988', event: 'Founded in São Paulo by Luiz César Fernandes and partners as an M&A and financial-advisory boutique in partnership with Salomon Brothers.', evidence: 'Thirty-eight years old: the oldest franchise in this pair by a quarter of a century, and one that predates every Brazilian rate cycle its investors now fear.', tier: 'C' },
      { when: '1990s–2000s', event: 'Moves from advisory into private equity, then infrastructure, as Brazilian pension funds and international LPs begin allocating to Latin American alternatives.', evidence: 'The private-equity and infrastructure verticals that still anchor the fee base — and produce whatever carry arrives — were built here, over two decades, before the company had a share price.', tier: 'C' },
      { when: '2010', event: 'Blackstone acquires a 40% stake, bringing global distribution and institutional credibility.', evidence: 'The Blackstone relationship is the origin of the international LP base. Blackstone was a selling shareholder in the IPO — a signal the memo does not over-read, but records.', tier: 'C' },
      { when: '22 Jan 2021', event: 'Lists on Nasdaq at $17.00 a share, above the $14–16 range, with $12.7bn of AUM across 16 active funds. Highest close of the listing year $17.57 (8 Feb 2021).', evidence: 'Sold at roughly 16.6× the distributable earnings the year would produce ($1.023), into the same zero-rate window as Blue Owl — and, like Blue Owl, never sustainably above its listing price since.', tier: 'A' },
      { when: 'Sep 2021', event: 'Moneda Asset Management (Chile) combined, ~60% stock / ~40% cash; AUM from $16bn to $26bn.', evidence: 'The template for everything after: growth bought with shares, adding a lower-fee vertical (credit), consolidated in full.', tier: 'A' },
      { when: '2022–2024', event: 'Investor Day 2022 sets 2025 targets ($35bn FEAUM, $50bn AUM, FRE >$200m, PRE $180m); Credit Suisse Brazil real estate and Bancolombia (51%) added in 2023; abrdn\'s European private-equity business in April 2024; December 2024 Investor Day sets the $70bn fee-earning AUM target for end-2027.', evidence: 'Every target with an AUM or FRE denominator was met or beaten; the only target expressed in shareholder earnings — performance-related earnings — was missed by 40% and rolled forward.', tier: 'A' },
      { when: '2025 – H1 2026', event: 'Record organic fundraising of $7.7bn; Solis (51%), RBR REITs and WP Global closed; fee-earning AUM $48.9bn. The shares rise 39% in 2025 to a post-IPO high of $17.15 (8 Jan 2026), then fall 35% into the Brazilian election.', evidence: 'The only year in which the multiple re-rated was the year performance income finally converged with FRE — and it un-rated the moment the macro turned. The market has never paid Patria for its platform; it has paid, briefly, for Brazil.', tier: 'C' },
    ],
    promises: [
      { promise: 'Fee-earning AUM of $35bn by end-2025', source: '2022 Investor Day', delivered: '$40.8bn', status: 'Exceeded', tier: 'A', note: 'With Solis, RBR, WP Global, abrdn, Credit Suisse Brazil and Bancolombia all contributing. Organic fundraising of $7.7bn in 2025 was itself a record.' },
      { promise: 'FRE above $200m by 2025', source: '2022 Investor Day', delivered: '$202.5m', status: 'Met', tier: 'A', note: 'At the line, three years after it was drawn.' },
      { promise: 'Performance-related earnings of $180m over 2023–2025', source: '2022 Investor Day', delivered: '≈$110m realised; target reset to $120–140m over 2024–2027', status: 'Behind plan', tier: 'C', note: 'The one promise expressed in shareholder earnings rather than platform size, and the one missed.' },
      { promise: 'FRE margin of 57–60% through scaling', source: 'Investor Days 2022 and 2024', delivered: '54.0% in Q2 2026; management now guides FY2026 below the 58–60% target', status: 'Behind plan', tier: 'A' },
      { promise: 'Dividend of roughly half of distributable earnings', source: 'IPO prospectus policy', delivered: '48–51% payout every year; $0.65 (2025–26)', status: 'Met', tier: 'B', note: 'Kept, and covered twice over throughout — the structural contrast with Blue Owl.' },
      { promise: '$17.00 a share', source: 'IPO price, January 2021', delivered: '$11.17; estimated $3.1–3.5 of cumulative dividends', status: 'Behind plan', tier: 'C', note: 'Roughly −14% to −16% total return over five and two-thirds years.' },
      { promise: '$70bn of fee-earning AUM by end-2027; FRE $260–290m ($1.60–1.80 per share) in 2027', source: 'December 2024 Investor Day; Q2 2026 call', delivered: '$48.9bn; FY2026 guidance $225–245m', status: 'On track', tier: 'C', note: 'Requires roughly 20% annual growth in fee-earning AUM from here; the 2027 FRE range implies 14–24% per-share growth on FY2026 guidance if dilution stays under 2%.' },
    ],
    acquisitions: [
      { target: 'Moneda Asset Management (Chile; credit, equities)', closed: 'Sep 2021', consideration: 'Not fully disclosed; ~60% stock / ~40% cash', funding: 'Stock and cash', aumAcquired: '~$10bn', tier: 'A' },
      { target: 'Credit Suisse Brazil real-estate funds', closed: '2023', consideration: '~US$130m', funding: 'Cash', aumAcquired: 'Not disclosed', tier: 'A' },
      { target: 'Bancolombia real-estate platform (51%)', closed: '2023', consideration: 'Not disclosed', funding: 'Not disclosed', aumAcquired: 'Not disclosed', tier: 'C', note: 'Consolidated in full; 49% of the economics accrue to the partner.' },
      { target: 'abrdn European private-equity business', closed: 'Apr 2024', consideration: '~£100m, of which £40m deferred and performance-linked', funding: 'Cash, staged', aumAcquired: '~£7bn', tier: 'A' },
      { target: 'Solis Investimentos (51%)', closed: 'Q1 2026', consideration: 'Not disclosed', funding: 'Not disclosed', aumAcquired: '$3.5bn fee-earning', tier: 'C' },
      { target: 'RBR REITs', closed: 'Q1 2026', consideration: 'Not disclosed', funding: 'Not disclosed', aumAcquired: '~$1.3bn permanent', tier: 'C' },
      { target: 'WP Global Partners', closed: '2026', consideration: 'Not disclosed', funding: 'Not disclosed', aumAcquired: '$1.8bn', tier: 'C' },
    ],
    acquisitionsNote:
      'Seven transactions in five years, of which only two carry a disclosed price. The identifiable cash consideration is $400m or more and the identifiable share issuance roughly 20m shares (+14.6%); the total is unknowable from public documents, which is itself a finding. What the deals delivered at the shareholder line is known: distributable earnings per share went from $1.023 to $1.270. Blue Owl bought lower-fee capital with equity and diluted its fee rate; Patria bought lower-margin platforms with equity and cash, consolidated two of them at 51%, and diluted its margin. Different mechanism, same result.',
    life: [
      { period: 'IPO, Jan 2021', price: 17.0, dePs: null, dividendPs: null, sharesM: null, aum: 12.7, tier: 'A', note: 'AUM at 30 Sep 2020. Highest close of the year $17.57 (8 Feb 2021).' },
      { period: 'FY2021', price: null, dePs: 1.023, dividendPs: null, sharesM: 138.1, aum: 26.0, tier: 'B', note: 'Year-end price not retrieved. DE $141.3m.' },
      { period: 'FY2022', price: null, dePs: 1.0, dividendPs: 0.5, sharesM: 147.1, aum: null, tier: 'B', note: 'Year-end price not retrieved. Dividend estimated from the ~50% policy (tier D).' },
      { period: 'FY2023', price: null, dePs: 1.26, dividendPs: 0.6, sharesM: 149.2, aum: null, tier: 'B', note: 'Year-end price not retrieved. Dividend tier D.' },
      { period: 'FY2024', price: 12.6, dePs: 1.24, dividendPs: 0.62, sharesM: 152.6, aum: null, tier: 'B', note: 'Price chained back from the 2025 total return of +39% and the 2026 year-to-date return; ±$0.50.' },
      { period: 'FY2025', price: 16.9, dePs: 1.27, dividendPs: 0.65, sharesM: 158.2, aum: 55, tier: 'B', note: 'Chained from the year-to-date return of −30.9%; the 8 Jan 2026 close of $17.15 was 1.5% above it. ±$0.50.' },
      { period: 'Mid-Sep 2026', price: 11.17, dePs: 1.28, dividendPs: 0.65, sharesM: 158.4, aum: 60, tier: 'C', note: 'Last close available; DE annualised from Q2 2026.' },
    ],
    lifeNote:
      'The series is sparse where we could not source it and says so. What it does show is enough: an IPO at $17 on $1.02 of DE, a company that has since grown DE per share 25% and diluted 15%, and a share price that has spent almost the entire period below the offer. The one excursion above it — the 2025 rally to $17.15 — coincided with Brazil\'s policy rate peaking at 15% and the start of the cutting cycle, not with any change in Patria\'s conversion record.',
    regimes: [
      { period: '2021', regime: 'IPO into the zero-rate window', whatHappened: 'Listing at $17 in January; Moneda in September; Selic rising from 2% to 9.25% through the year as Brazil tightened first.', priceMove: '$17.00 offer; high $17.57', tier: 'C' },
      { period: '2022–2023', regime: 'Selic at 13.75%; the first Lula year', whatHappened: 'Brazilian rates peak; per-share DE falls in 2022 and recovers in 2023 on a $47m performance-income year; Investor Day targets set.', priceMove: 'Not retrieved', tier: 'D' },
      { period: '2024', regime: 'Rates re-tighten, real weakens', whatHappened: 'Selic cut to 10.5% then raised back to 12.25% by December; the real falls; per-share DE slips to $1.24 while FRE grows 15%.', priceMove: 'Year-end ≈ $12.6 (tier B)', tier: 'B' },
      { period: '2025', regime: 'Peak rates, then the turn', whatHappened: 'Selic reaches 15%; record $7.7bn organic fundraising; FRE $202.5m meets the 2022 target; performance income converges with FRE. The shares rise 39%.', priceMove: '≈ $12.6 → ≈ $16.9', tier: 'B' },
      { period: '2026', regime: 'Cuts, and an election', whatHappened: 'Five Selic cuts to 13.75% (16 Sep). Q2 margin 54.0% and FY2026 margin guided below target. Brazilian assets fall from August on the 4 October first round (Lula v. Flávio Bolsonaro); Citi and BofA go to Underperform in the second week of September.', priceMove: '$17.15 (8 Jan) → $11.37 (cut) → $11.66 → $11.17', tier: 'C' },
    ],
    verdict:
      'Patria\'s history is the inverse of Blue Owl\'s in one respect and identical in another. Inverse: it is an old firm with a long private record that listed late, not a young one that listed early, and nothing about its capital was ever sold as permanent. Identical: it has grown everything except the number the shareholder owns, and the share price has spent its whole listed life below the offer. The 2026 chapter adds a variable the original memo under-weighted — Brazil\'s election — and the history says how to weight it: the stock\'s only sustained rally was macro-driven, so its next drawdown may be too, and neither tells you anything about whether $1.55 of DE per share arrives in 2027.',
  },

  multiple: {
    earningsLineMultiple: 10.5,
    points: [
      { label: 'IPO', date: '2021-01-22', price: 17.0, dePs: 1.023, basis: 'FY2021', tier: 'B', note: 'Offer price against the DE the listing year went on to produce.' },
      { label: 'FY2024', date: '2024-12-31', price: 12.6, dePs: 1.24, basis: 'FY2024', tier: 'B', note: 'Chained year-end, ±$0.50.' },
      { label: 'FY2025', date: '2025-12-31', price: 16.9, dePs: 1.27, basis: 'FY2025', tier: 'B', note: 'Chained year-end, ±$0.50.' },
      { label: 'High', date: '2026-01-08', price: 17.15, dePs: 1.27, basis: 'FY2025', tier: 'C', note: 'Highest close since the IPO year.' },
      { label: 'Cut', date: '2026-07-30', price: 11.37, dePs: 1.28, basis: 'Q2 26 annualised', tier: 'C' },
      { label: 'Aug pass', date: '2026-08-26', price: 11.66, dePs: 1.28, basis: 'Q2 26 annualised', tier: 'C' },
      { label: 'Now', date: '2026-09-18', price: 11.17, dePs: 1.28, basis: 'Q2 26 annualised', tier: 'C' },
    ],
    pointsNote:
      'Seven points, with a three-year gap where year-end prices could not be sourced; the chart draws the gap as a gap. The earnings line is at 10.5× — the base-case exit multiple. The multiple has ranged from 16.6× at the offer to 8.7× today, and has been in single digits since the July cut.',
    decomposition: [
      { term: 'DE per share', from: '$1.023 (FY2021)', to: '$1.28 (Q2 2026 annualised)', contribution: '+25%', effect: 'positive', note: 'Five and a half years; about 4% a year. The conversion collapse described in the per-share bridge is all of the shortfall against FRE growth of 135%.' },
      { term: 'Multiple (price / DE)', from: '16.6×', to: '8.7×', contribution: '−47%', effect: 'negative', note: 'Half the multiple has gone. Some of it was the IPO premium; some is Brazil; some is the conversion record being priced as permanent.' },
      { term: 'Price', from: '$17.00', to: '$11.17', contribution: '−34%', effect: 'negative', note: '1.25 × 0.53 = 0.66. The identity closes.' },
      { term: 'Dividends collected, 2021 – Sep 2026', from: '—', to: '≈ $3.2 per share', contribution: '+19% of the offer price', effect: 'positive', note: 'Tier D before FY2025: reconstructed from the ~50% payout policy. Covered throughout.' },
      { term: 'Total return since the IPO', from: '$17.00', to: '≈ $14.4 (price + dividends)', contribution: '≈ −15% over 5.7 years, ≈ −3% a year', effect: 'negative', note: 'Against a Brazilian sovereign that paid 11–15% a year in local currency over the same period — the comparison a local allocator actually made.' },
    ],
    decompositionNote:
      'Patria\'s decomposition is gentler than Blue Owl\'s in every line — earnings grew less, the multiple fell less, the dividend was covered — and the outcome is the same: a negative total return since listing. That is because the multiple started lower and had less to lose, not because the business did better. The live question the decomposition sharpens is whether 8.7× is a Brazil multiple or a Patria multiple; the peer chapter says roughly half of each.',
    technicals: [
      { indicator: 'Position in the 52-week range', value: '14% ($10.12 – $17.80)', read: 'In the bottom seventh of the range; the 52-week low was set this summer.', tier: 'B' },
      { indicator: 'Drawdown from the post-IPO high close ($17.15, 8 Jan 2026)', value: '−34.9%', read: 'The entire 2025 rally, and a little more, unwound in eight months.', tier: 'B' },
      { indicator: 'Year-to-date total return', value: '−30.9%', read: 'Against Blue Owl\'s roughly −33% and Carlyle\'s −30%: Patria has traded as a listed alternative manager this year, not as a Brazilian asset — which cuts both ways.', tier: 'C' },
      { indicator: 'Move since the 30 July cut', value: '−1.8%', read: 'Flat through the period in which Blue Owl round-tripped 30%. Low beta to the US private-credit story, high beta to the October election.', tier: 'B' },
      { indicator: 'Sell-side consensus rating', value: '"Reduce", $12.75 average target', read: 'From Buy and $15.6 four weeks ago: Citi to Underperform (9 Sep), BofA to Underperform with a $10 target, JPMorgan to $13 (10 Sep). The first time the consensus has been below Hold since listing.', tier: 'C' },
      { indicator: 'Moving averages and RSI', value: 'Not retrievable', read: 'Not carried rather than estimated.', tier: 'D' },
    ],
    technicalsNote:
      'The sell-side turn is the one technical fact that matters, and it is a sentiment fact: three downgrades in a week with no company disclosure, ahead of an election. Historically such episodes have marked the lows in Brazilian equities more often than the highs; the memo does not trade on that and records it.',
    verdict:
      'At 8.7× distributable earnings Patria is at the bottom of its listed-life range and has been there since July. The range itself is narrow — 8.7× to 16.6×, against Blue Owl\'s 9.2× to 32.5× — because Patria was never given a permanence premium to lose. The base case needs the multiple to reach 10.5×, which the shares last saw around the end of 2024 and exceeded through most of 2025; it does not need anything the stock has not already done, on earnings the company has already guided to.',
  },

  peers: {
    rows: [
      { ticker: 'PAX', name: 'Patria Investments', group: 'Subject', price: 11.17, marketCapBn: 1.77, freAnnualisedM: 228, freGrowthPct: 24, freMarginPct: 54, pFre: 7.5, pDe: 8.7, divYieldPct: 5.8, permCapital: '22% of FEAUM; no gates', creditSharePct: null, tier: 'B', note: 'P/FRE on the FY2026 guidance midpoint ($1.48 per share); 7.8× on annualised Q2.' },
      { ticker: 'VINP', name: 'Vinci Compass', group: 'Latin America', price: 9.55, marketCapBn: 0.63, freAnnualisedM: 69, freGrowthPct: 36, freMarginPct: 32.5, pFre: 9.1, pDe: 12.7, divYieldPct: 7.1, permCapital: 'Low', creditSharePct: null, tier: 'C', note: 'The direct comparator: Rio-based, Nasdaq-listed, acquisitive (Compass in 2025, BACS in Argentina and Navi\'s real-estate platform in 2026). Q2 FRE R$88.7m (+36%) at a 32.5% margin — twenty points below Patria\'s — and a higher multiple. Converted at 5.14.' },
      { ticker: 'OWL', name: 'Blue Owl Capital', group: 'Credit-heavy', price: 9.88, marketCapBn: 15.5, freAnnualisedM: 1573, freGrowthPct: 9, freMarginPct: 58.5, pFre: 9.9, pDe: 11.4, divYieldPct: 9.3, permCapital: '85% of fees; flagship vehicles capped', creditSharePct: 53, tier: 'B', note: 'The companion memo. LTM FRE.' },
      { ticker: 'ARES', name: 'Ares Management', group: 'Credit-heavy', price: 124, marketCapBn: 38, freAnnualisedM: 1964, freGrowthPct: 20, freMarginPct: null, pFre: 19.3, pDe: null, divYieldPct: 4.4, permCapital: 'High', creditSharePct: 66, tier: 'D', note: 'Q2 2026 FRE $491m (+20%). Aggregator price snapshots this month range $105.80–$142.76; midpoint shown; least reliable row.' },
      { ticker: 'APO', name: 'Apollo Global Management', group: 'Credit-heavy', price: 127, marketCapBn: 74.3, freAnnualisedM: 2950, freGrowthPct: null, freMarginPct: null, pFre: 25.2, pDe: 15.0, divYieldPct: 1.8, permCapital: 'Very high — Athene', creditSharePct: 86, tier: 'C', note: 'Q2 2026 FRE $1.26 / SRE $1.41 / ANI $2.11 per share; P/DE on ANI.' },
      { ticker: 'BX', name: 'Blackstone', group: 'Buyout-heavy', price: 124.96, marketCapBn: 157.3, freAnnualisedM: 7200, freGrowthPct: 22, freMarginPct: null, pFre: 21.8, pDe: 20.6, divYieldPct: 4.2, permCapital: 'High', creditSharePct: null, tier: 'C', note: 'Q2 2026 FRE $1.43 / DE $1.52 per share. 18 Sep close; market cap on the ~1,259m shares implied by FRE $1.8bn ÷ $1.43.' },
      { ticker: 'KKR', name: 'KKR & Co.', group: 'Buyout-heavy', price: 98.81, marketCapBn: 90.9, freAnnualisedM: 4856, freGrowthPct: 34, freMarginPct: null, pFre: 18.7, pDe: 15.2, divYieldPct: 0.7, permCapital: 'High — Global Atlantic', creditSharePct: 48, tier: 'C', note: 'Q2 2026 FRE $1.32 / ANI $1.63 per share. P/DE on ANI. Market cap on the ~920m shares implied by FRE $1.214bn ÷ $1.32.' },
      { ticker: 'BAM', name: 'Brookfield Asset Management', group: 'Buyout-heavy', price: 45.3, marketCapBn: 74.2, freAnnualisedM: 3232, freGrowthPct: 20, freMarginPct: null, pFre: 22.6, pDe: 25.9, divYieldPct: 4.4, permCapital: 'High', creditSharePct: null, tier: 'C', note: 'Q2 2026 FRE $0.50 / DE $0.44 per share.' },
      { ticker: 'CG', name: 'The Carlyle Group', group: 'Buyout-heavy', price: 41.4, marketCapBn: 14.8, freAnnualisedM: 1432, freGrowthPct: 11, freMarginPct: null, pFre: 10.3, pDe: 9.7, divYieldPct: 3.4, permCapital: 'Moderate', creditSharePct: null, tier: 'C', note: 'Q2 2026 FRE $358m (+11%), DE $1.07 per share. Price implied by the dividend yield.' },
      { ticker: 'TPG', name: 'TPG Inc.', group: 'Buyout-heavy', price: 52.67, marketCapBn: 19.5, freAnnualisedM: 1260, freGrowthPct: 43, freMarginPct: 50, pFre: 15.5, pDe: 19.1, divYieldPct: 4.5, permCapital: 'Lower', creditSharePct: null, tier: 'D', note: 'Q2 2026 FRE $315m (+43%), 50% margin. Market cap on all classes is our estimate.' },
      { ticker: 'HLNE', name: 'Hamilton Lane', group: 'Solutions', price: 95.98, marketCapBn: 5.29, freAnnualisedM: 496, freGrowthPct: 49, freMarginPct: null, pFre: 10.7, pDe: 12.4, divYieldPct: 2.3, permCapital: 'Low', creditSharePct: null, tier: 'C', note: 'Q1 FY2027 FRE $124m (+49%), flattered by a 170% rise in incentive fees that HLNE books inside FRE. The structural analogue for Patria\'s solutions vertical.' },
      { ticker: 'STEP', name: 'StepStone Group', group: 'Solutions', price: 47.1, marketCapBn: 6.0, freAnnualisedM: 424, freGrowthPct: 30, freMarginPct: 39, pFre: 14.2, pDe: null, divYieldPct: 2.0, permCapital: 'Low', creditSharePct: null, tier: 'C', note: 'Q1 FY2027 FRE $106m (+30%), 39% margin. Three and a half times Patria\'s market value on a broadly comparable fee model and a lower margin.' },
      { ticker: 'GCMG', name: 'GCM Grosvenor', group: 'Solutions', price: 13.86, marketCapBn: 2.8, freAnnualisedM: 201, freGrowthPct: 21, freMarginPct: 45, pFre: 13.9, pDe: null, divYieldPct: 3.5, permCapital: 'Low to moderate', creditSharePct: null, tier: 'C', note: 'The closest in size: $2.8bn against $1.77bn, on FRE of $201m against $228m, at nearly twice the multiple. Q2 2026; price 14 Aug.' },
    ],
    rowsNote:
      'The same thirteen names as the Blue Owl chapter, ordered from Patria outwards. Two rows carry the comparison: GCM Grosvenor, which earns slightly less FRE than Patria at a lower margin and is valued at 1.6× as much, and Vinci Compass, the only other listed Latin American manager, which grows faster at a far lower margin and trades at a slightly higher multiple. Between them they bracket the discount: roughly half of it is the domicile, and the other half is Patria-specific.',
    whatMarketPays: [
      { factor: 'Domicile', evidence: 'Patria (7.5×) and Vinci (9.1×) are the two cheapest names in the set and the two fastest organic growers. The US solutions managers with similar fee models — GCMG, STEP, HLNE — trade at 11–14×.', verdict: 'A Latin American discount of roughly 35–45% to the comparable US business model, before anything Patria-specific.' },
      { factor: 'Scale and liquidity', evidence: 'Market value of $1.77bn; daily turnover of a few hundred thousand shares. Every name above $35bn trades at 19× or more.', verdict: 'Size is a discount everywhere in the table; Patria is the second-smallest name in it.' },
      { factor: 'Disclosure', evidence: 'Single reportable segment. Vinci reports by segment (private markets, liquid strategies, IP&S, advisory).', verdict: 'The one factor the company could remove itself, and the one the peer with segment reporting is rewarded for — Vinci\'s multiple exceeds Patria\'s despite a margin twenty points lower.' },
      { factor: 'Conversion record', evidence: 'DE per share +25% since listing against FRE +135%; FRE margin down five points in a year.', verdict: 'The Patria-specific half of the discount, and the half the memo\'s predictions test.' },
      { factor: 'Liability structure', evidence: 'No gates, no queues, no repurchase caps — the best liability structure in the table in the year that structure mattered most.', verdict: 'Given no credit at all. The market has treated 2026 as a US private-credit story and a Brazil story, and Patria is on the wrong side of the second without being exposed to the first.' },
      { factor: 'Payout', evidence: 'A covered 5.8% yield at a 51% payout — the highest covered yield in the set.', verdict: 'Priced as a Brazil yield, not a manager yield. The retained half of DE has been spent on acquisitions at a low per-share return, which is the fair criticism.' },
    ],
    verdict:
      'Patria is cheap against every listed manager, including the one that shares its geography, and roughly half of that is for reasons it cannot change — domicile, size, the election calendar — and half for reasons it can: segment disclosure, acquisition cadence, the margin. The peer set also answers the question the original memo left open, of what "a warranted 50–55% discount to Ares" means in practice: it means the GCM Grosvenor multiple, 14×, less a Brazil spread — roughly 10–11×, which is where the base case sits. The stock does not need a re-rating to a US multiple; it needs to be valued like a smaller GCM Grosvenor with a country risk premium, which is what it is.',
  },

  yields: {
    rows: [
      { instrument: 'Patria — distributable-earnings yield (USD)', yieldPct: 11.5, asOf: '18 Sep 2026', basis: 'Q2 2026 DE annualised $1.28 ÷ $11.17', kind: 'subject', tier: 'B' },
      { instrument: 'Patria — fee-related-earnings yield (USD)', yieldPct: 12.9, asOf: '18 Sep 2026', basis: 'Q2 2026 FRE annualised $1.44 ÷ $11.17', kind: 'subject', tier: 'B' },
      { instrument: 'Patria — dividend yield (51% payout)', yieldPct: 5.8, asOf: '18 Sep 2026', basis: '$0.65 ÷ $11.17', kind: 'subject', tier: 'B' },
      { instrument: 'Brazil 10-year government bond (BRL)', yieldPct: 14.37, asOf: '17 Sep 2026', basis: 'Nominal; IPCA inflation 4.22% (Aug), so a real yield near 10%', kind: 'sovereign', tier: 'C' },
      { instrument: 'Selic policy rate', yieldPct: 13.75, asOf: '16 Sep 2026', basis: 'Fifth consecutive 25bp cut from the 15.00% peak', kind: 'sovereign', tier: 'C' },
      { instrument: 'Tesouro IPCA+ 2035 (NTN-B) real yield', yieldPct: 7.3, asOf: 'Latest surfaced; undated', basis: 'Inflation-linked; the figure predates this cut and is shown for scale only', kind: 'sovereign', tier: 'D' },
      { instrument: 'Brazil sovereign USD bond, 2035', yieldPct: 6.2, asOf: 'Latest surfaced; undated', basis: 'Yield to maturity on the 6.625% 2035; the March 2025 reopening priced at 6.73%, +237bp over Treasuries', kind: 'sovereign', tier: 'C' },
      { instrument: 'Vinci Compass — dividend yield', yieldPct: 7.1, asOf: '10 Sep 2026', basis: '$0.17 quarterly ÷ $9.55', kind: 'peer', tier: 'C' },
      { instrument: 'Blue Owl — distributable-earnings yield', yieldPct: 8.8, asOf: '18 Sep 2026', basis: 'Companion memo; a 106%-payout dividend yields 9.3%', kind: 'peer', tier: 'B' },
      { instrument: 'US large managers — DE yields: KKR 6.6 (ANI) · BX 4.9 · BAM 3.9', yieldPct: 4.9, asOf: 'Sep 2026', basis: 'Blackstone shown', kind: 'peer', tier: 'B' },
      { instrument: 'ICE BofA single-B', yieldPct: 7.27, asOf: '3 Sep 2026', basis: 'Effective yield', kind: 'credit', tier: 'C' },
      { instrument: 'ICE BofA BBB', yieldPct: 5.86, asOf: 'Sep 2026', basis: 'Effective yield', kind: 'credit', tier: 'C' },
      { instrument: 'US Treasury 10-year', yieldPct: 5.01, asOf: '16 Sep 2026', basis: 'Fed funds 3.75–4.00% after the 16 Sep hike', kind: 'sovereign', tier: 'C' },
    ],
    rowsNote:
      'Two ladders in one, because Patria sits between two bond markets. In dollars — the currency it reports, pays its dividend and is valued in — its 11.5% distributable-earnings yield is five points over Brazil\'s own dollar bonds and six and a half over Treasuries. In reais — the currency most of its funds, fees and costs are denominated in — the same yield is *below* the Brazilian 10-year and the policy rate. That is the whole valuation puzzle in one row: the market is applying a local-currency required return to a dollar-reporting, Cayman-domiciled company. Some of that is right (the assets are Brazilian); some of it is the election risk premium; and the difference between 11.5% and the ~9% a dollar investor would require is the discount the memo is buying.',
    buckets: [
      { bucket: 'Permanent capital — REITs and listed vehicles', sharePct: 22, duration: 'Perpetual', liability: 'None; RBR and the Bancolombia platform are structurally permanent', requiredYieldPct: 8.0, build: '10-year Treasury 5.01 + Brazil USD sovereign spread 1.5 + 1.5 for illiquidity and manager risk.' },
      { bucket: 'Finite-life drawdown funds — private equity, infrastructure, credit', sharePct: 63, duration: '8–10 years, contractually locked; must be re-raised', liability: 'None during the fund life; re-raise risk at the end of it, into a concentrated regional bid', requiredYieldPct: 9.5, build: '10-year Treasury 5.01 + Brazil spread 1.5 + 3.0 for re-raise, currency and emerging-market exit risk.' },
      { bucket: 'Public equities, solutions and other redeemable capital', sharePct: 15, duration: 'Short to medium', liability: 'Redeemable', requiredYieldPct: 10.5, build: '2-year Treasury 4.74 + Brazil spread 1.5 + 4.3 for redeemability, low fee rate and currency.' },
    ],
    dePs: 1.28,
    bucketNote:
      'The fee-earning AUM split is tier A for the 22% permanent share and tier D for the division of the remainder. Weighting the three required yields gives 9.3%; capitalising annualised DE of $1.28 at 9.3% with no growth gives $13.73 a share — 7% below the $14.75 base case and 23% above the price. Each point of durable growth is worth roughly $1.70 a share. The point of the exercise is the comparison with the Blue Owl bucket table: Patria\'s required yield is higher (9.3% against 8.5%) because of the country spread and the re-raise risk, and its capital is worse — but nothing in it is puttable, so nothing in it carries a redemption-cycle premium. A bond investor would rather own Patria\'s fee stream at 11.5% than Blue Owl\'s at 8.8%, and the equity market has priced the two the other way round.',
    verdict:
      'Patria is priced off the wrong yield curve. Its distributable-earnings yield of 11.5% in dollars is a Brazilian local-currency return applied to a dollar-reporting company whose covered dividend yields more than Blackstone\'s and whose fee base carries no put. The correct comparison for a dollar holder is Brazil\'s dollar sovereign plus a manager premium — roughly 9% — and at that yield the shares are worth $13–14 with no growth at all. What the market is adding on top is an election risk premium that will resolve on 25 October one way or the other; the memo does not pretend to know which, and does not need to, because the rating does not depend on it.',
  },

  sources: [
    { label: 'Share price $11.17 (last close), intraday $11.02; 52-week range $10.12–$17.80; market capitalisation $1.76bn', publisher: 'Market data aggregators', period: 'Mid-September 2026', tier: 'C' },
    { label: 'Post-IPO high close $17.15 on 8 Jan 2026; listing-year high $17.57 on 8 Feb 2021', publisher: 'MacroTrends / aggregators', period: '2021 – 2026', tier: 'C' },
    { label: 'Annual total returns: 2025 +39.0%; 2026 year-to-date −30.9%; five-year −30.5%', publisher: 'Eulerpool / Stock Titan / aggregators', period: '2021 – Sep 2026', tier: 'C' },
    { label: 'Founding in 1988 with Salomon Brothers; Blackstone\'s 40% stake (2010) and sale of shares in the IPO', publisher: 'Umbrex company profile / Renaissance Capital / S&P Global', period: '1988 – 2021', tier: 'C' },
    { label: 'IPO — 34.6m Class A shares at $17.00 (above the $14–16 range), Nasdaq, 22 Jan 2021', publisher: 'Patria Investments / SEC 6-K', period: 'January 2021', tier: 'A' },
    { label: 'Q2 2026 results and call — DE $50.7m / $0.32 (+31%), FRE $57.1m, FEAUM $48.9bn; FY2026 FRE $225–245m; FY2027 FRE target $260–290m ($1.60–1.80) maintained', publisher: 'Patria Investments / GlobeNewswire / transcripts', period: 'Jul–Aug 2026', tier: 'A' },
    { label: 'December 2024 Investor Day — $70bn fee-earning AUM by end-2027; PRE $120–140m over 2024–2027; 2026 fundraising $7bn', publisher: 'Patria Investments 6-K / Investing.com', period: 'Dec 2024 – Feb 2026', tier: 'C' },
    { label: 'Sell-side: JPMorgan $13 Neutral (10 Sep, from $15 and $16); Citi to Underperform (9 Sep); BofA to Underperform, $10; Goldman $18 Buy (from $20); consensus "Reduce" $12.75', publisher: 'TipRanks / MarketBeat / The Fly', period: 'August – September 2026', tier: 'C' },
    { label: 'Brazil — Selic cut to 13.75% (16 Sep); 10-year 14.37% (17 Sep); IPCA 4.22% (Aug); USD/BRL 5.14 (18 Sep); election 4 Oct / 25 Oct; assets sliding on election worries since August', publisher: 'Bloomberg / Rio Times / Trading Economics / Agência Brasil', period: 'August – September 2026', tier: 'C' },
    { label: 'Brazil USD 2035 bond — 6.625% coupon; YTM ~6.19%; reopening at 6.73%, +237.5bp', publisher: 'BondbloX / TradingView / Tesouro Nacional', period: '2025 – 2026 (undated YTM)', tier: 'C' },
    { label: 'Tesouro IPCA+ 2035 real yield 7.29%', publisher: 'Investidor10 / Tesouro Direto', period: 'Undated', tier: 'D' },
    { label: 'Vinci Compass Q2 2026 — FRE R$88.7m (+36%), R$1.35 per share, 32.5% margin; adjusted DE R$0.96; dividend $0.17; BACS and Navi transactions; price $9.55, market cap $627m', publisher: 'Vinci Compass 6-K / PR Newswire / aggregators', period: 'Aug – Sep 2026', tier: 'A' },
    { label: 'Peer results and prices — as listed in the Blue Owl chapter', publisher: 'Company releases; market data aggregators', period: 'Jul – Sep 2026', tier: 'C' },
    { label: 'US Treasury 10-year 5.01%, 2-year 4.74%; Fed funds 3.75–4.00%; ICE BofA BBB 5.86%, B 7.27%', publisher: 'Trading Economics / FRED / CNBC', period: 'September 2026', tier: 'C' },
  ],
}
