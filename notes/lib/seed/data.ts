/*
  Demo content. Dates are offsets in days from "now" so the product always
  looks current. Nothing here is hard-coded into the application logic — the
  pipeline derives entities, tasks, decisions, facts and timelines from these
  notes exactly as it would from yours.
*/
export interface SeedContext { id: string; slug: string; name: string; kind: 'work' | 'personal' | 'finance' | 'family' | 'research'; description: string; position: number }
export interface SeedEntity { ctx: string; type: 'person' | 'company' | 'project' | 'topic'; name: string; aliases?: string[]; attributes?: Record<string, string>; summary?: string; pinned?: boolean }
export interface SeedNote {
  id: string
  ctx: string
  title: string
  kind?: 'note' | 'meeting' | 'voice' | 'capture' | 'link' | 'document' | 'screenshot' | 'email'
  source?: string
  daysAgo: number
  hour?: number
  body: string
  favorite?: boolean
  research?: string
  sourceUrl?: string
  meeting?: { durationMin: number; participants: string[]; transcript?: { speaker: string; text: string }[]; location?: string }
}
export interface SeedMeetingUpcoming { id: string; ctx: string; title: string; daysAhead: number; hour: number; durationMin: number; participants: string[]; company?: string; location?: string }
export interface SeedResearch { id: string; ctx: string; name: string; slug: string; description: string; question: string; synthesis: string }
export interface SeedDecision { ctx: string; title: string; topic?: string; company?: string; context: string; reasoning: string; alternatives: string[]; history: { daysAgo: number; statement: string; kind: 'made' | 'confirmed' | 'modified' | 'contradicted' | 'proposed'; note: string }[] }

export const USER = { id: 'user_harsha', name: 'Harsha', email: 'harshasks@gmail.com' }

export const CONTEXTS: SeedContext[] = [
  { id: 'ctx_work', slug: 'work', name: 'Work', kind: 'work', description: 'Customers, partners, programs and the people behind them.', position: 0 },
  { id: 'ctx_personal', slug: 'personal', name: 'Personal', kind: 'personal', description: 'Ideas, journal, reading, training.', position: 1 },
  { id: 'ctx_finance', slug: 'finance', name: 'Finance', kind: 'finance', description: 'Portfolio, income programme, insurance, tax.', position: 2 },
  { id: 'ctx_family', slug: 'family', name: 'Family', kind: 'family', description: 'School, home, travel, health.', position: 3 },
  { id: 'ctx_research', slug: 'research', name: 'Research', kind: 'research', description: 'Long-running investigations with sources.', position: 4 },
]

