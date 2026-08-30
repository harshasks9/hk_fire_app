import type { Liability } from './types'

export const LIABILITIES: Liability[] = [
  {
    id: 'liab-seattle',
    kind: 'mortgage',
    name: 'Primary Residence Mortgage',
    lender: 'Wells Fargo',
    currency: 'USD',
    ownerId: 'm-joint',
    originalPrincipal: 676_000,
    balance: 604_200,
    ratePct: 3.125,
    rateType: 'fixed',
    monthlyPayment: 2_896,
    nextPaymentDate: '2026-08-01',
    originDate: '2019-09-01',
    maturityDate: '2049-09-01',
    collateralRef: { type: 'property', id: 'prop-seattle', label: 'Queen Anne Residence' },
    source: { provenance: 'verified', sourceLabel: 'Mortgage Statement — Jun 2026', sourceId: 'doc-wf-jun', asOf: '2026-06-30' },
  },
  {
    id: 'liab-austin',
    kind: 'mortgage',
    name: 'Austin Duplex Mortgage',
    lender: 'Chase',
    currency: 'USD',
    ownerId: 'm-joint',
    originalPrincipal: 430_000,
    balance: 396_400,
    ratePct: 3.875,
    rateType: 'fixed',
    monthlyPayment: 2_022,
    nextPaymentDate: '2026-08-01',
    originDate: '2021-05-01',
    maturityDate: '2051-05-01',
    collateralRef: { type: 'property', id: 'prop-austin', label: 'Mueller District Duplex' },
    source: { provenance: 'verified', sourceLabel: 'Mortgage Statement — Jun 2026', sourceId: 'doc-chase-jun', asOf: '2026-06-30' },
  },
  {
    id: 'liab-pal',
    kind: 'loan_against_securities',
    name: 'Pledged Asset Line',
    lender: 'Charles Schwab Bank',
    currency: 'USD',
    ownerId: 'm-harsha',
    originalPrincipal: 85_000,
    balance: 85_000,
    ratePct: 7.15,
    rateType: 'floating',
    rateIndex: 'SOFR + 1.90%',
    monthlyPayment: 506, // interest-only
    nextPaymentDate: '2026-08-05',
    originDate: '2025-11-10',
    maturityDate: '2027-11-10',
    collateralRef: { type: 'securities', id: 'acc-schwab', label: 'Schwab Joint Brokerage' },
    covenants: ['Maintain collateral LTV below 50%', 'No withdrawal of pledged securities while drawn'],
    marginMaintenancePct: 50,
    source: { provenance: 'verified', sourceLabel: 'PAL Statement — Jun 2026', sourceId: 'doc-pal-jun', asOf: '2026-06-30' },
  },
  {
    id: 'liab-auto',
    kind: 'auto',
    name: 'Auto Loan — EV9',
    lender: 'Kia Finance',
    currency: 'USD',
    ownerId: 'm-meera',
    originalPrincipal: 34_000,
    balance: 18_400,
    ratePct: 4.9,
    rateType: 'fixed',
    monthlyPayment: 642,
    nextPaymentDate: '2026-08-12',
    originDate: '2023-11-12',
    maturityDate: '2028-11-12',
    source: { provenance: 'confirmed', sourceLabel: 'User entry — verified against statement', asOf: '2026-05-14' },
  },
]

export function liabilityById(id: string): Liability | undefined {
  return LIABILITIES.find((l) => l.id === id)
}

/** Standard amortization schedule (monthly). */
export function amortize(l: Liability, months?: number) {
  const r = l.ratePct / 100 / 12
  const out: { month: number; date: string; principal: number; interest: number; balance: number }[] = []
  let bal = l.balance
  const start = new Date('2026-08-01T12:00:00')
  const n = months ?? 360
  for (let m = 0; m < n && bal > 1; m++) {
    const interest = bal * r
    const principal = Math.min(Math.max(l.monthlyPayment - interest, 0), bal)
    bal -= principal
    const d = new Date(start)
    d.setMonth(d.getMonth() + m)
    out.push({ month: m, date: d.toISOString().slice(0, 10), principal, interest, balance: bal })
    if (principal <= 0 && m > 600) break
  }
  return out
}
