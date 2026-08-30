import type { WatchlistItem } from './types'
import type { Instrument } from './types'
import { INSTRUMENTS } from './instruments'

/* Watchlist instruments that are not (yet) holdings. */
export const WATCH_INSTRUMENTS: Record<string, Instrument> = {
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', assetClass: 'us_equity', sector: 'Technology', geography: 'US', currency: 'USD', price: 164.3, prevClose: 160.9, fiftyTwoWeek: { low: 121.8, high: 187.3 }, peRatio: 48.2, beta: 1.62, nextEarnings: '2026-08-04', seed: 41, volatility: 0.45 },
  TSM: { symbol: 'TSM', name: 'Taiwan Semiconductor (ADR)', assetClass: 'us_equity', sector: 'Technology', geography: 'Emerging', currency: 'USD', price: 189.5, prevClose: 191.2, yieldPct: 1.31, fiftyTwoWeek: { low: 138.0, high: 212.6 }, peRatio: 28.9, nextEarnings: '2026-10-15', divPerShare: 0.62, divFrequency: 'quarterly', seed: 42, volatility: 0.34 },
  UNH: { symbol: 'UNH', name: 'UnitedHealth Group', assetClass: 'us_equity', sector: 'Healthcare', geography: 'US', currency: 'USD', price: 512.8, prevClose: 508.2, yieldPct: 1.64, fiftyTwoWeek: { low: 436.4, high: 625.3 }, peRatio: 18.4, beta: 0.68, nextEarnings: '2026-10-13', divPerShare: 2.1, divFrequency: 'quarterly', divGrowth5y: 13.8, seed: 43, volatility: 0.28 },
  JEPI: { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income', assetClass: 'etf', sector: 'Dividend', geography: 'US', currency: 'USD', price: 58.4, prevClose: 58.3, yieldPct: 7.42, fiftyTwoWeek: { low: 51.2, high: 59.9 }, divPerShare: 0.36, divFrequency: 'monthly', seed: 44, volatility: 0.12 },
  ASIANPAINT: { symbol: 'ASIANPAINT', name: 'Asian Paints', assetClass: 'in_equity', sector: 'Materials', geography: 'India', currency: 'INR', price: 2410.0, prevClose: 2398.0, yieldPct: 1.05, fiftyTwoWeek: { low: 2124.0, high: 3422.0 }, peRatio: 48.0, nextEarnings: '2026-08-11', divPerShare: 25.3, divFrequency: 'semiannual', seed: 45, volatility: 0.24 },
}

export function anyInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS[symbol] ?? WATCH_INSTRUMENTS[symbol]
}

export const WATCHLIST: WatchlistItem[] = [
  {
    id: 'w-amd',
    symbol: 'AMD',
    targetPrice: 145,
    note: 'Add below $145 — AI accelerator share gains vs NVDA.',
    alertOn: true,
    addedAt: '2026-04-12',
    thesis: 'MI-series data-center ramp narrows the gap with NVDA at half the multiple. Diversifies existing NVDA concentration only partially — same end-market.',
    entryCriteria: ['Price ≤ $145 (≈ 38× fwd earnings)', 'Data-center revenue growth > 40% y/y sustained', 'No new export-control expansion'],
    exitCriteria: ['Thesis break: DC share losses two consecutive quarters', 'Position > 3% of investable assets'],
    proposedSize: 15_000,
  },
  {
    id: 'w-tsm',
    symbol: 'TSM',
    targetPrice: 175,
    note: 'Core fab monopoly; watching geopolitics premium.',
    alertOn: true,
    addedAt: '2026-02-20',
    thesis: 'Effective monopoly on leading-edge nodes; N2 ramp in 2026. Geography risk is the discount and the danger.',
    entryCriteria: ['Price ≤ $175', 'N2 yield commentary on track'],
    exitCriteria: ['Cross-strait escalation events', 'Position > 2.5% of investable assets'],
    proposedSize: 12_000,
  },
  {
    id: 'w-unh',
    symbol: 'UNH',
    targetPrice: 470,
    note: 'Quality compounder at multi-year low multiple.',
    alertOn: false,
    addedAt: '2026-06-02',
    thesis: 'Regulatory overhang priced in at 18×; Optum growth intact. Healthcare adds a defensive sector the portfolio lacks entirely.',
    entryCriteria: ['Price ≤ $470 or resolution of DOJ inquiry'],
    exitCriteria: ['Medicare Advantage margin guidance cut twice'],
    proposedSize: 18_000,
  },
  {
    id: 'w-jepi',
    symbol: 'JEPI',
    targetPrice: 56,
    note: 'Income sleeve candidate if option-writing time shrinks.',
    alertOn: false,
    addedAt: '2026-05-18',
    thesis: 'Outsources the covered-call program at 0.35% — relevant if manual premium income (~$7.4K/yr) stops being worth the time.',
    entryCriteria: ['Decide vs manual covered-call program by year-end'],
    exitCriteria: ['Distribution yield < 6%'],
    proposedSize: 40_000,
  },
  {
    id: 'w-asianpaint',
    symbol: 'ASIANPAINT',
    targetPrice: 2250,
    note: 'India consumer quality at a 3-year low. INR sleeve.',
    alertOn: true,
    addedAt: '2026-06-25',
    thesis: 'Market-share pressure from Birla Opus is cyclical, not structural; distribution moat intact. Would lift India allocation toward its 12% target.',
    entryCriteria: ['Price ≤ ₹2,250', 'Crude (input cost) below $80'],
    exitCriteria: ['Share loss > 400bps cumulative'],
    proposedSize: 8_000,
  },
]
