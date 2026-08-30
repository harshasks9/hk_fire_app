import type { FrameworkId } from './types'

/* ---------------------------------------------------------------------------
   Investor lenses — publicly documented principles applied as structured
   analytical checklists. No personality imitation, no manufactured quotes:
   each lens is a set of questions derived from published writings.
--------------------------------------------------------------------------- */

export interface FrameworkDef {
  id: FrameworkId
  name: string
  basis: string // the published source of the principles
  focus: string
  questions: string[]
  bestFor: string
  poorFitFor: string
}

export const FRAMEWORKS: FrameworkDef[] = [
  {
    id: 'buffett',
    name: 'Buffett / Munger',
    basis: 'Berkshire shareholder letters; Poor Charlie’s Almanack',
    focus: 'Durable moats, honest capable management, capital efficiency, margin of safety',
    questions: [
      'Is the business understandable and predictable ten years out?',
      'Is there a durable moat, and is it widening or narrowing?',
      'Does management act with integrity and allocate capital rationally?',
      'Does the business earn high returns on capital with pricing power?',
      'Is there a reinvestment runway at similar returns?',
      'Is the price sensible relative to intrinsic value?',
    ],
    bestFor: 'Established franchises with long records',
    poorFitFor: 'Pre-profit, rapidly mutating, or commodity businesses',
  },
  {
    id: 'lynch',
    name: 'Peter Lynch',
    basis: 'One Up on Wall Street; Beating the Street',
    focus: 'Category, understandable growth story, earnings trajectory, balance-sheet risk',
    questions: [
      'Which Lynch category fits (stalwart, fast grower, cyclical, asset play, turnaround)?',
      'Can the growth story be told in two minutes?',
      'Are earnings actually following the story?',
      'Is the balance sheet strong enough to survive mistakes?',
      'Is PEG reasonable relative to growth?',
      'Is institutional ownership already saturated?',
    ],
    bestFor: 'Growth stories an informed consumer can verify',
    poorFitFor: 'Complex financials, conglomerates',
  },
  {
    id: 'graham',
    name: 'Benjamin Graham',
    basis: 'The Intelligent Investor; Security Analysis',
    focus: 'Downside protection, asset backing, earnings stability, valuation discount',
    questions: [
      'Is there tangible asset or cash protection against permanent loss?',
      'Have earnings been positive and stable across a full cycle?',
      'Is financial strength adequate (current ratio, debt levels)?',
      'Is the price at a clear discount to conservative value?',
      'Is the dividend record consistent?',
    ],
    bestFor: 'Asset-rich, out-of-favor businesses',
    poorFitFor: 'Asset-light compounders where value is in intangibles',
  },
  {
    id: 'fisher',
    name: 'Philip Fisher',
    basis: 'Common Stocks and Uncommon Profits',
    focus: 'Long growth runway, innovation, sales organization, management depth',
    questions: [
      'Do products have market potential for years of growth?',
      'Does management develop new products as current lines mature?',
      'Is R&D productive relative to its size?',
      'Is the sales organization strong?',
      'Do margins and margin trajectory show operating skill?',
      'What does scuttlebutt (customers, competitors, suppliers) indicate?',
    ],
    bestFor: 'Innovation-driven growth companies',
    poorFitFor: 'Regulated utilities, commodity producers',
  },
  {
    id: 'marks',
    name: 'Howard Marks',
    basis: 'The Most Important Thing; Oaktree memos',
    focus: 'Cycle position, psychology, consensus expectations, second-level thinking',
    questions: [
      'Where are we in this industry’s cycle?',
      'What does consensus believe, and what must be true for consensus to be wrong?',
      'Is optimism or pessimism embedded in the price?',
      'What is the risk of permanent loss rather than volatility?',
      'What is the second-level view the market is missing?',
    ],
    bestFor: 'Cyclicals, sentiment extremes',
    poorFitFor: 'Stable businesses priced near fair value with quiet sentiment',
  },
  {
    id: 'greenblatt',
    name: 'Joel Greenblatt',
    basis: 'The Little Book That Beats the Market',
    focus: 'Earnings yield × return on capital',
    questions: [
      'What is the EBIT/EV earnings yield?',
      'What is the return on tangible capital employed?',
      'Is the combination cheap and good relative to alternatives?',
    ],
    bestFor: 'Cross-sectional screening; sanity check on price vs quality',
    poorFitFor: 'Financials, REITs, and companies with distorted current earnings',
  },
  {
    id: 'smith',
    name: 'Terry Smith',
    basis: 'Fundsmith owner’s manuals and annual letters',
    focus: 'High sustainable ROCE, organic reinvestment, no overpayment',
    questions: [
      'Does the company earn consistently high returns on capital?',
      'Are the returns sustainable against competition?',
      'Can it reinvest organically at those returns?',
      'Are we paying a reasonable, not heroic, multiple?',
      'Does it resist disruption and leverage?',
    ],
    bestFor: 'Quality compounders',
    poorFitFor: 'Deep value, turnarounds, heavy cyclicals',
  },
  {
    id: 'damodaran',
    name: 'Aswath Damodaran',
    basis: 'Published valuation frameworks and class materials',
    focus: 'Narrative-to-numbers consistency; what the price implies',
    questions: [
      'What story does the current price tell (implied growth, margins, reinvestment)?',
      'Is that story plausible against market size and competition?',
      'Where do narrative and numbers disagree?',
      'How does value change across plausible narratives?',
    ],
    bestFor: 'Any company, especially where story dominates price',
    poorFitFor: 'None — but requires honest inputs',
  },
  {
    id: 'druckenmiller',
    name: 'Stanley Druckenmiller',
    basis: 'Public interviews and documented speeches',
    focus: 'Earnings inflections, liquidity, macro exposure, asymmetry',
    questions: [
      'Is there an earnings or narrative inflection under way?',
      'How do liquidity and macro conditions affect this name?',
      'Is the risk/reward asymmetric enough to size meaningfully?',
      'What would force a fast exit?',
    ],
    bestFor: 'Inflections and macro-sensitive positions',
    poorFitFor: 'Slow, stable compounding stories',
  },
  {
    id: 'mauboussin',
    name: 'Michael Mauboussin',
    basis: 'Expectations Investing; published research on base rates',
    focus: 'Price-implied expectations, base rates, competitive advantage period',
    questions: [
      'What expectations are embedded in the price?',
      'How do those compare with base rates for similar companies?',
      'How long is the competitive advantage period, realistically?',
      'Is capital allocation creating or destroying value per dollar retained?',
    ],
    bestFor: 'Testing whether growth assumptions are historically plausible',
    poorFitFor: 'Situations with no relevant base-rate cohort',
  },
  {
    id: 'chanos',
    name: 'Forensic (Chanos-style)',
    basis: 'Published short-selling and forensic-accounting methodology',
    focus: 'Accounting risk, incentives, cash-flow inconsistencies, leverage',
    questions: [
      'Do earnings convert to cash, or do accruals keep growing?',
      'Are receivables/inventory growing faster than revenue?',
      'Are expenses being capitalized aggressively?',
      'Do incentives encourage aggressive reporting?',
      'Any auditor changes, related-party deals, or governance flags?',
      'Is leverage masking deteriorating economics?',
    ],
    bestFor: 'Every position — as a devil’s advocate pass',
    poorFitFor: 'N/A: forensic review applies universally',
  },
]

export function frameworkById(id: FrameworkId): FrameworkDef {
  return FRAMEWORKS.find((f) => f.id === id)!
}
