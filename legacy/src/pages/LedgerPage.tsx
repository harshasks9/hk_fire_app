import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { setTxnCategory } from '@/store/store'
import { filterLedger, ledgerSymbols, ledgerTotals } from '@/store/selectors'
import type { TxnKind } from '@/store/types'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Badge, Button, Card, EmptyState, SectionHead } from '@/components/ui'
import { StatCard } from '@/components/finance'
import { cn } from '@/lib/cn'

const KIND_META: Record<TxnKind, { label: string; tone: 'gain' | 'loss' | 'neutral' | 'info' | 'warn' | 'brand' }> = {
  trade: { label: 'Stock trade', tone: 'neutral' },
  option_trade: { label: 'Option', tone: 'info' },
  option_event: { label: 'Option event', tone: 'info' },
  dividend: { label: 'Dividend', tone: 'gain' },
  interest: { label: 'Interest', tone: 'gain' },
  interest_charge: { label: 'Interest charge', tone: 'loss' },
  tax: { label: 'Tax withheld', tone: 'loss' },
  fee: { label: 'Fee', tone: 'loss' },
  reinvestment: { label: 'Reinvestment', tone: 'neutral' },
  transfer: { label: 'Transfer', tone: 'warn' },
  other: { label: 'Other', tone: 'neutral' },
}

const KIND_OPTIONS: (TxnKind | 'all')[] = ['all', 'trade', 'option_trade', 'dividend', 'interest', 'tax', 'transfer', 'option_event', 'reinvestment', 'interest_charge', 'fee', 'other']

const PAGE_SIZE = 50

export default function LedgerPage() {
  const store = useStore()
  const [kind, setKind] = useState<TxnKind | 'all'>('all')
  const [symbol, setSymbol] = useState('')
  const [month, setMonth] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [editingCat, setEditingCat] = useState<string | null>(null)

  const totals = useMemo(() => ledgerTotals(store), [store])
  const symbols = useMemo(() => ledgerSymbols(store), [store])
  const months = useMemo(() => {
    const set = new Set(store.ledger.map((t) => t.date.slice(0, 7)))
    return [...set].sort().reverse()
  }, [store])

  const filtered = useMemo(
    () => filterLedger(store, { kind, symbol: symbol || undefined, month: month || undefined, query: query || undefined }).reverse(),
    [store, kind, symbol, month, query],
  )
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const filteredSum = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered])

  if (store.ledger.length === 0) {
    return (
      <Card pad={false} className="fade-up">
        <EmptyState
          icon="receipt"
          title="No transactions yet"
          body="Import a Fidelity Accounts_History CSV and every broker row lands here — filterable, searchable and categorizable. Nothing is typed in for you."
          action={<Link to="/documents"><Button variant="primary" icon="upload">Go to Import</Button></Link>}
        />
      </Card>
    )
  }

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Transactions" value={totals.txns.toLocaleString()} sub={`${fmtDate(totals.dateFrom!, 'short')} → ${fmtDate(totals.dateTo!, 'medium')}`} icon="receipt" />
        <StatCard label="Dividends collected" value={fmtMoney(totals.dividends, 'USD', { decimals: 2 })} sub="Sum of dividend rows" icon="coins" tone="gain" />
        <StatCard label="Option premium net" value={fmtMoney(totals.optionPremiumNet, 'USD', { decimals: 2 })} sub="Cash across option trades (open contracts unmarked)" icon="layers" tone={totals.optionPremiumNet >= 0 ? 'gain' : 'warn'} />
        <StatCard label="Tax withheld" value={fmtMoney(totals.taxes, 'USD', { decimals: 2 })} sub="Non-resident withholding rows" icon="scale" tone="loss" />
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          <SectionHead title="Ledger" sub={`${filtered.length.toLocaleString()} rows match · net ${fmtMoney(filteredSum, 'USD', { decimals: 2 })}`} className="mb-0 mr-auto" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            placeholder="Search action, symbol, description…"
            className="h-8 w-52 rounded-ctl border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-brand"
          />
          <select value={symbol} onChange={(e) => { setSymbol(e.target.value); setPage(0) }} className="h-8 rounded-ctl border border-line bg-surface px-2 text-[12px] text-ink2">
            <option value="">All symbols</option>
            {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={month} onChange={(e) => { setMonth(e.target.value); setPage(0) }} className="h-8 rounded-ctl border border-line bg-surface px-2 text-[12px] text-ink2">
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="scroll-thin flex gap-1 overflow-x-auto px-5 py-3">
          {KIND_OPTIONS.map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setPage(0) }}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                kind === k ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink2 hover:bg-surface2',
              )}
            >
              {k === 'all' ? 'All' : KIND_META[k].label}
            </button>
          ))}
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12px]">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Date</th>
                <th className="px-2 py-2 text-left font-semibold">Action</th>
                <th className="px-2 py-2 text-left font-semibold">Symbol</th>
                <th className="px-2 py-2 text-left font-semibold">Kind</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Price</th>
                <th className="px-2 py-2 text-right font-semibold">Amount</th>
                <th className="px-5 py-2 text-left font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((t) => (
                <tr key={t.id} className="tnum border-b border-line last:border-0 hover:bg-surface2/50">
                  <td className="whitespace-nowrap px-5 py-2 text-ink2">{fmtDate(t.date, 'short')} <span className="text-[10px] text-ink3">{t.date.slice(0, 4)}</span></td>
                  <td className="max-w-[240px] truncate px-2 py-2 text-ink" title={`${t.action}${t.desc ? ` — ${t.desc}` : ''}`}>{t.action}</td>
                  <td className="px-2 py-2 font-semibold text-ink">{t.symbol.replace(/^ ?-/, '') || '—'}</td>
                  <td className="px-2 py-2"><Badge tone={KIND_META[t.kind].tone}>{KIND_META[t.kind].label}</Badge></td>
                  <td className="px-2 py-2 text-right text-ink2">{t.qty ? t.qty.toLocaleString() : '—'}</td>
                  <td className="px-2 py-2 text-right text-ink2">{t.price ? t.price.toFixed(2) : '—'}</td>
                  <td className={cn('px-2 py-2 text-right font-semibold', t.amount > 0 ? 'text-gain' : t.amount < 0 ? 'text-loss' : 'text-ink2')}>
                    {fmtMoney(t.amount, 'USD', { decimals: 2 })}
                  </td>
                  <td className="px-5 py-2">
                    {editingCat === t.id ? (
                      <input
                        autoFocus
                        defaultValue={t.category ?? ''}
                        onBlur={(e) => { setTxnCategory(t.id, e.target.value.trim() || null); setEditingCat(null) }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          if (e.key === 'Escape') setEditingCat(null)
                        }}
                        className="h-7 w-28 rounded-md border border-brand bg-surface px-2 text-[11.5px] outline-none"
                      />
                    ) : (
                      <button onClick={() => setEditingCat(t.id)} className="rounded-md px-1.5 py-0.5 text-[11.5px] text-ink3 hover:bg-surface2 hover:text-ink">
                        {t.category ?? '+ tag'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-2.5">
          <span className="text-[11px] text-ink3">
            Rows are verbatim broker records from your imports. “Kind” is derived by fixed rules; “Category” is yours.
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹ Prev</Button>
              <span className="tnum text-[11.5px] text-ink2">{page + 1} / {pages}</span>
              <Button size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next ›</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
