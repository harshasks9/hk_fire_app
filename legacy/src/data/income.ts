import type { IncomeEvent, IncomeType } from './types'
import { INSTRUMENTS } from './instruments'
import { POSITIONS } from './portfolio'
import { SYNDICATIONS } from './realestate'

/* ---------------------------------------------------------------------------
   Income events for calendar year 2026, generated from the same records the
   portfolio uses. Events on/before the reference date are 'received';
   later ones are 'expected'.
--------------------------------------------------------------------------- */

const REF = '2026-07-20'

/** Payment months (1-12) per dividend-paying symbol. */
const PAY_MONTHS: Record<string, number[]> = {
  AAPL: [2, 5, 8, 11],
  MSFT: [3, 6, 9, 12],
  GOOGL: [3, 6, 9, 12],
  COST: [2, 5, 8, 11],
  VOO: [3, 6, 9, 12],
  SCHD: [3, 6, 9, 12],
  QQQ: [3, 6, 9, 12],
  VXUS: [3, 6, 9, 12],
  VICI: [1, 4, 7, 10],
  O: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  BND: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  TCS: [2, 5, 8, 11],
  ITC: [3, 9],
  RELIANCE: [8],
  HDFCBANK: [5],
}

const PAY_DAY: Record<string, number> = {
  AAPL: 13, MSFT: 11, GOOGL: 16, COST: 20, VOO: 26, SCHD: 24, QQQ: 30, VXUS: 18,
  VICI: 9, O: 15, BND: 5, TCS: 8, ITC: 12, RELIANCE: 22, HDFCBANK: 19,
}

function d(iso: string) {
  return iso <= REF ? ('received' as const) : ('expected' as const)
}

function buildEvents(): IncomeEvent[] {
  const events: IncomeEvent[] = []
  let seq = 0
  const push = (e: Omit<IncomeEvent, 'id' | 'status'>) => {
    events.push({ ...e, id: `inc-${++seq}`, status: d(e.date) })
  }

  /* Dividends & fund distributions, aggregated per symbol across accounts */
  const bySymbol = new Map<string, { qty: number; accountId: string }>()
  for (const p of POSITIONS) {
    const cur = bySymbol.get(p.symbol)
    if (cur) cur.qty += p.qty
    else bySymbol.set(p.symbol, { qty: p.qty, accountId: p.accountId })
  }
  for (const [symbol, { qty, accountId }] of bySymbol) {
    const inst = INSTRUMENTS[symbol]
    if (!inst?.divPerShare || !PAY_MONTHS[symbol]) continue
    const type: IncomeType =
      inst.assetClass === 'reit' ? 'reit_distribution' : inst.assetClass === 'in_mf' ? 'mf_dividend' : 'dividend'
    for (const m of PAY_MONTHS[symbol]) {
      const date = `2026-${String(m).padStart(2, '0')}-${String(PAY_DAY[symbol] ?? 15).padStart(2, '0')}`
      const gross = qty * inst.divPerShare
      const withholding = inst.currency === 'INR' && type === 'dividend' ? gross * 0.1 : undefined
      push({
        date, type, sourceLabel: symbol, symbol, accountId,
        amount: Math.round(gross), currency: inst.currency,
        taxTreatment: inst.assetClass === 'reit' ? 'ordinary' : 'qualified',
        withholding: withholding ? Math.round(withholding) : undefined,
      })
    }
  }

  /* Rent */
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    push({ date: `2026-${mm}-01`, type: 'rent', sourceLabel: 'Mueller District Duplex', accountId: 'acc-chase', amount: 4_350, currency: 'USD', taxTreatment: 'ordinary' })
    push({ date: `2026-${mm}-05`, type: 'rent', sourceLabel: 'Indiranagar Apartment', accountId: 'acc-hdfcb', amount: 55_000, currency: 'INR', taxTreatment: 'ordinary' })
  }

  /* Bank interest */
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0')
    push({ date: `2026-${mm}-28`, type: 'interest', sourceLabel: 'Marcus HYSA (4.05% APY)', accountId: 'acc-marcus', amount: 206, currency: 'USD', taxTreatment: 'ordinary' })
    push({ date: `2026-${mm}-25`, type: 'interest', sourceLabel: 'HDFC NRE Savings', accountId: 'acc-hdfcb', amount: 2_700, currency: 'INR', taxTreatment: 'tax_free' })
  }

  /* Option premium (credits at open/roll) */
  const premiums: [string, string, number][] = [
    ['2026-01-16', 'NVDA covered call (Jan)', 1_120],
    ['2026-02-20', 'AAPL covered call (Feb)', 610],
    ['2026-03-20', 'SPY put spread (Mar)', 540],
    ['2026-04-17', 'NVDA roll credit', 255],
    ['2026-05-15', 'NVDA roll credit', 630],
    ['2026-05-22', 'AAPL roll credit', 230],
    ['2026-06-18', 'SPY put credit spread', 660],
    ['2026-06-26', 'AAPL covered call (Jul)', 680],
    ['2026-07-02', 'NVDA covered call (Aug)', 1_455],
    ['2026-07-08', 'GOOGL cash-secured put', 620],
  ]
  for (const [date, label, amount] of premiums) {
    push({ date, type: 'option_premium', sourceLabel: label, accountId: 'acc-ibkr', amount, currency: 'USD', taxTreatment: 'ordinary' })
  }

  /* Syndication distributions (2026) + expected Oct */
  for (const syn of SYNDICATIONS) {
    for (const dist of syn.distributions) {
      if (!dist.date.startsWith('2026')) continue
      push({ date: dist.date, type: 'syndication_distribution', sourceLabel: syn.name, amount: dist.amount, currency: syn.currency, taxTreatment: dist.type === 'return_of_capital' ? 'return_of_capital' : 'ordinary' })
    }
  }
  push({ date: '2026-10-15', type: 'syndication_distribution', sourceLabel: 'Cedar Bend Multifamily LP', amount: 1_450, currency: 'USD', taxTreatment: 'ordinary' })

  return events.sort((a, b) => a.date.localeCompare(b.date))
}

export const INCOME_EVENTS: IncomeEvent[] = buildEvents()

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  dividend: 'Dividends',
  reit_distribution: 'REIT distributions',
  interest: 'Interest',
  option_premium: 'Option premium',
  rent: 'Rent',
  syndication_distribution: 'Syndication distributions',
  mf_dividend: 'MF dividends',
}
