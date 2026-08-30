/* ---------------------------------------------------------------------------
   Canonical personal-finance records.

   Everything the personal mode of the app shows is derived from these records
   and nothing else. Each record carries its origin: entered by hand, imported
   from a broker file, or computed. Nothing here is sampled or invented.
--------------------------------------------------------------------------- */

import type { CurrencyCode } from '@/data/types'

export type RecordOrigin = 'manual' | 'imported' | 'computed'

export interface RecordSource {
  origin: RecordOrigin
  /** Human label, e.g. "Entered by you" or "Fidelity Accounts_History CSV". */
  label: string
  /** When the underlying value was true, not when it was typed in. */
  asOf: string
  importBatchId?: string
}

export type AccountKind = 'brokerage' | 'bank' | 'cash' | 'retirement' | 'crypto' | 'other'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  currency: CurrencyCode
  /** null = balance not provided yet — rendered as unknown, never as 0. */
  balance: number | null
  source: RecordSource
  notes?: string
}

export type AssetKind = 'property' | 'private' | 'vehicle' | 'collectible' | 'other'

export interface AssetRecord {
  id: string
  name: string
  kind: AssetKind
  currency: CurrencyCode
  value: number
  source: RecordSource
  notes?: string
}

export type LiabilityKind = 'mortgage' | 'loan' | 'credit_card' | 'margin' | 'other'

export interface LiabilityRecord {
  id: string
  name: string
  kind: LiabilityKind
  currency: CurrencyCode
  balance: number
  /** Annual interest rate in percent, if known. */
  ratePct?: number | null
  source: RecordSource
  notes?: string
}

export type TxnKind =
  | 'trade'
  | 'option_trade'
  | 'option_event'
  | 'dividend'
  | 'interest'
  | 'interest_charge'
  | 'tax'
  | 'fee'
  | 'reinvestment'
  | 'transfer'
  | 'other'

export interface LedgerTxn {
  id: string
  date: string
  /** Broker's own action string, verbatim. */
  action: string
  symbol: string
  desc: string
  qty: number
  price: number
  amount: number
  fees: number
  currency: CurrencyCode
  /** Derived from the action string by fixed rules — see classifyAction. */
  kind: TxnKind
  /** User-editable label; never auto-invented. */
  category: string | null
  accountId: string | null
  importBatchId: string
  /** Dedupe key derived from the broker fields. */
  fingerprint: string
}

export interface ImportBatch {
  id: string
  fileName: string
  format: 'fidelity-accounts-history'
  importedAt: string
  rowsParsed: number
  rowsCommitted: number
  rowsDuplicate: number
  dateFrom: string | null
  dateTo: string | null
}

export interface Goal {
  id: string
  name: string
  target: number
  currency: CurrencyCode
  targetDate: string | null
  note?: string
  createdAt: string
}

export interface WatchItem {
  id: string
  symbol: string
  note?: string
  addedAt: string
}

export interface ActivityEvent {
  id: string
  at: string
  text: string
  kind: 'import' | 'edit' | 'create' | 'delete' | 'restore'
}

export interface StoreData {
  profileName: string | null
  accounts: Account[]
  assets: AssetRecord[]
  liabilities: LiabilityRecord[]
  ledger: LedgerTxn[]
  importBatches: ImportBatch[]
  goals: Goal[]
  watchlist: WatchItem[]
  activity: ActivityEvent[]
}

export interface StoreEnvelope {
  version: 1
  updatedAt: string
  data: StoreData
}

export const EMPTY_STORE: StoreData = {
  profileName: null,
  accounts: [],
  assets: [],
  liabilities: [],
  ledger: [],
  importBatches: [],
  goals: [],
  watchlist: [],
  activity: [],
}
