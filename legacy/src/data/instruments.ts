import type { Instrument } from './types'
import { walkTo } from './rng'

/* Fictionalized but realistic market data, "as of" the app's reference date. */

const I = (i: Instrument) => i

export const INSTRUMENTS: Record<string, Instrument> = {
  AAPL: I({ symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'us_equity', sector: 'Technology', geography: 'US', currency: 'USD', price: 232.14, prevClose: 229.86, yieldPct: 0.44, fiftyTwoWeek: { low: 182.4, high: 241.9 }, peRatio: 35.2, beta: 1.24, nextEarnings: '2026-07-30', exDivDate: '2026-08-08', divPerShare: 0.26, divFrequency: 'quarterly', divGrowth5y: 5.6, seed: 11, volatility: 0.24 }),
  MSFT: I({ symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'us_equity', sector: 'Technology', geography: 'US', currency: 'USD', price: 452.3, prevClose: 449.1, yieldPct: 0.72, fiftyTwoWeek: { low: 388.0, high: 470.4 }, peRatio: 36.8, beta: 0.92, nextEarnings: '2026-07-28', exDivDate: '2026-08-19', divPerShare: 0.83, divFrequency: 'quarterly', divGrowth5y: 10.2, seed: 12, volatility: 0.21 }),
  NVDA: I({ symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'us_equity', sector: 'Technology', geography: 'US', currency: 'USD', price: 128.44, prevClose: 131.02, yieldPct: 0.03, fiftyTwoWeek: { low: 86.6, high: 149.8 }, peRatio: 62.1, beta: 1.68, nextEarnings: '2026-08-26', divPerShare: 0.01, divFrequency: 'quarterly', seed: 13, volatility: 0.42 }),
  GOOGL: I({ symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'us_equity', sector: 'Communication', geography: 'US', currency: 'USD', price: 178.62, prevClose: 177.4, yieldPct: 0.45, fiftyTwoWeek: { low: 148.2, high: 193.3 }, peRatio: 24.6, beta: 1.05, nextEarnings: '2026-07-23', exDivDate: '2026-09-08', divPerShare: 0.2, divFrequency: 'quarterly', seed: 14, volatility: 0.27 }),
  COST: I({ symbol: 'COST', name: 'Costco Wholesale', assetClass: 'us_equity', sector: 'Consumer Staples', geography: 'US', currency: 'USD', price: 894.5, prevClose: 891.2, yieldPct: 0.52, fiftyTwoWeek: { low: 702.0, high: 938.6 }, peRatio: 52.3, beta: 0.78, nextEarnings: '2026-09-24', exDivDate: '2026-08-01', divPerShare: 1.16, divFrequency: 'quarterly', divGrowth5y: 12.4, seed: 15, volatility: 0.19 }),
  VOO: I({ symbol: 'VOO', name: 'Vanguard S&P 500 ETF', assetClass: 'etf', sector: 'Broad Market', geography: 'US', currency: 'USD', price: 512.4, prevClose: 510.1, yieldPct: 1.28, fiftyTwoWeek: { low: 428.9, high: 522.2 }, exDivDate: '2026-09-26', divPerShare: 1.72, divFrequency: 'quarterly', divGrowth5y: 6.1, seed: 16, volatility: 0.14 }),
  SCHD: I({ symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', assetClass: 'etf', sector: 'Dividend', geography: 'US', currency: 'USD', price: 82.9, prevClose: 82.55, yieldPct: 3.48, fiftyTwoWeek: { low: 71.2, high: 84.7 }, exDivDate: '2026-09-24', divPerShare: 0.74, divFrequency: 'quarterly', divGrowth5y: 11.8, seed: 17, volatility: 0.13 }),
  QQQ: I({ symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'etf', sector: 'Technology', geography: 'US', currency: 'USD', price: 481.7, prevClose: 479.4, yieldPct: 0.58, fiftyTwoWeek: { low: 395.0, high: 494.8 }, exDivDate: '2026-09-19', divPerShare: 0.71, divFrequency: 'quarterly', seed: 18, volatility: 0.2 }),
  VXUS: I({ symbol: 'VXUS', name: 'Vanguard Total Intl Stock ETF', assetClass: 'etf', sector: 'Broad Market', geography: 'Intl Developed', currency: 'USD', price: 64.1, prevClose: 63.9, yieldPct: 3.02, fiftyTwoWeek: { low: 54.8, high: 65.0 }, exDivDate: '2026-09-18', divPerShare: 0.49, divFrequency: 'quarterly', seed: 19, volatility: 0.15 }),
  O: I({ symbol: 'O', name: 'Realty Income Corp.', assetClass: 'reit', sector: 'Real Estate', geography: 'US', currency: 'USD', price: 58.72, prevClose: 58.4, yieldPct: 5.41, fiftyTwoWeek: { low: 50.7, high: 64.9 }, peRatio: 41.0, beta: 0.82, exDivDate: '2026-08-01', divPerShare: 0.2645, divFrequency: 'monthly', divGrowth5y: 3.4, seed: 20, volatility: 0.18 }),
  VICI: I({ symbol: 'VICI', name: 'VICI Properties', assetClass: 'reit', sector: 'Real Estate', geography: 'US', currency: 'USD', price: 32.85, prevClose: 32.6, yieldPct: 5.28, fiftyTwoWeek: { low: 27.1, high: 34.3 }, peRatio: 12.4, exDivDate: '2026-09-17', divPerShare: 0.4325, divFrequency: 'quarterly', divGrowth5y: 7.1, seed: 21, volatility: 0.2 }),
  BND: I({ symbol: 'BND', name: 'Vanguard Total Bond Market ETF', assetClass: 'bond', sector: 'Fixed Income', geography: 'US', currency: 'USD', price: 74.6, prevClose: 74.55, yieldPct: 4.32, fiftyTwoWeek: { low: 70.9, high: 75.6 }, exDivDate: '2026-08-01', divPerShare: 0.27, divFrequency: 'monthly', seed: 22, volatility: 0.06 }),
  GLD: I({ symbol: 'GLD', name: 'SPDR Gold Shares', assetClass: 'commodity', sector: 'Commodities', geography: 'Global', currency: 'USD', price: 228.4, prevClose: 226.8, fiftyTwoWeek: { low: 178.5, high: 232.1 }, seed: 23, volatility: 0.15 }),
  NMBS: I({ symbol: 'NMBS', name: 'Nimbus Cloud Inc. (RSU)', assetClass: 'employee_equity', sector: 'Technology', geography: 'US', currency: 'USD', price: 84.2, prevClose: 83.1, fiftyTwoWeek: { low: 52.4, high: 91.6 }, nextEarnings: '2026-08-06', seed: 24, volatility: 0.46 }),
  RELIANCE: I({ symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'in_equity', sector: 'Energy', geography: 'India', currency: 'INR', price: 2954.5, prevClose: 2940.1, yieldPct: 0.34, fiftyTwoWeek: { low: 2320.0, high: 3049.0 }, peRatio: 28.4, exDivDate: '2026-08-14', divPerShare: 10, divFrequency: 'annual', seed: 25, volatility: 0.22 }),
  TCS: I({ symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'in_equity', sector: 'Technology', geography: 'India', currency: 'INR', price: 4082.0, prevClose: 4110.5, yieldPct: 1.42, fiftyTwoWeek: { low: 3320.0, high: 4478.0 }, peRatio: 30.1, exDivDate: '2026-10-16', divPerShare: 28, divFrequency: 'quarterly', divGrowth5y: 8.9, seed: 26, volatility: 0.2 }),
  HDFCBANK: I({ symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'in_equity', sector: 'Financials', geography: 'India', currency: 'INR', price: 1682.3, prevClose: 1676.0, yieldPct: 1.16, fiftyTwoWeek: { low: 1380.0, high: 1794.0 }, peRatio: 19.2, exDivDate: '2026-05-20', divPerShare: 19.5, divFrequency: 'annual', seed: 27, volatility: 0.21 }),
  ITC: I({ symbol: 'ITC', name: 'ITC Ltd.', assetClass: 'in_equity', sector: 'Consumer Staples', geography: 'India', currency: 'INR', price: 448.2, prevClose: 446.7, yieldPct: 3.06, fiftyTwoWeek: { low: 392.0, high: 502.0 }, peRatio: 26.0, exDivDate: '2026-08-28', divPerShare: 7.5, divFrequency: 'semiannual', divGrowth5y: 9.8, seed: 28, volatility: 0.17 }),
  PPFCF: I({ symbol: 'PPFCF', name: 'Parag Parikh Flexi Cap Fund', assetClass: 'in_mf', sector: 'Flexi Cap', geography: 'India', currency: 'INR', price: 84.62, prevClose: 84.3, fiftyTwoWeek: { low: 68.1, high: 85.3 }, seed: 29, volatility: 0.16 }),
  HDFCIDX: I({ symbol: 'HDFCIDX', name: 'HDFC Index Fund — Nifty 50', assetClass: 'in_mf', sector: 'Index', geography: 'India', currency: 'INR', price: 212.4, prevClose: 211.6, fiftyTwoWeek: { low: 176.0, high: 214.8 }, seed: 30, volatility: 0.15 }),
  SPY: I({ symbol: 'SPY', name: 'SPDR S&P 500 ETF', assetClass: 'etf', sector: 'Broad Market', geography: 'US', currency: 'USD', price: 557.2, prevClose: 554.8, yieldPct: 1.25, fiftyTwoWeek: { low: 466.4, high: 568.3 }, seed: 31, volatility: 0.14 }),
}

/** Benchmarks for performance comparison. */
export const BENCHMARKS = {
  SP500: { label: 'S&P 500 TR', seed: 91, ytdPct: 9.4, oneYearPct: 16.2, threeYearPct: 11.8 },
  NIFTY50: { label: 'Nifty 50 TR', seed: 92, ytdPct: 7.1, oneYearPct: 12.4, threeYearPct: 13.6 },
  BLEND: { label: '70/30 Global Blend', seed: 93, ytdPct: 8.2, oneYearPct: 13.9, threeYearPct: 10.9 },
}

const historyCache = new Map<string, number[]>()

/** Daily price history ending at the instrument's current price. */
export function priceHistory(symbol: string, days = 380): number[] {
  const key = `${symbol}:${days}`
  const hit = historyCache.get(key)
  if (hit) return hit
  const inst = INSTRUMENTS[symbol]
  const vol = (inst?.volatility ?? 0.2) / Math.sqrt(252)
  const h = walkTo(inst?.price ?? 100, days, inst?.seed ?? 1, vol, 0.00055)
  historyCache.set(key, h)
  return h
}

export function dayChangePct(symbol: string): number {
  const i = INSTRUMENTS[symbol]
  if (!i) return 0
  return ((i.price - i.prevClose) / i.prevClose) * 100
}
