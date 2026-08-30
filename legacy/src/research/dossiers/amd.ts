import type { ResearchDossier } from '../types'

/* Bundled sample dossier — watchlist name (not held). Approximate figures, labeled. */

export const AMD_DOSSIER: ResearchDossier = {
  symbol: 'AMD',
  tier: 'deep',
  dataProfile: {
    provider: 'bundled-sample',
    asOf: '2026-07-15',
    note: 'Approximate historicals through FY2025 (Dec); FY2025 partially estimated. Watchlist candidate — buy discipline set at ≤$145.',
  },
  profile: {
    name: 'Advanced Micro Devices',
    description: 'Designs CPUs (EPYC/Ryzen), GPUs (Instinct/Radeon) and adaptive chips (Xilinx), challenging Intel in compute and NVIDIA in AI accelerators.',
    sector: 'Technology',
    industry: 'Semiconductors',
    country: 'US',
    currency: 'USD',
    unit: 'USD billions',
    benchmark: 'SPY',
    marketNarrative: 'The credible #2 in AI compute: even modest accelerator share gains against NVIDIA transform the earnings power.',
    segments: [
      { name: 'Data Center', revenuePct: 52, note: 'EPYC server CPUs + Instinct accelerators' },
      { name: 'Client', revenuePct: 25 },
      { name: 'Gaming', revenuePct: 12, note: 'Semi-custom consoles in cyclical trough' },
      { name: 'Embedded', revenuePct: 11, note: 'Xilinx; industrial recovery under way' },
    ],
    geographies: [
      { name: 'US', revenuePct: 34 },
      { name: 'China', revenuePct: 24, note: 'Export-control sensitive' },
      { name: 'Japan/Taiwan/other', revenuePct: 42 },
    ],
    moat: {
      rating: 'narrow',
      direction: 'strengthening',
      basis: 'x86 duopoly + chiplet design lead + TSMC partnership. Software (ROCm) still the gap vs CUDA — the moat question IS the ROCm question.',
    },
    risks: [
      { label: 'CUDA software gap', detail: 'Instinct wins headline deals but ROCm friction caps share in the long tail of AI workloads.' },
      { label: 'Fabless dependence on TSMC', detail: 'Same single point of failure as the rest of the industry.' },
      { label: 'Intel price response', detail: 'A capacity-flush Intel discounts server CPUs to defend share.', underappreciated: true },
      { label: 'Hyperscaler custom silicon', detail: 'The same threat aimed at NVIDIA also caps the #2.' },
    ],
    management: {
      assessment: 'Execution-defining CEO; roadmap credibility rebuilt from near-bankruptcy to server-share leadership.',
      capitalAllocation: 'Xilinx (all-stock, well-timed); modest buybacks; R&D prioritized correctly.',
    },
    accountingFlags: [
      { label: 'Large acquisition intangibles', severity: 'low', detail: 'Xilinx amortization depresses GAAP earnings; use both GAAP and adjusted views — gap is disclosed cleanly.' },
    ],
  },
  financials: [
    { fy: 'FY2017', revenue: 5.3, grossMarginPct: 34, ebitMarginPct: 4, netIncome: 0.04, eps: 0.03, fcf: -0.1, shares: 0.97, roicPct: 2, netDebt: 0.4 },
    { fy: 'FY2018', revenue: 6.5, grossMarginPct: 38, ebitMarginPct: 7, netIncome: 0.34, eps: 0.32, fcf: 0.1, shares: 1.0, roicPct: 8, netDebt: 0.1 },
    { fy: 'FY2019', revenue: 6.7, grossMarginPct: 43, ebitMarginPct: 9, netIncome: 0.34, eps: 0.3, fcf: 0.3, shares: 1.09, roicPct: 9, netDebt: -0.5 },
    { fy: 'FY2020', revenue: 9.8, grossMarginPct: 45, ebitMarginPct: 14, netIncome: 2.5, eps: 2.06, fcf: 0.8, shares: 1.18, roicPct: 25, netDebt: -1.8 },
    { fy: 'FY2021', revenue: 16.4, grossMarginPct: 48, ebitMarginPct: 22, netIncome: 3.2, eps: 2.57, fcf: 3.2, shares: 1.21, roicPct: 30, netDebt: -2.6 },
    { fy: 'FY2022', revenue: 23.6, grossMarginPct: 45, ebitMarginPct: 5, netIncome: 1.3, eps: 0.84, fcf: 3.1, shares: 1.61, roicPct: 4, netDebt: -3.0 },
    { fy: 'FY2023', revenue: 22.7, grossMarginPct: 46, ebitMarginPct: 4, netIncome: 0.85, eps: 0.53, fcf: 1.1, shares: 1.62, roicPct: 3, netDebt: -2.5 },
    { fy: 'FY2024', revenue: 25.8, grossMarginPct: 49, ebitMarginPct: 8, netIncome: 1.6, eps: 1.0, fcf: 2.4, shares: 1.62, roicPct: 5, netDebt: -3.5 },
    { fy: 'FY2025e', revenue: 32.5, grossMarginPct: 51, ebitMarginPct: 14, netIncome: 3.9, eps: 2.4, fcf: 4.5, shares: 1.62, roicPct: 11, netDebt: -4.0 },
  ],
  estimateRevisions: [
    { period: 'FY2026 EPS', direction: 'up', note: 'MI400 launch commentary lifted accelerator revenue assumptions ~8% in 60 days.' },
    { period: 'FY2026 Data Center rev', direction: 'up', note: 'Two hyperscaler qualification wins disclosed.' },
  ],
  valuation: {
    methodNotes:
      'Earnings are inflecting, so trailing multiples overstate expense and forward multiples embed the debate. Use scenario EV: the stock is a probability-weighted bet on accelerator share. GAAP/adjusted gap (Xilinx amortization) must be handled explicitly. DCF is secondary given margin trajectory uncertainty.',
    dcf: { fcf0: 4.5, growthY1_5: 22, growthY6_10: 12, terminalGrowth: 3.5, discountRate: 11, netCash: 4, shares: 1.62 },
    scenarios: [
      { label: 'Bull', narrative: 'Instinct reaches 15% accelerator share; ROCm friction fades; server share >40%.', eps5: 9.5, exitMultiple: 26, probabilityPct: 25 },
      { label: 'Base', narrative: '8–10% accelerator share; server gains continue; embedded recovers.', eps5: 6.5, exitMultiple: 22, probabilityPct: 50 },
      { label: 'Bear', narrative: 'Accelerator share stalls <5%; Intel price war compresses CPU margins.', eps5: 3.5, exitMultiple: 15, probabilityPct: 25 },
    ],
    historicalMultiples: [
      { label: 'P/E (NTM)', low: 15, median: 35, high: 60, current: 48 },
      { label: 'EV/Sales (NTM)', low: 3, median: 7, high: 12, current: 7.4 },
    ],
    peers: [
      { symbol: 'NVDA', name: 'NVIDIA', multiple: 30, metric: 'P/E NTM' },
      { symbol: 'INTC', name: 'Intel', multiple: 22, metric: 'P/E NTM' },
      { symbol: 'AVGO', name: 'Broadcom', multiple: 33, metric: 'P/E NTM' },
    ],
  },
  frameworks: [
    { id: 'buffett', score: 3.5, verdict: 'Outside the circle: outcome depends on a technology share battle no outsider can handicap with confidence.', applicability: 'This lens will structurally never like semis challengers; noted, not disqualifying.' },
    {
      id: 'lynch', score: 7,
      verdict: 'Fast grower with a tellable story (the #2 in AI), but PEG ~1.6 already pays for much of it.',
      answers: [{ q: 'Earnings following the story?', a: 'Yes — FY2025 EPS more than doubling as Data Center mixes up (sample estimates).' }],
    },
    { id: 'graham', score: 3, verdict: 'No margin of safety in the Graham sense; net cash is the only cushion.' },
    {
      id: 'fisher', score: 8,
      verdict: 'Strong Fisher profile: R&D productivity (chiplets, roadmap cadence) and management depth are demonstrably elite.',
      answers: [{ q: 'R&D effectiveness?', a: 'Five consecutive generations delivered on time against a larger incumbent — rare and diagnostic.' }],
    },
    {
      id: 'marks', score: 6,
      verdict: 'The crowd owns NVDA; AMD is the "cheaper AI" consolation trade — sentiment is warm, not euphoric.',
    },
    { id: 'greenblatt', score: 4, verdict: 'Screens badly: current ROC still digesting Xilinx; formula sees an average business at a high price.' },
    { id: 'smith', score: 4.5, verdict: 'Quality improving but not yet sustained; Smith would wait for proof of durable ROCE.' },
    {
      id: 'damodaran', score: 5.5,
      verdict: 'Price implies ~19% FCF growth for a decade — plausible only in the bull share scenario.',
      answers: [{ q: 'Narrative vs numbers?', a: 'Reverse DCF says the market already pays for ~10% accelerator share. The base case is priced; you are buying the bull tail.', source: { label: 'Reverse DCF (computed)', date: '2026-07-15', kind: 'model_inference' } }],
    },
    { id: 'druckenmiller', score: 7.5, verdict: 'Genuine earnings inflection with revisions momentum — the setup he’d size, with a hard invalidation level.' },
    { id: 'mauboussin', score: 5, verdict: 'Base rates for #2 challengers closing software-ecosystem gaps are modest; expectations demand it anyway.' },
    { id: 'chanos', score: 7, verdict: 'Clean forensics; watch adjusted-vs-GAAP gap (amortization) and inventory build ahead of MI400.' },
  ],
  memo: {
    oneLiner: 'A well-run challenger whose stock already pays for the base case — the entry price is the whole decision.',
    narrative: 'Every AI buildout needs a second source; AMD is it, and share gains from even 5% → 10% double the earnings.',
    variantPerception: 'The market prices linear share gains; reality will be lumpy qualification-driven steps. Volatility around lumpy prints is the opportunity — hence the ≤$145 entry discipline rather than chasing.',
    bull: '15% accelerator share + server >40% → ~$9.50 EPS by FY2030; stock a multi-bagger from $145.',
    base: '8–10% share → ~$6.50 EPS; fair value ≈ $140–150 — roughly today’s price.',
    bear: 'Share stalls; CPU price war → $3.50 EPS at 15× = $52 downside case.',
    assumptions: ['Accelerator TAM grows >20%/yr through FY2029', 'ROCm reaches "good enough" for mainstream inference', 'TSMC capacity allocation secured', 'No China escalation beyond current controls'],
    reasonsToOwn: ['Only credible merchant alternative to NVIDIA', 'Server CPU share still compounding', 'Optionality across embedded recovery + custom silicon'],
    reasonsNotToOwn: ['Base case fully priced at 48× NTM', 'CUDA gap may be structural', 'Concentrated exposure overlaps existing NVDA position (same end market)'],
    catalysts: [
      { date: '2026-08-04', label: 'Q2 FY26 earnings — MI400 ramp disclosure', kind: 'earnings' },
      { date: '2026-10-08', label: 'Advancing AI event — customer roster', kind: 'product' },
    ],
    thesisBreakers: ['Accelerator revenue guide below $2B/qtr through FY2027', 'A hyperscaler publicly dropping Instinct', 'Server share losses two consecutive quarters'],
    leadingIndicators: ['Hyperscaler qualification announcements', 'ROCm GitHub activity / framework support', 'Server share (Mercury data)', 'MI400 lead times'],
    valuationRange: { low: 52, high: 250 },
    expectedReturnPct: { y1: 0, y3: 2, y5: 5 },
    status: 'Watch',
    statusRationale: 'Good business, full price. The watchlist entry discipline (≤$145, ≈38× fwd) converts the same thesis into an acceptable risk/reward. Also note portfolio overlap: adding AMD increases the same AI-capex factor NVDA already dominates in the household book.',
  },
  news: [
    { date: '2026-07-12', title: 'Second hyperscaler qualifies MI400 for inference fleet', source: { label: 'Company press (sample)', date: '2026-07-12', kind: 'sample_data' }, materiality: 'material', why: 'Direct evidence on the share-gain assumption.', affectsAssumption: 'ROCm reaches "good enough"' },
    { date: '2026-06-20', title: 'Intel announces aggressive server CPU pricing for H2', source: { label: 'Industry press (sample)', date: '2026-06-20', kind: 'sample_data' }, materiality: 'relevant', why: 'Tests the underappreciated Intel-response risk; watch EPYC ASPs.' },
    { date: '2026-05-06', title: 'Q1 beat; Data Center +64% YoY', source: { label: 'Earnings release (sample)', date: '2026-05-06', kind: 'sample_data' }, materiality: 'relevant', why: 'Keeps revisions momentum positive.' },
  ],
  insiders: [{ date: '2026-06-12', who: 'CEO', action: 'sell-10b5-1', valueUsd: 12_000_000, note: 'Scheduled plan' }],
  qualityScores: [
    { key: 'managementCapital', label: 'Management & capital allocation', score: 8, basis: 'Roadmap execution + Xilinx integration; buybacks small but sensible.' },
    { key: 'moat', label: 'Competitive advantage', score: 5, basis: 'Narrow, strengthening; hinges on ROCm closing the software gap.' },
  ],
  snapshots: [
    { date: '2026-04-12', status: 'Watch', note: 'Added to watchlist with ≤$145 entry discipline.' },
    { date: '2026-07-15', status: 'Watch', note: 'Qualification wins strengthen thesis; price ran past entry zone — discipline holds.' },
  ],
}
