import type { ResearchDossier } from '../types'

/* Bundled sample dossier — approximate figures in ₹ billions, labeled.
   Share count and per-share figures follow the sample dataset's convention (pre-bonus). */

export const RELIANCE_DOSSIER: ResearchDossier = {
  symbol: 'RELIANCE',
  tier: 'deep',
  dataProfile: {
    provider: 'bundled-sample',
    asOf: '2026-07-11',
    note: 'Approximate historicals through FY2025 (Mar). INR billions. Verify against annual report before acting.',
  },
  profile: {
    name: 'Reliance Industries',
    description: 'India’s largest conglomerate: energy & petrochemicals cash flows funding telecom (Jio), retail, and new-energy platforms.',
    sector: 'Energy / Conglomerate',
    industry: 'Integrated energy, telecom, retail',
    country: 'IN',
    currency: 'INR',
    unit: 'INR billions',
    benchmark: 'NIFTY50',
    marketNarrative: 'A sum-of-parts re-rating story: Jio and Retail IPOs will crystallize value trapped inside the energy conglomerate.',
    segments: [
      { name: 'Oil-to-Chemicals', revenuePct: 57, note: 'Cash engine; refining margins cyclical' },
      { name: 'Retail', revenuePct: 21, note: 'India’s largest retailer by revenue and footprint' },
      { name: 'Jio (Digital)', revenuePct: 13, note: '~480M subscribers; ARPU repair under way' },
      { name: 'Oil & Gas E&P', revenuePct: 3 },
      { name: 'Other / New Energy', revenuePct: 6 },
    ],
    geographies: [
      { name: 'India', revenuePct: 68 },
      { name: 'Exports (refined products/chemicals)', revenuePct: 32 },
    ],
    moat: {
      rating: 'narrow',
      direction: 'strengthening',
      basis: 'Scale + regulatory navigation + execution speed. Jio has network-scale economics; Retail has distribution density. O2C is commodity with cost advantage.',
    },
    risks: [
      { label: 'Conglomerate discount persistence', detail: 'The SOTP thesis has been "18 months from IPOs" for years; monetization timing is controlled, not promised.' },
      { label: 'Refining/petchem cycle', detail: 'GRM swings move consolidated EBITDA meaningfully.' },
      { label: 'Capex intensity', detail: 'New energy (₹750B program) restarts the heavy-investment cycle just as FCF emerged.', underappreciated: true },
      { label: 'Governance / succession', detail: 'Controlled company; next-generation transition in progress across three verticals.' },
      { label: 'Currency', detail: 'INR depreciation erodes USD returns for a US-based holder (~2%/yr drag historically).', underappreciated: true },
    ],
    management: {
      assessment: 'Aggressive, execution-heavy; built two national-scale businesses (Jio, Retail) inside a decade.',
      capitalAllocation: 'Historically dilution-free empire building funded by O2C; deleveraged via stake sales at premium marks (2020-21).',
      incentives: 'Promoter family holds ~50%; minority alignment via listed-subsidiary trajectory.',
    },
    accountingFlags: [
      { label: 'Segment disclosure quality', severity: 'medium', detail: 'Inter-segment transfers and capitalized costs make Jio/Retail standalone economics hard to verify externally.' },
      { label: 'Capitalized interest', severity: 'low', detail: 'Historically large during Jio buildout; normalized since.' },
    ],
  },
  financials: [
    { fy: 'FY2017', revenue: 3305, grossMarginPct: 32, ebitMarginPct: 12.5, netIncome: 299, eps: 45.5, fcf: -180, shares: 6.6, roicPct: 9, netDebt: 1963 },
    { fy: 'FY2018', revenue: 3916, grossMarginPct: 33, ebitMarginPct: 13.2, netIncome: 361, eps: 55, fcf: -350, shares: 6.6, roicPct: 10, netDebt: 2187 },
    { fy: 'FY2019', revenue: 5671, grossMarginPct: 30, ebitMarginPct: 12.0, netIncome: 398, eps: 60.5, fcf: -420, shares: 6.6, roicPct: 10, netDebt: 2875 },
    { fy: 'FY2020', revenue: 6597, grossMarginPct: 29, ebitMarginPct: 11.4, netIncome: 393, eps: 59.5, fcf: -260, shares: 6.6, roicPct: 9, netDebt: 3361 },
    { fy: 'FY2021', revenue: 5395, grossMarginPct: 31, ebitMarginPct: 11.8, netIncome: 491, eps: 73, fcf: 320, shares: 6.7, roicPct: 9, netDebt: 260 },
    { fy: 'FY2022', revenue: 6999, grossMarginPct: 30, ebitMarginPct: 12.6, netIncome: 607, eps: 90, fcf: 180, shares: 6.7, roicPct: 10, netDebt: 1100 },
    { fy: 'FY2023', revenue: 8768, grossMarginPct: 29, ebitMarginPct: 12.1, netIncome: 667, eps: 98.5, fcf: 120, shares: 6.8, roicPct: 10, netDebt: 1400 },
    { fy: 'FY2024', revenue: 9010, grossMarginPct: 30, ebitMarginPct: 12.8, netIncome: 696, eps: 102.5, fcf: 350, shares: 6.8, roicPct: 10, netDebt: 1250 },
    { fy: 'FY2025', revenue: 9640, grossMarginPct: 30, ebitMarginPct: 13.1, netIncome: 741, eps: 109, fcf: 420, shares: 6.8, roicPct: 11, netDebt: 1150 },
  ],
  estimateRevisions: [
    { period: 'FY2027 EBITDA', direction: 'up', note: 'Jio tariff hike (Jul 2026, sample) flows through consensus.' },
    { period: 'Retail IPO timing', direction: 'flat', note: 'Still guided as "milestone-based" — no date.' },
  ],
  valuation: {
    methodNotes:
      'Consolidated multiples mislead — three businesses with different economics. SOTP is the primary method; DCF on consolidated FCF is secondary (capex program makes FCF lumpy). Dividend yield irrelevant (~0.3%). The key question is what discount to SOTP is warranted for timing + holding-structure risk.',
    dcf: { fcf0: 420, growthY1_5: 14, growthY6_10: 9, terminalGrowth: 5, discountRate: 12.5, netCash: -1150, shares: 6.8 },
    scenarios: [
      { label: 'Bull', narrative: 'Retail + Jio IPOs within 24 months at premium marks; O2C stable; new energy optionality.', eps5: 185, exitMultiple: 26, probabilityPct: 30 },
      { label: 'Base', narrative: 'Steady triple-engine compounding; no IPO; discount persists.', eps5: 165, exitMultiple: 22, probabilityPct: 50 },
      { label: 'Bear', narrative: 'Refining downcycle + new-energy capex overruns; ARPU stalls.', eps5: 130, exitMultiple: 16, probabilityPct: 20 },
    ],
    historicalMultiples: [
      { label: 'P/E (NTM)', low: 12, median: 22, high: 32, current: 26 },
      { label: 'EV/EBITDA', low: 7, median: 12, high: 17, current: 13 },
    ],
    peers: [
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel (telecom comp)', multiple: 11, metric: 'EV/EBITDA' },
      { symbol: 'DMART', name: 'Avenue Supermarts (retail comp)', multiple: 45, metric: 'P/E NTM' },
      { symbol: 'IOC', name: 'Indian Oil (refining comp)', multiple: 5, metric: 'P/E NTM' },
    ],
    sotp: [
      { part: 'Oil-to-Chemicals', value: 10_000, basis: '7.5× EV/EBITDA on mid-cycle ₹1,330B EBITDA' },
      { part: 'Jio Platforms', value: 11_500, basis: '11× EV/EBITDA on FY27e; last external mark + tariff repair' },
      { part: 'Reliance Retail', value: 13_000, basis: '28× EV/EBITDA — discount to DMART for mix' },
      { part: 'New Energy + E&P + other', value: 2_500, basis: 'Invested capital, no success premium' },
      { part: 'Net debt', value: -2_400, basis: 'Consolidated, incl. spectrum liabilities' },
    ],
  },
  frameworks: [
    {
      id: 'buffett', score: 5,
      verdict: 'Capable owner-operator and real moats in Jio/Retail — but conglomerate opacity and capex appetite fail the simplicity test.',
      answers: [
        { q: 'Understandable business?', a: 'Three businesses in one ticker with inter-segment flows — hard to model with confidence from outside.' },
        { q: 'Management integrity & allocation?', a: 'Execution record extraordinary; minority holders ride shotgun on promoter timing decisions.' },
      ],
    },
    { id: 'lynch', score: 7, verdict: 'A stalwart-priced asset play: the two-minute story (India consumption + telecom duopoly + IPO unlock) is genuinely good.' },
    { id: 'graham', score: 5.5, verdict: 'Real assets and earnings stability, but no valuation discount on consolidated numbers; the discount only appears inside the SOTP.' },
    { id: 'fisher', score: 6.5, verdict: 'Jio and Retail show Fisher-grade organizational buildout; O2C is not a Fisher business.' },
    {
      id: 'marks', score: 7,
      verdict: 'Sentiment on India is exuberant, but on RIL specifically it is fatigued ("value trap") — a decent contrarian setup.',
      answers: [{ q: 'Second-level view?', a: 'Consensus is bored of the SOTP story; boredom, not disagreement, is the discount. Catalysts are controlled by a motivated promoter.' }],
    },
    { id: 'greenblatt', score: 4.5, verdict: 'Screens poorly: consolidated ROC diluted by capex-heavy segments; formula misses the parts logic.' },
    { id: 'smith', score: 4, verdict: 'Fails the quality screen: consolidated ROIC ~11% barely clears WACC; Smith would pass entirely.', applicability: 'Lens built for asset-light compounders; structurally unsuited to conglomerates.' },
    {
      id: 'damodaran', score: 7.5,
      verdict: 'A narrative-to-numbers exercise in the good sense: the price implies almost no IPO unlock — the story is cheap.',
      answers: [{ q: 'What does the price imply?', a: 'Current price ≈ SOTP × 0.83; you pay for the parts and get monetization timing for free.', source: { label: 'SOTP (computed)', date: '2026-07-11', kind: 'model_inference' } }],
    },
    { id: 'druckenmiller', score: 6.5, verdict: 'Two visible inflections (Jio ARPU, retail margin) with a liquidity-supported market — but timing sits with the promoter, not the trade.' },
    { id: 'mauboussin', score: 5.5, verdict: 'Base rates for conglomerate discounts closing without structural action are poor; the bet needs the IPOs, not hope.' },
    {
      id: 'chanos', score: 5,
      verdict: 'No fraud markers, but forensic friction: segment transfers, capitalized costs, and promoter-controlled related entities warrant permanent monitoring.',
      answers: [{ q: 'Related-party exposure?', a: 'Meaningful by construction (promoter group); disclosed, but external verification of segment economics is limited.' }],
    },
  ],
  memo: {
    oneLiner: 'Three good businesses priced as one mediocre one — with the unlock clock controlled by the founder’s family.',
    narrative: 'India’s compounding story via one liquid mega-cap; IPOs of Jio/Retail eventually close the SOTP gap.',
    variantPerception: 'The market prices IPO fatigue; the position is really a claim on controlled, motivated monetization plus India consumption growth with the O2C engine paying the carry.',
    bull: 'Both IPOs within 24 months near external marks → ~₹4,800/share equivalent value recognition.',
    base: 'No IPO; 12–14% EBITDA compounding drags the price along at a persistent discount.',
    bear: 'Refining downcycle + ₹750B new-energy program disappoints → multiple compresses to 16×.',
    assumptions: ['Jio ARPU reaches ₹260 by FY2028', 'Retail EBITDA margin ≥8.5%', 'Mid-cycle GRM assumptions hold', 'INR depreciates ~2%/yr (USD holder)'],
    reasonsToOwn: ['SOTP discount with motivated controller', 'Jio/Retail are genuine moats in the world’s fastest-growing large market', 'Deleveraged balance sheet post-2021'],
    reasonsNotToOwn: ['Timing entirely outside minority control', 'New-energy capex could consume the FCF inflection', 'Currency drag for USD-based goals'],
    catalysts: [
      { date: '2026-08-28', label: 'AGM — historically where structural announcements land', kind: 'capital' },
      { date: '2026-10-20', label: 'Q2 FY27 results (Jio ARPU print)', kind: 'earnings' },
    ],
    thesisBreakers: ['New-energy capex guidance above ₹1T without returns framework', 'Jio ARPU flat for 4 quarters', 'Any related-party transaction moving value away from listco'],
    leadingIndicators: ['Jio ARPU', 'Retail store adds & revenue/sq-ft', 'Singapore GRM', 'IPO bankers hired (news flow)'],
    valuationRange: { low: 2300, high: 4300 },
    expectedReturnPct: { y1: 8, y3: 16, y5: 26 },
    status: 'Accumulate',
    statusRationale: 'Discount to conservatively-marked SOTP ≈ 17% with positive carry and controlled catalysts. Position is 2.1% of household investable — room to add within the India allocation target (currently 8.4% vs 10–12% target).',
  },
  news: [
    { date: '2026-07-05', title: 'Jio announces 12% tariff increase across postpaid plans', source: { label: 'Company press (sample)', date: '2026-07-05', kind: 'sample_data' }, materiality: 'material', why: 'Directly advances the ARPU assumption — the base case’s main driver.', affectsAssumption: 'Jio ARPU ₹260 by FY2028' },
    { date: '2026-06-18', title: 'New-energy giga-factory phase 2 commissioning slips two quarters', source: { label: 'Industry press (sample)', date: '2026-06-18', kind: 'sample_data' }, materiality: 'relevant', why: 'Capex-discipline watch item; small delay, no budget change disclosed.' },
    { date: '2026-05-30', title: 'Retail reports 9.1% EBITDA margin, 320 net store adds', source: { label: 'Q4 FY26 release (sample)', date: '2026-05-30', kind: 'sample_data' }, materiality: 'relevant', why: 'Above the 8.5% assumption; strengthens SOTP retail mark.', affectsAssumption: 'Retail EBITDA margin ≥8.5%' },
  ],
  qualityScores: [
    { key: 'managementCapital', label: 'Management & capital allocation', score: 7, basis: 'Built Jio/Retail from zero; new-energy program is the open bet.' },
    { key: 'moat', label: 'Competitive advantage', score: 6, basis: 'Narrow but strengthening: scale + distribution + spectrum; O2C commoditized.' },
  ],
  snapshots: [
    { date: '2026-04-22', status: 'Accumulate', note: 'Initiated: SOTP discount + India allocation gap.' },
    { date: '2026-07-11', status: 'Accumulate', note: 'Tariff hike strengthens base case; thesis intact, discount unchanged.' },
  ],
}
