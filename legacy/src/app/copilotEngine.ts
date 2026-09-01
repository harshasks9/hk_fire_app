import { fmtMoney, fmtPct } from '@/lib/format'
import type { CurrencyCode } from '@/data/types'
import {
  incomeAgg,
  netWorthSnapshot,
  positionMetrics,
  upcomingObligations,
  allStrategyMetrics,
  optionsPremiumYtd,
} from '@/data/selectors'
import { INCOME_EVENTS } from '@/data/income'
import { TAX_SUMMARIES } from '@/data/tax'
import { INBOX_ITEMS } from '@/data/inbox'
import { SUGGESTIONS } from '@/data/suggestions'
import { convert } from '@/data/fx'

export interface CopilotAnswer {
  headline: string
  facts: { label: string; value: string }[]
  estimates?: { label: string; value: string }[]
  assumptions?: string[]
  missing?: string[]
  citations: { label: string; to?: string }[]
  followups?: string[]
}

export interface CopilotIntent {
  id: string
  question: string
  mode: 'simple' | 'pro' | 'both'
  keywords: string[]
  answer: (currency: CurrencyCode) => CopilotAnswer
}

export const COPILOT_INTENTS: CopilotIntent[] = [
  {
    id: 'changed',
    question: 'What changed this month?',
    mode: 'both',
    keywords: ['changed', 'month', 'change'],
    answer: (c) => {
      const snap = netWorthSnapshot(c)
      return {
        headline: `Your net worth is ${fmtMoney(snap.total, c, { compact: true })}, up ${fmtMoney(snap.monthChange, c, { compact: true })} (${fmtPct(snap.monthChangePct)}) over the past month.`,
        facts: [
          { label: 'Market movement', value: `+${fmtMoney(convert(31_900, 'USD', c), c, { compact: true })} — mostly US large-cap tech` },
          { label: 'Contributions (401k + SIP)', value: `+${fmtMoney(convert(4_800, 'USD', c), c, { compact: true })}` },
          { label: 'Debt principal paid', value: `+${fmtMoney(convert(1_500, 'USD', c), c, { compact: true })}` },
          { label: 'INR currency impact', value: `−${fmtMoney(convert(600, 'USD', c), c)} (rupee weakened 0.4%)` },
        ],
        estimates: [
          { label: 'Seattle home revaluation', value: `+${fmtMoney(convert(25_000, 'USD', c), c, { compact: true })} — model estimate, 78% confidence` },
        ],
        citations: [
          { label: 'June net-worth attribution', to: '/timeline' },
          { label: 'Comparable-sales model — Jun 28', to: '/real-estate/prop-seattle' },
        ],
        followups: ['Where am I overexposed?', 'What payments are due?'],
      }
    },
  },
  {
    id: 'income-year',
    question: 'How much income will I receive this year?',
    mode: 'both',
    keywords: ['income', 'receive', 'year', 'dividends'],
    answer: (c) => {
      const agg = incomeAgg(c)
      const received = agg.ytdReceived
      const expected = agg.forwardAnnual - received
      return {
        headline: `You are on track for ${fmtMoney(agg.forwardAnnual, c, { compact: true })} of passive income in 2026.`,
        facts: [
          { label: 'Received so far (Jan–Jul)', value: fmtMoney(received, c, { compact: true }) },
          { label: 'Rent (both properties)', value: `${fmtMoney(convert(4_350 + 55_000 / 86.8, 'USD', c), c, { compact: true })}/mo` },
        ],
        estimates: [
          { label: 'Still expected (Aug–Dec)', value: fmtMoney(expected, c, { compact: true }) },
          { label: 'Option premium', value: 'Depends on future writing activity — projection uses YTD run rate' },
        ],
        assumptions: ['Dividend schedules and amounts match each instrument’s current declared rate', 'Full occupancy through year-end'],
        citations: [
          { label: `${INCOME_EVENTS.length} income records (2026)`, to: '/income' },
        ],
        followups: ['What payments are due?'],
      }
    },
  },
  {
    id: 'payments-due',
    question: 'What payments are due?',
    mode: 'both',
    keywords: ['payments', 'due', 'obligations', 'upcoming', 'bills'],
    answer: (c) => {
      const obs = upcomingObligations().slice(0, 6)
      return {
        headline: `You have ${obs.length} obligations in the next 90 days.`,
        facts: obs.map((o) => ({
          label: `${o.label}`,
          value: `${o.amount > 0 ? fmtMoney(convert(o.amount, o.currency, c), c, { compact: true }) : '—'} · ${o.date}`,
        })),
        citations: [
          { label: 'Mortgage statements — Jun 2026', to: '/liabilities' },
          { label: 'Capital call notice — Sep 2026', to: '/private' },
          { label: 'LIC premium notice — Jun 2026', to: '/insurance' },
        ],
      }
    },
  },
  {
    id: 'overexposed',
    question: 'Where am I overexposed?',
    mode: 'both',
    keywords: ['overexposed', 'concentration', 'risk', 'exposure'],
    answer: (c) => {
      const rows = positionMetrics(c)
      const nvda = rows.filter((r) => r.symbol === 'NVDA').reduce((s, r) => s + r.value, 0)
      const total = rows.reduce((s, r) => s + r.value, 0)
      const tech = rows.filter((r) => r.sector === 'Technology').reduce((s, r) => s + r.value, 0)
      const nmbs = rows.filter((r) => r.symbol === 'NMBS').reduce((s, r) => s + r.value, 0)
      return {
        headline: 'Three concentrations exceed or approach your stated limits.',
        facts: [
          { label: 'NVDA across two accounts', value: `${fmtMoney(nvda, c, { compact: true })} — ${fmtPct((nvda / total) * 100)} of investable (limit 5%)` },
          { label: 'Technology sector', value: `${fmtPct((tech / total) * 100)} of investable assets` },
          { label: 'Employer stock (NMBS) + salary', value: `${fmtMoney(nmbs, c, { compact: true })} vested — same issuer as your income` },
        ],
        citations: [
          { label: 'NVDA — Fidelity', to: '/position/NVDA' },
          { label: 'NVDA — IBKR', to: '/position/NVDA' },
          { label: 'Concentration observation (Jul 14)', to: '/inbox' },
        ],
        followups: ['Show the tax impact of selling 20% of NVDA'],
      }
    },
  },
  {
    id: 'attention',
    question: 'What needs my attention?',
    mode: 'both',
    keywords: ['attention', 'urgent', 'needs'],
    answer: () => {
      const alerts = SUGGESTIONS.filter((s) => s.category === 'alert' && s.status === 'open')
      const issues = INBOX_ITEMS.filter((i) => i.status === 'open' && i.severity === 'high')
      return {
        headline: `${alerts.length} alerts and ${issues.length} high-priority data issues are open.`,
        facts: [
          ...alerts.map((a) => ({ label: a.urgency === 'today' ? 'Today' : 'This week', value: a.title })),
          ...issues.map((i) => ({ label: 'Data issue', value: i.simpleTitle })),
        ],
        citations: [{ label: 'Needs Review queue', to: '/inbox' }],
      }
    },
  },
  {
    id: 'missing-docs',
    question: 'What documents are missing?',
    mode: 'both',
    keywords: ['documents', 'missing', 'upload'],
    answer: () => ({
      headline: '2 documents would materially improve data quality.',
      facts: [
        { label: 'Zerodha capital gains statement FY2025-26', value: 'India realized gains are currently estimated from trade history' },
        { label: 'Fresh Bengaluru property valuation', value: 'Last valuation Jan 2024 (inferred, 55% confidence)' },
      ],
      missing: ['IBKR Form 1099 (expected Feb 2027 — not yet issued)'],
      citations: [{ label: 'Financial Inbox — missing documents', to: '/inbox' }],
    }),
  },
  {
    id: 'tax-sell',
    question: 'Show the tax impact of selling 20% of NVDA',
    mode: 'pro',
    keywords: ['tax', 'impact', 'selling', 'sell', 'nvda'],
    answer: (c) => {
      // 20% of 700 shares = 140; assume highest-basis lot first (SpecID): Aug 2024 @ $92
      const shares = 140
      const price = 128.44
      const proceeds = shares * price
      const basis = 80 * 92 + 60 * 42.5
      const gain = proceeds - basis
      return {
        headline: `Selling 20% of NVDA (${shares} sh) via SpecID realizes ≈ ${fmtMoney(convert(gain, 'USD', c), c, { compact: true })} of gains.`,
        facts: [
          { label: 'Proceeds (140 × $128.44)', value: fmtMoney(convert(proceeds, 'USD', c), c) },
          { label: 'Lots consumed', value: '80 sh @ $92.00 (Aug 2024, LT) + 60 sh @ $42.50 (Jun 2023, LT)' },
          { label: 'Realized gain', value: fmtMoney(convert(gain, 'USD', c), c) },
        ],
        estimates: [
          { label: 'Federal tax at 15% LT rate', value: fmtMoney(convert(gain * 0.15, 'USD', c), c) },
          { label: 'NIIT (3.8%) if MAGI > $250K', value: fmtMoney(convert(gain * 0.038, 'USD', c), c) },
        ],
        assumptions: ['SpecID selects highest-basis long-term lots first', 'WA has no state capital-gains tax below the $270K exemption'],
        missing: ['2026 MAGI projection — needed to confirm NIIT applies'],
        citations: [
          { label: 'NVDA tax lots — Fidelity', to: '/position/NVDA' },
          { label: 'Fidelity Statement — Jun 2026', to: '/documents' },
        ],
      }
    },
  },
  {
    id: 'prepay-vs-invest',
    question: 'Compare mortgage prepayment with investing the same cash',
    mode: 'pro',
    keywords: ['mortgage', 'prepayment', 'prepay', 'invest', 'compare'],
    answer: (c) => ({
      headline: 'Investing is expected to beat prepaying your 3.125% mortgage, but prepayment is risk-free.',
      facts: [
        { label: 'Primary mortgage rate (fixed)', value: '3.125% — guaranteed return on prepayment' },
        { label: 'PAL rate (floating)', value: '7.15% — prepaying this beats both options' },
      ],
      estimates: [
        { label: '$25K prepaid → interest saved (10 yr)', value: fmtMoney(convert(8_950, 'USD', c), c, { compact: true }) },
        { label: '$25K invested at 6.8% (10 yr)', value: fmtMoney(convert(23_180, 'USD', c), c, { compact: true }) + ' growth (pre-tax)' },
      ],
      assumptions: ['6.8% nominal US equity return (your plan assumption)', 'Mortgage interest not deductible (standard deduction)'],
      citations: [
        { label: 'Wells Fargo mortgage — Jun 2026', to: '/liabilities' },
        { label: 'Plan assumptions', to: '/scenarios' },
      ],
      followups: ['What payments are due?'],
    }),
  },
  {
    id: 'etf-overlap',
    question: 'Identify overlap across ETFs and MFs',
    mode: 'pro',
    keywords: ['overlap', 'etf', 'etfs', 'funds'],
    answer: (c) => ({
      headline: 'Your index funds overlap heavily in US mega-cap tech.',
      facts: [
        { label: 'VOO ∩ QQQ', value: '≈ 42% of QQQ’s weight also sits in VOO (top-10 mega caps)' },
        { label: 'Direct stock double-count', value: 'AAPL, MSFT, NVDA, GOOGL held directly and inside VOO/QQQ' },
        { label: 'Effective AAPL exposure', value: `${fmtMoney(convert(51_071 + 9_100, 'USD', c), c, { compact: true })} (direct + fund look-through est.)` },
      ],
      estimates: [{ label: 'Look-through weights', value: 'Fund holdings as of latest published constituents — approximate' }],
      assumptions: ['Index constituent weights from Jun 2026 rebalance'],
      citations: [{ label: 'Portfolio holdings', to: '/portfolio' }],
    }),
  },
  {
    id: 'premium-by-underlying',
    question: 'Show options premium return by underlying',
    mode: 'pro',
    keywords: ['options', 'premium', 'underlying', 'return'],
    answer: (c) => {
      const ytd = optionsPremiumYtd(c)
      const strategies = allStrategyMetrics()
      return {
        headline: `You have collected ${fmtMoney(ytd, c, { compact: true })} of option premium in 2026.`,
        facts: [
          { label: 'NVDA (covered calls + rolls)', value: fmtMoney(convert(3_460, 'USD', c), c) },
          { label: 'AAPL (covered calls + rolls)', value: fmtMoney(convert(1_520, 'USD', c), c) },
          { label: 'SPY (put spreads)', value: fmtMoney(convert(1_200, 'USD', c), c) },
          { label: 'GOOGL (cash-secured puts)', value: fmtMoney(convert(620, 'USD', c), c) },
          { label: 'Open strategies', value: `${strategies.length} — ${strategies.filter((s) => s.assignmentRisk === 'high').length} with high assignment risk` },
        ],
        estimates: [{ label: 'Annualized premium yield on collateral', value: '≈ 9.8%' }],
        citations: [
          { label: 'IBKR Activity Export — Jul 2026', to: '/options' },
          { label: 'Income records — option premium', to: '/income' },
        ],
      }
    },
  },
]

export function matchIntent(text: string, mode: 'simple' | 'pro'): CopilotIntent | null {
  const t = text.toLowerCase()
  let best: CopilotIntent | null = null
  let bestScore = 0
  for (const intent of COPILOT_INTENTS) {
    const score = intent.keywords.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0)
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }
  return bestScore > 0 ? best : null
}
