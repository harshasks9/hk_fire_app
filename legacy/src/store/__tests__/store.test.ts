import { beforeEach, describe, expect, it, vi } from 'vitest'
import { classifyAction, parseFidelityCsv, txnFingerprint } from '@/store/csv'
import { filterLedger, ledgerTotals, monthlyFlows, netWorthBreakdown, setupStatus } from '@/store/selectors'
import { EMPTY_STORE, type LedgerTxn, type StoreData } from '@/store/types'

/* localStorage stub so the store module can load and persist under vitest. */
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

const CSV = [
  'Brokerage',
  '',
  'Run Date,Action,Symbol,Description,Type,Quantity,Price,Commission,Fees,Amount,Settlement Date',
  '08/01/2025, DIVIDEND RECEIVED OWL,OWL,"BLUE OWL CAPITAL, INC",Cash,0,0,,,1250.50,',
  '08/04/2025, YOU BOUGHT OWL,OWL,BLUE OWL CAPITAL,Cash,100,14.25,0,0,-1425.00,08/05/2025',
  '08/04/2025, YOU SOLD OPENING TRANSACTION,-NVDA250815P200,PUT (NVDA),Cash,-10,0.45,6.50,0.30,443.20,',
  '08/05/2025, ELECTRONIC FUNDS TRANSFER RECEIVED,,WIRE IN,Cash,0,0,,,50000.00,',
  '08/06/2025, NON-RESIDENT TAX,OWL,NRA WITHHOLDING,Cash,0,0,,,-375.15,',
  '08/04/2025, YOU BOUGHT OWL,OWL,BLUE OWL CAPITAL,Cash,100,14.25,0,0,-1425.00,08/05/2025',
  'Total,,,,,,,,,,',
].join('\n')

describe('fidelity csv parser', () => {
  it('parses rows, skips junk, dedupes inside the file', () => {
    const r = parseFidelityCsv(CSV)
    expect(r.ok).toBe(true)
    expect(r.txns).toHaveLength(5)
    expect(r.duplicatesInFile).toBe(1)
    expect(r.dateFrom).toBe('2025-08-01')
    expect(r.dateTo).toBe('2025-08-06')
  })

  it('normalizes numbers and keeps broker fields verbatim', () => {
    const r = parseFidelityCsv(CSV)
    const div = r.txns.find((t) => t.kind === 'dividend')!
    expect(div.amount).toBeCloseTo(1250.5, 2)
    expect(div.desc).toBe('BLUE OWL CAPITAL, INC') // quoted comma survived
    const opt = r.txns.find((t) => t.kind === 'option_trade')!
    expect(opt.fees).toBeCloseTo(6.8, 2)
    expect(opt.amount).toBeCloseTo(443.2, 2)
  })

  it('rejects non-Fidelity content with an honest error, never a guess', () => {
    const r = parseFidelityCsv('Date,Payee,Amount\n2025-01-01,Coffee,-4.50')
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/does not look like a Fidelity/)
    expect(r.txns).toHaveLength(0)
  })

  it('classifies actions with fixed rules; transfers are never income', () => {
    expect(classifyAction('DIVIDEND RECEIVED OWL', 'OWL')).toBe('dividend')
    expect(classifyAction('ELECTRONIC FUNDS TRANSFER RECEIVED', '')).toBe('transfer')
    expect(classifyAction('TRANSFERRED FROM VS X12-345678', '')).toBe('transfer')
    expect(classifyAction('NON-RESIDENT TAX OWL', 'OWL')).toBe('tax')
    expect(classifyAction('MARGIN INTEREST', '')).toBe('interest_charge')
    expect(classifyAction('YOU BOUGHT OWL', 'OWL')).toBe('trade')
    expect(classifyAction('YOU SOLD OPENING TRANSACTION', '-NVDA250815P200')).toBe('option_trade')
    expect(classifyAction('EXPIRED PUT (NVDA)', '-NVDA250815P200')).toBe('option_event')
    expect(classifyAction('SOMETHING UNRECOGNIZED', '')).toBe('other')
  })

  it('fingerprints are stable and collision-relevant fields only', () => {
    const a = { date: '2025-08-04', action: 'YOU BOUGHT OWL', symbol: 'OWL', qty: 100, price: 14.25, amount: -1425 }
    expect(txnFingerprint(a)).toBe(txnFingerprint({ ...a }))
    expect(txnFingerprint(a)).not.toBe(txnFingerprint({ ...a, amount: -1426 }))
  })
})

function makeStore(partial: Partial<StoreData>): StoreData {
  return { ...structuredClone(EMPTY_STORE), ...partial }
}

const src = { origin: 'manual' as const, label: 'Entered by you', asOf: '2026-08-01' }

