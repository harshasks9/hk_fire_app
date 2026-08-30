/* ---------------------------------------------------------------------------
   Derived numbers for personal mode. Every figure any screen shows must come
   through here so the same question always has the same answer.

   Currency: values are converted with the static FX table (labeled in the UI
   as an estimate with its as-of date). Unknown balances stay unknown — they
   are surfaced in `unknowns`, never treated as zero.
--------------------------------------------------------------------------- */

import { convert } from '@/data/fx'
import type { CurrencyCode } from '@/data/types'
import type { LedgerTxn, StoreData, TxnKind } from './types'

const toDisplay = (amount: number, from: CurrencyCode, to: CurrencyCode) => convert(amount, from, to)

export interface NetWorthBreakdown {
  netWorth: number
  accountsTotal: number
  assetsTotal: number
  liabilitiesTotal: number
  /** Names of records whose value is unknown and therefore NOT included. */
  unknowns: string[]
  counts: { accounts: number; assets: number; liabilities: number }
}

export function netWorthBreakdown(s: StoreData, display: CurrencyCode): NetWorthBreakdown {
  const unknowns: string[] = []
  let accountsTotal = 0
  for (const a of s.accounts) {
    if (a.balance === null) unknowns.push(a.name)
    else accountsTotal += toDisplay(a.balance, a.currency, display)
  }
  const assetsTotal = s.assets.reduce((t, a) => t + toDisplay(a.value, a.currency, display), 0)
  const liabilitiesTotal = s.liabilities.reduce((t, l) => t + toDisplay(l.balance, l.currency, display), 0)
  return {
    netWorth: accountsTotal + assetsTotal - liabilitiesTotal,
    accountsTotal,
    assetsTotal,
    liabilitiesTotal,
    unknowns,
    counts: { accounts: s.accounts.length, assets: s.assets.length, liabilities: s.liabilities.length },
  }
}

/* ---------------------------------- ledger --------------------------------- */

export interface MonthFlow {
  month: string
  dividends: number
  interest: number
  optionPremium: number
  taxes: number
  fees: number
  /** Transfers are tracked separately and never counted as income/expense. */
  transfersIn: number
  transfersOut: number
}

const INCOME_KINDS: TxnKind[] = ['dividend', 'interest']

export function monthlyFlows(s: StoreData): MonthFlow[] {
  const by: Record<string, MonthFlow> = {}
  const row = (m: string): MonthFlow =>
    (by[m] ??= { month: m, dividends: 0, interest: 0, optionPremium: 0, taxes: 0, fees: 0, transfersIn: 0, transfersOut: 0 })
  for (const t of s.ledger) {
    const m = t.date.slice(0, 7)
    const r = row(m)
    if (t.kind === 'dividend') r.dividends += t.amount
    else if (t.kind === 'interest') r.interest += t.amount
    else if (t.kind === 'interest_charge') r.interest += t.amount
    else if (t.kind === 'option_trade') r.optionPremium += t.amount
    else if (t.kind === 'tax') r.taxes += t.amount
    else if (t.kind === 'fee') r.fees += t.amount
    else if (t.kind === 'transfer') {
      if (t.amount >= 0) r.transfersIn += t.amount
      else r.transfersOut += t.amount
    }
  }
  return Object.values(by).sort((a, b) => a.month.localeCompare(b.month))
}

export interface LedgerTotals {
  txns: number
  dividends: number
  interest: number
  optionPremiumNet: number
  taxes: number
  transfersNet: number
  dateFrom: string | null
  dateTo: string | null
}

export function ledgerTotals(s: StoreData): LedgerTotals {
  const t: LedgerTotals = {
    txns: s.ledger.length, dividends: 0, interest: 0, optionPremiumNet: 0,
    taxes: 0, transfersNet: 0,
    dateFrom: s.ledger[0]?.date ?? null,
    dateTo: s.ledger[s.ledger.length - 1]?.date ?? null,
  }
  for (const x of s.ledger) {
    if (x.kind === 'dividend') t.dividends += x.amount
    else if (x.kind === 'interest' || x.kind === 'interest_charge') t.interest += x.amount
    else if (x.kind === 'option_trade') t.optionPremiumNet += x.amount
    else if (x.kind === 'tax') t.taxes += x.amount
    else if (x.kind === 'transfer') t.transfersNet += x.amount
  }
  return t
}

export interface LedgerFilter {
  kind?: TxnKind | 'all'
  symbol?: string
  month?: string
  query?: string
}

export function filterLedger(s: StoreData, f: LedgerFilter): LedgerTxn[] {
  const q = f.query?.trim().toUpperCase()
  return s.ledger.filter((t) => {
    if (f.kind && f.kind !== 'all' && t.kind !== f.kind) return false
    if (f.symbol && t.symbol.replace(/^ ?-/, '').replace(/\d.*$/, '') !== f.symbol) return false
    if (f.month && !t.date.startsWith(f.month)) return false
    if (q && !(t.symbol.toUpperCase().includes(q) || t.desc.toUpperCase().includes(q) || t.action.toUpperCase().includes(q))) return false
    return true
  })
}

export function ledgerSymbols(s: StoreData): string[] {
  const set = new Set<string>()
  for (const t of s.ledger) {
    const sym = t.symbol.replace(/^ ?-/, '').replace(/\d.*$/, '')
    if (sym) set.add(sym)
  }
  return [...set].sort()
}

export function incomeBySymbol(s: StoreData): { symbol: string; dividends: number; count: number }[] {
  const by: Record<string, { symbol: string; dividends: number; count: number }> = {}
  for (const t of s.ledger) {
    if (t.kind !== 'dividend') continue
    const sym = t.symbol || t.desc.slice(0, 24)
    by[sym] ??= { symbol: sym, dividends: 0, count: 0 }
    by[sym].dividends += t.amount
    by[sym].count++
  }
  return Object.values(by).sort((a, b) => b.dividends - a.dividends)
}

/* ------------------------------- completeness ------------------------------ */

export interface SetupStatus {
  hasProfile: boolean
  hasAccounts: boolean
  hasBalances: boolean
  hasLedger: boolean
  hasGoals: boolean
  /** Ordered, honest list of what to do next to make numbers computable. */
  nextSteps: string[]
}

export function setupStatus(s: StoreData): SetupStatus {
  const hasAccounts = s.accounts.length > 0
  const hasBalances = s.accounts.some((a) => a.balance !== null) || s.assets.length > 0
  const hasLedger = s.ledger.length > 0
  const steps: string[] = []
  if (!hasAccounts) steps.push('Add your accounts (name, type, balance) so net worth can be computed')
  else if (s.accounts.some((a) => a.balance === null)) steps.push('Fill in missing account balances — unknown balances are excluded from totals')
  if (!hasLedger) steps.push('Import a Fidelity Accounts_History CSV to populate income and activity')
  if (s.liabilities.length === 0) steps.push('Add loans or credit cards if you have any, so net worth is not overstated')
  if (s.goals.length === 0) steps.push('Set a goal to track progress against your net worth')
  return { hasProfile: !!s.profileName, hasAccounts, hasBalances, hasLedger, hasGoals: s.goals.length > 0, nextSteps: steps }
}

/** Staleness: oldest as-of among balance-bearing records, for freshness warnings. */
export function oldestBalanceAsOf(s: StoreData): string | null {
  const dates = [
    ...s.accounts.filter((a) => a.balance !== null).map((a) => a.source.asOf),
    ...s.assets.map((a) => a.source.asOf),
    ...s.liabilities.map((l) => l.source.asOf),
  ].filter(Boolean)
  return dates.length ? dates.sort()[0] : null
}
