/* ---------------------------------------------------------------------------
   Canonical store: load, persist, mutate, subscribe.

   Single source of truth for personal mode. Persists to localStorage under a
   versioned envelope; every mutation goes through mutate() so persistence and
   subscribers can never drift. Backup/restore is a plain JSON file of the
   same envelope — what you export is exactly what the app runs on.
--------------------------------------------------------------------------- */

import {
  EMPTY_STORE,
  type Account, type ActivityEvent, type AssetRecord, type Goal,
  type ImportBatch, type LedgerTxn, type LiabilityRecord, type StoreData,
  type StoreEnvelope, type WatchItem,
} from './types'

const KEY = 'meridian.store.v1'

let state: StoreData = load()
const listeners = new Set<() => void>()

function load(): StoreData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(EMPTY_STORE)
    const env = JSON.parse(raw) as StoreEnvelope
    if (env.version !== 1 || !env.data) return structuredClone(EMPTY_STORE)
    return { ...structuredClone(EMPTY_STORE), ...env.data }
  } catch {
    return structuredClone(EMPTY_STORE)
  }
}

function persist() {
  const env: StoreEnvelope = { version: 1, updatedAt: new Date().toISOString(), data: state }
  localStorage.setItem(KEY, JSON.stringify(env))
}

export function getStore(): StoreData {
  return state
}

