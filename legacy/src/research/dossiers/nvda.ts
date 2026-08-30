import type { ResearchDossier } from '../types'

/* Bundled sample dossier — approximate figures, labeled. NVDA fiscal year ends late January. */

export const NVDA_DOSSIER: ResearchDossier = {
  symbol: 'NVDA',
  tier: 'deep',
  dataProfile: {
    provider: 'bundled-sample',
    asOf: '2026-07-18',
    note: 'Approximate historicals through FY2025 (Jan-2025); FY2026e is a sample estimate. Share counts split-adjusted (10:1, Jun 2024).',
  },
  profile: {
    name: 'NVIDIA Corp.',
    description: 'Designs the accelerated-computing stack — GPUs, networking, and the CUDA software layer — that trains and serves modern AI.',
    sector: 'Technology',
    industry: 'Semiconductors — accelerated computing',
    country: 'US',
    currency: 'USD',
    unit: 'USD billions',
    benchmark: 'SPY',
    marketNarrative: 'The arms dealer of the AI buildout: hyperscaler capex converts almost directly into NVIDIA revenue at 75% gross margin.',
    segments: [
      { name: 'Data Center', revenuePct: 88, note: 'Hyperscalers + enterprise + sovereign AI' },
      { name: 'Gaming', revenuePct: 8 },
      { name: 'Professional Visualization', revenuePct: 2 },
      { name: 'Automotive & other', revenuePct: 2 },
    ],
    geographies: [
      { name: 'US', revenuePct: 47 },
      { name: 'Singapore (billing hub)', revenuePct: 18, note: 'Largely re-billed; end-demand geography opaque' },
      { name: 'Taiwan', revenuePct: 16 },
      { name: 'China', revenuePct: 9, note: 'Export-control constrained' },
      { name: 'Other', revenuePct: 10 },
    ],
    moat: {
      rating: 'wide',
      direction: 'stable',
      basis: 'CUDA ecosystem lock-in (~5M developers), fastest product cadence (Blackwell→Rubin), networking + rack-scale integration. Custom ASICs erode the edges of training/inference share.',
    },
    risks: [
      { label: 'Customer concentration', detail: 'Top 4 hyperscalers ≈ 45%+ of revenue; all four are building in-house silicon.', underappreciated: false },
      { label: 'Capex cyclicality', detail: 'AI infrastructure is a capex cycle; digestion phases can cut orders abruptly — 2019 and 2022 precedents.' },
      { label: 'Export controls', detail: 'China restrictions cap TAM and invite domestic substitution (Huawei Ascend).' },
      { label: 'Supply-chain single points', detail: 'TSMC CoWoS capacity and HBM supply gate output.', underappreciated: true },
    ],
    management: {
      assessment: 'Founder-led with exceptional velocity; guidance has been beaten for 10 straight quarters (sample record).',
      capitalAllocation: 'R&D-first; buybacks large in dollars, minor vs FCF; no dilution problem post-SBC.',
    },
    accountingFlags: [
      { label: 'Inventory purchase commitments', severity: 'medium', detail: '$30B+ of supply commitments would hurt if demand inflects down — watch the disclosure each quarter.' },
      { label: 'Singapore billing opacity', severity: 'medium', detail: 'Re-billing hub obscures true end-market geography; matters for export-control tail risk.' },
    ],
  },
  financials: [
    { fy: 'FY2017', revenue: 6.9, grossMarginPct: 58.8, ebitMarginPct: 28, netIncome: 1.7, eps: 0.07, fcf: 1.5, shares: 24.2, roicPct: 20, netDebt: -5 },
    { fy: 'FY2018', revenue: 9.7, grossMarginPct: 59.9, ebitMarginPct: 33, netIncome: 3.0, eps: 0.12, fcf: 2.9, shares: 24.6, roicPct: 30, netDebt: -6 },
    { fy: 'FY2019', revenue: 11.7, grossMarginPct: 61.2, ebitMarginPct: 32, netIncome: 4.1, eps: 0.17, fcf: 3.1, shares: 24.7, roicPct: 33, netDebt: -6 },
    { fy: 'FY2020', revenue: 10.9, grossMarginPct: 62.0, ebitMarginPct: 26, netIncome: 2.8, eps: 0.11, fcf: 4.3, shares: 24.8, roicPct: 20, netDebt: -8 },
    { fy: 'FY2021', revenue: 16.7, grossMarginPct: 62.3, ebitMarginPct: 27, netIncome: 4.3, eps: 0.17, fcf: 4.7, shares: 25.0, roicPct: 22, netDebt: -7 },
    { fy: 'FY2022', revenue: 26.9, grossMarginPct: 64.9, ebitMarginPct: 37, netIncome: 9.8, eps: 0.39, fcf: 8.1, shares: 25.1, roicPct: 35, netDebt: -10 },
    { fy: 'FY2023', revenue: 27.0, grossMarginPct: 56.9, ebitMarginPct: 21, netIncome: 4.4, eps: 0.17, fcf: 3.8, shares: 24.9, roicPct: 14, netDebt: -3 },
    { fy: 'FY2024', revenue: 60.9, grossMarginPct: 72.7, ebitMarginPct: 54, netIncome: 29.8, eps: 1.19, fcf: 27.0, shares: 24.9, roicPct: 70, netDebt: -18 },
    { fy: 'FY2025', revenue: 130.5, grossMarginPct: 75.0, ebitMarginPct: 62, netIncome: 72.9, eps: 2.94, fcf: 60.9, shares: 24.8, roicPct: 105, netDebt: -35 },
    { fy: 'FY2026e', revenue: 198.0, grossMarginPct: 73.5, ebitMarginPct: 61, netIncome: 106.0, eps: 4.3, fcf: 92.0, shares: 24.6, roicPct: 115, netDebt: -55 },
  ],
  estimateRevisions: [
    { period: 'FY2027 EPS', direction: 'up', note: 'Consensus +6% over 90 days on sovereign-AI order disclosures.' },
    { period: 'FY2027 Data Center rev', direction: 'up', note: 'Whisper numbers above guidance; supply, not demand, is the cited constraint.' },
  ],
  valuation: {
    methodNotes:
      'Point-estimate DCF is fragile here — terminal economics are the whole debate. Use reverse DCF (what growth is priced in) plus scenario expected value. Historical multiple bands mislead across the FY2023→FY2025 regime change. Peer multiples (AMD, AVGO) are informative for the normalized state.',
    dcf: { fcf0: 92, growthY1_5: 25, growthY6_10: 12, terminalGrowth: 3.5, discountRate: 10.5, netCash: 55, shares: 24.6 },
    scenarios: [
      { label: 'Bull', narrative: 'AI capex compounds; inference demand outgrows training; CUDA holds share >80%.', eps5: 9.5, exitMultiple: 28, probabilityPct: 30 },
      { label: 'Base', narrative: 'Buildout continues then plateaus FY2029; margins normalize to ~65% GM; share dips to ~70%.', eps5: 7.0, exitMultiple: 22, probabilityPct: 45 },
      { label: 'Bear', narrative: 'Capex digestion FY2027–28; custom silicon takes inference; China locked out.', eps5: 4.0, exitMultiple: 16, probabilityPct: 25 },
    ],
    historicalMultiples: [
      { label: 'P/E (NTM)', low: 24, median: 40, high: 65, current: 30 },
      { label: 'EV/Sales (NTM)', low: 5, median: 14, high: 25, current: 15 },
      { label: 'FCF yield %', low: 0.8, median: 2.0, high: 3.5, current: 2.9 },
    ],
    peers: [
      { symbol: 'AMD', name: 'AMD', multiple: 48, metric: 'P/E NTM' },
      { symbol: 'AVGO', name: 'Broadcom', multiple: 33, metric: 'P/E NTM' },
      { symbol: 'TSM', name: 'TSMC', multiple: 29, metric: 'P/E NTM' },
    ],
  },
  frameworks: [
    {
      id: 'buffett', score: 6,
      verdict: 'Extraordinary economics, but ten-year predictability — the lens’s first requirement — is genuinely low.',
      answers: [
        { q: 'Understandable and predictable ten years out?', a: 'The stack is understandable; the duration of 75% gross margins under customer-owned-silicon pressure is not predictable.' },
        { q: 'Returns on capital?', a: 'ROIC >100% currently — unprecedented at this scale, and mean-reverting in every historical base rate.', source: { label: 'Sample financials + base rates', date: '2026-07-18', kind: 'model_inference' } },
      ],
    },
    {
      id: 'lynch', score: 7.5,
      verdict: 'A fast grower whose PEG (~1.0 on forward numbers) is oddly reasonable — if you trust the E.',
      answers: [
        { q: 'Category?', a: 'Fast grower at cyclical scale — Lynch would warn the categories can flip fast.' },
        { q: 'Are earnings following the story?', a: 'Beyond it: EPS 25× in four years. The question is durability, not delivery.' },
      ],
    },
    { id: 'graham', score: 2.5, verdict: 'Nothing here for Graham: no asset floor, no discount, earnings history too short at this level.', applicability: 'Wrong lens for a regime-change growth story; include for discipline only.' },
    { id: 'fisher', score: 9, verdict: 'The strongest Fisher case in mega-caps: R&D productivity, cadence and depth are generational.' },
    {
      id: 'marks', score: 4.5,
      verdict: 'Late-cycle psychology: universal bullishness, capex narratives, supply "sold out" — classic top-half-of-cycle markers.',
      answers: [
        { q: 'Where are we in the cycle?', a: 'Year 3–4 of an infrastructure buildout. No buildout in history has escaped a digestion phase.' },
        { q: 'What does consensus require?', a: 'Uninterrupted hyperscaler capex growth through FY2028. Any pause breaks the estimate ladder.' },
      ],
    },
    { id: 'greenblatt', score: 7, verdict: 'Screens surprisingly fine: ~3.4% EBIT/EV yield with the best ROC in the index.' },
    { id: 'smith', score: 6.5, verdict: 'Quality and reinvestment superb; "sustainable" and "don’t overpay" both carry real uncertainty.' },
    {
      id: 'damodaran', score: 6,
      verdict: 'Price implies ~17–18% FCF growth for five years — aggressive but not absurd against disclosed order books.',
      answers: [{ q: 'Narrative vs numbers?', a: 'The narrative (AI arms dealer) and the numbers reconcile only if inference demand replaces training demand as it matures.' }],
    },
    { id: 'druckenmiller', score: 8, verdict: 'Textbook earnings inflection with liquidity tailwind — but crowded; sizing and exit discipline are everything.' },
    { id: 'mauboussin', score: 5, verdict: 'Base rates are brutal: of all companies reaching $100B revenue, none sustained >60% EBIT margins for a decade.' },
    {
      id: 'chanos', score: 6,
      verdict: 'No accounting red flags, but structural watch-items: purchase commitments, billing-hub opacity, vendor-financing style deals with AI startups.',
      answers: [
        { q: 'Receivables/inventory vs revenue?', a: 'Inventory +90% YoY vs revenue +60% (sample) — rational pre-build for Rubin, but exactly what a peak looks like too.' },
      ],
    },
  ],
  memo: {
    oneLiner: 'The tollbooth on AI compute — priced for a long buildout, exposed to its first pause.',
    narrative: 'AI capex is a secular, not cyclical, phenomenon; NVIDIA is its irreplaceable core.',
    variantPerception:
      'Both tails are fatter than consensus: sovereign + enterprise demand could extend the cycle years (bull), while the four largest customers are also the four most capable competitors (bear). The base case is narrower than the market thinks.',
    bull: 'Inference outgrows training; $9+ EPS by FY2031 with CUDA share held → stock compounds >20%/yr.',
    base: 'Buildout through FY2029 then plateau; margins normalize; ~$7 EPS at 22× → high-single-digit IRR from here.',
    bear: 'Digestion + custom silicon: EPS stalls at ~$4, multiple 16× → meaningful drawdown before recovery.',
    assumptions: ['Hyperscaler capex grows through FY2028', 'CUDA retains >70% accelerator share', 'Gross margin floor ~65%', 'China remains largely excluded (already assumed)'],
    reasonsToOwn: ['Structural winner of the largest capex cycle in tech history', 'Software lock-in converts hardware share into durable economics', 'Balance sheet + FCF fund every option'],
    reasonsNotToOwn: ['Customer concentration in self-arming buyers', 'Cycle risk to estimates and multiple simultaneously', 'Position already 6.1% of household investable assets'],
    catalysts: [
      { date: '2026-08-26', label: 'Q2 FY27 earnings + Rubin ramp commentary', kind: 'earnings' },
      { date: '2026-09-15', label: 'Hyperscaler capex guidance season', kind: 'macro' },
      { date: '2026-11-18', label: 'Supercomputing conference — Rubin benchmarks', kind: 'product' },
    ],
    thesisBreakers: ['Two consecutive quarters of Data Center sequential decline', 'A top-4 customer shifting >25% of inference to in-house silicon', 'Gross margin below 65% without a mix explanation'],
    leadingIndicators: ['Hyperscaler capex guidance', 'CoWoS capacity bookings', 'HBM pricing', 'Purchase-commitment disclosure trend'],
    valuationRange: { low: 75, high: 190 },
    expectedReturnPct: { y1: 6, y3: 16, y5: 29 },
    status: 'Hold',
    statusRationale:
      'Expected value is positive but the distribution is wide and the household position (6.1%) already exceeds the 5% concentration principle. Hold; the covered-call program monetizes the elevated implied volatility. Add only after a digestion-driven derating, not on strength.',
  },
  news: [
    { date: '2026-07-10', title: 'Two additional sovereign-AI infrastructure agreements disclosed', source: { label: 'Company press (sample)', date: '2026-07-10', kind: 'sample_data' }, materiality: 'material', why: 'Diversifies away from hyperscaler concentration — supports the bull-tail assumption.', affectsAssumption: 'Hyperscaler capex growth' },
    { date: '2026-06-25', title: 'Largest customer confirms next-gen in-house accelerator for inference', source: { label: 'Industry press (sample)', date: '2026-06-25', kind: 'sample_data' }, materiality: 'material', why: 'Directly tests the CUDA-share assumption; monitor deployment scale.', affectsAssumption: 'CUDA retains >70% share' },
    { date: '2026-06-05', title: 'Purchase commitments rise to $34B in Q1 filing', source: { label: 'Quarterly filing (sample)', date: '2026-06-05', kind: 'sample_data' }, materiality: 'relevant', why: 'Forensic watch-item: supply pre-build deepens the downside in a demand pause.' },
    { date: '2026-05-20', title: 'Q1 beat-and-raise; 10th consecutive guidance beat', source: { label: 'Earnings release (sample)', date: '2026-05-20', kind: 'sample_data' }, materiality: 'relevant', why: 'Sustains estimate-revision momentum.' },
  ],
  insiders: [
    { date: '2026-06-30', who: 'CEO', action: 'sell-10b5-1', valueUsd: 120_000_000, note: 'Ongoing scheduled plan — consistent for years, not a signal' },
    { date: '2026-05-28', who: 'CFO', action: 'sell', valueUsd: 8_000_000 },
  ],
  qualityScores: [
    { key: 'managementCapital', label: 'Management & capital allocation', score: 9, basis: 'Founder-led velocity; R&D compounding; no empire-building.' },
    { key: 'moat', label: 'Competitive advantage', score: 8, basis: 'CUDA wide but under deliberate, well-funded attack from its own customers.' },
  ],
  snapshots: [
    { date: '2026-04-20', status: 'Hold', note: 'Initiated: exceptional business, cycle risk, concentration cap binding.' },
    { date: '2026-07-18', status: 'Hold', note: 'Thesis intact; customer-silicon news raises bear weight; sovereign deals raise bull weight. Distribution widened, midpoint unchanged.' },
  ],
}