describe('store selectors', () => {
  it('net worth = accounts + assets − liabilities; unknown balances excluded, not zeroed', () => {
    const s = makeStore({
      accounts: [
        { id: 'a1', name: 'Fidelity', kind: 'brokerage', currency: 'USD', balance: 100_000, source: src },
        { id: 'a2', name: 'DBS', kind: 'bank', currency: 'USD', balance: null, source: src },
      ],
      assets: [{ id: 's1', name: 'Flat', kind: 'property', currency: 'USD', value: 300_000, source: src }],
      liabilities: [{ id: 'l1', name: 'Loan', kind: 'loan', currency: 'USD', balance: 50_000, ratePct: 8, source: src }],
    })
    const nw = netWorthBreakdown(s, 'USD')
    expect(nw.netWorth).toBe(350_000)
    expect(nw.unknowns).toEqual(['DBS'])
  })

  it('currency conversion applies the static table symmetrically', () => {
    const s = makeStore({
      accounts: [{ id: 'a1', name: 'INR acct', kind: 'bank', currency: 'INR', balance: 86_800, source: src }],
    })
    expect(netWorthBreakdown(s, 'USD').netWorth).toBeCloseTo(1_000, 0)
    expect(netWorthBreakdown(s, 'INR').netWorth).toBeCloseTo(86_800, 0)
  })

  const txn = (over: Partial<LedgerTxn>): LedgerTxn => ({
    id: 'x', date: '2025-08-01', action: 'A', symbol: '', desc: '', qty: 0, price: 0,
    amount: 0, fees: 0, currency: 'USD', kind: 'other', category: null, accountId: null,
    importBatchId: 'b', fingerprint: Math.random().toString(),
    ...over,
  })

  it('monthly flows separate income from transfers — a wire in is never income', () => {
    const s = makeStore({
      ledger: [
        txn({ kind: 'dividend', amount: 1000 }),
        txn({ kind: 'transfer', amount: 50_000 }),
        txn({ kind: 'transfer', amount: -20_000 }),
        txn({ kind: 'interest', amount: 25 }),
      ],
    })
    const [m] = monthlyFlows(s)
    expect(m.dividends + m.interest).toBe(1025)
    expect(m.transfersIn).toBe(50_000)
    expect(m.transfersOut).toBe(-20_000)
    const t = ledgerTotals(s)
    expect(t.dividends).toBe(1000)
    expect(t.transfersNet).toBe(30_000)
  })

  it('ledger filter combines kind, month and free text', () => {
    const s = makeStore({
      ledger: [
        txn({ kind: 'dividend', symbol: 'OWL', date: '2025-08-01' }),
        txn({ kind: 'trade', symbol: 'GLD', date: '2025-09-01', action: 'YOU BOUGHT GLD' }),
      ],
    })
    expect(filterLedger(s, { kind: 'dividend' })).toHaveLength(1)
    expect(filterLedger(s, { month: '2025-09' })).toHaveLength(1)
    expect(filterLedger(s, { query: 'bought' })).toHaveLength(1)
    expect(filterLedger(s, { kind: 'dividend', month: '2025-09' })).toHaveLength(0)
  })

  it('setup status tells the truth about missing data', () => {
    expect(setupStatus(makeStore({})).nextSteps.length).toBeGreaterThan(0)
    const full = makeStore({
      accounts: [{ id: 'a', name: 'X', kind: 'bank', currency: 'USD', balance: 1, source: src }],
      liabilities: [{ id: 'l', name: 'L', kind: 'loan', currency: 'USD', balance: 1, source: src }],
      ledger: [txn({})],
      goals: [{ id: 'g', name: 'G', target: 1, currency: 'USD', targetDate: null, createdAt: '' }],
    })
    expect(setupStatus(full).nextSteps).toHaveLength(0)
  })
})

describe('store mutations (persisted)', () => {
  beforeEach(() => {
    mem.clear()
    vi.resetModules()
  })

  it('commitImport dedupes against existing ledger rows across imports', async () => {
    const store = await import('@/store/store')
    const rows = parseFidelityCsv(CSV).txns
    const first = store.commitImport('a.csv', rows)
    expect(first.added).toBe(5)
    expect(first.duplicates).toBe(0)
    const second = store.commitImport('a-again.csv', rows)
    expect(second.added).toBe(0)
    expect(second.duplicates).toBe(5)
    expect(store.getStore().ledger).toHaveLength(5)
    // persisted envelope round-trips
    const env = JSON.parse(mem.get('meridian.store.v1')!)
    expect(env.version).toBe(1)
    expect(env.data.ledger).toHaveLength(5)
  })

  it('deleting an import batch removes exactly its transactions', async () => {
    const store = await import('@/store/store')
    const rows = parseFidelityCsv(CSV).txns
    const r = store.commitImport('a.csv', rows)
    store.upsertAccount({ id: 'acc', name: 'Keep me', kind: 'bank', currency: 'USD', balance: 10, source: src })
    store.deleteImportBatch(r.batch.id)
    expect(store.getStore().ledger).toHaveLength(0)
    expect(store.getStore().accounts).toHaveLength(1)
  })

  it('backup export/restore round-trips; malformed backups are rejected', async () => {
    const store = await import('@/store/store')
    store.upsertAccount({ id: 'acc', name: 'Fidelity', kind: 'brokerage', currency: 'USD', balance: 5, source: src })
    const backup = store.exportBackup()
    store.wipeStore()
    expect(store.getStore().accounts).toHaveLength(0)
    expect(store.importBackup(backup)).toEqual({ ok: true })
    expect(store.getStore().accounts[0].name).toBe('Fidelity')
    expect(store.importBackup('not json').ok).toBe(false)
    expect(store.importBackup('{"version":2,"data":{}}').ok).toBe(false)
  })
})
