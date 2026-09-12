/*
  Local (no-API-key) understanding. Deterministic heuristics that extract
  people, companies, topics, actions, decisions, numbers, commitments and
  dates from a note. Used as the fallback provider and as the always-on
  precision layer for known-entity matching even when an LLM is configured.
*/
import { sentences, escapeRegExp, truncate } from '../util'
import type { AIProvider, Extraction, ExtractContext, ExtractedAction, ExtractedCommitment, ExtractedDecision, ExtractedNumber, KnownEntity } from './types'
import { emptyExtraction } from './types'

const COMPANY_LEXICON = [
  'Nissan', 'Samsung', 'TCS', 'Tata Consultancy Services', 'ByteDance', 'Tencent', 'Manus', 'Anthropic', 'OpenAI', 'Microsoft', 'Google', 'Google Cloud', 'AWS', 'Amazon', 'Meta', 'Apple', 'Toyota', 'Sony', 'Salesforce', 'Oracle', 'SAP', 'Infosys', 'Wipro', 'Accenture', 'Deloitte', 'Honda', 'Hyundai', 'LG', 'SK Telecom', 'Rakuten', 'SoftBank', 'Grab', 'Shopee', 'Alibaba', 'Baidu', 'Xiaomi', 'Huawei', 'Databricks', 'Snowflake', 'Nvidia', 'Intel', 'IBM', 'Cisco', 'Zoom', 'Slack', 'Atlassian', 'Stripe', 'Adobe', 'Palantir', 'Deepmind', 'Mistral', 'Cohere', 'Perplexity', 'Vanguard', 'BlackRock', 'iShares', 'Fidelity', 'Schwab', 'Interactive Brokers', 'HSBC', 'DBS', 'Standard Chartered', 'Citi', 'JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'Netflix', 'Uber', 'Airbnb', 'Shopify', 'Zomato', 'Flipkart', 'Reliance', 'Jio', 'HDFC', 'ICICI', 'Axis Bank',
]
const COMPANY_SUFFIX = /\b(Inc|Corp|Corporation|Ltd|LLC|GmbH|PLC|Co|Group|Holdings|Motors|Bank|Capital|Partners|Technologies|Labs|Systems)\.?$/i

const TOPIC_LEXICON = [
  'marketplace caps', 'marketplace cap', 'cap exception', 'agent platform', 'Gemini Enterprise', 'dedicated PayGo capacity', 'dedicated capacity', 'model share', 'data residency', 'coding agents', 'coding agent benchmark', 'proof of concept', 'covered calls', 'leveraged ETFs', 'leveraged ETF', 'withholding tax', 'capital gains', 'real estate', 'buy vs rent', 'AI adoption', 'finance workflows', 'cash forecasting', 'invoice matching', 'O365 integration', 'O365 connector', 'fine-tuning', 'vector search', 'tokenomics', 'activation playbook', 'ODCs', 'ODC', 'UCITS', 'DTAA', 'Copilot bundle', 'Copilot for Finance', 'rate lock', 'true-up', 'strategic accounts', 'partner credits', 'estate tax', 'expense ratio', 'volatility decay', 'rebalancing', 'model quality', 'quality regression', 'joint GTM', 'go-to-market', 'success metrics', 'renewal', 'QBR', 'pricing decision', 'deal desk', 'discount exception', 'term life', 'DSA', 'robotics lab', 'long run', 'physio',
]

