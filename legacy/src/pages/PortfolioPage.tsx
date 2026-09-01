import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { groupedPositions, positionMetrics, ASSET_CLASS_LABELS, type PositionMetrics } from '@/data/selectors'
import { ACCOUNTS } from '@/data/household'
import { fmtMoney, fmtNum, fmtPct } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Button, ProvenanceChip, EmptyState } from '@/components/ui'
import { Treemap } from '@/components/charts'
import { Freshness } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { Provenance } from '@/data/types'

const CLASS_ORDER = ['us_equity', 'etf', 'reit', 'in_equity', 'in_mf', 'bond', 'commodity', 'employee_equity']

export default function PortfolioPage() {
  const app = useApp()
  return app.mode === 'simple' ? <SimplePortfolio /> : <ProPortfolio />
}

/* ---------------- Simple ---------------- */

function SimplePortfolio() {
  const app = useApp()
  const c = app.currency
  const [cls, setCls] = useState<string | null>(null)
  const rows = useMemo(() => groupedPositions(c, { memberId: app.memberId }), [c, app.memberId])
  const classes = [...new Set(rows.map((r) => r.assetClass))].sort((a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b))
  const visible = cls ? rows.filter((r) => r.assetClass === cls) : rows
  const total = rows.reduce((s, r) => s + r.value, 0)
  const totalGain = rows.reduce((s, r) => s + r.unrealized, 0)
  const totalIncome = rows.reduce((s, r) => s + r.annualIncome, 0)

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-wide text-ink3">Investments</div>
            <div className="tnum font-display text-[30px] font-semibold text-ink">{fmtMoney(total, c)}</div>
            <div className="mt-1 flex items-center gap-3 text-[12.5px]">
              <Delta value={totalGain} currency={c} pct={(totalGain / (total - totalGain)) * 100} />
              <span className="text-ink3">all-time gain</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11.5px] text-ink3">Income these investments pay</div>
            <div className="tnum text-[17px] font-semibold text-ink">{fmtMoney(totalIncome, c, { compact: true })}<span className="text-[12px] font-normal text-ink2">/yr</span></div>
          </div>
        </div>
      </Card>

      <div className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1">
        <FilterChip active={cls === null} onClick={() => setCls(null)}>All</FilterChip>
        {classes.map((k) => (
          <FilterChip key={k} active={cls === k} onClick={() => setCls(cls === k ? null : k)}>
            {ASSET_CLASS_LABELS[k] ?? k}
          </FilterChip>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card><EmptyState icon="pie" title="Nothing here yet" body="Upload a statement or add an account to see holdings in this group." /></Card>
      ) : (
        <Card pad={false} className="overflow-hidden">
          {visible.map((p, i) => (
            <Link
              key={p.symbol}
              to={`/position/${p.symbol}`}
              className={cn('grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface2 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto]', i > 0 && 'border-t border-line')}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{p.symbol.slice(0, 4)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                  <span className="flex items-center gap-2 text-[10.5px] text-ink3">
                    {ASSET_CLASS_LABELS[p.assetClass]}
                    <Freshness asOf={p.asOf} />
                  </span>
                </span>
              </span>
              <span className="hidden sm:block">
                <span className="block text-[10.5px] text-ink3">Value · {p.weightPct.toFixed(1)}%</span>
                <span className="tnum text-[13.5px] font-semibold text-ink">{fmtMoney(p.value, c, { compact: true })}</span>
              </span>
              <span className="hidden sm:block">
                <span className="block text-[10.5px] text-ink3">Gain / loss</span>
                <Delta value={p.unrealized} currency={c} pct={p.unrealizedPct} arrow={false} className="text-[12.5px]" />
              </span>
              <span className="hidden sm:block">
                <span className="block text-[10.5px] text-ink3">Income / yr</span>
                <span className="tnum text-[12.5px] text-ink">{p.annualIncome > 0 ? fmtMoney(p.annualIncome, c, { compact: true }) : '—'}</span>
              </span>
              {/* mobile compact right column */}
              <span className="text-right sm:hidden">
                <span className="tnum block text-[13.5px] font-semibold text-ink">{fmtMoney(p.value, c, { compact: true })}</span>
                <Delta value={p.unrealized} currency={c} arrow={false} className="text-[11.5px]" />
              </span>
              <Icon name="chevronRight" size={15} className="hidden text-ink3 sm:block" />
            </Link>
          ))}
        </Card>
      )}
      <p className="px-1 text-[11px] text-ink3">
        Values combine all accounts{app.memberId ? ' for the selected member' : ''}. Tap any investment for performance, income, documents and tax lots.
      </p>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
        active ? 'border-brand bg-brand text-invert' : 'border-line bg-surface text-ink2 hover:border-brand hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/* ---------------- Pro ---------------- */

type SortKey = 'value' | 'unrealized' | 'dayChange' | 'weightPct' | 'symbol' | 'realized'

const ALL_COLUMNS = [
  { key: 'account', label: 'Account' },
  { key: 'qty', label: 'Qty' },
  { key: 'price', label: 'Price' },
  { key: 'avgCost', label: 'Avg cost' },
  { key: 'day', label: 'Day' },
  { key: 'unrealized', label: 'Unrealized' },
  { key: 'realized', label: 'Realized YTD' },
  { key: 'income', label: 'Income/yr' },
  { key: 'yield', label: 'Yield' },
  { key: 'weight', label: 'Weight' },
  { key: 'source', label: 'Source' },
] as const

function ProPortfolio() {
  const app = useApp()
  const c = app.currency
  const [accountId, setAccountId] = useState<string>('')
  const [cls, setCls] = useState<string>('')
  const [cur, setCur] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('value')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [cols, setCols] = useState<Record<string, boolean>>({ account: true, qty: true, price: true, avgCost: true, day: true, unrealized: true, realized: false, income: false, yield: false, weight: true, source: true })
  const [colsOpen, setColsOpen] = useState(false)

  const rows = useMemo(
    () => positionMetrics(c, { memberId: app.memberId, accountId: accountId || undefined, assetClass: cls || undefined, currency: (cur || undefined) as any }),
    [c, app.memberId, accountId, cls, cur],
  )
  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const va = sort === 'symbol' ? a.symbol : sort === 'realized' ? a.position.realizedYtd : (a as any)[sort]
      const vb = sort === 'symbol' ? b.symbol : sort === 'realized' ? b.position.realizedYtd : (b as any)[sort]
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir
    })
    return arr
  }, [rows, sort, dir])

  const total = rows.reduce((s, r) => s + r.value, 0)
  const header = (label: string, key?: SortKey, align: 'left' | 'right' = 'right') => (
    <th
      className={cn('cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3', align === 'right' ? 'text-right' : 'text-left', key && 'hover:text-ink')}
      onClick={() => key && (sort === key ? setDir((d) => (d === 1 ? -1 : 1)) : (setSort(key), setDir(-1)))}
    >
      {label}
      {key === sort && <span className="ml-0.5">{dir === -1 ? '↓' : '↑'}</span>}
    </th>
  )

  const exportCsv = () => {
    const csv = ['Symbol,Name,Account,Qty,Price,AvgCost,Value,DayChange,Unrealized,RealizedYTD,Weight,Provenance,AsOf']
      .concat(sorted.map((r) => `${r.symbol},"${r.name}","${r.accountLabel}",${r.qty},${r.price},${(r.cost / Math.max(r.qty, 1)).toFixed(2)},${r.value.toFixed(0)},${r.dayChange.toFixed(0)},${r.unrealized.toFixed(0)},${r.position.realizedYtd},${r.weightPct.toFixed(2)}%,${r.provenance},${r.asOf}`))
      .join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'meridian-holdings.csv'
    a.click()
  }

  return (
    <div className="fade-up space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={accountId} onChange={setAccountId} label="All accounts" options={ACCOUNTS.map((a) => ({ value: a.id, label: `${a.institution} — ${a.name}` }))} />
        <Select value={cls} onChange={setCls} label="All asset classes" options={Object.entries(ASSET_CLASS_LABELS).map(([value, label]) => ({ value, label }))} />
        <Select value={cur} onChange={setCur} label="All currencies" options={[{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }]} />
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Button size="sm" variant="ghost" icon="filter" onClick={() => setColsOpen((v) => !v)}>Columns</Button>
            {colsOpen && (
              <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-line bg-surface p-2 shadow-pop">
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-surface2">
                    <input type="checkbox" checked={cols[col.key]} onChange={(e) => setCols({ ...cols, [col.key]: e.target.checked })} className="accent-(--m-brand)" />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" icon="download" onClick={exportCsv}>Export</Button>
        </div>
      </div>

      {/* Concentration treemap */}
      <Card pad>
        <SectionHead title="Concentration" sub="Box size = position weight · color = today's move. Answers: what dominates my risk right now?" />
        <Treemap
          items={groupedPositions(c, { memberId: app.memberId }).slice(0, 14).map((g) => ({ label: g.symbol, value: g.value, delta: g.dayChangePct }))}
          currency={c}
          height={190}
        />
      </Card>

      {/* Table */}
      <Card pad={false} className="overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead className="border-b border-line bg-surface2/60">
              <tr>
                {header('Instrument', 'symbol', 'left')}
                {cols.account && header('Account', undefined, 'left')}
                {cols.qty && header('Qty')}
                {cols.price && header('Price')}
                {cols.avgCost && header('Avg cost')}
                {header('Value', 'value')}
                {cols.day && header('Day', 'dayChange')}
                {cols.unrealized && header('Unrealized', 'unrealized')}
                {cols.realized && header('Realized YTD', 'realized')}
                {cols.income && header('Income/yr')}
                {cols.yield && header('Yield')}
                {cols.weight && header('Weight', 'weightPct')}
                {cols.source && header('Source', undefined, 'left')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.position.id} className="border-b border-line transition-colors last:border-0 hover:bg-surface2/60">
                  <td className="px-3 py-2.5">
                    <Link to={`/position/${r.symbol}`} className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[9px] font-bold text-brand">{r.symbol.slice(0, 4)}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">{r.symbol}</span>
                        <span className="block max-w-[160px] truncate text-[10.5px] text-ink3">{r.name}</span>
                      </span>
                    </Link>
                  </td>
                  {cols.account && <td className="max-w-[140px] truncate px-3 py-2.5 text-[11.5px] text-ink2">{r.accountLabel}</td>}
                  {cols.qty && <td className="tnum px-3 py-2.5 text-right">{fmtNum(r.qty, r.qty % 1 ? 2 : 0)}</td>}
                  {cols.price && <td className="tnum px-3 py-2.5 text-right">{r.nativeCurrency === 'INR' ? '₹' : '$'}{fmtNum(r.price)}</td>}
                  {cols.avgCost && <td className="tnum px-3 py-2.5 text-right text-ink2">{r.nativeCurrency === 'INR' ? '₹' : '$'}{fmtNum(r.cost > 0 ? (r.cost / r.value) * r.nativeValue / r.qty : 0)}</td>}
                  <td className="tnum px-3 py-2.5 text-right font-semibold">{fmtMoney(r.value, c, { compact: true })}</td>
                  {cols.day && <td className="px-3 py-2.5 text-right"><Delta pct={r.dayChangePct} className="justify-end text-[11.5px]" /></td>}
                  {cols.unrealized && <td className="px-3 py-2.5 text-right"><Delta value={r.unrealized} currency={c} pct={r.unrealizedPct} arrow={false} className="justify-end text-[11.5px]" /></td>}
                  {cols.realized && <td className="tnum px-3 py-2.5 text-right">{r.position.realizedYtd ? fmtMoney(r.position.realizedYtd, 'USD', { compact: true }) : '—'}</td>}
                  {cols.income && <td className="tnum px-3 py-2.5 text-right">{r.annualIncome > 0 ? fmtMoney(r.annualIncome, c, { compact: true }) : '—'}</td>}
                  {cols.yield && <td className="tnum px-3 py-2.5 text-right">{r.yieldPct ? fmtPct(r.yieldPct) : '—'}</td>}
                  {cols.weight && <td className="tnum px-3 py-2.5 text-right">{r.weightPct.toFixed(1)}%</td>}
                  {cols.source && (
                    <td className="px-3 py-2.5"><ProvenanceChip provenance={r.provenance as Provenance} asOf={r.asOf} /></td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-line bg-surface2/60 font-semibold">
              <tr>
                <td className="px-3 py-2.5">Total · {rows.length} positions</td>
                {cols.account && <td />}
                {cols.qty && <td />}
                {cols.price && <td />}
                {cols.avgCost && <td />}
                <td className="tnum px-3 py-2.5 text-right">{fmtMoney(total, c, { compact: true })}</td>
                {cols.day && <td className="px-3 py-2.5 text-right"><Delta value={rows.reduce((s, r) => s + r.dayChange, 0)} currency={c} className="justify-end text-[11.5px]" /></td>}
                {cols.unrealized && <td className="px-3 py-2.5 text-right"><Delta value={rows.reduce((s, r) => s + r.unrealized, 0)} currency={c} arrow={false} className="justify-end text-[11.5px]" /></td>}
                {cols.realized && <td />}
                {cols.income && <td />}
                {cols.yield && <td />}
                {cols.weight && <td className="tnum px-3 py-2.5 text-right">100%</td>}
                {cols.source && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <p className="px-1 text-[11px] text-ink3">
        TWR, MWR, benchmark and currency attribution are on each position page. Fees and withholding YTD: {fmtMoney(221, 'USD')} / {fmtMoney(1674 / 86.8 + 214, 'USD')} recorded across accounts.
      </p>
    </div>
  )
}

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 max-w-[220px] rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-brand"
      aria-label={label}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
