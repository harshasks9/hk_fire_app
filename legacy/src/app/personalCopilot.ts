/* Copilot intents for personal mode.

   Deterministic, not an LLM: every answer is computed from the canonical
   store or the imported broker datasets at the moment you ask. When data is
   missing the answer says what is missing instead of inventing a number. */

import { fmtDate, fmtMoney } from '@/lib/format'
import type { CurrencyCode } from '@/data/types'
import { convert } from '@/data/fx'
import { getStore } from '@/store/store'
import { incomeBySymbol, ledgerTotals, monthlyFlows, netWorthBreakdown, setupStatus } from '@/store/selectors'
import { LIVE_OPTION_BOOK, OPTIONS_TOTALS, TRADING_STATS, TRADING_WINDOW } from '@/data/fidelityTrading'
import type { CopilotIntent } from './copilotEngine'

const cv = (n: number, c: CurrencyCode) => convert(n, 'USD', c)

export const PERSONAL_INTENTS: CopilotIntent[] = [
  {
    id: 'p-networth',
    question: 'What is my net worth?',
    mode: 'both',
    keywords: ['net', 'worth', 'total', 'position'],
    answer: (c) => {
      const s = getStore()
      const nw = netWorthBreakdown(s, c)
      if (nw.counts.accounts + nw.counts.assets + nw.counts.liabilities === 0) {
        return {
          headline: 'I can’t compute net worth yet — there are no balance records.',
          facts: [],
          missing: ['Add accounts, assets and liabilities under Net Worth. Totals derive from exactly those records.'],
          citations: [{ label: 'Net Worth & Accounts', to: '/balances' }],
          followups: ['What income have I collected?'],
        }
      }
      return {
        headline: `Your net worth is ${fmtMoney(nw.netWorth, c)} — ${nw.counts.accounts + nw.counts.assets} asset records minus ${nw.counts.liabilities} liabilities.`,
        facts: [
          { label: 'Accounts', value: fmtMoney(nw.accountsTotal, c) },
          { label: 'Other assets', value: fmtMoney(nw.assetsTotal, c) },
          { label: 'Liabilities', value: `−${fmtMoney(nw.liabilitiesTotal, c)}` },
        ],
        missing: nw.unknowns.length ? [`${nw.unknowns.join(', ')} ${nw.unknowns.length === 1 ? 'has' : 'have'} no balance — excluded from the total, not guessed.`] : undefined,
        citations: [{ label: 'Every underlying record', to: '/balances' }],
        followups: ['What income have I collected?', 'How are my goals tracking?'],
      }
    },
  },
  {
    id: 'p-income',
    question: 'What income have I collected?',
    mode: 'both',
    keywords: ['income', 'dividend', 'collected', 'interest', 'yield'],
    answer: (c) => {
      const s = getStore()
      if (s.ledger.length === 0) {
        return {
          headline: 'No transaction history is imported, so income can’t be computed yet.',
          facts: [],
          missing: ['Import a Fidelity Accounts_History CSV — dividends and interest are summed from the broker rows.'],
          citations: [{ label: 'Import', to: '/documents' }],
          followups: ['What is my net worth?'],
        }
      }
      const t = ledgerTotals(s)
      const flows = monthlyFlows(s)
      const last = flows[flows.length - 1]
      const top = incomeBySymbol(s).slice(0, 3)
      return {
        headline: `Your imported ledger shows ${fmtMoney(cv(t.dividends, c), c)} of dividends and ${fmtMoney(cv(t.interest, c), c)} net interest between ${fmtDate(t.dateFrom!)} and ${fmtDate(t.dateTo!)}.`,
        facts: [
          ...(last ? [{ label: `Latest month (${last.month})`, value: fmtMoney(cv(last.dividends + last.interest, c), c) }] : []),
          ...top.map((x) => ({ label: `Top payer — ${x.symbol}`, value: fmtMoney(cv(x.dividends, c), c) })),
          { label: 'Withholding in the same window', value: fmtMoney(cv(t.taxes, c), c) },
        ],
        assumptions: ['Transfers between your own accounts are never counted as income.'],
        citations: [{ label: 'Income (computed per month)', to: '/income' }, { label: 'Ledger rows', to: '/ledger' }],
        followups: ['What options expire soon?', 'What is my net worth?'],
      }
    },
  },
  {
    id: 'p-expiries',
    question: 'What options expire soon?',
    mode: 'both',
    keywords: ['option', 'expire', 'expiry', 'due', 'obligation', 'assignment'],
    answer: () => {
      const now = Date.now()
      const soon = LIVE_OPTION_BOOK
        .map((p) => ({ ...p, days: Math.round((new Date(p.expiry + 'T12:00:00').getTime() - now) / 86400000) }))
        .filter((p) => p.days >= 0 && p.days <= 45)
        .sort((a, b) => a.days - b.days)
      return {
        headline: soon.length
          ? `${soon.length} imported option line${soon.length === 1 ? '' : 's'} expire within 45 days.`
          : 'No imported option contracts expire within 45 days.',
        facts: soon.slice(0, 6).map((p) => ({
          label: `${p.netQty > 0 ? '+' : ''}${p.netQty}× ${p.under} $${p.strike} ${p.type === 'call' ? 'C' : 'P'}`,
          value: `${fmtDate(p.expiry)} (${p.days}d)`,
        })),
        assumptions: [`Positions are as of your last CSV export (${TRADING_WINDOW.to}) — anything closed since isn’t reflected until you re-import.`],
        citations: [{ label: 'Live option book', to: '/trading-review' }],
        followups: ['How did my trading actually go?'],
      }
    },
  },
  {
    id: 'p-trading',
    question: 'How did my trading actually go?',
    mode: 'both',
    keywords: ['trading', 'trade', 'performance', 'win', 'strengths', 'weaknesses', 'review'],
    answer: (c) => ({
      headline: `Over 14 months: stock round trips realized ${fmtMoney(cv(TRADING_STATS.totalRealized, c), c)} at a ${(TRADING_STATS.winRate * 100).toFixed(0)}% win rate, while settled option premium earned ${fmtMoney(cv(OPTIONS_TOTALS.settledCash, c), c)}.`,
      facts: [
        { label: 'Round trips', value: `${TRADING_STATS.trips} (${TRADING_STATS.wins} wins)` },
        { label: 'Median hold — winners vs losers', value: `${TRADING_STATS.medianHoldWin}d vs ${TRADING_STATS.medianHoldLoss}d` },
        { label: 'Cash deployed in live options', value: fmtMoney(cv(OPTIONS_TOTALS.liveCash, c), c) },
      ],
      assumptions: ['Live contracts are cash flow, not P&L — no marks are available without a market-data connection.'],
      citations: [{ label: 'Full trading review', to: '/trading-review' }],
      followups: ['What options expire soon?'],
    }),
  },
  {
    id: 'p-goals',
    question: 'How are my goals tracking?',
    mode: 'both',
    keywords: ['goal', 'goals', 'target', 'progress', 'fire'],
    answer: (c) => {
      const s = getStore()
      if (s.goals.length === 0) {
        return {
          headline: 'You haven’t set any goals yet.',
          facts: [],
          missing: ['Create a goal (target amount + optional date) and progress is measured against your real net worth.'],
          citations: [{ label: 'Goals', to: '/plan' }],
          followups: ['What is my net worth?'],
        }
      }
      const nw = netWorthBreakdown(s, c)
      return {
        headline: `${s.goals.length} goal${s.goals.length === 1 ? '' : 's'}, measured against your current net worth of ${fmtMoney(nw.netWorth, c)}.`,
        facts: s.goals.map((g) => {
          const cur = convert(nw.netWorth, c, g.currency)
          const pct = g.target > 0 ? Math.min(100, (cur / g.target) * 100) : 0
          return { label: g.name, value: `${pct.toFixed(0)}% of ${fmtMoney(g.target, g.currency, { compact: true })}` }
        }),
        citations: [{ label: 'Goals', to: '/plan' }],
        followups: ['What changed recently?'],
      }
    },
  },
  {
    id: 'p-changed',
    question: 'What changed recently?',
    mode: 'both',
    keywords: ['changed', 'recent', 'activity', 'happened', 'edits'],
    answer: () => {
      const s = getStore()
      return {
        headline: s.activity.length
          ? `${s.activity.length} recorded change${s.activity.length === 1 ? '' : 's'} to your data — the latest ${s.activity[0].text.toLowerCase()}`
          : 'No changes recorded yet — the activity log starts with your first record or import.',
        facts: s.activity.slice(0, 5).map((a) => ({ label: fmtDate(a.at.slice(0, 10)), value: a.text })),
        citations: [{ label: 'Activity log', to: '/timeline' }],
        followups: ['What is my net worth?'],
      }
    },
  },
  {
    id: 'p-missing',
    question: 'What data am I missing?',
    mode: 'both',
    keywords: ['missing', 'complete', 'setup', 'gaps', 'need'],
    answer: () => {
      const s = getStore()
      const st = setupStatus(s)
      return {
        headline: st.nextSteps.length === 0
          ? 'Nothing obvious — all record types have values. Keep balances fresh.'
          : `${st.nextSteps.length} thing${st.nextSteps.length === 1 ? '' : 's'} would make your numbers more complete.`,
        facts: [],
        missing: st.nextSteps,
        citations: [{ label: 'Net Worth & Accounts', to: '/balances' }, { label: 'Import', to: '/documents' }],
        followups: ['What is my net worth?', 'What income have I collected?'],
      }
    },
  },
]

