import type { ResearchDossier } from '../types'

/* Bundled sample dossier. Historical figures are approximate (authored as of
   model cutoff) and labeled as sample data — replace via a licensed provider. */

export const AAPL_DOSSIER: ResearchDossier = {
  symbol: 'AAPL',
  tier: 'deep',
  dataProfile: {
    provider: 'bundled-sample',
    asOf: '2026-07-18',
    note: 'Approximate historicals through FY2025 (Sep). FY2025 figures are sample estimates. Verify against 10-K before acting.',
  },
  profile: {
    name: 'Apple Inc.',
    description: 'Designs and sells iPhone, Mac, iPad, wearables and a growing high-margin services ecosystem to ~2.4B active devices.',
    sector: 'Technology',
    industry: 'Consumer electronics & software platforms',
    country: 'US',
    currency: 'USD',
    unit: 'USD billions',
    benchmark: 'SPY',
    marketNarrative:
      'A safe mega-cap compounder: services mix shift and buybacks grind EPS higher; AI features drive an iPhone upgrade cycle.',
    segments: [
      { name: 'iPhone', revenuePct: 51, note: 'Upgrade-cycle dependent' },
      { name: 'Services', revenuePct: 25, note: '~74% gross margin; App Store + Google TAC + subscriptions' },
      { name: 'Wearables & Home', revenuePct: 9 },
      { name: 'Mac', revenuePct: 8 },
      { name: 'iPad', revenuePct: 7 },
    ],
    geographies: [
      { name: 'Americas', revenuePct: 43 },
      { name: 'Europe', revenuePct: 26 },
      { name: 'Greater China', revenuePct: 17, note: 'Declining share; competitive + geopolitical pressure' },
      { name: 'Rest of Asia-Pacific', revenuePct: 14 },
    ],
    moat: {
      rating: 'wide',
      direction: 'stable',
      basis: 'Ecosystem lock-in across 2.4B devices, switching costs, brand pricing power, silicon integration. Offset by App Store regulatory erosion.',
    },
    risks: [
      { label: 'China (demand + supply)', detail: '~17% of revenue and most assembly capacity; tariff and substitution risk both directions.' },
      { label: 'Google TAC payment', detail: 'An est. $20B+/yr near-pure-margin payment sits inside Services; antitrust remedies could impair it.', underappreciated: true },
      { label: 'App Store economics', detail: 'DMA and US rulings chip at the 15–30% take rate — the highest-margin dollars in the company.' },
      { label: 'Innovation cadence', detail: 'AI feature perception lags peers; a weak cycle extends replacement age.' },
    ],
    management: {
      assessment: 'Operationally elite, conservative disclosure; execution on silicon transitions has been flawless.',
      capitalAllocation: '>$650B returned since 2012; buybacks at high multiples have decent-but-declining IRR vs history.',
      incentives: 'RSU-based, TSR-linked; no controlling shareholder.',
    },
    accountingFlags: [
      { label: 'Clean, conservative reporting', severity: 'low', detail: 'Minimal adjustments; FCF ≈ net income consistently. Channel inventory disclosure is thin.' },
    ],
  },
  financials: [
    { fy: 'FY2016', revenue: 215.6, grossMarginPct: 39.1, ebitMarginPct: 27.8, netIncome: 45.7, eps: 2.08, fcf: 52.3, shares: 21.9, roicPct: 27, netDebt: -60, sbc: 4.2, dividendsPerShare: 0.55 },
    { fy: 'FY2017', revenue: 229.2, grossMarginPct: 38.5, ebitMarginPct: 26.8, netIncome: 48.4, eps: 2.3, fcf: 50.8, shares: 21.0, roicPct: 26, netDebt: -45, sbc: 4.8, dividendsPerShare: 0.6 },
    { fy: 'FY2018', revenue: 265.6, grossMarginPct: 38.3, ebitMarginPct: 26.7, netIncome: 59.5, eps: 2.98, fcf: 64.1, shares: 20.0, roicPct: 29, netDebt: -30, sbc: 5.3, dividendsPerShare: 0.68 },
    { fy: 'FY2019', revenue: 260.2, grossMarginPct: 37.8, ebitMarginPct: 24.6, netIncome: 55.3, eps: 2.97, fcf: 58.9, shares: 18.6, roicPct: 28, netDebt: -20, sbc: 6.1, dividendsPerShare: 0.75 },
    { fy: 'FY2020', revenue: 274.5, grossMarginPct: 38.2, ebitMarginPct: 24.1, netIncome: 57.4, eps: 3.28, fcf: 73.4, shares: 17.5, roicPct: 30, netDebt: -12, sbc: 6.8, dividendsPerShare: 0.8 },
    { fy: 'FY2021', revenue: 365.8, grossMarginPct: 41.8, ebitMarginPct: 29.8, netIncome: 94.7, eps: 5.61, fcf: 92.9, shares: 16.9, roicPct: 42, netDebt: -8, sbc: 7.9, dividendsPerShare: 0.85 },
    { fy: 'FY2022', revenue: 394.3, grossMarginPct: 43.3, ebitMarginPct: 30.3, netIncome: 99.8, eps: 6.11, fcf: 111.4, shares: 16.3, roicPct: 46, netDebt: 5, sbc: 9.0, dividendsPerShare: 0.9 },
    { fy: 'FY2023', revenue: 383.3, grossMarginPct: 44.1, ebitMarginPct: 29.8, netIncome: 97.0, eps: 6.13, fcf: 99.6, shares: 15.8, roicPct: 44, netDebt: -5, sbc: 10.8, dividendsPerShare: 0.95 },
    { fy: 'FY2024', revenue: 391.0, grossMarginPct: 46.2, ebitMarginPct: 31.5, netIncome: 93.7, eps: 6.08, fcf: 108.8, shares: 15.4, roicPct: 45, netDebt: -30, sbc: 11.7, dividendsPerShare: 1.0 },
    { fy: 'FY2025e', revenue: 416.0, grossMarginPct: 46.9, ebitMarginPct: 32.0, netIncome: 102.0, eps: 6.75, fcf: 112.0, shares: 15.1, roicPct: 46, netDebt: -55, sbc: 12.4, dividendsPerShare: 1.04 },
  ],
  estimateRevisions: [
    { period: 'FY2026 EPS', direction: 'up', note: 'Consensus drifted +2% after the June developer event; services growth guided low-teens.' },
    { period: 'FY2026 iPhone units', direction: 'flat', note: 'AI-cycle thesis not yet visible in supply-chain build orders.' },
  ],
  valuation: {
    methodNotes:
      'DCF fits well: cash flows are stable, high-conversion and shareholder-directed. Multiples vs own history matter more than vs peers (no true comp). PEG misleads — growth is single-digit, so quality premium must be justified by moat durability, not growth. SOTP not meaningful for an integrated ecosystem.',
    dcf: { fcf0: 112, growthY1_5: 7, growthY6_10: 5, terminalGrowth: 3, discountRate: 9, netCash: 55, shares: 15.1 },
    scenarios: [
      { label: 'Bull', narrative: 'AI supercycle compresses replacement age; services >15%/yr; China stabilizes.', eps5: 10.2, exitMultiple: 30, probabilityPct: 25 },
      { label: 'Base', narrative: 'Mid-single-digit device growth, low-teens services; buybacks −3%/yr shares.', eps5: 9.0, exitMultiple: 25, probabilityPct: 55 },
      { label: 'Bear', narrative: 'App Store remedies + Google TAC loss clip services; China share loss persists.', eps5: 7.2, exitMultiple: 19, probabilityPct: 20 },
    ],
    historicalMultiples: [
      { label: 'P/E (NTM)', low: 10, median: 22, high: 34, current: 33 },
      { label: 'FCF yield %', low: 2.6, median: 4.5, high: 10, current: 3.2 },
      { label: 'EV/EBITDA', low: 7, median: 16, high: 26, current: 25 },
    ],
    peers: [
      { symbol: 'MSFT', name: 'Microsoft', multiple: 34, metric: 'P/E NTM' },
      { symbol: 'GOOGL', name: 'Alphabet', multiple: 23, metric: 'P/E NTM' },
      { symbol: 'SSNLF', name: 'Samsung Elec.', multiple: 11, metric: 'P/E NTM' },
    ],
  },
  frameworks: [
    {
      id: 'buffett', score: 8.5,
      verdict: 'Near-archetype: wide moat, pristine economics — but today’s price offers little margin of safety.',
      answers: [
        { q: 'Durable moat, widening or narrowing?', a: 'Wide via ecosystem lock-in and brand; regulators are sanding the highest-margin edge (App Store).', source: { label: 'Sample dossier synthesis', date: '2026-07-18', kind: 'sample_data' } },
        { q: 'Returns on capital & pricing power?', a: 'ROIC ~45%+, ASPs rise through mix — genuine pricing power.', source: { label: 'FY2016–FY2025 sample financials', date: '2026-07-18', kind: 'sample_data' } },
        { q: 'Margin of safety at current price?', a: 'No. ~33× NTM earnings for ~7% growth relies on multiple durability, not undervaluation.', source: { label: 'Valuation lab (computed)', date: '2026-07-18', kind: 'model_inference' } },
      ],
    },
    {
      id: 'lynch', score: 6.5,
      verdict: 'A stalwart, not a fast grower — expect stalwart returns; PEG is unattractive.',
      answers: [
        { q: 'Category?', a: 'Stalwart. Single-digit top line, dependable EPS via buybacks.' },
        { q: 'PEG reasonable?', a: '~33× P/E on high-single-digit EPS growth → PEG >3. Expensive on this lens.', source: { label: 'Computed from sample financials', date: '2026-07-18', kind: 'model_inference' } },
      ],
    },
    { id: 'graham', score: 4, verdict: 'Fails on price: superb stability, but no valuation discount and negligible asset backing per dollar.', applicability: 'Graham lens penalizes intangible-moat compounders; weight accordingly.' },
    { id: 'fisher', score: 7, verdict: 'Elite product organization; the open question is whether AI features restore innovation-led (not mix-led) growth.' },
    {
      id: 'marks', score: 5.5,
      verdict: 'Consensus long, calm sentiment, full price — second-level edge must come from the tails (TAC ruling, China).',
      answers: [
        { q: 'What must be true for consensus to be wrong?', a: 'Either an AI supercycle (upside) or services-margin impairment via TAC/App Store (downside). Market prices neither tail.' },
      ],
    },
    { id: 'greenblatt', score: 5, verdict: 'Great business, mediocre earnings yield (~3.6% EBIT/EV) — the formula would not select it today.' },
    { id: 'smith', score: 8, verdict: 'Passes quality and sustainability easily; “don’t overpay” is the strained leg.' },
    {
      id: 'damodaran', score: 5,
      verdict: 'Narrative (safe grower) and numbers (33×) only reconcile if services keep re-rating the whole company.',
      answers: [
        { q: 'What does the price imply?', a: 'Reverse DCF implies ~12–13% FCF growth for five years — roughly double the base case.', source: { label: 'Reverse DCF (computed)', date: '2026-07-18', kind: 'model_inference' } },
      ],
    },
    { id: 'druckenmiller', score: 4.5, verdict: 'No inflection: estimates are drifting, not accelerating. Position size should reflect absence of asymmetry.' },
    { id: 'mauboussin', score: 6, verdict: 'Base rates say sustaining 45% ROIC at this scale is historically exceptional — priced as if the CAP is very long.' },
    { id: 'chanos', score: 8.5, verdict: 'Forensically clean: FCF ≈ net income for a decade, no accrual buildup, conservative disclosure.', applicability: 'High score = low forensic risk.' },
  ],
  memo: {
    oneLiner: 'The world’s best consumer franchise, priced as if its regulatory risks don’t exist.',
    narrative: 'Safe compounding: services + buybacks make EPS dependable; AI drives the next upgrade cycle.',
    variantPerception:
      'The market treats Services as an annuity. A material slice (Google TAC, App Store take rate) is contested economics that courts — not customers — will decide. Conversely, the installed base’s monetization ceiling is still underexplored.',
    bull: 'AI supercycle + services >15%/yr + China stabilization → $10+ EPS by FY2030 at a premium multiple.',
    base: 'MSD device growth, low-teens services, −3%/yr share count → ~9% EPS CAGR; returns ≈ EPS growth + dividend, minus multiple drift.',
    bear: 'TAC remedy + App Store erosion cut services margin; upgrade cycle disappoints → EPS flat, multiple de-rates to ~19×.',
    assumptions: [
      'Services grows low-teens with ≥70% gross margin',
      'Google TAC survives in some economically similar form',
      'iPhone replacement cycle does not extend beyond ~4.5 years',
      'Buybacks retire ~3%/yr of shares',
    ],
    reasonsToOwn: ['Ecosystem moat with pricing power', 'Best-in-class FCF conversion funding relentless buybacks', 'Optionality: installed-base monetization, health, AI services'],
    reasonsNotToOwn: ['Full valuation vs own history', 'Regulatory risk to highest-margin dollars', 'Growth now depends on mix, not units'],
    catalysts: [
      { date: '2026-07-30', label: 'Q3 FY26 earnings', kind: 'earnings' },
      { date: '2026-09-09', label: 'iPhone 18 launch event', kind: 'product' },
      { date: '2026-10-15', label: 'Google TAC remedies ruling window', kind: 'regulatory' },
    ],
    thesisBreakers: ['Services growth < 8% for two consecutive quarters', 'TAC payment structurally impaired', 'Replacement cycle extends past 5 years'],
    leadingIndicators: ['Supply-chain build orders', 'App Store billings growth', 'China sell-through share', 'Services gross margin'],
    valuationRange: { low: 150, high: 260 },
    expectedReturnPct: { y1: 1, y3: 2, y5: 4 },
    status: 'Hold',
    statusRationale:
      'Quality argues for owning; price argues against adding. The probability-weighted scenario IRR is ≈ 0%/yr — well below the portfolio hurdle. Hold existing shares (large embedded LT gains make selling tax-expensive); add only on multiple compression toward ~25× or thesis-confirming services acceleration.',
  },
  news: [
    { date: '2026-07-14', title: 'Developer beta expands on-device AI APIs to third-party apps', source: { label: 'Company press release (sample)', date: '2026-07-14', kind: 'sample_data' }, materiality: 'relevant', why: 'Supports the AI-cycle assumption; monetization path still unclear.', affectsAssumption: 'iPhone replacement cycle' },
    { date: '2026-06-28', title: 'EU opens follow-on DMA inquiry into App Store steering compliance', source: { label: 'Regulatory notice (sample)', date: '2026-06-28', kind: 'sample_data' }, materiality: 'material', why: 'Directly touches the contested services economics in the bear case.', affectsAssumption: 'Services margin ≥70%' },
    { date: '2026-06-10', title: 'Supplier reports flat H2 build orders year-over-year', source: { label: 'Industry press (sample)', date: '2026-06-10', kind: 'sample_data' }, materiality: 'relevant', why: 'Leading indicator not yet confirming the AI supercycle.', affectsAssumption: 'Replacement cycle' },
    { date: '2026-05-02', title: 'Buyback authorization raised by $90B', source: { label: 'Q2 FY26 report (sample)', date: '2026-05-02', kind: 'sample_data' }, materiality: 'relevant', why: 'Sustains the −3%/yr share-count assumption.' },
  ],
  insiders: [
    { date: '2026-05-15', who: 'CEO', action: 'sell-10b5-1', valueUsd: 32_000_000, note: 'Scheduled plan; consistent with prior years' },
    { date: '2026-04-08', who: 'Director', action: 'buy', valueUsd: 500_000, note: 'First open-market director buy since 2019' },
  ],
  qualityScores: [
    { key: 'managementCapital', label: 'Management & capital allocation', score: 8, basis: 'Flawless operations; buyback IRR declining as multiple expands — good, no longer exceptional.' },
    { key: 'moat', label: 'Competitive advantage', score: 9, basis: 'Wide, stable; regulatory sanding at the edges.' },
  ],
  snapshots: [
    { date: '2026-04-20', status: 'Hold', note: 'Initiated coverage. Quality 9/10, valuation stretched; hold.' },
    { date: '2026-07-18', status: 'Hold', note: 'Thesis intact. EU inquiry raises bear-tail weight modestly; AI cycle unconfirmed by build orders.' },
  ],
}
