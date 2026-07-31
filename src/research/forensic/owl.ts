import type { ForensicMemo } from './types'

/**
 * Blue Owl Capital (NYSE: OWL) — forensic memorandum.
 * Cut as of 31 July 2026, one day after the Q2 2026 release (30 July 2026).
 *
 * Tier discipline (docs/FORENSIC-ASSET-MANAGER-PROMPT.md §1):
 *   A = quoted from a company release/filing/call · B = our arithmetic on tier-A inputs
 *   C = secondary source citing the company    · D = our estimate
 */
export const OWL_MEMO: ForensicMemo = {
  symbol: 'OWL',
  name: 'Blue Owl Capital Inc.',
  exchange: 'NYSE',
  asOf: '2026-07-31',
  latestPeriod: 'Q2 2026 (reported 30 July 2026)',
  headline:
    'A high-quality, high-margin fee machine priced for permanent impairment — where the impairment is real but partial, and the dividend is the thing that has to give.',
  rating: 'Moderately undervalued',
  horizon: '3–5 years',
  positionSizing: '2–3% of a diversified equity book. Not larger: the semi-liquid credit book is still mid-cycle and the payout has to be rebased.',
  ratingChangesAt: {
    upgrade: 'Below $7.50 — at that price the market pays nothing for the $31.1bn of committed capital not yet paying fees.',
    downgrade: 'Above $13.50 without a rebased dividend and two quarters of falling BDC repurchase requests.',
  },

  price: 9.35,
  priceAsOf: '30 July 2026 close',
  dilutedShares: 1569,
  marketCap: 14.67,
  netDebt: 3.9,
  dividendPs: 0.92,
  dividendYieldPct: 9.84,

  headlineStats: [
    { label: 'Price / LTM FRE per share', value: '9.3×', sub: '$9.35 ÷ $1.01', tier: 'B', tone: 'neutral' },
    { label: 'Price / LTM DE per share', value: '10.8×', sub: '$9.35 ÷ $0.87', tier: 'B', tone: 'neutral' },
    { label: 'Dividend yield', value: '9.8%', sub: '$0.92 declared for 2026', tier: 'A', tone: 'warn' },
    { label: 'Dividend as % of LTM DE', value: '106%', sub: 'Uncovered for a second year', tier: 'B', tone: 'loss' },
    { label: 'Permanent capital', value: '85%', sub: 'of management fees, LTM to 31 Mar 2026 — was 93% in 2022', tier: 'A', tone: 'warn' },
    { label: 'FRE margin', value: '58.5%', sub: 'Q2 2026, in line with full-year guidance', tier: 'A', tone: 'gain' },
    { label: 'AUM not yet paying fees', value: '$31.1bn', sub: '≈ $380m of future annual management fees', tier: 'A', tone: 'gain' },
    { label: 'Drawdown from peak', value: '−63%', sub: '$25.02 (Jan 2025) → $9.35', tier: 'B', tone: 'loss' },
  ],

  debate: {
    marketBelieves:
      'That Blue Owl is a leveraged bet on a private-credit cycle that has turned. At 9.3× fee-related earnings against 16–23× for Ares and TPG, the market is not pricing slower growth — it is pricing structural impairment: that the semi-liquid wealth vehicles which drove the last three years of fundraising are now a shrinking, gated liability, that "permanent capital" was a marketing term, and that a 9.8% dividend yield is a signal of a cut rather than a return.',
    mustGoRight:
      'Redemption requests must keep falling from the Q1 2026 peak, the $31.1bn of committed-but-unpaid capital must convert into the ~$380m of annual fees management says it will, and fee-related earnings must hold a 58%+ margin while it happens. On those three, the current price is comfortably beaten.',
    underestimated:
      'The fee base is far more inert than the flow narrative implies. Fee-paying AUM rose to $190.6bn even in a quarter when the wealth channel effectively closed, because 85% of management fees sit in permanent-capital vehicles and $31.1bn of already-committed capital pays fees on deployment, not on sentiment. FRE still grew 9% and management fees 8% through the worst two quarters the asset class has had.',
    deRating:
      'The quality of the fee base is genuinely degrading, and the company does not lead with it. Permanent capital fell from 93% of management fees in 2022 to 85% in the LTM to March 2026, the blended fee rate compressed roughly 18bp as acquired insurance, CMBS and asset-based capital came in at lower rates, and FRE growth halved from 14% in Q1 to 9% in Q2. If growth settles at 6–8% with a 100%+ payout, 9× is not a discount — it is the right number.',
    swingFactors: [
      'Conversion of the $31.1bn non-fee-paying pool into paying AUM — worth roughly $0.24 of FRE per share, ~24% of the current run-rate.',
      'Whether the dividend is rebased to a covered level or defended with balance sheet. The second choice destroys the SOTP.',
      'The trajectory of OCIC/OTIC repurchase requests — the direct read on whether permanent capital is permanent.',
    ],
    bearsBestFact:
      'Blue Owl Technology Income Corp received repurchase requests for 38.1% of its shares outstanding in Q2 2026 and could fulfil 5%. That is not a liquidity wobble; it is a vehicle whose investor base is trying to leave, and it is the same vehicle type that produced the growth the equity was priced on.',
  },

  quarterNarrative:
    'The quarter beat on revenue by roughly 10% and met on distributable earnings — but the composition matters more than the beat. Fee-related earnings grew 9% year over year against 14% in Q1, and distributable earnings per share of $0.22 was one cent above the prior year, so essentially all of the aggregate 9% DE growth was consumed by the fee base being spread over a slightly larger share count and by higher below-the-line cost. Real Assets did the work: AUM there rose 25% year on year while total capital raised fell to $7.8bn from $11bn in Q1. Management framed the quarter around the easing of redemptions and around guidance to beat full-year consensus; both are defensible, and neither addresses that the private-wealth channel — the engine of 2023–2025 — contributed materially less this quarter.',

  quarter: [
    { metric: 'Total AUM', latest: '$319.0bn', yoy: '+12%', qoq: '+1.3%', driver: 'Mixed', verdict: 'In line', tier: 'A', note: 'Q1 2026 AUM was $314.9bn; growth is now deployment- and appreciation-led rather than flow-led.' },
    { metric: 'Fee-paying AUM', latest: '$190.6bn', yoy: 'n/d', qoq: 'n/d', driver: 'Recurring', verdict: 'Improved', tier: 'A', note: 'FPAUM rose despite the wealth-channel slowdown — the mechanical benefit of deploying already-committed capital.' },
    { metric: 'Management fees', latest: '$672.6m', yoy: '+8% (ex-offsets)', qoq: 'n/d', driver: 'Recurring', verdict: 'In line', tier: 'B', note: 'Sum of the three platforms: Credit $391.31m + GP Strategic Capital $168.43m + Real Assets $112.87m (each tier A).' },
    { metric: 'Total GAAP revenue', latest: '$753.95m', yoy: 'n/d', qoq: 'n/d', driver: 'Mixed', verdict: 'Improved', tier: 'A', note: 'Versus consensus of $687.9m (+9.6%) and FactSet $693.1m. The beat is revenue-line, not margin-line.' },
    { metric: 'Fee-related earnings', latest: '$392.2m', yoy: '+9%', qoq: 'n/d', driver: 'Recurring', verdict: 'Deteriorated', tier: 'A', note: 'Growth halved from +14% in Q1 2026. The level is fine; the second derivative is the story.' },
    { metric: 'FRE per share', latest: '$0.25', yoy: '+9% (from $0.23)', qoq: 'flat', driver: 'Recurring', verdict: 'In line', tier: 'A', note: 'Two consecutive quarters at $0.25 — the sequential ramp stopped.' },
    { metric: 'FRE margin', latest: '58.5%', yoy: '+~30bp', qoq: '+10bp', driver: 'Recurring', verdict: 'Improved', tier: 'A', note: 'Q1 2026 was 58.4%, Q1 2025 58.3%. Margin is the most durable part of the story.' },
    { metric: 'Distributable earnings', latest: '$351.2m', yoy: '+9%', qoq: 'n/d', driver: 'Recurring', verdict: 'In line', tier: 'A', note: 'Q2 2025 was $323.0m.' },
    { metric: 'DE per share', latest: '$0.22', yoy: '+4.8% (from $0.21)', qoq: '+16%', driver: 'Recurring', verdict: 'Deteriorated', tier: 'A', note: 'Aggregate DE +9% versus per-share +4.8% — the wedge is share count and it recurs every quarter.' },
    { metric: 'GAAP net income to Class A', latest: '$11.4m', yoy: '−34% (from $17.4m)', qoq: 'n/d', driver: 'Mixed', verdict: 'Deteriorated', tier: 'A', note: 'GAAP earnings are 3% of DE. The gap is real and structural, not a rounding artefact — see the bridge.' },
    { metric: 'Capital raised', latest: '$7.8bn', yoy: 'n/d', qoq: '−29% (from $11bn)', driver: 'Mixed', verdict: 'Deteriorated', tier: 'A', note: 'LTM total $50.5bn. PitchBook: the individual-investor channel "dried up" in the quarter.' },
    { metric: 'AUM not yet paying fees', latest: '$31.1bn', yoy: 'n/d', qoq: '+3.7% (from $30bn)', driver: 'Recurring', verdict: 'Improved', tier: 'A', note: 'Associated future annual fees rose from ~$350m to ~$380m — the single most valuable disclosure in the release.' },
    { metric: 'Dividend declared', latest: '$0.23', yoy: '+2.2%', qoq: 'flat', driver: 'One-off', verdict: 'In line', tier: 'A', note: '$0.92 annualised for 2026 against LTM DE of $0.87. Payable 27 Aug 2026.' },
  ],

  trajectory: {
    labels: ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26'],
    frePs: [0.22, 0.23, 0.24, 0.27, 0.25, 0.25],
    dePs: [0.17, 0.21, 0.22, 0.24, 0.19, 0.22],
  },

  indexed: {
    labels: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'LTM Q2 26'],
    aum: [100, 120, 182, 222, 231],
    dePs: [100, 103, 128, 140, 145],
  },

  history: [
    { period: 'Listing (31 Mar 2021)', aum: 52.5, fpaum: null, frePs: null, dePs: null, freMarginPct: null, dividendPs: null, shares: null, tier: 'A', note: 'Owl Rock + Dyal combine via Altimar; trading began 20 May 2021. 91% of AUM described as permanent capital.' },
    { period: 'FY2022', aum: 138.2, fpaum: 88.8, frePs: 0.62, dePs: 0.60, freMarginPct: null, dividendPs: 0.56, shares: null, tier: 'B', note: 'Per-share figures summed from quarterly releases (Q4 2022: FRE $0.16, DE $0.15). 93% of management fees from permanent capital.' },
    { period: 'FY2023', aum: 165.7, fpaum: 102.7, frePs: 0.68, dePs: 0.62, freMarginPct: null, dividendPs: 0.56, shares: null, tier: 'B', note: 'Dividend held flat for a second year. 92% of management fees from permanent capital. Revenue $1.732bn (+26%).' },
    { period: 'FY2024', aum: 251.1, fpaum: 159.8, frePs: 0.86, dePs: 0.77, freMarginPct: null, dividendPs: 0.72, shares: null, tier: 'C', note: 'The acquisition year: Prima, Kuvare, Atalaya, IPI. Revenue $2.295bn (+33%). GAAP EPS $0.20.' },
    { period: 'FY2025', aum: 307.4, fpaum: 187.7, frePs: 0.96, dePs: 0.84, freMarginPct: 58.3, dividendPs: 0.90, shares: 1550, tier: 'A', note: '$56bn raised. Permanent capital down to 85% of management fees. Dividend exceeds DE for the first time.' },
    { period: 'Q2 2026 (LTM)', aum: 319.0, fpaum: 190.6, frePs: 1.01, dePs: 0.87, freMarginPct: 58.5, dividendPs: 0.92, shares: 1569, tier: 'B', note: 'LTM per-share figures summed from the four reported quarters; share count derived as $392.2m ÷ $0.25 (range 1,538–1,601m on cent-rounding).' },
  ],

  bridge: {
    period: 'FY2023 → LTM Q2 2026',
    terms: [
      { label: 'Starting DE per share (FY2023)', value: '$0.62', effect: 'neutral', detail: 'Tier B: summed from the four 2023 quarterly releases ($0.15 / $0.16 / $0.16 / $0.17 net of rounding).' },
      { label: 'Fee-paying AUM growth, +86%', value: '+$0.53', effect: 'positive', detail: 'FPAUM $102.7bn → $190.6bn (tier A). Applied at constant fee rate, margin, conversion and share count.' },
      { label: 'Blended fee-rate and mix compression, ≈ −11%', value: '−$0.13', effect: 'negative', detail: 'Tier D. Implied blended rate ~1.60% (FY23) → ~1.42% (LTM), i.e. ≈18bp. Acquired insurance (Kuvare), CMBS (Prima) and asset-based (Atalaya) capital carries materially lower fee rates than direct lending.' },
      { label: 'FRE margin, 57.5% → 58.5%', value: '+$0.02', effect: 'positive', detail: 'Tier A/B. The one term working unambiguously for shareholders — genuine operating leverage.' },
      { label: 'DE / FRE conversion, 91% → 86%', value: '−$0.06', effect: 'negative', detail: 'Tier B: $0.62/$0.68 → $0.87/$1.01. Interest expense on ~$3.9bn of debt and a higher cash-tax burden. This is recurring, not one-off.' },
      { label: 'Share issuance, ≈ +7%', value: '−$0.06', effect: 'negative', detail: 'Tier D. Acquisition equity (Kuvare part-stock) plus equity compensation, partially offset by ~$79m of 2025-authorisation buybacks — a rounding error against the issuance.' },
      { label: 'Residual — fee holidays, admin-fee mix, timing', value: '−$0.05', effect: 'negative', detail: 'Tier D. The unallocated remainder; we show it rather than forcing the bridge to close.' },
      { label: 'LTM DE per share', value: '$0.87', effect: 'neutral', detail: 'Tier B: $0.22 + $0.24 + $0.19 + $0.22.' },
    ],
    conclusion:
      'Fee-paying AUM grew 86%; distributable earnings per share grew 40%. The public shareholder captured roughly 47 cents of every dollar of fee-paying AUM growth. Half the leakage is blended fee-rate compression from acquired, lower-rate capital — the price of buying growth — and the rest is below-the-FRE-line cost and share issuance. This is not a company that is failing to grow; it is a company whose growth arrives at the per-share line at less than half strength.',
  },

  scorecard: [
    { commitment: 'Scale the platform', target: 'Grow from $52.5bn AUM at listing', actual: '$319.0bn (Q2 2026), 6.1×', status: 'Exceeded', note: 'Unambiguous. But 2024 alone added $85bn, of which Kuvare (~$20bn), Prima (~$10bn), Atalaya (~$10bn) and IPI were purchased.', tier: 'A' },
    { commitment: 'Permanent / long-dated capital mix', target: '91% of AUM at listing; 93% of fees in 2022', actual: '85% of management fees, LTM to Mar 2026', status: 'Behind plan', note: 'An eight-point deterioration in the single characteristic the equity was sold on. Disclosed, but never framed as a decline.', tier: 'A' },
    { commitment: 'FRE growth', target: 'Compounding management-fee-led growth', actual: '+9% YoY in Q2 2026, from +14% in Q1', status: 'On track', note: 'Still growing through the worst private-credit tape since 2008 — genuinely creditable. The deceleration is the caveat, not the level.', tier: 'A' },
    { commitment: 'Margin expansion', target: 'Operating leverage on a scaling platform', actual: '58.5% FRE margin, up from 58.3% in Q1 2025', status: 'On track', note: 'Delivered, but the incremental gain is now ~10–30bp a year. Assume no further help from here.', tier: 'A' },
    { commitment: 'Capital-light, fee-centric model', target: 'Minimal balance-sheet risk', actual: '~$3.9bn debt; $250m Kuvare preferred; insurance-linked exposure added', status: 'Behind plan', note: 'The model has become less capital-light with every acquisition. Interest cost is now visible in the DE/FRE conversion ratio.', tier: 'C' },
    { commitment: 'Growing dividend', target: 'Fixed annual dividend rising with expected DE', actual: '$0.56 → $0.56 → $0.72 → $0.90 → $0.92', status: 'Behind plan', note: 'Grown, but past coverage. 2025 payout was 107% of DE; 2026 guidance implies ~103%. The policy states the dividend is set on expected DE — expectations have been running ahead of delivery.', tier: 'B' },
    { commitment: 'Per-share value creation', target: 'Growth reaching the public share', actual: 'AUM index 231 vs. DE/share index 145 (FY2022 = 100)', status: 'Behind plan', note: 'The central finding of this memo. Aggregate growth is real; per-share capture is roughly half of it.', tier: 'B' },
    { commitment: 'Manage dilution', target: 'Buybacks offsetting issuance', actual: '1.71m shares for $24.97m in Q1 2026; $78.58m completed under the 2025 authorisation', status: 'Behind plan', note: '$79m of buybacks against a ~1.57bn share count is ~0.5% — immaterial next to acquisition equity and SBC.', tier: 'C' },
  ],

  narrative: [
    {
      claim: '"We believe inflows have troughed, and redemptions in our non-traded BDCs are down." — CFO, Q2 2026 call',
      support: 'OCIC repurchase requests fell to 18.8% of shares ($3.6bn) from 21.9% ($4.2bn); OTIC to 38.1% ($1.1bn) from 40.4% ($1.2bn). For a second consecutive quarter, 90% of OCIC investors requested no redemption.',
      contradiction: 'A fall from 21.9% to 18.8% is a fall from catastrophic to severe. Both funds remain capped at 5% per quarter; OCIC is filling roughly 27% of each request pro rata, which means an unsatisfied queue is being carried forward and will re-present. Total capital raised fell 29% sequentially to $7.8bn.',
      verdict: 'Directionally true, materially incomplete. The second derivative improved; the level has not normalised, and the unfilled queue is a committed future outflow that has not been quantified for investors.',
      challenged: true,
    },
    {
      claim: 'Management expects to beat full-year 2026 consensus for both FRE ($1.02) and DE ($0.89).',
      support: 'H1 2026 FRE per share of $0.50 annualises to $1.00 before the second-half ramp management describes; $31.1bn of committed capital converts to fees on deployment, giving genuine visibility independent of new fundraising.',
      contradiction: 'Beating $0.89 of DE still leaves the $0.92 dividend uncovered. The "visibility" is real but it is visibility into a number that does not fund the distribution.',
      verdict: 'Credible on FRE. But framing a beat against a consensus that itself implies a >100% payout ratio is answering a question investors are not asking.',
      challenged: true,
    },
    {
      claim: 'Blue Owl is a permanent-capital business — 85% of management fees come from permanent capital.',
      support: 'Disclosed and accurate; the GP Strategic Capital platform in particular is genuinely locked, and fee-paying AUM rose in a quarter when net flows were weak.',
      contradiction: 'The same metric was 93% in 2022 and 92% in 2023. And "permanent" in the non-traded BDCs means perpetual-life, not non-redeemable — the 5% quarterly repurchase caps are precisely what is holding the definition together under a 19–38% request rate.',
      verdict: 'The label is being asked to carry more weight than it can. Permanent capital should be read as two businesses: GP Strategic Capital (genuinely permanent, deserves a premium multiple) and the perpetual wealth vehicles (redeemable subject to a gate, deserve a credit-fund multiple).',
      challenged: true,
    },
    {
      claim: 'Real Assets is the growth engine — AUM up 25% year over year.',
      support: 'Confirmed in the Q2 release; digital infrastructure and net lease are long-duration, contractually escalating, and less correlated to the credit cycle that is hurting the rest of the platform.',
      contradiction: 'Real Assets generated $112.87m of the $672.6m management-fee base — 17%. A 25% growth rate on 17% of fees adds ~4 points of platform growth. Credit, at 58% of fees, sets the trajectory.',
      verdict: 'Accurate and genuinely positive, but mix-weighted it cannot offset Credit. Useful as evidence the franchise is diversifying; not yet evidence it has diversified.',
      challenged: true,
    },
    {
      claim: 'AI-related credit risk is contained — roughly 3.5% of private-credit AUM.',
      support: 'The concentration figure is low, and Blue Owl\'s data-centre exposure is predominantly equity/real-asset with contracted hyperscale tenants rather than speculative lending.',
      contradiction: 'The exposure that matters is not labelled "AI". Technology-lending concentration is what drove OTIC\'s 38% redemption rate, and OBDC\'s PIK income at 9.5% of investment income (down from 13.5%) shows borrowers conserving cash across the book.',
      verdict: 'The stated number is fine. It answers a narrower question than the market is asking, which is about software and technology credit generally, not AI specifically.',
      challenged: true,
    },
    {
      claim: 'Credit quality remains strong — no new non-accruals at OCIC, sub-10bp annual net loss rate since inception.',
      support: 'OCIC non-accruals 0.2% of fair value at 31 Mar 2026; OCIC Class I NAV per share of $9.11 unchanged from year-end. OBDC non-accruals improved to 2.0%/1.0% at cost/fair value from 2.3%/1.1%.',
      contradiction: 'OBDC\'s NAV per share fell to $14.41 from $14.81 in the same quarter, attributed to spread widening, and OBDC cut its dividend amid an origination slump. Marks in a non-traded vehicle that holds NAV flat while its listed sibling marks down deserve scrutiny.',
      verdict: 'Credit losses are genuinely low. But the divergence between a flat non-traded NAV and a −2.7% listed NAV on overlapping strategies is the single disclosure item we would most want explained.',
      challenged: true,
    },
  ],

  segments: [
    { name: 'Credit', aum: 'n/d separately', mgmtFee: '$391.3m (Q2 26)', share: 58.2, feeRate: '~1.3–1.5%', duration: 'Perpetual, redeemable subject to 5%/qtr caps', organic: 'Organic core; Atalaya and Wellfleet acquired', multipleView: 'Discount', comment: 'The largest fee pool and the one bearing the redemption cycle. High fee rate, high margin — but the liability side is now the binding constraint. Value at a credit-manager multiple, not a permanent-capital multiple.', tier: 'A' },
    { name: 'GP Strategic Capital', aum: 'n/d separately', mgmtFee: '$168.4m (Q2 26)', share: 25.0, feeRate: '~1.0–1.3%', duration: 'Genuinely permanent / very long-dated', organic: 'Organic (legacy Dyal franchise)', multipleView: 'Premium', comment: 'The crown jewel and the least discussed. Minority stakes in alternative managers, no redemption mechanism, structurally scarce, and a direct participation in the growth of the whole asset class. On its own this deserves 15–17× FRE.', tier: 'A' },
    { name: 'Real Assets', aum: '+25% YoY', mgmtFee: '$112.9m (Q2 26)', share: 16.8, feeRate: '~0.9–1.2%', duration: 'Long-dated, contractual', organic: 'Heavily acquired — Oak Street, Prima, IPI', multipleView: 'Premium', comment: 'Net lease plus digital infrastructure. Longest duration, lowest credit-cycle beta, fastest growth — but the smallest fee pool and the lowest fee rate, and most of it was purchased rather than built.', tier: 'A' },
  ],

  aumScorecard: [
    { dimension: 'Fee rate', score: 8, basis: 'Blended ~1.42% is at the high end for the peer group; direct lending and GP stakes both carry premium rates.' },
    { dimension: 'Duration', score: 7, basis: 'GP Strategic Capital and Real Assets are genuinely long. The Credit wealth vehicles are perpetual-life but redeemable.' },
    { dimension: 'Redeemability (liability side)', score: 3, basis: 'OCIC 18.8% and OTIC 38.1% of shares requested repurchase in a single quarter, both capped at 5%. The gate is doing the work the structure was supposed to do.' },
    { dimension: 'Deployment optionality', score: 9, basis: '$31.1bn committed and not yet paying fees, worth ~$380m of annual fees — roughly 24% of run-rate FRE, contracted and independent of new fundraising.' },
    { dimension: 'Organic vs. acquired origin', score: 5, basis: 'Roughly a third of the AUM added since 2023 arrived through Kuvare, Prima, Atalaya and IPI, at lower blended fee rates.' },
    { dimension: 'Channel concentration', score: 4, basis: 'Private wealth drove 2023–2025 growth and effectively closed in Q2 2026. Institutional was 67% of Q1 raise — a healthier mix arrived by attrition, not design.' },
    { dimension: 'Margin quality', score: 9, basis: '58.5% FRE margin, expanding, and stable through a demand shock.' },
    { dimension: 'Fee-rate trend', score: 4, basis: 'Roughly 18bp of blended compression since FY2023 as lower-rate acquired capital diluted the mix.' },
  ],
  aumScorecardNote:
    'Scored on economic characteristics, not scale. The distribution is bimodal, and that is the entire investment case: Blue Owl owns one of the best fee streams in the industry (GP Strategic Capital, Real Assets, deployment pipeline) bolted to one of the most exposed liability structures (perpetual wealth credit vehicles under a redemption cycle). A single blended multiple mis-prices both halves.',

  redemptions: [
    { vehicle: 'Blue Owl Credit Income Corp (OCIC)', size: '~$36bn', requested: '18.8% of shares / $3.6bn (Q2 26)', cap: '5% per quarter', fulfilled: '~27% of each request, pro rata', trend: 'Down from 21.9% / $4.2bn in Q1 2026 (−14% QoQ)' },
    { vehicle: 'Blue Owl Technology Income Corp (OTIC)', size: '~$6.2bn', requested: '38.1% of shares / $1.1bn (Q2 26)', cap: '5% per quarter', fulfilled: 'Capped at 5%', trend: 'Down from 40.4% / $1.2bn in Q1 2026' },
  ],
  redemptionNote:
    'Two consecutive quarters of ~$4.7bn in combined requests against 5% caps. The improvement is real but the arithmetic is unforgiving: at a 5% quarterly cap, satisfying a 19% request rate takes roughly a year of full-cap redemptions, during which fee-paying AUM in those vehicles falls unless gross sales replace it. Management\'s most useful disclosure — that 90% of OCIC holders requested nothing, for a second quarter — says the pressure is concentrated rather than universal. That is genuinely reassuring about contagion and says nothing about the size of the queue already formed.',

  dividendCoverage: [
    { year: 'FY2022', dePs: 0.60, dividendPs: 0.56, payoutPct: 93, note: 'Fixed-dividend policy adopted for 2023 onwards.' },
    { year: 'FY2023', dePs: 0.62, dividendPs: 0.56, payoutPct: 90, note: 'Dividend held flat for a second year — the last year of genuine cushion.' },
    { year: 'FY2024', dePs: 0.77, dividendPs: 0.72, payoutPct: 94, note: 'Dividend +29% against DE +24%.' },
    { year: 'FY2025', dePs: 0.84, dividendPs: 0.90, payoutPct: 107, note: 'First year of uncovered distribution. Dividend +25% against DE +9%.' },
    { year: 'FY2026E', dePs: 0.89, dividendPs: 0.92, payoutPct: 103, note: 'Uses consensus DE of $0.89; management guides to beat it. Even a beat to $0.92 leaves zero retained distributable earnings.' },
    { year: 'LTM Q2 2026', dePs: 0.87, dividendPs: 0.92, payoutPct: 106, note: 'The number that matters today.' },
  ],
  dividendNote:
    'This is the most important table in the memo and it is not in any company presentation. Blue Owl\'s stated policy is to set a fixed annual dividend from *expected* distributable earnings — and expectations have run ahead of delivery for two consecutive years. A 9.8% headline yield on a payout that has exceeded DE since 2025 is not a return; it is a partial return of the retained-earnings cushion. Funding the gap with the ~$3.9bn debt stack raises interest expense, which lowers the DE/FRE conversion ratio, which widens the gap next year. Our base case assumes the dividend is rebased to roughly $0.72–0.78 (a 15–20% cut) at some point in the next four quarters. That is a positive for intrinsic value and will be reported as a negative.',

  earningsBridge: [
    { label: 'FRE', value: 392.2 },
    { label: 'Perf. income', value: 15 },
    { label: 'Net interest', value: -35 },
    { label: 'Tax & other', value: -21 },
    { label: 'DE', value: 351.2, isTotal: true },
  ],
  earningsBridgeNote:
    'FRE $392.2m and DE $351.2m are tier A; the three intermediate lines are tier D — sized to reconcile the two disclosed anchors, since the line-item detail was not retrievable from our accessible sources. The far larger gap sits below DE: GAAP net income attributable to Class A shareholders was $11.4m, roughly 3% of distributable earnings. That gap is approximately $180m of earnings attributable to non-Class-A unit holders (the legacy Operating Group partnership) plus roughly $160m of equity-based compensation and intangible amortisation added back (both tier D). Two judgements follow. First, the non-controlling-interest portion is genuinely not available to Class A holders — which is exactly why this memo values the company on ~1.57bn fully diluted economic shares rather than the ~676m Class A shares. Second, equity-based compensation is a real, recurring, cash-substituting cost that DE excludes; at an estimated ~$95m per quarter it is roughly 24% of FRE, and treating it as non-economic is the single most generous adjustment in the DE definition.',

  ownership: [
    { k: 'Class A shares', v: '675.8m', tier: 'C', period: '6 Apr 2026', note: 'The public float; the only class with a market price.' },
    { k: 'Class C shares', v: '578.9m', tier: 'C', period: '6 Apr 2026', note: 'Non-economic voting shares paired with Operating Group units held by legacy owners.' },
    { k: 'Class D shares', v: '304.3m', tier: 'C', period: '6 Apr 2026', note: 'Ten-vote non-economic shares — the mechanism of principal control.' },
    { k: 'Fully diluted economic shares', v: '≈1,569m', tier: 'B', note: 'Derived: FRE $392.2m ÷ $0.25 per adjusted share. Cent-rounding gives a range of 1,538–1,601m.' },
    { k: 'Class A as % of economics', v: '≈43%', tier: 'B', note: '675.8m ÷ 1,569m. Public shareholders own well under half the economics and a small minority of the votes.' },
    { k: 'Market capitalisation', v: '$14.67bn', tier: 'B', note: '$9.35 × 1,569m — on full economic shares, not Class A alone. Sources quoting $14.4–15.4bn differ mainly on the price date.' },
    { k: 'Buybacks', v: '$78.6m under the 2025 authorisation', tier: 'C', note: '1.71m shares for $24.97m in Q1 2026 — about 0.1% of shares outstanding.' },
    { k: 'Implied annual dilution', v: '~2–3%', tier: 'D', note: 'Cannot be pinned precisely: per-share metrics are disclosed to the cent, which admits anything from −3% to +5% on a single-quarter comparison. The multi-year direction is unambiguous.' },
    { k: 'Estimated SBC', v: '~$95m/quarter, ~24% of FRE', tier: 'D', note: 'Excluded from both FRE and DE.' },
  ],
  ownershipNote:
    'The structure does what SPAC-merged alternative managers\' structures usually do: the public Class A holder buys roughly 43% of the economics and effectively none of the control, and the per-share metrics the company reports are already spread across the full economic base — which is correct, and which is why aggregate growth headlines overstate what reaches the listed share. The tax receivable agreement is a further prior claim on cash as units exchange. We deduct an estimated $0.8bn for it in the sum-of-the-parts; we could not retrieve the disclosed balance and flag that as the largest single unverified item in our valuation.',

  peers: [
    { ticker: 'OWL', name: 'Blue Owl Capital', marketCap: 14.67, fre: 1573, freGrowthPct: 9, freMarginPct: 58.5, pFre: 9.3, divYieldPct: 9.8, permCapital: '85% of fees', tier: 'B', note: 'Highest margin and highest yield in the group; slowest FRE growth and the only one with gated flagship vehicles.' },
    { ticker: 'ARES', name: 'Ares Management', marketCap: 42.14, fre: 1856, freGrowthPct: 26, freMarginPct: null, pFre: 22.7, divYieldPct: null, permCapital: 'High', tier: 'C', note: 'Q1 2026 FRE $464m (+26%); AUM $644bn; quarterly dividend $1.35 (+20% YoY). 66% credit in fee-earning assets — same exposure, 2.4× the multiple.' },
    { ticker: 'TPG', name: 'TPG Inc.', marketCap: 15.92, fre: 988, freGrowthPct: 36, freMarginPct: 44, pFre: 16.1, divYieldPct: 5.4, permCapital: 'Lower', tier: 'C', note: 'Q1 2026 FRE $246.9m (+36%), 44% margin, AUM $306bn (+22%). Faster growth, materially worse margin.' },
    { ticker: 'HLNE', name: 'Hamilton Lane', marketCap: null, fre: 345, freGrowthPct: 25, freMarginPct: 50, pFre: null, divYieldPct: 2.7, permCapital: 'Low', tier: 'C', note: 'FY2026 FRE $345m (+25%) on $687m fee revenue; AUM $142bn. Fee-only, no balance sheet — the cleanest comparison for fee-stream quality.' },
    { ticker: 'STEP', name: 'StepStone Group', marketCap: 5.47, fre: null, freGrowthPct: null, freMarginPct: null, pFre: null, divYieldPct: 2.6, permCapital: 'Low', tier: 'C', note: 'Included for business-model relevance; FRE not retrievable from our accessible sources.' },
    { ticker: 'PAX', name: 'Patria Investments', marketCap: 1.8, fre: 235, freGrowthPct: 24, freMarginPct: 54.0, pFre: 7.7, divYieldPct: 5.7, permCapital: '22% of FEAUM', tier: 'B', note: 'The only manager in the group trading below Blue Owl. See the companion memo.' },
  ],
  peerNote:
    'Blue Owl trades at 9.3× fee-related earnings against 22.7× for Ares and 16.1× for TPG — while earning a higher FRE margin than either (58.5% vs. TPG\'s 44%) and holding a higher permanent-capital share. The discount is not explained by quality; it is explained by three things the peer table does not show. First, growth: 9% FRE growth against Ares\' 26% and TPG\'s 36%, and decelerating. Second, the liability side: neither Ares nor TPG has flagship vehicles fulfilling 27% of redemption requests. Third, the payout: Blue Owl is the only name in the group distributing more than it earns. A fair warranted position is a discount to Ares of 40–45% — roughly 12–13× FRE — rather than the 59% discount on offer. The gap between 9.3× and 12.5× is the investment.',

  valuation: [
    { name: 'A — Normalised FRE multiple', approach: 'Normalised FRE per share $1.02 (LTM $1.01, consensus $1.02, management guiding to beat) × 11–14×, anchored on a 40–45% discount to Ares.', low: 11.2, base: 12.2, high: 14.3, note: 'The method that most favours Blue Owl, because FRE is the part of the business that is working. Weight 35%.' },
    { name: 'B — Distributable earnings / yield', approach: 'Normalised DE per share $0.89 × 11–13×; cross-checked against a required DE yield of 8–9%.', low: 9.8, base: 10.7, high: 11.6, note: 'Captures the interest and tax burden the FRE multiple ignores. At a 9% required DE yield the value is $9.89 — close to today\'s price, which tells you the market is valuing Blue Owl as a yield instrument. Weight 35%.' },
    { name: 'C — Sum of the parts', approach: 'Each platform at its own warranted multiple, less debt, TRA and other claims. Detailed below.', low: 8.4, base: 9.95, high: 12.1, note: 'The most conservative method and the most honest one: it refuses to pay a permanent-capital multiple for the redeemable Credit book. Weight 30%.' },
    { name: 'D — Price / fee-paying AUM (cross-check only)', approach: 'Market cap ÷ FPAUM = 7.7% ($14.67bn ÷ $190.6bn), against a blended fee rate of ~1.42%.', low: 0, base: 0, high: 0, note: 'Not used in the weighted value. Ares trades near 10–11% of fee-earning AUM on a lower fee rate; adjusted for fee rate Blue Owl is the cheaper capital base. Directionally supportive, too crude to size a position on.' },
  ],

  sotp: [
    { component: 'Credit — recurring fee stream', basis: 'Management fees $1,565m annualised × ~60% FRE margin = $939m', multiple: '10× FRE', value: 9390 },
    { component: 'GP Strategic Capital — recurring fee stream', basis: 'Management fees $674m annualised × ~65% FRE margin = $438m', multiple: '16× FRE', value: 7010 },
    { component: 'Real Assets — recurring fee stream', basis: 'Management fees $452m annualised × ~55% FRE margin = $248m', multiple: '13× FRE', value: 3230 },
    { component: 'Unallocated corporate cost', basis: 'Reconciles segment FRE to the ~$1,573m LTM total', multiple: '12×', value: -620 },
    { component: 'Expected performance revenues', basis: 'Modest for a fee-centric manager; capitalised well below the FRE multiple', multiple: '5×', value: 400 },
    { component: 'Balance-sheet investments', basis: 'Includes the $250m Kuvare preferred and seed/GP commitments', multiple: 'At carrying value', value: 900 },
    { component: 'Corporate debt', basis: '~$3.9bn outstanding, average cost ~3.8%', multiple: '—', value: -3900 },
    { component: 'Tax receivable agreement', basis: 'Estimated; the disclosed balance was not retrievable — largest unverified item here', multiple: '—', value: -800 },
  ],

  implied: [
    { variable: 'Normalised DE per share', impliedByPrice: '$0.78 at a 12× multiple', ourView: '$0.87 LTM, $0.89 consensus', assessment: 'Aggressive' },
    { variable: 'Perpetual DE growth', impliedByPrice: '~1.7% forever (9.3% DE yield at an 11% required return)', ourView: '6–8% achievable on deployment of committed capital alone', assessment: 'Aggressive' },
    { variable: 'Value of the $31.1bn not-yet-paying pool', impliedByPrice: 'Approximately zero', ourView: '≈$380m of annual fees, ~$0.24 of FRE per share, contracted', assessment: 'Aggressive' },
    { variable: 'FRE multiple', impliedByPrice: '9.3×, a 59% discount to Ares', ourView: '12–13× warranted (40–45% discount)', assessment: 'Aggressive' },
    { variable: 'Dividend sustainability', impliedByPrice: 'A cut is priced — 9.8% yield versus a ~4% peer norm', ourView: 'A cut is likely and correct; we model a rebase to $0.72–0.78', assessment: 'Reasonable' },
    { variable: 'FRE margin', impliedByPrice: 'Stable near 58%', ourView: 'Stable to +30bp; no further expansion assumed', assessment: 'Reasonable' },
    { variable: 'Fee-paying AUM trajectory', impliedByPrice: 'Flat to modestly declining', ourView: 'Grows on deployment even with zero net new wealth flows', assessment: 'Aggressive' },
  ],

  scenarios: [
    {
      name: 'Bear',
      probability: 0.30,
      narrative:
        'The redemption queue does not clear. OCIC and OTIC run at the 5% cap for four to six more quarters, credit fee-paying AUM falls 12–15%, and the wealth channel does not reopen before 2028. Blue Owl defends the dividend with leverage for a year, then cuts to $0.50. Blended fee rates compress a further 10bp as the mix shifts to insurance and asset-based. FRE per share falls to ~$0.90 and the market applies a credit-manager multiple to the whole platform.',
      assumptions: [
        { k: 'Gross fundraising', v: '$28–32bn p.a. (from $50.5bn LTM)' },
        { k: 'Net organic flows', v: 'Negative in Credit, positive in Real Assets' },
        { k: 'Fee-paying AUM', v: '−5% CAGR over 3 years, then flat' },
        { k: 'FRE margin', v: '55% (−350bp on lost operating leverage)' },
        { k: 'FRE per share (2031)', v: '$0.90' },
        { k: 'DE per share (2031)', v: '$0.70' },
        { k: 'Dividend', v: 'Cut to $0.50' },
        { k: 'Exit multiple', v: '8× DE' },
      ],
      targetPrice: 6.50,
      threeYrIrrPct: -8,
      fiveYrIrrPct: -2.6,
    },
    {
      name: 'Base',
      probability: 0.50,
      narrative:
        'Redemptions keep decaying at the ~14% quarterly rate seen in Q2 and normalise through 2027. The $31.1bn deploys on schedule, adding ~$380m of annual fees. FRE grows 7–9% a year with the margin held near 58.5%. The dividend is rebased to ~$0.75 in 2027 — reported as bad news, correct for intrinsic value — restoring roughly $0.15 per share a year of retained distributable earnings and ending the leverage drift. The multiple recovers from 9.3× to 12× FRE as the gate story leaves the tape.',
      assumptions: [
        { k: 'Gross fundraising', v: '$45–55bn p.a.' },
        { k: 'Net organic flows', v: 'Positive from 2027' },
        { k: 'Fee-paying AUM', v: '+7% CAGR' },
        { k: 'FRE margin', v: '58.5%, flat' },
        { k: 'FRE per share (2031)', v: '$1.45' },
        { k: 'DE per share (2031)', v: '$1.19' },
        { k: 'Dividend', v: 'Rebased to $0.75, then growing with DE' },
        { k: 'Exit multiple', v: '12× DE' },
      ],
      targetPrice: 11.00,
      threeYrIrrPct: 16,
      fiveYrIrrPct: 15,
    },
    {
      name: 'Bull',
      probability: 0.20,
      narrative:
        'The private-credit dislocation proves to be a 2026 sentiment event. Wealth-channel inflows resume in 2027 and Blue Owl — with the sector\'s best margin and an intact institutional franchise — takes share from weaker sponsors. The $31.1bn deploys ahead of schedule, GP Strategic Capital is separately recognised for what it is, and Real Assets compounds at 20%+ on digital infrastructure. FRE per share reaches $1.30 by 2028 and the multiple re-rates towards the peer group.',
      assumptions: [
        { k: 'Gross fundraising', v: '$60–70bn p.a. by 2028' },
        { k: 'Net organic flows', v: 'Strongly positive across all three platforms' },
        { k: 'Fee-paying AUM', v: '+12% CAGR' },
        { k: 'FRE margin', v: '60% (renewed operating leverage)' },
        { k: 'FRE per share (2031)', v: '$1.75' },
        { k: 'DE per share (2031)', v: '$1.35' },
        { k: 'Dividend', v: 'Held at $0.92, then growing' },
        { k: 'Exit multiple', v: '15× DE' },
      ],
      targetPrice: 17.00,
      threeYrIrrPct: 30,
      fiveYrIrrPct: 22.7,
    },
  ],

  sensitivity: {
    rowLabel: 'Normalised FRE per share',
    colLabel: 'FRE multiple',
    rows: ['$0.85', '$0.95', '$1.02', '$1.10', '$1.20'],
    cols: ['8×', '10×', '12×', '14×', '16×'],
    values: [
      [6.8, 8.5, 10.2, 11.9, 13.6],
      [7.6, 9.5, 11.4, 13.3, 15.2],
      [8.2, 10.2, 12.2, 14.3, 16.3],
      [8.8, 11.0, 13.2, 15.4, 17.6],
      [9.6, 12.0, 14.4, 16.8, 19.2],
    ],
  },

  redTeam: {
    case:
      'The bull case here is a multiple argument dressed as a quality argument, and it ignores what a gated fund actually is. A perpetual vehicle fulfilling 27% of redemption requests is not permanent capital experiencing a wobble — it is a fund in an orderly run, and the only reason fee-paying AUM has not collapsed is that the contract prevents investors from leaving. That queue does not disappear; it re-presents every quarter, and each fulfilled dollar permanently removes a fee. Meanwhile Blue Owl is paying out more than it earns, has been for two years, and is funding the difference from a balance sheet that already carries ~$3.9bn of debt. The FRE margin the bulls celebrate is measured on a definition that excludes roughly $95m a quarter of equity compensation — add it back and the margin is nearer 44%, in line with TPG, and the "premium quality" argument evaporates. GAAP net income attributable to Class A was $11.4m. Eleven million dollars, against a $14.7bn market capitalisation, for a company whose public holders own 43% of the economics and effectively none of the votes. The market is not mispricing Blue Owl; it is finally pricing the difference between an adjusted metric and a shareholder\'s claim. And the "cheap versus Ares" comparison is exactly backwards: Ares grows FRE at 26% and Blue Owl at 9%, decelerating. A 59% discount for a third of the growth rate is not an opportunity, it is arithmetic.',
    adjudication:
      'We accept three of these points and they are why the position is 2–3% and not larger. The equity-compensation adjustment is the strongest: adding back ~$380m a year of SBC does compress the margin towards the peer group and does mean DE overstates the shareholder\'s cash claim — we have said so in the bridge and we do not net it out of the valuation. The dividend point is accepted in full; our base case requires a cut. The growth-rate point is accepted and is precisely why we warrant 12–13× rather than Ares\' 22.7×. We reject the run characterisation. A run is indiscriminate; this is concentrated — 90% of OCIC holders requested nothing, twice in a row — and requests fell 14% sequentially. And the GAAP net income argument proves too much: $11.4m to Class A is an artefact of the Operating Group partnership structure, which is exactly why this memo values 1,569m economic shares rather than 676m Class A shares. Value the whole economic entity and the GAAP figure stops being informative. The disagreement reduces to one testable question: does the repurchase-request rate keep falling? Two more quarters of decay settles it in our favour; a reversal settles it in the red team\'s, and is our first kill criterion.',
  },

  predictions: [
    { claim: 'OCIC quarterly repurchase requests continue to decline', threshold: '≤16% of shares outstanding', by: 'Q3 2026 results (late October 2026)', ifWrong: 'The queue is re-presenting rather than clearing. Thesis is impaired; the bear case becomes the base case.' },
    { claim: 'The dividend is rebased rather than defended with leverage', threshold: 'Declared annual dividend for 2027 of $0.70–0.80, or DE per share ≥ $0.92', by: 'Q4 2026 results (February 2027)', ifWrong: 'A third year of >100% payout funded by debt confirms capital-allocation indiscipline and removes the SOTP support.' },
    { claim: 'The not-yet-paying pool converts to fees on schedule', threshold: 'FRE per share ≥ $1.08 for FY2027', by: 'FY2027 results (February 2028)', ifWrong: 'The $380m of "contracted" future fees is softer than disclosed, and the deployment optionality we are paying nothing for is worth nothing.' },
  ],

  killCriteria: [
    'OCIC or OTIC repurchase requests rise sequentially in any quarter, or either fund suspends repurchases entirely.',
    'The permanent-capital share of management fees falls below 80% (from 85%), confirming structural mix degradation rather than a one-off acquisition effect.',
    'A third consecutive year of dividend in excess of distributable earnings, funded by incremental debt rather than a rebase.',
    'FRE margin falls below 55% for two consecutive quarters — the operating leverage thesis is the load-bearing assumption of every valuation method here.',
    'Non-accruals at OCIC exceed 2% of fair value (from 0.2%), or OCIC\'s NAV falls more than 5% in a quarter.',
  ],

  risks: [
    { risk: 'Redemption queue does not clear', mechanism: 'Fulfilled repurchases permanently remove fee-paying AUM from the highest-fee-rate vehicles; a 15% reduction in Credit FPAUM removes ~$235m of annual management fees.', severity: 'High', quantified: '≈$0.09 of FRE per share, ~9% of run-rate' },
    { risk: 'Dividend defended with leverage', mechanism: 'Funding a ~$0.05/share annual gap adds ~$80m of debt a year, raising interest expense and further depressing the DE/FRE conversion ratio.', severity: 'High', quantified: 'Compounding: the gap widens each year it is not addressed' },
    { risk: 'Continued fee-rate compression', mechanism: 'Acquired insurance, CMBS and asset-based capital dilutes the blended rate; a further 10bp costs ~$190m of annual fees.', severity: 'Medium', quantified: '≈$0.07 of FRE per share' },
    { risk: 'Equity compensation understated as an economic cost', mechanism: 'FRE and DE both exclude an estimated ~$380m a year of SBC — roughly 24% of FRE.', severity: 'Medium', quantified: 'On a fully-expensed basis the FRE margin is nearer 44% than 58.5%' },
    { risk: 'Credit losses migrate from funds to the manager', mechanism: 'Reputational support for gated vehicles, GP commitments, and the $250m Kuvare preferred create paths from fund-level loss to manager-level cost.', severity: 'Medium', quantified: 'Not quantifiable from disclosure — flagged rather than modelled' },
    { risk: 'Sector multiple compression persists', mechanism: 'The entire listed alternatives complex de-rated in 2026; Blue Owl is a high-beta expression of it.', severity: 'Medium', quantified: 'Each 1× of FRE multiple is ~$1.02 per share' },
    { risk: 'Tax receivable agreement claim larger than estimated', mechanism: 'Unit exchanges trigger cash payments ahead of common holders.', severity: 'Low', quantified: 'We deduct $0.8bn (~$0.51/share); the disclosed balance was not retrievable' },
  ],

  kpis: [
    { kpi: 'OCIC / OTIC repurchase requests as % of shares', why: 'The single direct read on whether "permanent capital" survives a redemption cycle. Everything else in the thesis is downstream of it.', green: 'OCIC ≤16% and falling', red: 'Any sequential increase, or a suspension' },
    { kpi: 'AUM not yet paying fees, and the associated fee estimate', why: 'Contracted future FRE independent of sentiment. It went $30bn/$350m → $31.1bn/$380m this quarter; that is the growth the market is pricing at zero.', green: 'Rising, with fees converting on schedule', red: 'Falling without a matching rise in fee-paying AUM' },
    { kpi: 'Dividend as a percentage of trailing DE per share', why: 'Distinguishes a yield from a liquidation. Above 100% for a third year would confirm the capital-allocation concern.', green: '≤90% after a rebase', red: '>100% funded by incremental debt' },
  ],

  conclusions: [
    { q: 'What is normalised earning power today?', a: 'FRE of roughly $1.02 per share (~$1.60bn) and distributable earnings of roughly $0.87–0.89 per share (~$1.38bn) on ~1.57bn fully diluted economic shares. Both figures exclude an estimated ~$380m a year of equity compensation; on a fully expensed basis normalised DE is nearer $0.63 per share.' },
    { q: 'What percentage of earnings is recurring?', a: 'Roughly 96%. Blue Owl is the most fee-centric of the large alternative managers — realised performance revenue is an estimated ~4% of DE. This is genuinely a management-fee annuity, which is the strongest argument in its favour.' },
    { q: 'How good is the fee-paying AUM relative to peers?', a: 'Bimodal. The fee rate (~1.42%), margin (58.5%) and $31.1bn deployment pipeline are best-in-class. The redeemability of the Credit wealth vehicles is worst-in-class. Blended, it is average-quality capital at a below-average price, and the blend is what the single multiple gets wrong.' },
    { q: 'How much growth since listing reached the public share?', a: 'Roughly half. From FY2022 to the LTM period, AUM indexed to 231 while DE per share indexed to 145. On fee-paying AUM specifically: +86% versus +40% DE per share — about 47 cents of per-share earnings per dollar of fee-paying capital added.' },
    { q: 'Has capital allocation been disciplined?', a: 'No, on two counts. The 2024 acquisition programme bought AUM at materially lower blended fee rates and diluted the permanent-capital mix from 92% to 85% of fees. And the dividend has exceeded distributable earnings since 2025 while buybacks totalled $79m — about 0.5% of the share count. Growth was purchased, and the distribution was over-promised.' },
    { q: 'Does the latest quarter strengthen or weaken the thesis?', a: 'Marginally strengthens it. FRE growth halving to 9% is the genuine negative and the FRE margin held. But redemption requests fell for the first time, the not-yet-paying pool grew to $31.1bn/$380m, and fee-paying AUM rose in a quarter when the wealth channel closed — which is exactly the inertia the bull case requires.' },
    { q: 'What does the price already assume?', a: 'A 9.3% distributable-earnings yield implies roughly 1.7% perpetual growth at an 11% required return, against a business that grew FRE 9% through the sector\'s worst quarter and holds $31.1bn of committed capital not yet earning. The price also assumes the dividend is cut — correctly — and assigns approximately zero value to the deployment pipeline.' },
    { q: 'Most defensible base-case value per share?', a: '$11.00. Weighted 35% on 12× normalised FRE of $1.02 ($12.24), 35% on 12× normalised DE of $0.89 ($10.68), and 30% on a sum-of-the-parts that refuses a permanent-capital multiple for the redeemable Credit book ($9.95).' },
    { q: 'Bear and bull values?', a: 'Bear $6.50 (30% probability) — the queue does not clear, fee-paying AUM falls, the dividend goes to $0.50 and an 8× multiple applies. Bull $17.00 (20%) — the dislocation proves to be sentiment, FRE per share reaches $1.30 by 2028 and the multiple re-rates to 15×. Probability-weighted: $10.85, roughly 16% above the current price.' },
    { q: 'Expected annualised return including dividends?', a: 'Probability-weighted, approximately 11–12% over five years and 12–13% over three. The base case alone returns roughly 15–16% annualised; the bear case returns approximately −3% over five years, which is the relevant fact for sizing — this is a wide distribution, not a high-conviction compounder.' },
    { q: 'What would invalidate the thesis?', a: 'A sequential increase in OCIC or OTIC repurchase requests; permanent-capital fees falling below 80% of the total; a third year of uncovered dividend funded by debt; FRE margin below 55% for two quarters; or OCIC non-accruals above 2% of fair value.' },
    { q: 'Three KPIs to monitor each quarter?', a: 'BDC repurchase requests as a percentage of shares outstanding; AUM not yet paying fees and its associated fee estimate; dividend as a percentage of trailing distributable earnings per share.' },
  ],

  questionsForManagement: [
    'What is the cumulative unfulfilled repurchase queue at OCIC and OTIC, and over how many quarters does it clear at the 5% cap assuming no new requests?',
    'OCIC\'s Class I NAV was unchanged at $9.11 while OBDC\'s NAV fell from $14.81 to $14.41 on spread widening. What explains the divergence on overlapping strategies in the same quarter?',
    'The 2026 dividend of $0.92 exceeds both LTM distributable earnings of $0.87 and consensus of $0.89. What is the intended source of funding for the gap, and at what payout ratio would the board rebase?',
    'Permanent capital fell from 93% of management fees in 2022 to 85% in the LTM to March 2026. How much of that decline is acquisition mix and how much is redemption-driven, and where does it stabilise?',
    'What is the blended management-fee rate on the $31.1bn of AUM not yet paying fees, and what is the expected quarterly conversion schedule?',
    'What was equity-based compensation in Q2 2026, and what is the rationale for excluding it from both FRE and DE when it is a recurring, cash-substituting cost of roughly a quarter of FRE?',
    'What is the current tax receivable agreement liability, and what is the expected cash payment schedule over the next five years?',
    'Of the $85bn of AUM added in 2024, how much was acquired, at what aggregate consideration, and what is the realised return on that consideration measured in incremental FRE?',
  ],

  sourceCaveat:
    'Direct retrieval of company filings, the IR site, the earnings deck PDF and SEC EDGAR was blocked by this environment\'s network egress policy. Every figure below was obtained through search-surfaced content from the company\'s Q2 2026 release, 8-K, earnings call and prior filings, and each is tagged by tier accordingly. Where a figure could only be obtained from a secondary source it is tier C and is used as supporting evidence only, never to carry a valuation conclusion. Two internal consistency checks passed and are worth stating, because they materially raise confidence in the derived series: the four 2025 quarterly FRE figures we assembled ($0.22 / $0.23 / $0.24 / $0.27) sum exactly to the reported full-year $0.96, and the four DE figures ($0.17 / $0.21 / $0.22 / $0.24) sum exactly to the reported $0.84. Items we could not verify and have flagged in place: the tax receivable agreement balance, the current cash position (so enterprise value is approximate), quarterly stock-based compensation, and segment-level FRE margins.',

  sources: [
    { label: 'Q2 2026 results — AUM $319.0bn, FRE $392.2m, DE $351.2m, dividend $0.23', publisher: 'Blue Owl Capital / 8-K', period: 'Q2 2026', tier: 'A', url: 'https://ir.blueowl.com/Investors/news/news-details/2026/Blue-Owl-Capital-Inc--Second-Quarter-2026-Results/default.aspx' },
    { label: 'Q2 2026 earnings deck — platform management fees, FRE margin 58.5%', publisher: 'Blue Owl Capital', period: 'Q2 2026', tier: 'A', url: 'https://s202.q4cdn.com/477831904/files/doc_financials/2026/q2/Blue-Owl-Earnings-Deck-6-30-26.pdf' },
    { label: 'Q2 2026 earnings call transcript — redemptions, $31bn not yet paying fees, guidance', publisher: 'Seeking Alpha / Investing.com', period: '30 July 2026', tier: 'A', url: 'https://seekingalpha.com/article/4927892-blue-owl-capital-inc-owl-q2-2026-earnings-call-transcript' },
    { label: 'Q2 2025 results — FRE $358.3m / $0.23, DE $323.0m / $0.21, AUM $284.1bn', publisher: 'Blue Owl Capital / 8-K (SEC)', period: 'Q2 2025', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000182394525000044/a63025-ex991xearningspress.htm' },
    { label: 'FY2025 10-K — AUM $307.4bn, FPAUM $187.7bn, 85% permanent capital', publisher: 'Blue Owl Capital / SEC', period: 'FY2025', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000182394526000009/owl-20251231.htm' },
    { label: 'FY2024 10-K — AUM $251.1bn, FPAUM $159.8bn', publisher: 'Blue Owl Capital / SEC', period: 'FY2024', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000182394525000013/owl-20241231.htm' },
    { label: 'FY2023 and FY2022 10-K — AUM/FPAUM, 92–93% permanent capital', publisher: 'Blue Owl Capital / SEC', period: 'FY2022–23', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000182394524000016/owl-20231231.htm' },
    { label: 'Altimar / Owl Rock / Dyal combination — $52.5bn AUM, 91% permanent capital', publisher: 'Blue Owl Capital / SEC Form 425', period: 'May 2021', tier: 'A', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000119312521148255/d365230dex991.htm' },
    { label: 'DEF 14A — share classes outstanding at 6 April 2026', publisher: 'Blue Owl Capital / SEC', period: 'April 2026', tier: 'C', url: 'https://www.sec.gov/Archives/edgar/data/1823945/000182394526000017/owl-20260417.htm' },
    { label: 'Q2 2026 BDC repurchase requests — OCIC 18.8%, OTIC 38.1%, 5% caps', publisher: 'Investing.com / AltsWire', period: 'July 2026', tier: 'C' },
    { label: 'Private-credit redemption cycle and record-low share price', publisher: 'Bloomberg', period: 'April–July 2026', tier: 'C' },
    { label: 'Private-wealth fundraising channel contraction in Q2', publisher: 'PitchBook', period: 'July 2026', tier: 'C' },
    { label: 'OBDC / OCIC credit metrics — non-accruals, PIK, NAV', publisher: 'Blue Owl Capital Corporation / AltsWire', period: 'Q1 2026', tier: 'C' },
    { label: 'Peer data — Ares, TPG, Hamilton Lane, StepStone', publisher: 'Company releases via secondary aggregators', period: 'Q1–Q2 2026', tier: 'C' },
    { label: 'Share price $9.35 and market capitalisation', publisher: 'Market data aggregators', period: '30 July 2026 close', tier: 'C' },
  ],
}
