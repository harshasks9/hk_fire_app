import type { TaxSummary } from './types'

export const TAX_SUMMARIES: TaxSummary[] = [
  {
    year: 2026,
    jurisdiction: 'US',
    estimatedObligation: 14_800,
    currency: 'USD',
    provenance: 'estimated',
    realizedStGains: 3_180,
    realizedLtGains: 8_420,
    unrealizedStGains: 12_400,
    unrealizedLtGains: 214_600,
    carryForwardLosses: 0,
    harvestableLosses: 3_348, // O + BND
    foreignWithholding: 214,
    deadlines: [
      { label: 'Q3 estimated payment (Federal)', date: '2026-09-15' },
      { label: 'Q4 estimated payment (Federal)', date: '2027-01-15' },
      { label: '2026 Form 1040 filing', date: '2027-04-15' },
    ],
    missingDocs: ['IBKR 1099 (available Feb 2027)'],
    advisorNotes: [
      'Supplemental RSU withholding (22%) runs below the 24% marginal bracket — expect a small balance due at filing.',
      'WA has no state income tax; no state estimated payments required.',
    ],
  },
  {
    year: 2026,
    jurisdiction: 'IN',
    estimatedObligation: 92_000,
    currency: 'INR',
    provenance: 'estimated',
    realizedStGains: 0,
    realizedLtGains: 184_000,
    unrealizedStGains: 96_000,
    unrealizedLtGains: 2_610_000,
    carryForwardLosses: 42_000,
    harvestableLosses: 0,
    foreignWithholding: 0,
    deadlines: [
      { label: 'Advance tax installment (75%)', date: '2026-12-15' },
      { label: 'ITR filing (AY 2026-27)', date: '2026-07-31' },
    ],
    missingDocs: ['Zerodha capital gains statement FY2025-26'],
    residencyDays: 34,
    advisorNotes: [
      'NRI status maintained: 34 days in India this FY (limit 181).',
      'Rental income taxed in India; claim credit on US return under DTAA Article 25.',
    ],
  },
]