export function subscribeStore(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function mutate(fn: (draft: StoreData) => void, event?: Omit<ActivityEvent, 'id' | 'at'>) {
  const draft: StoreData = structuredClone(state)
  fn(draft)
  if (event) {
    draft.activity.unshift({ id: uid(), at: new Date().toISOString(), ...event })
    if (draft.activity.length > 500) draft.activity.length = 500
  }
  state = draft
  persist()
  listeners.forEach((l) => l())
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/* --------------------------------- profile -------------------------------- */

export function setProfileName(name: string) {
  mutate((d) => { d.profileName = name })
}

/* -------------------------------- accounts -------------------------------- */

export function upsertAccount(a: Account) {
  mutate(
    (d) => {
      const i = d.accounts.findIndex((x) => x.id === a.id)
      if (i >= 0) d.accounts[i] = a
      else d.accounts.push(a)
    },
    { kind: 'edit', text: `Account “${a.name}” saved (${a.balance === null ? 'balance unknown' : 'balance updated'})` },
  )
}

export function deleteAccount(id: string) {
  const name = state.accounts.find((a) => a.id === id)?.name ?? id
  mutate((d) => { d.accounts = d.accounts.filter((a) => a.id !== id) }, { kind: 'delete', text: `Account “${name}” removed` })
}

/* --------------------------- assets & liabilities -------------------------- */

export function upsertAsset(a: AssetRecord) {
  mutate(
    (d) => {
      const i = d.assets.findIndex((x) => x.id === a.id)
      if (i >= 0) d.assets[i] = a
      else d.assets.push(a)
    },
    { kind: 'edit', text: `Asset “${a.name}” saved` },
  )
}

export function deleteAsset(id: string) {
  const name = state.assets.find((a) => a.id === id)?.name ?? id
  mutate((d) => { d.assets = d.assets.filter((a) => a.id !== id) }, { kind: 'delete', text: `Asset “${name}” removed` })
}

export function upsertLiability(l: LiabilityRecord) {
  mutate(
    (d) => {
      const i = d.liabilities.findIndex((x) => x.id === l.id)
      if (i >= 0) d.liabilities[i] = l
      else d.liabilities.push(l)
    },
    { kind: 'edit', text: `Liability “${l.name}” saved` },
  )
}

export function deleteLiability(id: string) {
  const name = state.liabilities.find((a) => a.id === id)?.name ?? id
  mutate((d) => { d.liabilities = d.liabilities.filter((a) => a.id !== id) }, { kind: 'delete', text: `Liability “${name}” removed` })
}

/* ---------------------------------- ledger --------------------------------- */

export interface CommitResult {
  added: number
  duplicates: number
  batch: ImportBatch
}

/** Commit parsed transactions, skipping any fingerprint already in the store. */
export function commitImport(fileName: string, txns: Omit<LedgerTxn, 'id' | 'importBatchId'>[]): CommitResult {
  const existing = new Set(state.ledger.map((t) => t.fingerprint))
  const fresh = txns.filter((t) => !existing.has(t.fingerprint))
  const batchId = uid()
  const dates = fresh.map((t) => t.date).sort()
  const batch: ImportBatch = {
    id: batchId,
    fileName,
    format: 'fidelity-accounts-history',
    importedAt: new Date().toISOString(),
    rowsParsed: txns.length,
    rowsCommitted: fresh.length,
    rowsDuplicate: txns.length - fresh.length,
    dateFrom: dates[0] ?? null,
    dateTo: dates[dates.length - 1] ?? null,
  }
  mutate(
    (d) => {
      for (const t of fresh) d.ledger.push({ ...t, id: uid(), importBatchId: batchId })
      d.ledger.sort((a, b) => a.date.localeCompare(b.date))
      d.importBatches.unshift(batch)
    },
    { kind: 'import', text: `Imported ${fresh.length} transactions from ${fileName} (${txns.length - fresh.length} duplicates skipped)` },
  )
  return { added: fresh.length, duplicates: txns.length - fresh.length, batch }
}

export function setTxnCategory(id: string, category: string | null) {
  mutate((d) => {
    const t = d.ledger.find((x) => x.id === id)
    if (t) t.category = category
  })
}

export function deleteImportBatch(batchId: string) {
  const b = state.importBatches.find((x) => x.id === batchId)
  mutate(
    (d) => {
      d.ledger = d.ledger.filter((t) => t.importBatchId !== batchId)
      d.importBatches = d.importBatches.filter((x) => x.id !== batchId)
    },
    { kind: 'delete', text: `Removed import “${b?.fileName ?? batchId}” and its ${b?.rowsCommitted ?? '?'} transactions` },
  )
}

/* ---------------------------------- goals ---------------------------------- */

export function upsertGoal(g: Goal) {
  mutate(
    (d) => {
      const i = d.goals.findIndex((x) => x.id === g.id)
      if (i >= 0) d.goals[i] = g
      else d.goals.push(g)
    },
    { kind: 'edit', text: `Goal “${g.name}” saved` },
  )
}

export function deleteGoal(id: string) {
  const name = state.goals.find((g) => g.id === id)?.name ?? id
  mutate((d) => { d.goals = d.goals.filter((g) => g.id !== id) }, { kind: 'delete', text: `Goal “${name}” removed` })
}

/* -------------------------------- watchlist -------------------------------- */

export function addWatch(symbol: string, note?: string) {
  const sym = symbol.trim().toUpperCase()
  if (!sym) return
  mutate(
    (d) => {
      if (!d.watchlist.some((w) => w.symbol === sym)) {
        d.watchlist.push({ id: uid(), symbol: sym, note, addedAt: new Date().toISOString() })
      }
    },
    { kind: 'create', text: `${sym} added to watchlist` },
  )
}

export function removeWatchItem(id: string) {
  mutate((d) => { d.watchlist = d.watchlist.filter((w) => w.id !== id) })
}

export function updateWatchNote(id: string, note: string) {
  mutate((d) => {
    const w = d.watchlist.find((x) => x.id === id)
    if (w) w.note = note
  })
}

/* ------------------------------ backup/restore ----------------------------- */

export function exportBackup(): string {
  const env: StoreEnvelope = { version: 1, updatedAt: new Date().toISOString(), data: state }
  return JSON.stringify(env, null, 1)
}

export function importBackup(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const env = JSON.parse(json) as StoreEnvelope
    if (env?.version !== 1 || typeof env.data !== 'object' || env.data === null) {
      return { ok: false, error: 'Not a Meridian backup file (missing version-1 envelope).' }
    }
    for (const k of ['accounts', 'assets', 'liabilities', 'ledger', 'goals', 'watchlist'] as const) {
      if (env.data[k] !== undefined && !Array.isArray(env.data[k])) {
        return { ok: false, error: `Backup field “${k}” is malformed.` }
      }
    }
    mutate(
      (d) => Object.assign(d, structuredClone(EMPTY_STORE), env.data),
      { kind: 'restore', text: 'Data restored from backup file' },
    )
    return { ok: true }
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }
}

export function wipeStore() {
  mutate((d) => Object.assign(d, structuredClone(EMPTY_STORE)))
  localStorage.removeItem(KEY)
}
