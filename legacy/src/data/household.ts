import type { Account, Member } from './types'

export const MEMBERS: Member[] = [
  { id: 'm-harsha', name: 'Harsha', short: 'H', role: 'primary', color: 'var(--m-chart-1)' },
  { id: 'm-meera', name: 'Meera', short: 'M', role: 'spouse', color: 'var(--m-chart-5)' },
  { id: 'm-joint', name: 'Joint', short: 'J', role: 'joint', color: 'var(--m-chart-2)' },
]

export const HOUSEHOLD = {
  name: 'Kandala Household',
  baseCurrency: 'USD' as const,
  countries: ['US', 'IN'] as const,
  taxResidency: 'US (federal + WA); NRI status in India',
}

export const ACCOUNTS: Account[] = [
  { id: 'acc-fid', institution: 'Fidelity', name: 'Individual Brokerage', number: '•••7842', type: 'taxable', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-harsha', costBasisMethod: 'SpecID', lastSynced: '2026-07-18', syncSource: 'Fidelity Statement — Jun 2026' },
  { id: 'acc-schwab', institution: 'Charles Schwab', name: 'Joint Brokerage', number: '•••3319', type: 'taxable', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-joint', costBasisMethod: 'FIFO', lastSynced: '2026-07-17', syncSource: 'Schwab Statement — Jun 2026' },
  { id: 'acc-ibkr', institution: 'Interactive Brokers', name: 'Margin / Options', number: '•••U114', type: 'options', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-harsha', costBasisMethod: 'SpecID', lastSynced: '2026-07-19', syncSource: 'IBKR Activity Export — Jul 2026' },
  { id: 'acc-401k', institution: 'Fidelity', name: 'Nimbus Cloud 401(k)', number: '•••9006', type: '401k', taxTreatment: 'tax_deferred', country: 'US', currency: 'USD', ownerId: 'm-harsha', lastSynced: '2026-07-15', syncSource: '401(k) Statement — Q2 2026' },
  { id: 'acc-roth', institution: 'Charles Schwab', name: 'Roth IRA', number: '•••5527', type: 'roth_ira', taxTreatment: 'tax_free', country: 'US', currency: 'USD', ownerId: 'm-meera', lastSynced: '2026-07-17', syncSource: 'Schwab Statement — Jun 2026' },
  { id: 'acc-zerodha', institution: 'Zerodha', name: 'Demat — Kite', number: '•••ZR41', type: 'demat', taxTreatment: 'taxable', country: 'IN', currency: 'INR', ownerId: 'm-harsha', costBasisMethod: 'FIFO', lastSynced: '2026-07-11', syncSource: 'Zerodha Holdings CSV — Jul 2026' },
  { id: 'acc-mf', institution: 'HDFC AMC', name: 'MF Folio 448812/07', number: '•••8812', type: 'mf_folio', taxTreatment: 'taxable', country: 'IN', currency: 'INR', ownerId: 'm-meera', lastSynced: '2026-06-30', syncSource: 'CAMS CAS — Jun 2026' },
  { id: 'acc-chase', institution: 'Chase', name: 'Checking', number: '•••2210', type: 'bank', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-joint', lastSynced: '2026-07-19', syncSource: 'Chase Statement — Jun 2026' },
  { id: 'acc-marcus', institution: 'Marcus by Goldman Sachs', name: 'High-Yield Savings', number: '•••7085', type: 'bank', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-joint', lastSynced: '2026-07-16', syncSource: 'Marcus Statement — Jun 2026' },
  { id: 'acc-hdfcb', institution: 'HDFC Bank', name: 'NRE Savings', number: '•••4471', type: 'bank', taxTreatment: 'taxable', country: 'IN', currency: 'INR', ownerId: 'm-harsha', lastSynced: '2026-06-28', syncSource: 'HDFC Bank Statement — Jun 2026' },
  { id: 'acc-etrade', institution: 'E*TRADE', name: 'Equity Awards (Nimbus Cloud)', number: '•••6119', type: 'taxable', taxTreatment: 'taxable', country: 'US', currency: 'USD', ownerId: 'm-harsha', costBasisMethod: 'SpecID', lastSynced: '2026-07-01', syncSource: 'RSU Release Confirmation — Jun 2026' },
]

export const CASH_BALANCES: { accountId: string; amount: number }[] = [
  { accountId: 'acc-fid', amount: 18_450 },
  { accountId: 'acc-schwab', amount: 6_240 },
  { accountId: 'acc-ibkr', amount: 32_800 }, // includes CSP collateral
  { accountId: 'acc-chase', amount: 14_120 },
  { accountId: 'acc-marcus', amount: 61_500 },
  { accountId: 'acc-hdfcb', amount: 815_000 }, // INR
]

export function accountById(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id)
}

export function memberById(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id)
}