const PERSON_TITLES = 'CFO|CEO|CTO|CIO|COO|CMO|CRO|CISO|VP|SVP|EVP|Director|Head|Manager|Lead|Founder|Partner|President|Chairman|Chief|GM|Engineer|Architect|Analyst|Controller|Treasurer'
const PERSON_CUES_BEFORE = /\b(?:spoke (?:to|with)|talked (?:to|with)|met(?: with)?|call with|meeting with|sync with|chat with|1:1 with|with|from|thanks to|per|cc|ping|email(?:ed)? (?:to|from)|intro(?:duced)? (?:to|by)|according to|asked|told|joined by|and|\/)\s+$/i
const PERSON_CUES_AFTER = /^\s+(?:said|says|asked|mentioned|noted|wants|thinks|suggested|proposed|confirmed|agreed|pushed|raised|flagged|will|to|is|was|has|had|shared|sent|owes|owns|replied|prefers|expects|committed|promised|joined|led|ran|presented|called|emailed|pinged|reviewed|reviews|takes|took)\b/i
const NOT_A_NAME = new Set('Treasury Procurement Finance Legal Sales Marketing Engineering Product Board Contractor Option Quote Insurer Budget Decision Risk Pattern Need Needs Spoke Ask Asked Waiting Also Still Owe Quick Second First Third Short Good Met Pulled Wrote Ran Read Checked Working Total Equity Cash Bond Bonds Premium Positions Rule Idea Thinking Conclusion Scope Numbers Discussion Where What Follow Open Everything Nothing Singapore Tokyo Seoul Mumbai Pune Chennai Hyderabad Japan China Korea India Yokohama Bangalore Jakarta Mexico Americas Katong Europe Asia APAC Americas Weekly Monthly Daily Friday Sunday Monday Tuesday Wednesday Thursday Saturday Week Month Quarter Year Current Proposal Proposed Reasoning Alternatives Owner Owners Region Regional Treasury Copilot Marketplace Gemini Claude Flash Pro Ultra Vertex Workspace Azure Enterprise Platform Program Programme Project Pilot Sleeve Portfolio Rent Mortgage Premium Cover Physio Kitchen Robotics Interest Maintenance Rental Dividend Dividends Tenant Flights Visa Cardiologist Lab Team Teams Group Bench Practice Desk Deal Deck Demo Data Model Models Benchmark Pricing Price Prices Discount Commit Buffer Overage Terms Board Budget Fiscal Legal Region Regions Connector Connectors Use Cases Case Success Metric Metrics Kickoff Session Sessions Steering Call Sync Review Reviews Renewal Anchor Order Book Block Submit Visit Confirm Define Prepare Present Draft Send Share Get Set Introduce Rerun Compile Map Root Rebalance Decide Apply Book Bring Watch Take Keep List Cap Caps Percentage Amount Revenue Seats Users Requests Engineers Days Accounts Number Numbers Options Option Fund Funds Notes Note Summary Context Background Agenda Attendees Actions Action Steps Next Overall Status Goal Goals Key Points Main Item Items Result Results Outcome Outcomes Update Updates Email Slack Meet Google Cloud Marketplace'.split(' '))
const COMMON_CAPS = new Set('I We You They He She It Our The This That These Those There Then Today Tomorrow Yesterday Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Q1 Q2 Q3 Q4 AI ML API SaaS OK Note Notes Summary Decision Decisions Action Actions Next Steps Agenda Attendees Context Risks Open Questions Follow Also And But Or If When While What Why How Where Who Which Because Since Although Team Teams Customer Customers Meeting Call Email Slack Update Plan Review Yes No Not Key Points Discussion Background Goal Goals Status Overall New Old Both Per Re Fwd Fw Hi Hello Thanks Regards Best Cheers Draft Final Done Pending TBD ASAP EOD EOW FYI'.split(' '))