export const ENTITIES: SeedEntity[] = [
  // Companies
  { ctx: 'ctx_work', type: 'company', name: 'Nissan', aliases: ['Nissan Motor'], attributes: { status: 'Active opportunity', stage: 'POC agreed', owner: 'Kavya Menon', location: 'Yokohama' }, pinned: true },
  { ctx: 'ctx_work', type: 'company', name: 'Samsung', aliases: ['Samsung SDS', 'Samsung Electronics'], attributes: { status: 'Pricing escalation', stage: 'Negotiation', location: 'Seoul' }, pinned: true },
  { ctx: 'ctx_work', type: 'company', name: 'TCS', aliases: ['Tata Consultancy Services'], attributes: { status: 'Partner expansion', stage: 'ODC framework', location: 'Mumbai' } },
  { ctx: 'ctx_work', type: 'company', name: 'ByteDance', aliases: [], attributes: { status: 'Renewal', stage: 'QBR prep', location: 'Singapore' }, pinned: true },
  { ctx: 'ctx_work', type: 'company', name: 'Tencent', aliases: ['Tencent Cloud'], attributes: { status: 'Capacity discussion', stage: 'Exploratory', location: 'Shenzhen' } },
  { ctx: 'ctx_work', type: 'company', name: 'Manus', aliases: [], attributes: { status: 'Quality follow-up', stage: 'Startup — growth', location: 'Singapore' } },
  { ctx: 'ctx_work', type: 'company', name: 'Microsoft', aliases: ['MSFT'], attributes: { status: 'Competitor / incumbent' } },
  { ctx: 'ctx_work', type: 'company', name: 'Anthropic', aliases: [], attributes: { status: 'Partner and competitor' } },
  { ctx: 'ctx_work', type: 'company', name: 'Google Cloud', aliases: ['GCP'], attributes: { status: 'Home team' } },
  // People
  { ctx: 'ctx_work', type: 'person', name: 'Stephen Ma', aliases: ['Nissan CFO'], attributes: { role: 'CFO', company: 'Nissan', location: 'Yokohama' } },
  { ctx: 'ctx_work', type: 'person', name: 'Kenji Hirokawa', aliases: ['Hirokawa', 'Hirokawa-san'], attributes: { role: 'Head of Digital Finance', company: 'Nissan' } },
  { ctx: 'ctx_work', type: 'person', name: 'Thomas Lindqvist', aliases: ['Thomas'], attributes: { role: 'Head of Partner Programs, APAC', company: 'Google Cloud' }, pinned: true },
  { ctx: 'ctx_work', type: 'person', name: 'Kavya Menon', aliases: ['Kavya'], attributes: { role: 'Account Executive, Nissan', company: 'Google Cloud' } },
  { ctx: 'ctx_work', type: 'person', name: 'Marcus Chen', aliases: ['Marcus'], attributes: { role: 'Solutions Architect', company: 'Google Cloud' } },
  { ctx: 'ctx_work', type: 'person', name: 'Aisha Rahman', aliases: ['Aisha'], attributes: { role: 'Deal Desk Lead', company: 'Google Cloud' } },
  { ctx: 'ctx_work', type: 'person', name: 'Daniel Okafor', aliases: ['Daniel'], attributes: { role: 'Product Lead, Agent Platform', company: 'Google Cloud' } },
  { ctx: 'ctx_work', type: 'person', name: 'Jihoon Park', aliases: ['Jihoon'], attributes: { role: 'VP AI Platform', company: 'Samsung' } },
  { ctx: 'ctx_work', type: 'person', name: 'Min-jun Lee', aliases: ['Min-jun'], attributes: { role: 'Procurement Lead', company: 'Samsung' } },
  { ctx: 'ctx_work', type: 'person', name: 'Rajesh Iyer', aliases: ['Rajesh'], attributes: { role: 'Global Head, AI.Cloud', company: 'TCS' } },
  { ctx: 'ctx_work', type: 'person', name: 'Priya Nair', aliases: ['Priya'], attributes: { role: 'Delivery Partner', company: 'TCS' } },
  { ctx: 'ctx_work', type: 'person', name: 'Wei Zhang', aliases: ['Wei'], attributes: { role: 'Head of Infrastructure Procurement', company: 'ByteDance' } },
  { ctx: 'ctx_work', type: 'person', name: 'Li Wen', aliases: [], attributes: { role: 'AI Partnerships', company: 'Tencent' } },
  { ctx: 'ctx_work', type: 'person', name: 'Ren Xiaobo', aliases: ['Ren'], attributes: { role: 'CTO', company: 'Manus' } },
  // Topics
  { ctx: 'ctx_work', type: 'topic', name: 'Marketplace caps', aliases: ['marketplace cap', 'cap exception', 'cap exceptions'], pinned: true },
  { ctx: 'ctx_work', type: 'topic', name: 'Gemini Enterprise', aliases: ['GE'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Activation', aliases: ['activation metrics', 'activated accounts'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Agent Platform', aliases: ['agent builder'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Tokenomics', aliases: ['token economics', 'per-token pricing'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Treasury POC', aliases: ['treasury pilot'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Dedicated PayGo capacity', aliases: ['dedicated capacity', 'reserved PayGo'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Anthropic positioning', aliases: ['losing to Anthropic', 'Claude positioning'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Coding agents', aliases: ['coding agent', 'code agents'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Microsoft economics', aliases: ['O365 economics', 'Copilot economics'] },
  { ctx: 'ctx_work', type: 'topic', name: 'ODCs', aliases: ['ODC', 'offshore development centers', 'offshore development centres'] },
  { ctx: 'ctx_work', type: 'topic', name: 'Model quality', aliases: ['quality regression', 'quality follow-up'] },
  // Projects
  { ctx: 'ctx_work', type: 'project', name: 'Anthropic Program', aliases: ['Claude on Vertex program'], attributes: { status: 'Cap decision unresolved', owner: 'Thomas Lindqvist' } },
  { ctx: 'ctx_work', type: 'project', name: 'Nissan Finance AI Task Force', aliases: ['task force'], attributes: { status: 'POC phase', owner: 'Kavya Menon' } },
  // Research topics
  { ctx: 'ctx_research', type: 'topic', name: 'Leveraged ETFs', aliases: ['LETF', 'leveraged ETF'] },
  { ctx: 'ctx_research', type: 'topic', name: 'Irish ETFs', aliases: ['UCITS', 'Irish-domiciled ETFs'] },
  { ctx: 'ctx_research', type: 'topic', name: 'India tax', aliases: ['DTAA', 'NRI tax'] },
  { ctx: 'ctx_research', type: 'topic', name: 'Real estate', aliases: ['property'] },
  { ctx: 'ctx_finance', type: 'topic', name: 'Options income', aliases: ['covered calls', 'weekly options'] },
  { ctx: 'ctx_finance', type: 'topic', name: 'Portfolio', aliases: ['allocation'] },
  { ctx: 'ctx_family', type: 'person', name: 'Aarav', aliases: [], attributes: { role: 'Son' } },
  { ctx: 'ctx_family', type: 'person', name: 'Amma', aliases: ['Mom'], attributes: { role: 'Mother' } },
  { ctx: 'ctx_personal', type: 'topic', name: 'Marathon training', aliases: ['long run', 'training block'] },
  { ctx: 'ctx_personal', type: 'topic', name: 'Reading', aliases: ['books'] },
]

export const RESEARCH: SeedResearch[] = [
  {
    id: 'rp_letf', ctx: 'ctx_research', name: 'Leveraged ETFs', slug: 'leveraged-etfs',
    description: 'Whether a small, rules-based allocation to 2x/3x index ETFs improves long-run outcomes after volatility decay.',
    question: 'Does a 10–20% sleeve of leveraged index ETFs, rebalanced quarterly, beat plain SPY over 20 years after decay and fees?',
    synthesis: 'Across the sources collected so far, daily-reset leveraged ETFs compound at roughly (leverage × return) − (leverage² − leverage)/2 × variance. In calm, trending regimes 2x has historically outperformed; in choppy years (2011, 2015, 2018, 2022) decay dominates. A rebalanced 60/40-style split between UPRO and a bond/cash sleeve (the "HFEA" idea) has strong backtests but a 2022-style joint drawdown of ~65%. Fees run 0.9–1.0% versus 0.03% for SPY. Working conclusion: cap the sleeve at 10%, rebalance quarterly, and treat it as a satellite, not core.',
  },
  {
    id: 'rp_irish', ctx: 'ctx_research', name: 'Irish ETFs', slug: 'irish-etfs',
    description: 'Irish-domiciled UCITS ETFs versus US-listed ETFs for a Singapore-based investor: withholding tax, estate tax, TER, liquidity.',
    question: 'Should the core equity allocation move from VOO/VTI to CSPX/VWRA?',
    synthesis: 'For a non-US investor with no US tax treaty (Singapore), Irish-domiciled accumulating ETFs cut dividend withholding from 30% to 15% at the fund level and remove US estate-tax exposure above the $60K threshold. Cost: TER of 0.07% (CSPX) vs 0.03% (VOO), thinner spreads on LSE (~2–4 bps), and no dividend cash flow. On a $1M position the withholding difference alone is ~$2.2K a year. Working conclusion: migrate new contributions to CSPX/VWRA; leave existing VOO lots until a low-gain year.',
  },
  {
    id: 'rp_india', ctx: 'ctx_research', name: 'India tax strategy', slug: 'india-tax-strategy',
    description: 'NRI status, NRE/NRO accounts, DTAA with Singapore, and the treatment of Indian mutual funds and property income.',
    question: 'What is the cleanest structure for Indian assets while resident in Singapore?',
    synthesis: 'Interest on NRE accounts is tax-free in India and Singapore does not tax foreign-sourced income unless remitted (and even then the exemption generally applies to individuals). Indian equity MF gains: LTCG 12.5% above ₹1.25L, STCG 20%. Under the India–Singapore DTAA, capital gains on shares acquired after 1 April 2017 are taxed in India. Rental income is taxable in India with a 30% standard deduction. Working conclusion: keep NRE for deposits, route rental income through NRO with a CA filing the return, and avoid new Indian MF purchases from Singapore.',
  },
  {
    id: 'rp_realestate', ctx: 'ctx_research', name: 'Real estate', slug: 'real-estate',
    description: 'Buy vs rent in Singapore, and whether a Bangalore rental property is worth keeping.',
    question: 'Does buying a 3-bedroom condo in Singapore beat renting over a 10-year horizon?',
    synthesis: 'At current prices (~S$2.3M for a 3-bed in District 15) and 3.2% mortgage rates, monthly ownership cost (interest + maintenance + property tax) is roughly S$8.4K against S$6.5K rent for an equivalent unit. Buying only wins if price appreciation exceeds ~2.5% a year. The Bangalore flat yields 2.1% gross with rising maintenance; selling triggers LTCG but frees capital for the Irish ETF plan. Working conclusion: keep renting in Singapore; list the Bangalore flat after the current tenant leaves.',
  },
]

const NISSAN_CFO_TRANSCRIPT = [
  { speaker: 'Stephen Ma', text: 'Thank you for coming down. We have been looking at how AI fits into the finance function, and honestly the picture is fragmented. Every region has its own reconciliation process.' },
  { speaker: 'Harsha', text: 'That matches what Hirokawa-san shared on the first. The task force flagged six separate close processes across regions.' },
  { speaker: 'Kenji Hirokawa', text: 'Seven now. The Americas team added one for the Mexico plant. Which is why treasury is the right starting point — it is the most centralised piece we have.' },
  { speaker: 'Stephen Ma', text: 'Treasury will participate in an initial proof of concept. We want to see cash forecasting and the O365 integration working with real data before anything broader.' },
  { speaker: 'Harsha', text: 'Understood. Our team will define the POC use cases with treasury and send the enablement plan by next Friday.' },
  { speaker: 'Kenji Hirokawa', text: 'I will review the Microsoft economics separately. We have a large O365 estate and the Copilot bundle numbers need to be compared honestly against Gemini Enterprise.' },
  { speaker: 'Stephen Ma', text: 'If the POC lands well and the economics are clear, a September close is possible. Budget is provisioned this fiscal year.' },
  { speaker: 'Harsha', text: 'That is a strong signal. We will keep the scope tight — cash forecasting, invoice matching, and the O365 connector.' },
  { speaker: 'Kenji Hirokawa', text: 'One concern: data residency for Japan. Legal will want the data to stay in Tokyo region.' },
  { speaker: 'Harsha', text: 'Tokyo region is supported for Gemini Enterprise. I will confirm the exact SKU list in writing.' },
]

const SAMSUNG_TRANSCRIPT = [
  { speaker: 'Jihoon Park', text: 'Let me be direct. The board approved the platform program but procurement is pushing back on the commercial terms.' },
  { speaker: 'Min-jun Lee', text: 'The request is now a 40% discount on the committed spend, up from the 30% we discussed in August. Plus a 3% buffer on top of the commit for overage.' },
  { speaker: 'Harsha', text: 'Forty is above what the deal desk has approved for any APAC account this year. Help me understand what changed since August.' },
  { speaker: 'Jihoon Park', text: 'Two things. Anthropic came in with an aggressive number through the marketplace, and internal benchmarks on coding agents favoured Claude for two of our teams.' },
  { speaker: 'Harsha', text: 'Understood. I will take the 40% ask to Aisha at the deal desk and come back with a position by Tuesday. The buffer I think we can structure as a true-up rather than a discount.' },
  { speaker: 'Min-jun Lee', text: 'A true-up works if the rate card is locked for three years.' },
  { speaker: 'Jihoon Park', text: 'And we want the coding agent benchmark rerun on the latest model before the decision. Our data was from July.' },
  { speaker: 'Harsha', text: 'Marcus will rerun the benchmark with your team this week.' },
]

export const NOTES: SeedNote[] = [
  /* ------------------------------------------------------------------ WORK */
  {
    id: 'note_nissan_taskforce', ctx: 'ctx_work', title: 'Nissan — Initial task force discussion', kind: 'meeting', daysAgo: 43, hour: 10,
    meeting: { durationMin: 60, participants: ['Kenji Hirokawa', 'Kavya Menon', 'Marcus Chen'], location: 'Yokohama HQ' },
    body: `First working session with Nissan's Finance AI Task Force. Hirokawa-san leads it and reports into Stephen Ma, the Nissan CFO.

## Context
- Nissan is exploring AI integration into finance workflows, starting with reconciliation and cash forecasting.
- Six separate month-end close processes across regions. Each region built its own tooling.
- Finance runs on a large O365 estate; Microsoft is pushing Copilot for Finance hard.

## Discussion
- Hirokawa wants a narrow, measurable pilot rather than a platform conversation.
- Kavya to map the regional close owners and propose a pilot region.
- Marcus to prepare a demo of Gemini Enterprise connected to a sandbox O365 tenant.
- Data residency: Japan legal will require Tokyo region for any finance data.

## Next steps
- [ ] Kavya: map regional close owners and propose pilot region
- [ ] Marcus: prepare Gemini Enterprise + O365 sandbox demo
- [ ] Harsha: share reference customer story from the automotive finance team`,
  },
  {
    id: 'note_samsung_kickoff', ctx: 'ctx_work', title: 'Samsung SDS — AI platform kickoff', kind: 'meeting', daysAgo: 38, hour: 14,
    meeting: { durationMin: 45, participants: ['Jihoon Park', 'Min-jun Lee', 'Marcus Chen'], location: 'Google Meet' },
    body: `Kickoff with Samsung SDS for the group AI platform program. Jihoon Park (VP AI Platform) sponsors; Min-jun Lee runs procurement.

- Scope: a shared model gateway for 14 business units, Gemini as default model, Claude via the marketplace for coding teams.
- Samsung wants a 30% discount on a $12M annual commit. Aisha said 22% is the current ceiling without an exception.
- Requested discount: 30%
- Annual commit: $12M
- Jihoon flagged that two engineering teams prefer Claude for coding agents based on a July benchmark.
- Min-jun asked whether marketplace purchases of Anthropic models count toward the commit. Today they count up to the 25% marketplace cap.

Decision: Samsung will run the platform program on Google Cloud; the model mix stays open until the pricing decision.

- [ ] Aisha: check discount exception path for a $12M commit
- [ ] Marcus: rerun the coding agent benchmark with Samsung's data
- [ ] Harsha: send Samsung the marketplace cap policy in writing`,
  },
  {
    id: 'note_tcs_odc', ctx: 'ctx_work', title: 'TCS — ODC discussion', kind: 'meeting', daysAgo: 35, hour: 11,
    meeting: { durationMin: 50, participants: ['Rajesh Iyer', 'Priya Nair', 'Thomas Lindqvist'], location: 'Mumbai' },
    body: `Rajesh Iyer wants to stand up offshore development centers (ODCs) dedicated to Google Cloud AI delivery. Three centres proposed: Pune, Chennai, Hyderabad, with 400 engineers in the first year.

- TCS asked for co-funded enablement: they cover headcount, we cover certification and lab credits.
- Priya raised that ODC engineers need hands-on Agent Platform access before customer work starts.
- Thomas offered partner program credits worth $1.2M across the three ODCs.

Decision: We agreed with TCS that the ODCs will be Google Cloud-first, with Anthropic models available only through the marketplace.

Risk: TCS also runs an Azure OpenAI practice; if enablement slips they will staff from that bench.

- [ ] Thomas: confirm partner credits allocation by end of month
- [ ] Priya: send ODC ramp plan with headcount by quarter
- [ ] Harsha: introduce Daniel Okafor for Agent Platform early access`,
  },
  {
    id: 'note_bytedance_review', ctx: 'ctx_work', title: 'ByteDance — commercial review', kind: 'meeting', daysAgo: 30, hour: 16,
    meeting: { durationMin: 40, participants: ['Wei Zhang', 'Aisha Rahman'], location: 'Singapore office' },
    body: `Commercial review ahead of the ByteDance renewal. Wei Zhang runs infrastructure procurement.

## Numbers
- Revenue: $7.6M trailing twelve months
- Gemini: $5M of that is Gemini consumption
- Model share: 15% of their total model spend is with us
- Requested discount: 45% on the renewal

## Discussion
- Wei was clear that 45% is the anchor because Anthropic and a domestic provider are both bidding.
- They want dedicated PayGo capacity for peak inference windows — no commit, but guaranteed throughput.
- Aisha said anything above 30% needs VP approval and a strategic-account justification.

Decision: We will not go above 30% without dedicated capacity being part of the package.

- [ ] Aisha: draft the strategic-account justification
- [ ] Harsha: get Daniel's view on dedicated PayGo capacity feasibility
- Waiting on Wei to share their peak throughput numbers.`,
  },
  {
    id: 'note_tencent_sync', ctx: 'ctx_work', title: 'Tencent — partnership sync', kind: 'meeting', daysAgo: 25, hour: 15,
    meeting: { durationMin: 30, participants: ['Li Wen'], location: 'Google Meet' },
    body: `Short sync with Li Wen from Tencent Cloud's AI partnerships team.

- Tencent is interested in reselling Gemini to overseas game studios; regulatory constraints in China mean this is APAC-ex-China only.
- Li asked about tokenomics for high-volume gaming inference: they need per-token pricing below $0.10 per million for the small model tier to make the resale margin work.
- They also raised dedicated PayGo capacity for launch windows, similar to what ByteDance asked for.

Follow up: I will come back to Li with the tokenomics deck once Daniel's team finalises the small-model tier pricing.

Open question: can a reseller hold dedicated capacity on behalf of multiple end customers?`,
  },
  {
    id: 'note_anthropic_positioning', ctx: 'ctx_work', title: 'Where we are losing to Anthropic', daysAgo: 21, hour: 9,
    favorite: true,
    body: `Pulled together the last month of competitive notes. Pattern is consistent enough to write down.

## Where Anthropic wins
- Coding agents: Samsung, ByteDance and a fintech in Jakarta all benchmarked Claude ahead for agentic coding. Our July numbers on 3.8 Flash were the comparison in every case.
- Marketplace caps: customers can only put 25% of their commit through the marketplace, so buying Claude via us is capped while buying Claude direct is not. This is the single most cited friction.
- Sales motion: Anthropic's enterprise team quotes fast and quotes aggressive.

## Where we win
- Gemini Enterprise for knowledge workers with an O365 or Workspace estate.
- Data residency and region coverage (Tokyo, Seoul, Mumbai).
- Tokenomics at the small-model tier.

## What I think
- The marketplace cap is a policy we control. Raising it for strategic accounts removes the friction without changing price.
- We need the coding agent benchmark rerun on the current model at every account where July numbers are being cited.

Risk: three renewals in Q4 cite the cap as a blocker.`,
  },
  {
    id: 'note_cap_aug28', ctx: 'ctx_work', title: 'Anthropic Program steering — marketplace cap review', kind: 'meeting', daysAgo: 15, hour: 13,
    meeting: { durationMin: 45, participants: ['Thomas Lindqvist', 'Aisha Rahman', 'Daniel Okafor'], location: 'Google Meet' },
    body: `Steering call for the Anthropic Program. Main item: whether to change the marketplace cap.

- Thomas presented the request volume: 8 customer conversations this month asked for cap exceptions.
- Aisha's view: exceptions should be rare and tied to a strategic-account list.
- Daniel: raising the cap changes the mix toward third-party models and affects Agent Platform adoption targets.

Decision: The marketplace cap remains at 25% for now. Exceptions go through the deal desk case by case.

- [ ] Thomas: compile the strategic-account list for cap exceptions
- [ ] Harsha: bring Samsung and ByteDance cases to the next steering call`,
  },
  {
    id: 'note_nissan_fragmentation', ctx: 'ctx_work', title: 'Nissan — Finance fragmentation discussion', kind: 'meeting', daysAgo: 11, hour: 10,
    meeting: { durationMin: 60, participants: ['Kenji Hirokawa', 'Kavya Menon', 'Marcus Chen'], location: 'Yokohama HQ' },
    body: `Second task force session with Hirokawa-san. The demo landed.

- Marcus showed Gemini Enterprise reading from a sandbox O365 tenant and drafting a reconciliation summary. Hirokawa asked for the same on real treasury data.
- Kavya's map shows seven close processes now (Mexico plant added one). Treasury is the most centralised function and the obvious pilot.
- Hirokawa will bring the CFO into the next session and wants a one-page economics comparison against the Copilot bundle.
- Microsoft has offered Nissan a Copilot for Finance bundle at 20% discount across the O365 estate.

Decision: Treasury is the proposed pilot function; the CFO decides on the third.

- [ ] Harsha: prepare one-page economics comparison vs Copilot bundle
- [ ] Marcus: prepare treasury data demo with anonymised extracts
- [ ] Kavya: confirm CFO attendance and agenda`,
  },
  {
    id: 'note_nissan_cfo', ctx: 'ctx_work', title: 'Nissan — CFO meeting', kind: 'meeting', daysAgo: 9, hour: 14,
    favorite: true,
    meeting: { durationMin: 50, participants: ['Stephen Ma', 'Kenji Hirokawa', 'Kavya Menon'], location: 'Yokohama HQ', transcript: NISSAN_CFO_TRANSCRIPT },
    body: `Spoke to Stephen Ma, the Nissan CFO, with Hirokawa-san and Kavya. Nissan is exploring AI integration into finance workflows and the picture is fragmented across regions.

- Treasury team will run a POC around the O365 integration with real data — cash forecasting, invoice matching, O365 connector.
- Team to send the enablement plan by next Friday.
- Hirokawa to review the Microsoft economics separately; the Copilot bundle numbers must be compared honestly against Gemini Enterprise.
- Potential September close if the POC lands and the economics are clear. Budget is provisioned this fiscal year.
- Data residency: Japan legal will want Tokyo region. I will confirm the exact SKU list in writing.

Decision: Treasury POC will proceed.

Risk: Microsoft economics remain part of the decision.`,
  },
  {
    id: 'note_cap_sep4', ctx: 'ctx_work', title: 'Marketplace cap — proposal to raise for strategic accounts', daysAgo: 8, hour: 9,
    body: `Wrote up the proposal for Thomas after the Samsung and ByteDance conversations.

Proposal: raise the marketplace cap from 25% to 50–75% for named strategic accounts, reviewed quarterly.

## Reasoning
- Eight customer conversations this month asked for a cap exception. Handling them case by case is slower than the Anthropic direct quote.
- The cap does not change our price; it changes where the customer buys a model we already carry.
- Agent Platform adoption is better protected by being the platform than by limiting model choice.

## Alternatives considered
- Keep 25% and speed up the exception process (Aisha's preference).
- Remove the cap entirely (Daniel's concern about mix).

Thomas will take it to the steering call. Waiting on Thomas for a slot on the agenda.`,
  },
  {
    id: 'note_nissan_poc_agreed', ctx: 'ctx_work', title: 'Nissan — Treasury POC agreed', kind: 'meeting', daysAgo: 8, hour: 16,
    meeting: { durationMin: 30, participants: ['Kenji Hirokawa', 'Kavya Menon'], location: 'Google Meet' },
    body: `Quick follow-up with Hirokawa-san to lock the POC.

- Treasury POC agreed: four weeks, starting the week of the 21st, three use cases.
- Use cases to be defined jointly by Friday: cash forecasting, invoice matching, and the O365 connector.
- Nissan wants a named success metric per use case before kickoff.
- Hirokawa still reviewing the Microsoft economics; he asked for our one-pager by Wednesday.

- [ ] Harsha: define Treasury POC use cases with the treasury team by Friday
- [ ] Kavya: draft success metrics per use case
- [ ] Harsha: send Nissan the enablement plan`,
  },
  {
    id: 'note_manus_quality', ctx: 'ctx_work', title: 'Manus — 3.8 Flash quality follow-up', kind: 'meeting', daysAgo: 7, hour: 11,
    meeting: { durationMin: 30, participants: ['Ren Xiaobo', 'Daniel Okafor'], location: 'Google Meet' },
    body: `Ren Xiaobo (Manus CTO) reported a quality regression on 3.8 Flash for their agent planning step. Daniel joined from product.

- Manus runs roughly 40M requests a day on Flash; the planning step is 20% of that volume.
- Their eval shows a 6% drop in task completion after the last model update.
- Daniel to get the eval traces into the model quality team and come back with a root cause.
- Ren asked whether they can pin the previous model version for 30 days.

Decision: Manus can pin the previous version for 30 days while the regression is investigated.

- [ ] Daniel: root cause the 3.8 Flash planning regression with Manus eval traces
- [ ] Harsha: follow up with Ren on the quality investigation next week

Waiting on Daniel for the root cause before we reply to Ren formally.`,
  },
  {
    id: 'note_samsung_escalation', ctx: 'ctx_work', title: 'Samsung — pricing escalation', kind: 'meeting', daysAgo: 6, hour: 10,
    favorite: true,
    meeting: { durationMin: 45, participants: ['Jihoon Park', 'Min-jun Lee', 'Marcus Chen'], location: 'Seoul', transcript: SAMSUNG_TRANSCRIPT },
    body: `Met Jihoon Park and Min-jun Lee in Seoul. Procurement has pushed back on the terms from August.

- Requested discount: 40% on the $12M commit, up from the 30% ask in August.
- Samsung also wants a 3% buffer on top of the commit for overage.
- What changed: Anthropic quoted aggressively through the marketplace, and the July coding agent benchmark favoured Claude for two teams.
- Min-jun will accept a true-up structure instead of a discount for the buffer if the rate card is locked for three years.

I will take the 40% ask to Aisha at the deal desk and come back with a position by Tuesday.

- [ ] Marcus: rerun the coding agent benchmark with Samsung's team this week
- [ ] Harsha: deal desk position on 40% by Tuesday

Risk: Samsung is the largest account citing the marketplace cap as a blocker.`,
  },
  {
    id: 'note_activation_sync', ctx: 'ctx_work', title: 'Gemini Enterprise activation sync with Thomas', kind: 'meeting', daysAgo: 5, hour: 9,
    meeting: { durationMin: 30, participants: ['Thomas Lindqvist'], location: 'Google Meet' },
    body: `Weekly activation sync with Thomas.

- 12 accounts activated on Gemini Enterprise this quarter against a target of 20.
- Activation is stalling at the O365 connector step for 5 accounts — the same friction Nissan raised.
- Thomas wants a shared activation playbook: connector setup, first three use cases, success metric.
- We discussed whether activation should count seats or active users. Thomas prefers active users: 30-day active is the honest number.

Decision: Activation will be measured on 30-day active users, not provisioned seats.

- [ ] Harsha: draft the activation playbook using the Nissan treasury use cases
- [ ] Thomas: get the O365 connector fixes prioritised with Daniel's team

I promised Thomas the playbook draft before the next sync.`,
  },
  {
    id: 'note_cap_sep8', ctx: 'ctx_work', title: 'Marketplace cap — 100% requested for strategic customers', daysAgo: 4, hour: 17,
    body: `Deal desk escalation from Aisha. Both ByteDance and Samsung have now formally requested that 100% of their commit be usable through the marketplace for strategic customers.

- Aisha's read: the 50–75% proposal is now the moderate option.
- Wei Zhang put it in writing in the renewal response; Min-jun Lee raised it verbally in Seoul.
- Thomas will present all three options (25% status quo, 50–75% tiered, 100% for strategic) at the steering call on Wednesday.

This is the third time the cap has moved in two weeks. Decision is unresolved until the steering call.

- [ ] Harsha: prepare the customer impact summary for the steering call by Tuesday`,
  },
  {
    id: 'note_tcs_followup', ctx: 'ctx_work', title: 'TCS — ODC follow-up', kind: 'meeting', daysAgo: 3, hour: 12,
    meeting: { durationMin: 30, participants: ['Priya Nair', 'Rajesh Iyer'], location: 'Google Meet' },
    body: `Priya sent the ODC ramp plan: 120 engineers in Q4, 400 by Q2 next year, split Pune 180, Chennai 120, Hyderabad 100.

- Rajesh confirmed the ODCs will be Google Cloud-first; Anthropic models only through the marketplace, consistent with what we agreed.
- Daniel gave the Pune team Agent Platform early access last week.
- Partner credits: Thomas confirmed $1.2M allocated across the three ODCs.
- Priya asked for a joint go-to-market plan for the first five customers.

- [ ] Harsha: draft the joint GTM plan for the first five ODC customers
- [ ] Priya: nominate the five target customers by next week`,
  },
  {
    id: 'note_pipeline_review', ctx: 'ctx_work', title: 'Weekly pipeline review', daysAgo: 2, hour: 17,
    body: `Friday pipeline review notes.

## Nissan
- Treasury POC on track for the week of the 21st. Use cases still not defined — need this by Friday.
- Enablement plan still owed to Nissan. Committed four days ago.

## Samsung
- Deal desk position on 40%: Aisha can support 32% with a three-year rate lock. Need to present Tuesday.
- Benchmark rerun scheduled for Monday.

## ByteDance
- QBR on Thursday. Wei expects an answer on dedicated PayGo capacity.
- Renewal risk if the cap question is not resolved at Wednesday's steering call.

## Manus
- Still waiting on Daniel for the 3.8 Flash root cause.

## Tencent
- Owe Li Wen the tokenomics deck.

- [ ] Harsha: send enablement plan to Nissan
- [ ] Harsha: present deal desk position to Samsung on Tuesday
- [ ] Harsha: prepare ByteDance QBR with dedicated capacity answer`,
  },
  {
    id: 'note_capture_samsung', ctx: 'ctx_work', title: '', kind: 'capture', source: 'quick-capture', daysAgo: 1, hour: 11,
    body: `Samsung wants additional 3% buffer on top of the commit — Min-jun confirmed in email this morning. Buffer is a true-up, not a discount.`,
  },
  {
    id: 'note_capture_tencent', ctx: 'ctx_work', title: '', kind: 'capture', source: 'quick-capture', daysAgo: 1, hour: 14,
    body: `Tencent asked for dedicated PayGo capacity again for their October game launch. Third customer this month raising dedicated capacity after ByteDance and Manus.`,
  },
  {
    id: 'note_link_anthropic', ctx: 'ctx_work', title: 'Anthropic expands enterprise marketplace availability', kind: 'link', source: 'share', daysAgo: 1, hour: 8,
    sourceUrl: 'https://www.anthropic.com/news',
    body: `Shared link. Anthropic announced broader availability of Claude through cloud marketplaces with committed-spend drawdown, positioning it directly against marketplace caps at hyperscalers. Relevant for the Wednesday steering call and the Samsung and ByteDance conversations.`,
  },
  {
    id: 'note_voice_drive', ctx: 'ctx_work', title: 'Voice note — after Seoul', kind: 'voice', source: 'voice', daysAgo: 6, hour: 13,
    body: `Voice note recorded in the taxi after the Samsung meeting. Jihoon is genuinely open but Min-jun is running the process and the number that matters to him is the three-year rate lock, not the discount. I think we can land at 32% with the lock and a true-up for the buffer. Need to call Aisha before Tuesday and get Marcus the benchmark data from Samsung's team. Also remind myself to send Thomas the activation playbook — I promised it last week.`,
  },
  /* -------------------------------------------------------------- PERSONAL */
  {
    id: 'note_marathon', ctx: 'ctx_personal', title: 'Marathon training block — weeks 5–8', daysAgo: 4, hour: 7, favorite: true,
    body: `Second block of the plan. Long runs move to Sunday mornings at East Coast Park.

| Week | Long run | Total km |
| --- | --- | --- |
| 5 | 24 km | 58 km |
| 6 | 26 km | 62 km |
| 7 | 28 km | 66 km |
| 8 | 20 km (down week) | 50 km |

- Easy pace stays at 5:50/km; tempo at 4:45/km.
- Left calf tightness after week 4 — strength work twice a week, not once.
- [ ] Book physio for calf before week 6
- [ ] Order new shoes (current pair at 640 km)`,
  },
  {
    id: 'note_reading', ctx: 'ctx_personal', title: 'Reading list — September', daysAgo: 10, hour: 21,
    body: `- *The Idea Factory* — Bell Labs history. Halfway. The chapter on Shannon is worth re-reading.
- *Range* — finished. Main takeaway: sampling periods matter more than early specialisation.
- *Slow Productivity* — started, not convinced yet.

Idea: write up how the Bell Labs "critical mass of people in one building" idea applies to the ODC conversation at work.`,
  },
  {
    id: 'note_journal', ctx: 'ctx_personal', title: 'Sunday journal', daysAgo: 6, hour: 20,
    body: `Good week. Seoul trip was tiring but the meeting was honest, which is rare. Ran 26 km on Sunday and felt fine until the last 3 km.

Thinking about whether the current pace of travel is sustainable through Q4 — three trips in the next four weeks. Need to protect Sunday mornings.

- [ ] Block Sunday mornings in the calendar through November`,
  },
  /* --------------------------------------------------------------- FINANCE */
  {
    id: 'note_portfolio_aug', ctx: 'ctx_finance', title: 'Portfolio review — August', daysAgo: 12, hour: 19, favorite: true,
    body: `Monthly review.

- Total portfolio: $1.84M
- Equity allocation: 72% (target 70%)
- Cash: 9%
- Options income YTD: $86,457 across 131 trades

Observations:
- VOO position has $210K unrealised gains; the Irish ETF migration (CSPX) should start with new contributions only.
- Bond sleeve is 19% — slightly under the 21% target after the equity run.
- [ ] Rebalance 2% from equities to bonds at the next contribution
- [ ] Set up CSPX purchases on IBKR for the October contribution`,
  },
  {
    id: 'note_options_wk36', ctx: 'ctx_finance', title: 'Options income — week 36', daysAgo: 8, hour: 18,
    body: `Friday write completed on schedule. Five names, all within the delta rule.

- Premium collected: $2,340
- Positions: MSFT, AAPL, SPY, QQQ, META covered calls, one week out
- One position (META) is 2% from the strike after Monday's move — watch, do not roll.

Rule reminder: no rolling. If assigned, take it and rewrite the following Friday.`,
  },
  {
    id: 'note_insurance', ctx: 'ctx_finance', title: 'Insurance renewal', daysAgo: 20, hour: 9,
    body: `Term life renews in November. Current cover S$2M at S$1,860 a year. Two quotes received:

| Insurer | Cover | Annual premium |
| --- | --- | --- |
| Current | S$2M | S$1,860 |
| Quote A | S$2M | S$1,640 |
| Quote B | S$2.5M | S$2,110 |

Leaning toward Quote B — the extra cover is cheap at this age.

- [ ] Decide on insurance quote by end of October
- Waiting on Quote B underwriting questionnaire.`,
  },
  /* ---------------------------------------------------------------- FAMILY */
  {
    id: 'note_school', ctx: 'ctx_family', title: 'School options for Aarav', daysAgo: 14, hour: 20, favorite: true,
    body: `Aarav moves to secondary next year. Three options visited.

- Option 1: current school's secondary section. Known quantity, 10 minutes away, S$2,400 a month.
- Option 2: international school in the east. Strong STEM, 25 minutes, S$3,900 a month, waitlist.
- Option 3: local school via the DSA route. Excellent academics, needs a portfolio submission by October.

Aarav prefers Option 2 for the robotics lab. We prefer Option 1 for the commute.

- [ ] Submit DSA portfolio for Option 3 by October
- [ ] Visit Option 2 robotics lab with Aarav
- Decision: we will apply to all three and decide in November.`,
  },
  {
    id: 'note_amma_visit', ctx: 'ctx_family', title: "Amma's visit in October", daysAgo: 9, hour: 21,
    body: `Amma arrives 18 October for six weeks.

- [ ] Book flights (BLR–SIN, 18 Oct; return 29 Nov)
- [ ] Apply for the long-stay visa extension — needs the invitation letter and a bank statement
- [ ] Book the cardiologist follow-up for the second week
- Ask her to bring the property papers for the Bangalore flat.`,
  },
  {
    id: 'note_renovation', ctx: 'ctx_family', title: 'Kitchen renovation quotes', daysAgo: 17, hour: 19,
    body: `Three contractors quoted for the kitchen.

| Contractor | Quote | Timeline |
| --- | --- | --- |
| A | S$38,000 | 6 weeks |
| B | S$31,500 | 8 weeks |
| C | S$44,000 | 5 weeks |

Contractor B is the reference from the neighbours. We agreed to go with Contractor B if they can start in November.

- [ ] Confirm start date with Contractor B
- Waiting on Contractor B for the revised drawings.`,
  },
  /* -------------------------------------------------------------- RESEARCH */
  {
    id: 'note_letf_decay', ctx: 'ctx_research', title: 'Volatility decay — the actual math', daysAgo: 28, hour: 22, research: 'rp_letf',
    body: `Working through the decay formula for daily-reset leveraged ETFs.

For leverage L, daily return r and daily variance σ², the expected log growth is approximately L·μ − (L² − L)/2 · σ². For L = 3 and annual σ = 20%, the drag is roughly 3 × 0.04 / 2 × 2 = 12% a year in a flat market.

- In 2011 (flat year, high vol) UPRO returned −12% while SPY returned +2%.
- In 2017 (trending, low vol) UPRO returned +75% versus SPY +22%.
- Expense ratio: 0.91% for UPRO versus 0.03% for SPY.

Conclusion so far: the sleeve is a bet on regime, not on the index.`,
  },
  {
    id: 'note_letf_hfea', ctx: 'ctx_research', title: 'HFEA backtest notes', daysAgo: 20, hour: 22, research: 'rp_letf',
    body: `Read the long HFEA thread and reran the numbers with quarterly rebalancing.

- 55% UPRO / 45% TMF from 1987 (simulated): CAGR 17.8% versus 10.9% for SPY.
- Max drawdown: −65% in 2022 when stocks and long bonds fell together.
- The correlation assumption between stocks and bonds is the whole strategy.

Decision: cap any leveraged sleeve at 10% of the portfolio and rebalance quarterly.`,
  },
  {
    id: 'note_irish_withholding', ctx: 'ctx_research', title: 'Withholding tax: US vs Irish domicile', daysAgo: 24, hour: 21, research: 'rp_irish',
    body: `For a Singapore tax resident:

- US-listed ETF (VOO): 30% withholding on dividends, no treaty.
- Irish-domiciled ETF (CSPX): 15% withholding at fund level under the US–Ireland treaty, 0% on distribution to me.
- Estate tax: US-situs assets above $60,000 exposed to up to 40%; Irish ETFs are not US-situs.
- TER: CSPX 0.07%, VOO 0.03%.

On a $1M position with a 1.5% yield, the withholding difference is $2,250 a year. The TER difference is $400 a year.`,
  },
  {
    id: 'note_irish_liquidity', ctx: 'ctx_research', title: 'LSE liquidity and spreads for CSPX and VWRA', daysAgo: 13, hour: 21, research: 'rp_irish',
    body: `Checked spreads over five sessions on IBKR.

- CSPX: average spread 2 bps, depth fine for $50K clips.
- VWRA: average spread 4 bps.
- Trading hours overlap with Singapore evening — fine.

Decision: new contributions go to CSPX and VWRA from October; existing VOO lots stay until a low-gain year.`,
  },
  {
    id: 'note_india_dtaa', ctx: 'ctx_research', title: 'India–Singapore DTAA and capital gains', daysAgo: 18, hour: 22, research: 'rp_india',
    body: `Notes from the CA call.

- NRE interest: tax-free in India.
- Equity MF LTCG: 12.5% above ₹1.25 lakh; STCG 20%.
- Under the DTAA, gains on shares acquired after 1 April 2017 are taxable in India.
- Rental income taxable in India with a 30% standard deduction; TDS applies if the tenant is a company.

- [ ] Ask the CA whether the Bangalore flat sale would be LTCG at 12.5% with indexation removed
- Waiting on the CA for the NRO remittance limits note.`,
  },
  {
    id: 'note_realestate_buyrent', ctx: 'ctx_research', title: 'Buy vs rent — District 15 numbers', daysAgo: 16, hour: 22, research: 'rp_realestate',
    body: `Ran the comparison for a 3-bedroom in District 15.

- Purchase price: S$2.3M
- Mortgage rate: 3.2%
- Monthly ownership cost: S$8,400 (interest, maintenance, property tax)
- Equivalent rent: S$6,500 a month
- Break-even appreciation: 2.5% a year

Decision: keep renting in Singapore for now.`,
  },
  {
    id: 'note_realestate_blr', ctx: 'ctx_research', title: 'Bangalore flat — keep or sell', daysAgo: 5, hour: 22, research: 'rp_realestate',
    body: `- Gross yield: 2.1%
- Maintenance up 18% this year.
- Tenant leaves in December.
- Selling would fund roughly two years of the CSPX plan.

Decision: list the flat after the tenant leaves in December. Ask Amma to bring the property papers in October.`,
  },
]

export const UPCOMING: SeedMeetingUpcoming[] = [
  { id: 'mtg_nissan_poc_review', ctx: 'ctx_work', title: 'Nissan — Treasury POC use case review', daysAhead: 2, hour: 10, durationMin: 60, participants: ['Kenji Hirokawa', 'Kavya Menon', 'Marcus Chen'], company: 'Nissan', location: 'Yokohama HQ' },
  { id: 'mtg_samsung_decision', ctx: 'ctx_work', title: 'Samsung — pricing decision', daysAhead: 3, hour: 9, durationMin: 45, participants: ['Jihoon Park', 'Min-jun Lee', 'Aisha Rahman'], company: 'Samsung', location: 'Google Meet' },
  { id: 'mtg_steering', ctx: 'ctx_work', title: 'Anthropic Program steering — cap decision', daysAhead: 4, hour: 13, durationMin: 45, participants: ['Thomas Lindqvist', 'Aisha Rahman', 'Daniel Okafor'], location: 'Google Meet' },
  { id: 'mtg_bytedance_qbr', ctx: 'ctx_work', title: 'ByteDance QBR', daysAhead: 5, hour: 15, durationMin: 90, participants: ['Wei Zhang', 'Aisha Rahman', 'Daniel Okafor'], company: 'ByteDance', location: 'Singapore office' },
  { id: 'mtg_manus_followup', ctx: 'ctx_work', title: 'Manus — quality investigation update', daysAhead: 6, hour: 11, durationMin: 30, participants: ['Ren Xiaobo', 'Daniel Okafor'], company: 'Manus', location: 'Google Meet' },
  { id: 'mtg_physio', ctx: 'ctx_personal', title: 'Physio — calf', daysAhead: 3, hour: 18, durationMin: 45, participants: [], location: 'Katong' },
]

/* Curated decision history that makes institutional memory visible from day one. */
export const DECISIONS: SeedDecision[] = [
  {
    ctx: 'ctx_work', title: 'Marketplace cap strategy', topic: 'Marketplace caps', company: undefined,
    context: 'Customers can put a limited share of committed spend through the Google Cloud Marketplace for third-party models. Strategic accounts have asked for the cap to be raised or removed.',
    reasoning: 'The cap protects first-party model mix and Agent Platform adoption, but it is the most cited friction in competitive deals against Anthropic direct.',
    alternatives: ['Keep 25% and speed up exceptions', 'Tiered 50–75% for strategic accounts', 'Remove the cap entirely'],
    history: [
      { daysAgo: 15, statement: 'The marketplace cap remains at 25%; exceptions go through the deal desk case by case.', kind: 'made', note: 'note_cap_aug28' },
      { daysAgo: 8, statement: 'Proposal to raise the cap to 50–75% for named strategic accounts, reviewed quarterly.', kind: 'proposed', note: 'note_cap_sep4' },
      { daysAgo: 4, statement: 'ByteDance and Samsung formally requested 100% marketplace usability for strategic customers; decision deferred to the steering call.', kind: 'contradicted', note: 'note_cap_sep8' },
    ],
  },
  {
    ctx: 'ctx_work', title: 'Nissan pilot function', topic: 'Treasury POC', company: 'Nissan',
    context: 'Nissan finance is fragmented across seven regional close processes; a narrow pilot was preferred over a platform conversation.',
    reasoning: 'Treasury is the most centralised finance function and has budget provisioned this fiscal year.',
    alternatives: ['Regional close pilot in one region', 'Enterprise-wide Gemini Enterprise rollout'],
    history: [
      { daysAgo: 11, statement: 'Treasury is the proposed pilot function; the CFO decides.', kind: 'proposed', note: 'note_nissan_fragmentation' },
      { daysAgo: 9, statement: 'Treasury POC will proceed.', kind: 'made', note: 'note_nissan_cfo' },
      { daysAgo: 8, statement: 'Treasury POC agreed: four weeks from the week of the 21st, three use cases with named success metrics.', kind: 'confirmed', note: 'note_nissan_poc_agreed' },
    ],
  },
  {
    ctx: 'ctx_work', title: 'ByteDance discount ceiling', topic: 'Dedicated PayGo capacity', company: 'ByteDance',
    context: 'ByteDance anchored the renewal at a 45% discount with Anthropic and a domestic provider bidding.',
    reasoning: 'Anything above 30% needs VP approval; dedicated capacity is the lever that justifies a strategic exception.',
    alternatives: ['Match 45% outright', 'Hold at 30% with no capacity commitment'],
    history: [{ daysAgo: 30, statement: 'We will not go above a 30% discount without dedicated capacity being part of the package.', kind: 'made', note: 'note_bytedance_review' }],
  },
  {
    ctx: 'ctx_work', title: 'Activation metric definition', topic: 'Activation',
    context: 'Gemini Enterprise activation was being reported inconsistently as provisioned seats or active users.',
    reasoning: '30-day active users is the honest number and is what customers will judge value on.',
    alternatives: ['Provisioned seats', 'Weekly active users'],
    history: [{ daysAgo: 5, statement: 'Activation will be measured on 30-day active users, not provisioned seats.', kind: 'made', note: 'note_activation_sync' }],
  },
  {
    ctx: 'ctx_work', title: 'TCS ODC model mix', topic: 'ODCs', company: 'TCS',
    context: 'TCS proposed three ODCs dedicated to Google Cloud AI delivery while also running an Azure OpenAI practice.',
    reasoning: 'Keeping the ODCs Google Cloud-first with Anthropic only via the marketplace preserves the partner economics.',
    alternatives: ['Multi-cloud ODCs', 'Google-only with no marketplace access'],
    history: [
      { daysAgo: 35, statement: 'The ODCs will be Google Cloud-first, with Anthropic models available only through the marketplace.', kind: 'made', note: 'note_tcs_odc' },
      { daysAgo: 3, statement: 'Rajesh reconfirmed the Google Cloud-first ODC model with marketplace-only Anthropic access.', kind: 'confirmed', note: 'note_tcs_followup' },
    ],
  },
  {
    ctx: 'ctx_research', title: 'Leveraged ETF sleeve size', topic: 'Leveraged ETFs',
    context: 'Whether to hold leveraged index ETFs at all, and if so how much.',
    reasoning: 'Backtests are strong in trending regimes but the 2022 joint drawdown shows the strategy is a regime bet.',
    alternatives: ['No leverage', 'HFEA-style 55/45 as core'],
    history: [{ daysAgo: 20, statement: 'Cap any leveraged sleeve at 10% of the portfolio and rebalance quarterly.', kind: 'made', note: 'note_letf_hfea' }],
  },
  {
    ctx: 'ctx_research', title: 'Core ETF domicile', topic: 'Irish ETFs',
    context: 'Whether to move the core equity allocation from US-listed to Irish-domiciled ETFs.',
    reasoning: 'Halves dividend withholding and removes US estate-tax exposure for a small TER cost.',
    alternatives: ['Stay in VOO/VTI', 'Sell everything and switch at once'],
    history: [{ daysAgo: 13, statement: 'New contributions go to CSPX and VWRA from October; existing VOO lots stay until a low-gain year.', kind: 'made', note: 'note_irish_liquidity' }],
  },
]
