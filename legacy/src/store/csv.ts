/* ---------------------------------------------------------------------------
   Browser-side parser for Fidelity "Accounts_History" CSV exports.

   Same rules as the offline analysis pipeline: find the "Run Date" header,
   parse quoted CSV, keep rows that start with a date, normalize numbers.
   Classification of each row into a ledger kind uses fixed pattern rules on
   the broker's action string — no guessing, and anything unrecognized is
   'other', never silently dropped.
--------------------------------------------------------------------------- */

import type { LedgerTxn, TxnKind } from './types'

export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQ = false
      } else cur += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

const OPTION_SYMBOL = /^-?[A-Z]+\d{6}[CP][\d.]+$/

export function classifyAction(action: string, symbol: string): TxnKind {
  const a = action.toUpperCase()
  if (/^DIVIDEND RECEIVED/.test(a)) return 'dividend'
  if (/NON-RESIDENT TAX|FOREIGN TAX|TAX WITHHELD/.test(a)) return 'tax'
  if (/^MARGIN INTEREST/.test(a)) return 'interest_charge'
  if (/INTEREST/.test(a)) return 'interest'
  if (/^REINVESTMENT/.test(a)) return 'reinvestment'
  if (/^EXPIRED|^ASSIGNED|^EXERCISED/.test(a)) return 'option_event'
  if (/TRANSFERRED|ELECTRONIC FUNDS|^EFT|WIRE|JOURNALED|MONEY LINE|^DIRECT DEPOSIT|^DIRECT DEBIT|CONTRIBUTION|DISTRIBUTION/.test(a)) return 'transfer'
  if (/FEE|COMMISSION ADJ/.test(a)) return 'fee'
  if (/^YOU BOUGHT|^YOU SOLD/.test(a)) {
    const sym = symbol.replace(/^ ?-/, '')
    if (OPTION_SYMBOL.test(sym) || /OPENING TRANSACTION|CLOSING TRANSACTION/.test(a)) return 'option_trade'
    return 'trade'
  }
  return 'other'
}

export function txnFingerprint(t: { date: string; action: string; symbol: string; qty: number; price: number; amount: number }): string {
  return [t.date, t.action, t.symbol, t.qty, t.price, t.amount].join('|')
}

export interface ParseResult {
  ok: boolean
  /** Why parsing failed, when ok is false. */
  error?: string
  txns: Omit<LedgerTxn, 'id' | 'importBatchId'>[]
  /** Rows skipped because they did not look like transaction rows. */
  skipped: number
  /** Duplicate rows within the file itself (Fidelity exports can overlap). */
  duplicatesInFile: number
  kinds: Record<string, number>
  dateFrom: string | null
  dateTo: string | null
}

const num = (v: string | undefined): number =>
  v === undefined || v.trim() === '' ? 0 : parseFloat(v.replace(/[$,]/g, '')) || 0

const iso = (d: string): string => {
  const [m, dd, y] = d.split('/')
  return `${y}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

export function parseFidelityCsv(text: string): ParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  const hi = lines.findIndex((l) => l.startsWith('Run Date'))
  if (hi < 0) {
    return {
      ok: false,
      error: 'No "Run Date" header found — this does not look like a Fidelity Accounts_History export. Only that format is supported today.',
      txns: [], skipped: 0, duplicatesInFile: 0, kinds: {}, dateFrom: null, dateTo: null,
    }
  }
  const header = parseCsvLine(lines[hi]).map((h) => h.trim())
  const col = (name: string) => header.indexOf(name)
  const ci = {
    date: col('Run Date'), action: col('Action'), symbol: col('Symbol'),
    desc: col('Description'), price: col('Price'), qty: col('Quantity'),
    comm: col('Commission'), fees: col('Fees'), amount: col('Amount'),
  }
  if (ci.date < 0 || ci.action < 0 || ci.amount < 0) {
    return {
      ok: false,
      error: 'Header found but required columns (Run Date, Action, Amount) are missing.',
      txns: [], skipped: 0, duplicatesInFile: 0, kinds: {}, dateFrom: null, dateTo: null,
    }
  }

  const txns: Omit<LedgerTxn, 'id' | 'importBatchId'>[] = []
  const seen = new Set<string>()
  let skipped = 0
  let duplicatesInFile = 0
  for (const line of lines.slice(hi + 1)) {
    if (!line.trim()) continue
    if (!/^\s*\d{2}\/\d{2}\/\d{4}/.test(line)) { skipped++; continue }
    const vals = parseCsvLine(line)
    const get = (i: number) => (i >= 0 ? (vals[i] ?? '').trim() : '')
    const t = {
      date: iso(get(ci.date)),
      action: get(ci.action),
      symbol: get(ci.symbol),
      desc: get(ci.desc),
      price: num(get(ci.price)),
      qty: num(get(ci.qty)),
      amount: num(get(ci.amount)),
      fees: num(get(ci.comm)) + num(get(ci.fees)),
    }
    const fingerprint = txnFingerprint(t)
    if (seen.has(fingerprint)) { duplicatesInFile++; continue }
    seen.add(fingerprint)
    txns.push({
      ...t,
      currency: 'USD',
      kind: classifyAction(t.action, t.symbol),
      category: null,
      accountId: null,
      fingerprint,
    })
  }
  txns.sort((a, b) => a.date.localeCompare(b.date))
  const kinds: Record<string, number> = {}
  for (const t of txns) kinds[t.kind] = (kinds[t.kind] ?? 0) + 1
  return {
    ok: true,
    txns,
    skipped,
    duplicatesInFile,
    kinds,
    dateFrom: txns[0]?.date ?? null,
    dateTo: txns[txns.length - 1]?.date ?? null,
  }
}