const ACTION_VERBS = 'send|share|review|define|prepare|draft|schedule|set up|setup|follow up|follow-up|circulate|confirm|check|update|write|build|create|finalize|finalise|align|escalate|book|book in|reach out|ping|email|call|sync|revisit|validate|test|deploy|migrate|ship|present|submit|collect|gather|compile|document|map|scope|size|price|quote|negotiate|approve|sign|onboard|enable|run|kick off|kickoff|complete|close|deliver|propose|investigate|explore|assess|evaluate|compare|decide|pull|push|loop in|introduce|connect|coordinate|plan|track|monitor|measure|report|summarize|summarise|clarify|resolve|fix|reply|respond|get back|look into|dig into|think about|come back'
const ACTION_RE = new RegExp(`^(?:(?:action|todo|to-do|next step|task)s?\\s*[:\\-–]\\s*)?(?:\\[\\s?\\]\\s*)?(?:also\\s+)?(?:remind myself\\s+)?(?<owner>I|We|Me|Team|[A-Z][\\w.'-]+(?:\\s+[A-Z][\\w.'-]+){0,2}|[A-Z]{2,5}(?:\\s+team)?)?\\s*(?:'ll|will|to|needs? to|need to|should|must|has to|have to|is going to|are going to|are to|is to|owes|committed to|agreed to|promised to)\\s+(?<verb>${ACTION_VERBS})\\b(?<rest>[^.!?]*)`, 'i')
const ACTION_LEAD_RE = new RegExp(`^(?:action|todo|to-do|next step|task|ai)s?\\s*[:\\-–]\\s*(?<body>.+)$`, 'i')
const CHECKBOX_RE = /^(?:[-*]\s*)?\[(?:\s|x)?\]\s*(?<body>.+)$/i
const DECISION_RE = /\b(?:decided|decision(?: is| was)?\s*:|decision (?:is|was) (?:to|that)|agreed(?: that| to| with)|we(?:'re| are) going (?:with|to)|going with|approved|signed off|sign-off|green-?lit|will proceed|will not|won't|final(?:ised|ized)|locked in|settled on|chose|opted (?:for|to)|policy is|cap (?:remains|stays|moves|goes)|no longer)\b/i
const PROPOSAL_RE = /\b(?:proposal|proposed|proposing|suggest(?:ed|ion)|considering|asking for|requested|request(?:s|ed)? (?:to|for)|wants? to|would like to|pushing for|exploring)\b/i
const COMMIT_PROMISE_RE = /\b(?:I(?:'ll| will)\s+(?!not\b)\w+|I (?:promised|committed|owe)|I said I(?:'d| would)|I told (?:them|him|her) I(?:'d| would)|we(?:'ll| will) (?:send|share|get back|come back|circulate|confirm|follow|revert|deliver|provide|draft|prepare|review|schedule|set up|introduce|keep|reply|respond)|we (?:owe|promised|committed)|our team will|team to send|team will (?:send|share|follow|come back|revert|deliver|provide)|owe [A-Z][a-z]+ (?:the|a|an)|remind myself to)\b/i
const COMMIT_WAITING_RE = /\b(?:waiting (?:on|for)|pending|blocked on|awaiting|need(?:s)? (?:their|his|her|customer|legal|finance|pricing|deal desk|approval)|they(?:'ll| will) (?:send|share|come back|revert|confirm|get back)|will get back to (?:me|us)|to come back (?:to|with)|will revert|will confirm|will share|will send us|owes us|expecting)\b/i
const COMMIT_FOLLOW_RE = /(?:(?:^|\bto |\bwill |\bshould |\bneed to |\blet'?s |\bmust |: )follow[- ]?up\b|\b(?:come back to|revisit|circle back|park(?:ed)? (?:this|that|it)|let'?s (?:come back|revisit|discuss (?:later|next))|table(?:d)? (?:this|that|it)|to be (?:discussed|decided|confirmed)|open (?:question|item|point)|unresolved|not yet (?:decided|resolved|agreed)|still (?:owed|open|outstanding)))\b/i
const RISK_RE = /\b(?:risk|risks|risky|concern(?:s|ed)?|worried|worry|blocker|blocked|threat|losing to|lost to|churn|delay(?:ed|s)?|slip(?:ped|ping)?|pushback|push back|escalat(?:e|ed|ion)|unhappy|frustrat(?:ed|ion)|competitor|competitive pressure|at risk|red flag|dependency|constraint|limitation|gap|shortfall|miss(?:ed|ing)? (?:the )?(?:target|deadline|number))\b/i
const OPPORTUNITY_RE = /\b(?:potential|opportunity|upside|expansion|upsell|could (?:add|grow|expand|close)|pipeline|close (?:by|in)|(?:possible|likely|potential|targeting) (?:close|signing|expansion)|september close|q[1-4] close|deal size|tam|land and expand)\b/i

const MONEY_RE = /(?<cur>[$€£¥₹]|USD|EUR|GBP|INR|SGD|HKD|JPY|KRW|RMB|CNY)\s?(?<num>\d[\d,]*(?:\.\d+)?)\s?(?<mag>[kKmMbB](?:n|illion)?|thousand|million|billion|crore|lakh|cr)?\b/g
const PCT_RE = /(?<num>\d+(?:\.\d+)?)\s?(?:%|percent|pct|bps)(?:\s?(?:→|->|to)\s?(?<num2>\d+(?:\.\d+)?)\s?%)?/gi
const COUNT_RE = /\b(?<num>\d[\d,]*(?:\.\d+)?)\s?(?<mag>[kKmM])?\s?(?<unit>seats|users|licenses|licences|engineers|developers|people|customers|accounts|agents|models|tokens|tps|qps|requests|gpus|tpus|nodes|regions|months|weeks|days|years|hours|sqft|sq ft|bedrooms|units|shares|contracts|lots)\b/gi
const RANGE_PCT_RE = /(?<a>\d+)\s?[-–]\s?(?<b>\d+)\s?%/g
const DATE_RE = /(?:\b(?:next|this|last)\s+)?(?:\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Tues|Wed|Thu|Thurs|Fri|Sat|Sun)\b|\b(?:January|February|March|April|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b\.?(?:\s+\d{1,2}(?:st|nd|rd|th)?)?|\bMay\s+\d{1,2}\b|\bQ[1-4](?:\s?\d{2,4})?\b|\bH[12]\s?\d{2,4}\b|\b(?:EOY|EOQ|EOM|EOW|EOD)\b|\bend of (?:the )?(?:month|quarter|year|week|day)\b|\bnext (?:week|month|quarter|year)\b|\bthis (?:week|month|quarter)\b|\btomorrow\b|\btoday\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b)/g

type UnitKind = 'money' | 'pct' | 'count'
const NUMBER_LABELS: [RegExp, string, UnitKind[]][] = [
  [/\b(?:revenue|ARR|MRR|run[- ]?rate|trailing twelve months|TTM)\b/i, 'Revenue', ['money']],
  [/\b(?:bookings?|TCV|ACV|contract value|annual commit|committed spend|commit)\b/i, 'Commitment', ['money']],
  [/\b(?:spend|consumption|billing|budget)\b/i, 'Spend', ['money']],
  [/\bdiscount\b/i, 'Requested discount', ['pct']],
  [/\bbuffer\b/i, 'Buffer', ['pct']],
  [/\bmarketplace cap|\bcap\b/i, 'Marketplace cap', ['pct']],
  [/\bmodel share|share of (?:models|inference|workload)|wallet share\b/i, 'Model share', ['pct']],
  [/\bactivated\b/i, 'Activated accounts', ['count']],
  [/\bseats?\b|\blicen[cs]es?\b/i, 'Seats', ['count']],
  [/\bcredits?\b/i, 'Partner credits', ['money']],
  [/\bforecast|projection|pipeline\b/i, 'Forecast', ['money']],
  [/\bgemini\b/i, 'Gemini consumption', ['money']],
  [/\bmargin\b/i, 'Margin', ['pct']],
  [/\bexpense ratio|\bTER\b/, 'Expense ratio', ['pct']],
  [/\bwithholding\b/i, 'Withholding tax', ['pct']],
  [/\bLTCG|STCG|tax rate\b/i, 'Tax rate', ['pct']],
  [/\byield|dividend|CAGR|IRR\b/i, 'Yield', ['pct']],
  [/\bmortgage rate|interest rate\b/i, 'Interest rate', ['pct']],
  [/\bdrawdown\b/i, 'Max drawdown', ['pct']],
  [/\bappreciation\b/i, 'Break-even appreciation', ['pct']],
  [/\bpremium\b/i, 'Premium', ['money']],
  [/\bcover\b/i, 'Cover', ['money']],
  [/\bprice|valuation|quote\b/i, 'Price', ['money']],
  [/\brent\b/i, 'Rent', ['money']],
  [/\bheadcount|engineers|developers\b/i, 'Headcount', ['count']],
  [/\brequests?\b|\bthroughput|\btps\b|\bqps\b/i, 'Volume', ['count']],
  [/\btask completion|completion|regression|drop\b/i, 'Quality delta', ['pct']],
]

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function clean(s: string): string {
  return s.replace(/^[\s\-–•*>#]+/, '').replace(/\s+/g, ' ').trim()
}

function stripTrailing(s: string): string {
  return s.replace(/[.;:,\s]+$/, '')
}

function firstDate(s: string): string | undefined {
  DATE_RE.lastIndex = 0
  const m = DATE_RE.exec(s)
  return m ? m[0] : undefined
}

function magnitude(mag?: string): number {
  if (!mag) return 1
  const m = mag.toLowerCase()
  if (m.startsWith('k') || m === 'thousand') return 1e3
  if (m.startsWith('m') || m === 'million') return 1e6
  if (m.startsWith('b') || m === 'billion') return 1e9
  if (m === 'crore' || m === 'cr') return 1e7
  if (m === 'lakh') return 1e5
  return 1
}

export function matchKnownEntities(text: string, known: KnownEntity[]): { entity: KnownEntity; excerpt: string; count: number }[] {
  const sents = sentences(text)
  const out: { entity: KnownEntity; excerpt: string; count: number }[] = []
  for (const e of known) {
    const names = [e.name, ...e.aliases].filter((n) => n && n.length > 1)
    let count = 0
    let excerpt = ''
    for (const n of names) {
      const re = new RegExp(`(?<![\\w@])${escapeRegExp(n)}(?![\\w])`, n.length <= 3 ? 'g' : 'gi')
      const hits = text.match(re)
      if (hits) {
        count += hits.length
        if (!excerpt) excerpt = sents.find((s) => re.test(s)) ?? ''
      }
    }
    if (count > 0) out.push({ entity: e, excerpt: truncate(excerpt, 240), count })
  }
  return out
}

function isCompanyName(name: string, known: KnownEntity[]): boolean {
  const lower = name.toLowerCase()
  if (COMPANY_LEXICON.some((c) => c.toLowerCase() === lower)) return true
  if (COMPANY_SUFFIX.test(name)) return true
  return known.some((k) => k.type === 'company' && (k.name.toLowerCase() === lower || k.aliases.some((a) => a.toLowerCase() === lower)))
}

function isPersonName(name: string, known: KnownEntity[]): boolean {
  const lower = name.toLowerCase()
  return known.some((k) => k.type === 'person' && (k.name.toLowerCase() === lower || k.aliases.some((a) => a.toLowerCase() === lower)))
}

function candidateNames(text: string): { name: string; before: string; after: string; sentence: string }[] {
  const out: { name: string; before: string; after: string; sentence: string }[] = []
  for (const s of sentences(text)) {
    const re = /(?<![\w@#])((?:[A-Z][\w'’.-]+|[A-Z]{2,6})(?:\s+(?:[A-Z][\w'’.-]+|[A-Z]{2,6}|of|de|van|von|&)){0,3})/g
    let m: RegExpExecArray | null
    while ((m = re.exec(s))) {
      let name = m[1]!.replace(/[.,;:]+$/, '').replace(/[’']s$/, '')
      // Drop leading generic words ("Ask Amma" → "Amma"); skip pure generic phrases.
      while (name.includes(' ') && NOT_A_NAME.has(name.split(' ')[0]!)) name = name.split(' ').slice(1).join(' ')
      if (!name || COMMON_CAPS.has(name) || NOT_A_NAME.has(name) || name.length < 2) continue
      if (name.split(' ').every((w) => NOT_A_NAME.has(w) || COMMON_CAPS.has(w))) continue
      out.push({ name, before: s.slice(0, m.index), after: s.slice(m.index + m[1]!.length), sentence: s })
    }
  }
  return out
}

function detectEntities(text: string, ctx: ExtractContext) {
  const people = new Map<string, { name: string; role?: string; company?: string; excerpt?: string }>()
  const companies = new Map<string, { name: string; excerpt?: string }>()
  const topics = new Map<string, { name: string; excerpt?: string }>()
  const projects = new Map<string, { name: string; excerpt?: string }>()
  const known = ctx.knownEntities

  for (const { entity, excerpt } of matchKnownEntities(text, known)) {
    const rec = { name: entity.name, excerpt }
    if (entity.type === 'person') people.set(entity.name.toLowerCase(), { ...rec, role: entity.attributes?.role, company: entity.attributes?.company })
    else if (entity.type === 'company') companies.set(entity.name.toLowerCase(), rec)
    else if (entity.type === 'topic') topics.set(entity.name.toLowerCase(), rec)
    else projects.set(entity.name.toLowerCase(), rec)
  }

  const titleRe = new RegExp(`^(?<company>[A-Z][\\w&.-]+(?:\\s+[A-Z][\\w&.-]+)?)?\\s*(?<title>${PERSON_TITLES})(?:\\s+of\\s+[A-Z][\\w]+)?$`)
  for (const c of candidateNames(text)) {
    const lower = c.name.toLowerCase()
    if (people.has(lower) || companies.has(lower) || topics.has(lower)) continue
    const aliasOf = known.find((k) => k.aliases.some((a) => a.toLowerCase() === lower) || (k.type === 'person' && k.name.toLowerCase().split(' ')[0] === lower))
    if (aliasOf) {
      if (aliasOf.type === 'person' && !people.has(aliasOf.name.toLowerCase())) people.set(aliasOf.name.toLowerCase(), { name: aliasOf.name, role: aliasOf.attributes?.role, company: aliasOf.attributes?.company, excerpt: truncate(c.sentence, 240) })
      else if (aliasOf.type === 'company' && !companies.has(aliasOf.name.toLowerCase())) companies.set(aliasOf.name.toLowerCase(), { name: aliasOf.name, excerpt: truncate(c.sentence, 240) })
      continue
    }
    // "Nissan CFO", "Samsung Korea CTO"
    const tm = c.name.match(titleRe)
    if (tm?.groups?.title) {
      const company = tm.groups.company
      if (!company || !isCompanyName(company, known)) continue
      const title = tm.groups.title
      const knownPerson = known.find((k) => k.type === 'person' && (k.attributes?.company ?? '').toLowerCase() === company.toLowerCase() && (k.attributes?.role ?? '').toLowerCase().includes(title.toLowerCase()))
      const personName = knownPerson?.name ?? c.name
      if (!people.has(personName.toLowerCase())) people.set(personName.toLowerCase(), { name: personName, role: knownPerson?.attributes?.role ?? title, company, excerpt: truncate(c.sentence, 240) })
      if (!companies.has(company.toLowerCase())) companies.set(company.toLowerCase(), { name: company, excerpt: truncate(c.sentence, 240) })
      continue
    }
    if (isCompanyName(c.name, known)) {
      companies.set(lower, { name: c.name, excerpt: truncate(c.sentence, 240) })
      continue
    }
    const words = c.name.split(/\s+/)
    const personCue = PERSON_CUES_BEFORE.test(c.before) || PERSON_CUES_AFTER.test(c.after) || isPersonName(c.name, known)
    const roleAfter = c.after.match(new RegExp(`^\\s*[,(]?\\s*(?:\\(|,\\s*)?(?:the\\s+)?(${PERSON_TITLES})(?:\\s+(?:of|at)\\s+([A-Z][\\w&.-]+))?`, 'i'))
    if (personCue || roleAfter) {
      if (words.length <= 3 && words.every((w) => /^[A-Z][a-z'’.-]+$/.test(w) || /^[A-Z]\.$/.test(w))) {
        people.set(lower, { name: c.name, role: roleAfter?.[1] ? cap(roleAfter[1]) : undefined, company: roleAfter?.[2], excerpt: truncate(c.sentence, 240) })
        continue
      }
    }
    // Capitalised multi-word phrases that look like named initiatives → project/topic.
    if (words.length >= 2 && words.length <= 4 && /(?:Program|Programme|Project|Initiative|Platform|Enterprise|Strategy|Plan|Launch|Pilot|POC|Rollout|Migration|Task Force)$/i.test(c.name) && !new RegExp(`^(?:${PERSON_TITLES})\\b`).test(c.name)) {
      projects.set(lower, { name: c.name, excerpt: truncate(c.sentence, 240) })
    }
  }

  const sents = sentences(text)
  for (const t of TOPIC_LEXICON) {
    const re = new RegExp(`(?<![\\w])${escapeRegExp(t)}(?![\\w])`, t.length <= 4 ? 'g' : 'gi')
    if (re.test(text)) {
      const canon = cap(t)
      if (companies.has(canon.toLowerCase()) || projects.has(canon.toLowerCase())) continue
      const key = canon.toLowerCase().replace(/s$/, '')
      if ([...topics.keys()].some((k) => k.replace(/s$/, '') === key || k.includes(key) || key.includes(k))) continue
      if (topics.size >= 8) break
      topics.set(canon.toLowerCase(), { name: canon, excerpt: truncate(sents.find((s) => re.test(s)) ?? '', 240) })
    }
  }
  // Hashtags are explicit topics.
  for (const m of text.matchAll(/(?<!\w)#([A-Za-z][\w-]{2,})/g)) {
    const name = m[1]!.replace(/-/g, ' ')
    topics.set(name.toLowerCase(), { name: cap(name) })
  }
  return {
    people: [...people.values()],
    companies: [...companies.values()],
    topics: [...topics.values()].slice(0, 12),
    projects: [...projects.values()],
  }
}

function findCompanyIn(s: string, companies: { name: string }[]): string | undefined {
  const lower = s.toLowerCase()
  return companies.find((c) => lower.includes(c.name.toLowerCase()))?.name
}

function ownerFrom(raw: string | undefined, ctx: ExtractContext, people: { name: string }[]): string {
  if (!raw) return ctx.userName
  const r = raw.trim()
  if (/^(I|me|we)$/i.test(r) || NOT_A_NAME.has(r) || COMMON_CAPS.has(r)) return ctx.userName
  if (/^team$/i.test(r)) return 'Team'
  const p = people.find((p) => p.name.toLowerCase() === r.toLowerCase() || p.name.toLowerCase().startsWith(r.toLowerCase()))
  return p?.name ?? r
}

function extractActions(text: string, ctx: ExtractContext, people: { name: string }[], companies: { name: string }[]): ExtractedAction[] {
  const out: ExtractedAction[] = []
  const seen = new Set<string>()
  const push = (a: ExtractedAction) => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (!key || seen.has(key) || key.length < 6) return
    seen.add(key)
    out.push(a)
  }
  const lines = text.split(/\n/).map(clean).filter(Boolean)
  for (const line of lines) {
    const cb = line.match(CHECKBOX_RE)
    if (cb?.groups?.body) {
      const body = stripTrailing(cb.groups.body)
      const m = body.match(/^(?<owner>[A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+)?|Team|I|We)\s*[:\-–]\s*(?<rest>.+)$/)
      push({ title: cap(m?.groups?.rest ?? body), owner: ownerFrom(m?.groups?.owner, ctx, people), due: firstDate(body), company: findCompanyIn(body, companies), excerpt: truncate(line, 240) })
      continue
    }
    const lead = line.match(ACTION_LEAD_RE)
    if (lead?.groups?.body) {
      const body = stripTrailing(lead.groups.body)
      const m = body.match(/^(?<owner>[A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+)?|Team|I|We)\s*(?:[:\-–]|to)\s*(?<rest>.+)$/)
      push({ title: cap(m?.groups?.rest ?? body), owner: ownerFrom(m?.groups?.owner, ctx, people), due: firstDate(body), company: findCompanyIn(body, companies), excerpt: truncate(line, 240) })
    }
  }
  for (const s of sentences(text)) {
    const c = clean(s)
    if (CHECKBOX_RE.test(c) || ACTION_LEAD_RE.test(c)) continue
    if (COMMIT_WAITING_RE.test(c) || /^decisions?\s*[:\-–]/i.test(c)) continue
    const m = c.match(ACTION_RE)
    if (m?.groups?.verb) {
      const owner = ownerFrom(m.groups.owner, ctx, people)
      const rest = stripTrailing(m.groups.rest ?? '').replace(/\s+(?:by|before)\s+(?:next\s+|end of\s+|the\s+)?(?:[A-Z][a-z]+|EOD|EOW|EOM|tomorrow|today)\b.*$/, '').split(/\s+[—;]\s+/)[0]!
      const title = cap(`${m.groups.verb}${rest}`.trim().replace(new RegExp(`\\s+(?:on|by|before)?\\s*(?:${DATE_RE.source.replace(/^\(\?:/, '(?:')})\\s*$`), ''))
      if (title.split(' ').length < 2) continue
      const priority: ExtractedAction['priority'] = /\b(urgent|asap|critical|immediately|today)\b/i.test(c) ? 'urgent' : /\b(important|priority|must)\b/i.test(c) ? 'high' : 'normal'
      push({ title, owner, due: firstDate(c), priority, company: findCompanyIn(c, companies), excerpt: truncate(c, 240) })
    }
  }
  return out.slice(0, 15)
}

function extractDecisions(text: string, companies: { name: string }[], topics: { name: string }[]): ExtractedDecision[] {
  const out: ExtractedDecision[] = []
  const seen = new Set<string>()
  for (const raw of sentences(text)) {
    const s = clean(raw)
    if (s.length < 12 || s.length > 320) continue
    const lead = s.match(/^decisions?\s*[:\-–]\s*(?<body>.+)$/i)
    if (/^(?:risk|risks|open question|question|waiting|context|background)\s*[:\-–]/i.test(s)) continue
    const isDecision = Boolean(lead) || (DECISION_RE.test(s) && !/\?$/.test(s) && !/\b(should we|not (?:yet )?decided|undecided|unresolved|deferred|tbd|tbc|pending)\b/i.test(s))
    const isProposal = !isDecision && PROPOSAL_RE.test(s) && /\b(?:cap|price|discount|%|percent|policy|strategy|approach|scope|timeline|term|plan)\b/i.test(s)
    if (!isDecision && !isProposal) continue
    const statement = stripTrailing(lead?.groups?.body ?? s)
    const key = statement.toLowerCase().slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    const because = statement.match(/\b(?:because|since|given|as|due to)\s+(.+)$/i)
    const topic = topics.find((t) => statement.toLowerCase().includes(t.name.toLowerCase()))?.name
    out.push({ statement: cap(statement), reasoning: because?.[1] ? cap(stripTrailing(because[1])) : undefined, topic, company: findCompanyIn(statement, companies), excerpt: truncate(raw, 240), status: isProposal ? 'proposed' : 'active' })
  }
  return out.slice(0, 8)
}

function extractCommitments(text: string, ctx: ExtractContext, people: { name: string }[], companies: { name: string }[]): ExtractedCommitment[] {
  const out: ExtractedCommitment[] = []
  const seen = new Set<string>()
  for (const raw of sentences(text)) {
    const s = clean(raw)
    if (s.length < 10 || s.length > 300) continue
    if (CHECKBOX_RE.test(s) || /^decisions?\s*[:\-–]/i.test(s)) continue
    let kind: ExtractedCommitment['kind'] | null = null
    if (COMMIT_PROMISE_RE.test(s)) kind = 'promised'
    else if (COMMIT_WAITING_RE.test(s)) kind = 'waiting'
    else if (COMMIT_FOLLOW_RE.test(s)) kind = 'follow_up'
    else if (/\?$/.test(s) && /\b(?:should|can|could|do we|will they|what if|how do|when)\b/i.test(s)) kind = 'question'
    if (!kind) continue
    const key = s.toLowerCase().slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    const personIn = (str: string) => people.find((p) => str.toLowerCase().includes(p.name.toLowerCase()) || new RegExp(`\\b${escapeRegExp(p.name.split(' ')[0]!)}\\b`).test(str))
    const who = kind === 'promised' ? (/\b(?:team will|our team|team to send)\b/i.test(s) ? 'Team' : ctx.userName) : kind === 'waiting' ? (personIn(s)?.name ?? findCompanyIn(s, companies) ?? 'Them') : ctx.userName
    const counterparty = people.find((p) => p.name !== who && (s.toLowerCase().includes(p.name.toLowerCase()) || new RegExp(`\\b${escapeRegExp(p.name.split(' ')[0]!)}\\b`).test(s)))?.name
    out.push({ text: stripTrailing(cap(s)), kind, byWhom: who, counterparty, company: findCompanyIn(s, companies), dueHint: firstDate(s), excerpt: truncate(raw, 240) })
  }
  return out.slice(0, 10)
}

function labelFor(s: string, kind: UnitKind, at = 0): string | null {
  let best: { label: string; dist: number } | null = null
  for (const [re, label, kinds] of NUMBER_LABELS) {
    if (!kinds.includes(kind)) continue
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    for (const m of s.matchAll(g)) {
      const dist = Math.abs(m.index! - at)
      if (!best || dist < best.dist) best = { label, dist }
    }
  }
  return best && best.dist <= 60 ? best.label : null
}

export function canonicalLabel(label: string): string {
  const l = label.toLowerCase()
  if (/commit/.test(l)) return 'Commitment'
  if (/discount/.test(l)) return 'Requested discount'
  if (/revenue|ttm|trailing/.test(l)) return 'Revenue'
  if (/premium/.test(l)) return 'Premium'
  if (/model share/.test(l)) return 'Model share'
  if (/gemini/.test(l)) return 'Gemini consumption'
  if (/buffer/.test(l)) return 'Buffer'
  if (/cap\b/.test(l)) return 'Marketplace cap'
  return cap(label)
}

function extractNumbers(text: string, companies: { name: string }[], ctx: ExtractContext): ExtractedNumber[] {
  const out: ExtractedNumber[] = []
  const seen = new Set<string>()
  const push = (n: ExtractedNumber) => {
    const key = `${n.entity ?? ''}|${n.label}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(n)
  }
  const titleCompany = findCompanyIn(ctx.title ?? '', companies) ?? (text.length < 600 && companies.length === 1 ? companies[0]!.name : undefined)
  let sectionCompany: string | undefined
  for (const raw of sentences(text)) {
    const s = clean(raw)
    if (s.split(' ').length <= 3) {
      const sc = companies.find((c) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() === c.name.toLowerCase())
      sectionCompany = sc?.name ?? (s.split(' ').length <= 3 && /^[A-Z]/.test(s) ? undefined : sectionCompany)
    }
    const entity = findCompanyIn(s, companies) ?? sectionCompany ?? titleCompany
    if (!entity) continue
    // Explicit "Label: value" lines.
    const kv = s.match(/^(?<label>[A-Z][\w\s/&-]{2,30}?)\s*[:=]\s*(?<value>[$€£¥₹]?\s?\d[\d,.]*\s?(?:[kKmMbB]|%|seats|users)?[^,;]*)$/)
    if (kv?.groups?.value && kv.groups.label) {
      const v = kv.groups.value.trim()
      const num = v.match(MONEY_RE) || v.match(PCT_RE) || v.match(COUNT_RE)
      if (num) {
        const label = kv.groups.label.trim()
        const shortValue = (v.match(MONEY_RE)?.[0] ?? v.match(PCT_RE)?.[0] ?? v.match(COUNT_RE)?.[0] ?? v).trim()
        const pctKv = shortValue.match(/^(\d+(?:\.\d+)?)\s?%/)
        push({ label: canonicalLabel(label), value: shortValue, numeric: pctKv ? parseFloat(pctKv[1]!) : undefined, unit: pctKv ? '%' : undefined, entity, excerpt: truncate(raw, 200) })
        continue
      }
    }
    for (const m of s.matchAll(MONEY_RE)) {
      const g = m.groups!
      const label = labelFor(s, 'money', m.index)
      if (!label) continue
      const numeric = parseFloat(g.num!.replace(/,/g, '')) * magnitude(g.mag)
      push({ label, value: m[0].replace(/\s+/g, ''), numeric, unit: g.cur, entity, excerpt: truncate(raw, 200) })
    }
    for (const m of s.matchAll(RANGE_PCT_RE)) {
      const label = labelFor(s, 'pct', m.index)
      if (!label) continue
      push({ label, value: `${m.groups!.a}–${m.groups!.b}%`, numeric: parseFloat(m.groups!.b!), unit: '%', entity, excerpt: truncate(raw, 200) })
    }
    for (const m of s.matchAll(PCT_RE)) {
      const g = m.groups!
      if (new RegExp(`\\d+\\s?[-–]\\s?${g.num}\\s?%`).test(s)) continue
      const label = labelFor(s, 'pct', m.index)
      if (!label) continue
      const value = g.num2 ? `${g.num}% → ${g.num2}%` : `${g.num}%`
      push({ label, value, numeric: parseFloat(g.num2 ?? g.num!), unit: '%', entity, excerpt: truncate(raw, 200) })
    }
    for (const m of s.matchAll(COUNT_RE)) {
      const g = m.groups!
      const label = labelFor(s, 'count', m.index) ?? cap(g.unit!)
      if (/^(days|weeks|months|years|hours)$/i.test(g.unit!)) continue
      const numeric = parseFloat(g.num!.replace(/,/g, '')) * magnitude(g.mag)
      push({ label, value: `${g.num}${g.mag ?? ''} ${g.unit}`, numeric, unit: g.unit, entity, excerpt: truncate(raw, 200) })
    }
  }
  return out.slice(0, 20)
}

function scoreSentence(s: string, ents: string[]): number {
  let score = Math.min(s.length, 200) / 200
  const lower = s.toLowerCase()
  for (const e of ents) if (lower.includes(e.toLowerCase())) score += 1.2
  if (DECISION_RE.test(s)) score += 1
  if (MONEY_RE.test(s) || PCT_RE.test(s)) score += 0.8
  if (RISK_RE.test(s)) score += 0.5
  if (OPPORTUNITY_RE.test(s)) score += 0.5
  if (/^(?:[-*•]|\d+\.)/.test(s)) score -= 0.2
  if (s.length < 25) score -= 1
  return score
}

export function localExtract(text: string, ctx: ExtractContext): Extraction {
  const ex = emptyExtraction()
  const body = text.trim()
  if (!body) return ex
  const ents = detectEntities(body, ctx)
  ex.people = ents.people
  ex.companies = ents.companies
  ex.topics = ents.topics
  ex.projects = ents.projects
  ex.actions = extractActions(body, ctx, ents.people, ents.companies)
  ex.decisions = extractDecisions(body, ents.companies, ents.topics)
  ex.commitments = extractCommitments(body, ctx, ents.people, ents.companies)
  ex.numbers = extractNumbers(body, ents.companies, ctx)
  const sents = sentences(body).map(clean).filter((s) => s.length > 3)
  ex.risks = sents.filter((s) => RISK_RE.test(s) && s.length < 240).slice(0, 5).map(stripTrailing)
  ex.opportunities = sents.filter((s) => OPPORTUNITY_RE.test(s) && s.length < 240).slice(0, 4).map(stripTrailing)
  ex.questions = sents.filter((s) => /\?$/.test(s) || /^(?:open question|unclear|tbd|question)\b/i.test(s)).slice(0, 6)
  const dates = new Map<string, { label: string; excerpt?: string }>()
  for (const s of sents) {
    DATE_RE.lastIndex = 0
    for (const m of s.matchAll(DATE_RE)) if (!dates.has(m[0].toLowerCase())) dates.set(m[0].toLowerCase(), { label: m[0], excerpt: truncate(s, 200) })
  }
  ex.dates = [...dates.values()].slice(0, 8)
  const entNames = [...ents.people, ...ents.companies, ...ents.topics].map((e) => e.name)
  const ranked = sents
    .map((s, i) => ({ s, i, score: scoreSentence(s, entNames) + (i === 0 ? 0.6 : 0) }))
    .filter((x) => !/^#/.test(x.s) && !CHECKBOX_RE.test(x.s))
    .sort((a, b) => b.score - a.score)
    .slice(0, sents.length > 12 ? 5 : sents.length > 5 ? 4 : 3)
    .sort((a, b) => a.i - b.i)
  ex.summary = ranked.map((x) => stripTrailing(truncate(x.s, 180)))
  ex.keyPoints = ranked.map((x) => stripTrailing(truncate(x.s, 180)))
  if (!ctx.title) {
    const firstLine = body.split('\n').map(clean).find((l) => l.length > 3) ?? ''
    ex.title = truncate(stripTrailing(firstLine.replace(/^#+\s*/, '')), 80)
  }
  return ex
}

export const localProvider: AIProvider = {
  name: 'local',
  model: 'heuristics-v1',
  isLLM: false,
  async extract(text, ctx) {
    return localExtract(text, ctx)
  },
  async complete() {
    return ''
  },
  async *stream() {
    /* local provider composes answers elsewhere */
  },
}
