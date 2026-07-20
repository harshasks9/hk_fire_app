import type { OptionStrategy } from './types'

/* Open option strategies. Reference date: 2026-07-20. */

export const OPTION_STRATEGIES: OptionStrategy[] = [
  {
    id: 'opt-aapl-cc',
    accountId: 'acc-fid',
    kind: 'covered_call',
    underlying: 'AAPL',
    linkedPositionId: 'pos-aapl-fid',
    openedAt: '2026-06-26',
    legs: [
      {
        id: 'leg-aapl-1', type: 'call', side: 'short', strike: 230, expiry: '2026-07-24',
        contracts: 2, premium: 3.4, currentPrice: 4.1, delta: -0.62, theta: 0.31, iv: 0.26,
      },
    ],
    rollHistory: [
      { date: '2026-05-22', note: 'Rolled 225C Jun → 230C Jul for net credit', credit: 1.15 },
    ],
    source: { provenance: 'verified', sourceLabel: 'Fidelity Statement — Jun 2026', sourceId: 'doc-fid-jun', asOf: '2026-06-30' },
  },
  {
    id: 'opt-nvda-cc',
    accountId: 'acc-ibkr',
    kind: 'covered_call',
    underlying: 'NVDA',
    linkedPositionId: 'pos-nvda-ibkr',
    openedAt: '2026-07-02',
    legs: [
      {
        id: 'leg-nvda-1', type: 'call', side: 'short', strike: 140, expiry: '2026-08-21',
        contracts: 3, premium: 4.85, currentPrice: 2.2, delta: -0.31, theta: 0.09, iv: 0.44,
      },
    ],
    rollHistory: [
      { date: '2026-04-17', note: 'Assigned-risk roll: 120C Apr → 132C May', credit: 0.85 },
      { date: '2026-05-15', note: 'Rolled 132C May → 140C Aug on strength', credit: 2.1 },
    ],
    source: { provenance: 'imported', sourceLabel: 'IBKR Activity Export — Jul 2026', sourceId: 'doc-ibkr-jul', asOf: '2026-07-19' },
  },
  {
    id: 'opt-googl-csp',
    accountId: 'acc-ibkr',
    kind: 'cash_secured_put',
    underlying: 'GOOGL',
    openedAt: '2026-07-08',
    collateral: 33_000,
    legs: [
      {
        id: 'leg-googl-1', type: 'put', side: 'short', strike: 165, expiry: '2026-08-07',
        contracts: 2, premium: 3.1, currentPrice: 1.45, delta: 0.24, theta: 0.07, iv: 0.29,
      },
    ],
    source: { provenance: 'imported', sourceLabel: 'IBKR Activity Export — Jul 2026', sourceId: 'doc-ibkr-jul', asOf: '2026-07-19' },
  },
  {
    id: 'opt-spy-vert',
    accountId: 'acc-ibkr',
    kind: 'vertical_spread',
    underlying: 'SPY',
    openedAt: '2026-06-18',
    legs: [
      {
        id: 'leg-spy-1', type: 'put', side: 'short', strike: 530, expiry: '2026-09-18',
        contracts: 2, premium: 6.4, currentPrice: 4.9, delta: 0.21, theta: 0.05, iv: 0.17,
      },
      {
        id: 'leg-spy-2', type: 'put', side: 'long', strike: 510, expiry: '2026-09-18',
        contracts: 2, premium: -3.1, currentPrice: -2.3, delta: -0.13, theta: -0.03, iv: 0.19,
      },
    ],
    source: { provenance: 'imported', sourceLabel: 'IBKR Activity Export — Jul 2026', sourceId: 'doc-ibkr-jul', asOf: '2026-07-19' },
  },
  {
    id: 'opt-aapl-cal',
    accountId: 'acc-ibkr',
    kind: 'calendar_spread',
    underlying: 'AAPL',
    openedAt: '2026-07-01',
    legs: [
      {
        id: 'leg-cal-1', type: 'call', side: 'short', strike: 240, expiry: '2026-08-21',
        contracts: 1, premium: 2.9, currentPrice: 1.35, delta: -0.28, theta: 0.06, iv: 0.25,
      },
      {
        id: 'leg-cal-2', type: 'call', side: 'long', strike: 240, expiry: '2026-11-20',
        contracts: 1, premium: -7.8, currentPrice: -8.4, delta: 0.41, theta: -0.03, iv: 0.24,
      },
    ],
    source: { provenance: 'imported', sourceLabel: 'IBKR Activity Export — Jul 2026', sourceId: 'doc-ibkr-jul', asOf: '2026-07-19' },
  },
]

export const STRATEGY_LABELS: Record<string, string> = {
  covered_call: 'Covered Call',
  cash_secured_put: 'Cash-Secured Put',
  vertical_spread: 'Put Credit Spread',
  calendar_spread: 'Calendar Spread',
  long_call: 'Long Call',
  protective_put: 'Protective Put',
}
