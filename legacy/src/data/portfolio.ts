import type { Position, SourceRef, TaxLot } from './types'

/* Helpers to keep the dataset readable. */
let lotSeq = 0
const L = (
  date: string,
  qty: number,
  costPerUnit: number,
  provenance: SourceRef['provenance'] = 'verified',
  sourceLabel = 'Brokerage statement',
  sourceId?: string,
): TaxLot => ({
  id: `lot-${++lotSeq}`,
  date,
  qty,
  costPerUnit,
  source: { provenance, sourceLabel, sourceId, asOf: date },
})

const src = (
  provenance: SourceRef['provenance'],
  sourceLabel: string,
  asOf: string,
  sourceId?: string,
  extra?: Partial<SourceRef>,
): SourceRef => ({ provenance, sourceLabel, asOf, sourceId, ...extra })

export const POSITIONS: Position[] = [
  /* -- Fidelity Individual (Harsha) -- */
  {
    id: 'pos-aapl-fid', accountId: 'acc-fid', symbol: 'AAPL', qty: 220,
    lots: [
      L('2019-03-12', 80, 52.3, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2021-08-05', 60, 132.5, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2023-04-18', 80, 171.2, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 0, feesYtd: 0, withholdingYtd: 0,
    thesis: 'Core compounder. Services mix shift and installed-base monetization support durable FCF; sized as a long-term anchor holding.',
    risks: ['Hardware cycle sensitivity', 'China exposure', 'Multiple compression at >30× earnings'],
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-msft-fid', accountId: 'acc-fid', symbol: 'MSFT', qty: 130,
    lots: [
      L('2020-06-22', 50, 210.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2022-11-02', 40, 242.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2024-05-14', 40, 405.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    thesis: 'Azure + AI infrastructure demand with high switching costs across enterprise suites.',
    risks: ['Capex intensity of AI buildout', 'Regulatory scrutiny'],
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-nvda-fid', accountId: 'acc-fid', symbol: 'NVDA', qty: 400,
    lots: [
      L('2022-10-17', 200, 17.8, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2023-06-09', 120, 42.5, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2024-08-21', 80, 92.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 8_420, feesYtd: 0,
    thesis: 'Accelerated-compute franchise; trimmed twice in 2025 to manage concentration.',
    risks: ['Concentration — 6%+ of household investable assets across two accounts', 'Cyclical AI capex', 'High volatility'],
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-voo-fid', accountId: 'acc-fid', symbol: 'VOO', qty: 260,
    lots: [
      L('2020-01-15', 90, 296.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2021-07-20', 80, 392.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2023-02-08', 90, 371.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-schd-fid', accountId: 'acc-fid', symbol: 'SCHD', qty: 900,
    lots: [
      L('2021-03-10', 400, 61.2, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2022-09-28', 300, 70.4, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2024-01-17', 200, 76.8, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    thesis: 'Dividend-growth sleeve; funds the household income floor alongside rental cash flow.',
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-o-fid', accountId: 'acc-fid', symbol: 'O', qty: 620,
    lots: [
      L('2022-04-12', 350, 66.4, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
      L('2023-10-03', 270, 54.5, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    thesis: 'Monthly income; triple-net leases with long WALT.',
    risks: ['Rate sensitivity', 'Currently below blended cost basis'],
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-bnd-fid', accountId: 'acc-fid', symbol: 'BND', qty: 300,
    lots: [L('2023-08-15', 300, 76.8, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun')],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },
  {
    id: 'pos-gld-fid', accountId: 'acc-fid', symbol: 'GLD', qty: 60,
    lots: [L('2024-03-06', 60, 172.0, 'verified', 'Fidelity Statement — Jun 2026', 'doc-fid-jun')],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Fidelity Statement — Jun 2026', '2026-06-30', 'doc-fid-jun'),
  },

  /* -- Schwab Joint -- */
  {
    id: 'pos-googl-schwab', accountId: 'acc-schwab', symbol: 'GOOGL', qty: 180,
    lots: [
      L('2022-03-01', 100, 135.2, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
      L('2023-11-14', 80, 104.1, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },
  {
    id: 'pos-cost-schwab', accountId: 'acc-schwab', symbol: 'COST', qty: 40,
    lots: [L('2021-05-19', 40, 512.0, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun')],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },
  {
    id: 'pos-qqq-schwab', accountId: 'acc-schwab', symbol: 'QQQ', qty: 110,
    lots: [
      L('2020-09-09', 60, 278.0, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
      L('2023-01-25', 50, 288.5, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },
  {
    id: 'pos-vxus-schwab', accountId: 'acc-schwab', symbol: 'VXUS', qty: 520,
    lots: [
      L('2021-10-11', 300, 60.1, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
      L('2024-04-30', 220, 55.6, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
    ],
    realizedYtd: 0, feesYtd: 0, withholdingYtd: 214,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },
  {
    id: 'pos-vici-schwab', accountId: 'acc-schwab', symbol: 'VICI', qty: 700,
    lots: [
      L('2023-03-22', 400, 31.2, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
      L('2024-10-08', 300, 27.0, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },

  /* -- IBKR (options + covered-call shares) -- */
  {
    id: 'pos-nvda-ibkr', accountId: 'acc-ibkr', symbol: 'NVDA', qty: 300,
    lots: [
      L('2023-09-06', 300, 44.9, 'imported', 'IBKR Activity Export — Jul 2026', 'doc-ibkr-jul'),
    ],
    realizedYtd: 3_180, feesYtd: 42,
    notes: 'Held at IBKR to write covered calls against.',
    source: src('imported', 'IBKR Activity Export — Jul 2026', '2026-07-19', 'doc-ibkr-jul'),
  },

  /* -- 401(k) -- */
  {
    id: 'pos-voo-401k', accountId: 'acc-401k', symbol: 'VOO', qty: 420,
    lots: [L('2018-01-01', 420, 298.0, 'confirmed', '401(k) Statement — Q2 2026', 'doc-401k-q2')],
    realizedYtd: 0, feesYtd: 118,
    source: src('confirmed', '401(k) Statement — Q2 2026', '2026-06-30', 'doc-401k-q2'),
  },
  {
    id: 'pos-qqq-401k', accountId: 'acc-401k', symbol: 'QQQ', qty: 180,
    lots: [L('2019-06-01', 180, 310.0, 'confirmed', '401(k) Statement — Q2 2026', 'doc-401k-q2')],
    realizedYtd: 0, feesYtd: 61,
    source: src('confirmed', '401(k) Statement — Q2 2026', '2026-06-30', 'doc-401k-q2'),
  },
  {
    id: 'pos-bnd-401k', accountId: 'acc-401k', symbol: 'BND', qty: 400,
    lots: [L('2020-02-01', 400, 72.0, 'confirmed', '401(k) Statement — Q2 2026', 'doc-401k-q2')],
    realizedYtd: 0, feesYtd: 0,
    source: src('confirmed', '401(k) Statement — Q2 2026', '2026-06-30', 'doc-401k-q2'),
  },

  /* -- Roth IRA (Meera) -- */
  {
    id: 'pos-schd-roth', accountId: 'acc-roth', symbol: 'SCHD', qty: 700,
    lots: [
      L('2021-02-16', 380, 58.4, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
      L('2023-07-11', 320, 64.1, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },
  {
    id: 'pos-voo-roth', accountId: 'acc-roth', symbol: 'VOO', qty: 90,
    lots: [L('2022-06-21', 90, 340.0, 'verified', 'Schwab Statement — Jun 2026', 'doc-schwab-jun')],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'Schwab Statement — Jun 2026', '2026-06-30', 'doc-schwab-jun'),
  },

  /* -- Zerodha Demat (INR) -- */
  {
    id: 'pos-rel-zer', accountId: 'acc-zerodha', symbol: 'RELIANCE', qty: 420,
    lots: [
      L('2020-11-09', 250, 2010.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
      L('2022-08-16', 170, 2504.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('imported', 'Zerodha Holdings CSV — Jul 2026', '2026-07-11', 'doc-zerodha-jul'),
  },
  {
    id: 'pos-tcs-zer', accountId: 'acc-zerodha', symbol: 'TCS', qty: 260,
    lots: [
      L('2021-04-05', 160, 3050.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
      L('2023-12-18', 100, 3232.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
    ],
    realizedYtd: 0, feesYtd: 0, withholdingYtd: 1_460,
    source: src('imported', 'Zerodha Holdings CSV — Jul 2026', '2026-07-11', 'doc-zerodha-jul'),
  },
  {
    id: 'pos-hdfcb-zer', accountId: 'acc-zerodha', symbol: 'HDFCBANK', qty: 800,
    lots: [
      L('2019-07-23', 500, 1210.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
      L('2023-05-30', 300, 1676.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('imported', 'Zerodha Holdings CSV — Jul 2026', '2026-07-11', 'doc-zerodha-jul'),
  },
  {
    id: 'pos-itc-zer', accountId: 'acc-zerodha', symbol: 'ITC', qty: 2400,
    lots: [
      L('2020-06-15', 1500, 198.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
      L('2022-02-09', 900, 232.0, 'imported', 'Zerodha Holdings CSV — Jul 2026', 'doc-zerodha-jul'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('imported', 'Zerodha Holdings CSV — Jul 2026', '2026-07-11', 'doc-zerodha-jul'),
  },

  /* -- HDFC MF folio (INR) -- */
  {
    id: 'pos-ppfcf-mf', accountId: 'acc-mf', symbol: 'PPFCF', qty: 42_000,
    lots: [
      L('2019-01-10', 18_000, 24.6, 'verified', 'CAMS CAS — Jun 2026', 'doc-cams-jun'),
      L('2021-09-01', 14_000, 47.2, 'verified', 'CAMS CAS — Jun 2026', 'doc-cams-jun'),
      L('2024-02-05', 10_000, 62.8, 'verified', 'CAMS CAS — Jun 2026', 'doc-cams-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    notes: 'SIP of ₹50,000/mo continues; lots grouped by year for readability.',
    source: src('verified', 'CAMS CAS — Jun 2026', '2026-06-30', 'doc-cams-jun'),
  },
  {
    id: 'pos-hdfcidx-mf', accountId: 'acc-mf', symbol: 'HDFCIDX', qty: 11_500,
    lots: [
      L('2020-03-20', 6_500, 98.4, 'verified', 'CAMS CAS — Jun 2026', 'doc-cams-jun'),
      L('2022-12-12', 5_000, 154.0, 'verified', 'CAMS CAS — Jun 2026', 'doc-cams-jun'),
    ],
    realizedYtd: 0, feesYtd: 0,
    source: src('verified', 'CAMS CAS — Jun 2026', '2026-06-30', 'doc-cams-jun'),
  },

  /* -- E*TRADE RSUs -- */
  {
    id: 'pos-nmbs-etrade', accountId: 'acc-etrade', symbol: 'NMBS', qty: 1_450,
    lots: [
      L('2024-03-15', 520, 45.1, 'confirmed', 'RSU Release Confirmation — Mar 2024', 'doc-rsu-24'),
      L('2025-03-15', 480, 62.3, 'confirmed', 'RSU Release Confirmation — Mar 2025', 'doc-rsu-25'),
      L('2026-03-15', 450, 78.0, 'confirmed', 'RSU Release Confirmation — Jun 2026', 'doc-rsu-26'),
    ],
    realizedYtd: 0, feesYtd: 0,
    notes: 'Unvested: 1,350 shares vesting quarterly through Mar 2028 (not included in totals).',
    risks: ['Single-issuer concentration alongside salary income', 'Vesting-date tax withholding at supplemental rate'],
    source: src('confirmed', 'RSU Release Confirmation — Jun 2026', '2026-07-01', 'doc-rsu-26'),
  },
]

export function positionById(id: string): Position | undefined {
  return POSITIONS.find((p) => p.id === id)
}
