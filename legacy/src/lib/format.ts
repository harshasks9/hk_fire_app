import type { CurrencyCode } from '@/data/types'

/** Reference "today" for the sample dataset — keeps all derived data coherent. */
export const TODAY = new Date('2026-07-20T12:00:00')

const symbols: Record<CurrencyCode, string> = { USD: '$', INR: '₹' }

export function fmtMoney(
  amount: number,
  currency: CurrencyCode = 'USD',
  opts: { compact?: boolean; decimals?: number; sign?: boolean } = {},
): string {
  const { compact = false, sign = false } = opts
  const neg = amount < 0
  const abs = Math.abs(amount)
  let body: string
  if (compact && abs >= 1_000_000_0 && currency === 'INR') {
    // Indian crore notation for large INR values
    body = `${(abs / 1_000_000_0).toFixed(2)} Cr`
  } else if (compact && abs >= 1_000_000) {
    body = `${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`
  } else if (compact && abs >= 10_000) {
    body = `${(abs / 1000).toFixed(1)}K`
  } else {
    const decimals = opts.decimals ?? (abs >= 1000 ? 0 : 2)
    body = abs.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  const prefix = neg ? '−' : sign ? '+' : ''
  return `${prefix}${symbols[currency]}${body}`
}

export function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtPct(n: number, opts: { sign?: boolean; decimals?: number } = {}): string {
  const { sign = false, decimals = 1 } = opts
  const prefix = n < 0 ? '−' : sign ? '+' : ''
  return `${prefix}${Math.abs(n).toFixed(decimals)}%`
}

export function fmtDate(iso: string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  if (style === 'short')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (style === 'long')
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysUntil(iso: string): number {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''))
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000)
}

export function daysAgo(iso: string): number {
  return -daysUntil(iso)
}

export function relDate(iso: string): string {
  const days = daysUntil(iso)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0 && days < 30) return `in ${days}d`
  if (days < 0 && days > -30) return `${-days}d ago`
  if (days < 0) return `${Math.round(-days / 30)}mo ago`
  return `in ${Math.round(days / 30)}mo`
}

export function isoAddDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
