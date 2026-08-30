import type { CurrencyCode } from './types'
import { walkTo } from './rng'

/** Spot rates vs USD ("as of" the app reference date). */
export const FX_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 86.8, // 1 USD = 86.8 INR
}

export const FX_ASOF = '2026-07-20'

/** Convert an amount between currencies. */
export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount
  const usd = amount / FX_RATES[from]
  return usd * FX_RATES[to]
}

/** USD/INR history for currency-impact charts. */
export function usdInrHistory(days = 380): number[] {
  return walkTo(FX_RATES.INR, days, 77, 0.0021, 0.00012)
}
