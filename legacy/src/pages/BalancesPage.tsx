import { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import {
  deleteAccount, deleteAsset, deleteLiability, uid,
  upsertAccount, upsertAsset, upsertLiability,
} from '@/store/store'
import { netWorthBreakdown } from '@/store/selectors'
import type { Account, AccountKind, AssetKind, AssetRecord, LiabilityKind, LiabilityRecord } from '@/store/types'
import type { CurrencyCode } from '@/data/types'
import { FX_ASOF, FX_RATES } from '@/data/fx'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Modal, SectionHead } from '@/components/ui'
import { HBarStack } from '@/components/charts'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

const FIELD = 'h-9 w-full rounded-ctl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand'
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink3'

const ACCOUNT_KINDS: { value: AccountKind; label: string }[] = [
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
]
const ASSET_KINDS: { value: AssetKind; label: string }[] = [
  { value: 'property', label: 'Property' },
  { value: 'private', label: 'Private investment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'collectible', label: 'Collectible' },
  { value: 'other', label: 'Other' },
]
const LIABILITY_KINDS: { value: LiabilityKind; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'loan', label: 'Loan' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'margin', label: 'Margin' },
  { value: 'other', label: 'Other' },
]

type EditTarget =
  | { type: 'account'; record: Account | null }
  | { type: 'asset'; record: AssetRecord | null }
  | { type: 'liability'; record: LiabilityRecord | null }
  | null

export default function BalancesPage() {
  const app = useApp()
  const store = useStore()
  const c = app.currency
  const [edit, setEdit] = useState<EditTarget>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'account' | 'asset' | 'liability'; id: string; name: string } | null>(null)

  const nw = useMemo(() => netWorthBreakdown(store, c), [store, c])
  const empty = nw.counts.accounts === 0 && nw.counts.assets === 0 && nw.counts.liabilities === 0
  const hasFxMix = [...store.accounts, ...store.assets, ...store.liabilities].some((r) => r.currency !== c)

  const allocation = useMemo(() => {
    const slices: { label: string; value: number }[] = []
    for (const k of ACCOUNT_KINDS) {
      const v = store.accounts
        .filter((a) => a.kind === k.value && a.balance !== null)
        .reduce((t, a) => t + (a.balance as number) * (a.currency === c ? 1 : FX_RATES[c] / FX_RATES[a.currency]), 0)
      if (v > 0) slices.push({ label: k.label, value: v })
    }
    const assets = store.assets.reduce((t, a) => t + a.value * (a.currency === c ? 1 : FX_RATES[c] / FX_RATES[a.currency]), 0)
    if (assets > 0) slices.push({ label: 'Other assets', value: assets })
    return slices
  }, [store, c])

  return (
    <div className="fade-up space-y-5">
      {empty ? (
        <Card pad={false}>
          <EmptyState
            icon="pie"
            title="No records yet — net worth cannot be computed"
            body="Add each account, asset and loan with its current balance. Every value you enter is stored on this device only, and totals are derived from exactly what you add — nothing is estimated for you."
            action={<Button variant="primary" icon="plus" onClick={() => setEdit({ type: 'account', record: null })}>Add your first account</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Net worth"
              value={fmtMoney(nw.netWorth, c)}
              sub={nw.unknowns.length ? `${nw.unknowns.length} account${nw.unknowns.length > 1 ? 's' : ''} excluded (no balance)` : 'All records included'}
              icon="pie"
              tone={nw.unknowns.length ? 'warn' : 'neutral'}
            />
            <StatCard label="Accounts" value={fmtMoney(nw.accountsTotal, c)} sub={`${nw.counts.accounts} account${nw.counts.accounts === 1 ? '' : 's'}`} icon="wallet" />
            <StatCard label="Other assets" value={fmtMoney(nw.assetsTotal, c)} sub={`${nw.counts.assets} record${nw.counts.assets === 1 ? '' : 's'}`} icon="building" />
            <StatCard label="Liabilities" value={fmtMoney(-nw.liabilitiesTotal, c)} sub={`${nw.counts.liabilities} record${nw.counts.liabilities === 1 ? '' : 's'}`} icon="scale" tone={nw.liabilitiesTotal > 0 ? 'loss' : 'neutral'} />
          </div>

          {allocation.length > 1 && (
            <Card pad>
              <SectionHead title="Where it sits" sub="Included balances by type — derived from the records below" />
              <HBarStack slices={allocation} currency={c} />
            </Card>
          )}

          {hasFxMix && (
            <p className="text-[11px] text-ink3">
              Mixed currencies are converted at a static rate (1 USD = ₹{FX_RATES.INR}, as of {fmtDate(FX_ASOF, 'short')}) — an estimate, not a live quote.
            </p>
          )}
        </>
      )}

      <RecordSection
        title="Accounts"
        sub="Bank, brokerage, retirement and cash balances"
        onAdd={() => setEdit({ type: 'account', record: null })}
        rows={store.accounts.map((a) => ({
          key: a.id,
          name: a.name,
          kind: ACCOUNT_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind,
          value: a.balance === null ? null : fmtMoney(a.balance, a.currency),
          asOf: a.source.asOf,
          notes: a.notes,
          onEdit: () => setEdit({ type: 'account', record: a }),
          onDelete: () => setConfirmDelete({ type: 'account', id: a.id, name: a.name }),
        }))}
        emptyHint="No accounts yet."
      />

      <RecordSection
        title="Other assets"
        sub="Property, private investments and anything else you own"
        onAdd={() => setEdit({ type: 'asset', record: null })}
        rows={store.assets.map((a) => ({
          key: a.id,
          name: a.name,
          kind: ASSET_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind,
          value: fmtMoney(a.value, a.currency),
          asOf: a.source.asOf,
          notes: a.notes,
          onEdit: () => setEdit({ type: 'asset', record: a }),
          onDelete: () => setConfirmDelete({ type: 'asset', id: a.id, name: a.name }),
        }))}
        emptyHint="No other assets recorded."
      />

      <RecordSection
        title="Liabilities"
        sub="Loans, mortgages and credit cards — subtracted from net worth"
        onAdd={() => setEdit({ type: 'liability', record: null })}
        rows={store.liabilities.map((l) => ({
          key: l.id,
          name: l.name,
          kind: LIABILITY_KINDS.find((k) => k.value === l.kind)?.label ?? l.kind,
          value: fmtMoney(-l.balance, l.currency),
          asOf: l.source.asOf,
          notes: [l.ratePct != null ? `${l.ratePct}% APR` : null, l.notes].filter(Boolean).join(' · ') || undefined,
          onEdit: () => setEdit({ type: 'liability', record: l }),
          onDelete: () => setConfirmDelete({ type: 'liability', id: l.id, name: l.name }),
        }))}
        emptyHint="No liabilities recorded. If you have any, add them — net worth is overstated without them."
      />

      <p className="text-[11px] leading-relaxed text-ink3">
        Every value here is one you entered, shown with its as-of date. Totals above are the sum of these records and
        nothing else — if a number looks wrong, the record it came from is on this page.
      </p>

      {edit?.type === 'account' && <AccountForm record={edit.record} onClose={() => setEdit(null)} />}
      {edit?.type === 'asset' && <AssetForm record={edit.record} onClose={() => setEdit(null)} />}
      {edit?.type === 'liability' && <LiabilityForm record={edit.record} onClose={() => setEdit(null)} />}

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Remove record?">
        <p className="text-[13px] leading-relaxed text-ink2">
          “{confirmDelete?.name}” will be removed from your data and from every total derived from it. This cannot be undone
          (your last exported backup still has it).
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(null)}>Keep it</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirmDelete) return
              if (confirmDelete.type === 'account') deleteAccount(confirmDelete.id)
              else if (confirmDelete.type === 'asset') deleteAsset(confirmDelete.id)
              else deleteLiability(confirmDelete.id)
              setConfirmDelete(null)
            }}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

interface RowSpec {
  key: string
  name: string
  kind: string
  value: string | null
  asOf: string
  notes?: string
  onEdit: () => void
  onDelete: () => void
}

function RecordSection({ title, sub, rows, onAdd, emptyHint }: { title: string; sub: string; rows: RowSpec[]; onAdd: () => void; emptyHint: string }) {
  return (
    <Card pad>
      <SectionHead title={title} sub={sub} right={<Button size="sm" icon="plus" onClick={onAdd}>Add</Button>} />
      {rows.length === 0 ? (
        <p className="py-2 text-[12.5px] text-ink3">{emptyHint}</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{r.name}</span>
                  <Badge tone="neutral">{r.kind}</Badge>
                  {r.value === null && <Badge tone="warn" icon="alert">No balance — excluded from totals</Badge>}
                </div>
                <div className="mt-0.5 text-[11px] text-ink3">
                  as of {fmtDate(r.asOf, 'medium')} · entered by you{r.notes ? ` · ${r.notes}` : ''}
                </div>
              </div>
              {r.value !== null && <span className={cn('tnum text-[13.5px] font-semibold', r.value.startsWith('−') ? 'text-loss' : 'text-ink')}>{r.value}</span>}
              <div className="flex shrink-0 gap-1">
                <button onClick={r.onEdit} className="rounded-lg p-1.5 text-ink3 hover:bg-surface2 hover:text-ink" aria-label={`Edit ${r.name}`}><Icon name="settings" size={14} /></button>
                <button onClick={r.onDelete} className="rounded-lg p-1.5 text-ink3 hover:bg-loss-soft hover:text-loss" aria-label={`Delete ${r.name}`}><Icon name="x" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ------------------------------- record forms ------------------------------ */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function useFormBase(name0: string, currency0: CurrencyCode, asOf0: string) {
  const [name, setName] = useState(name0)
  const [currency, setCurrency] = useState<CurrencyCode>(currency0)
  const [asOf, setAsOf] = useState(asOf0)
  const [error, setError] = useState<string | null>(null)
  return { name, setName, currency, setCurrency, asOf, setAsOf, error, setError }
}

function FormShell({ title, onClose, onSave, error, children }: { title: string; onClose: () => void; onSave: () => void; error: string | null; children: React.ReactNode }) {
  return (
    <Modal open onClose={onClose} title={title}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSave() }}
        className="space-y-3"
      >
        {children}
        {error && <p className="flex items-center gap-1.5 text-[12px] font-medium text-loss"><Icon name="alert" size={13} />{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  )
}

function CurrencyAsOfRow({ currency, setCurrency, asOf, setAsOf }: { currency: CurrencyCode; setCurrency: (c: CurrencyCode) => void; asOf: string; setAsOf: (d: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={LABEL}>Currency</label>
        <select className={FIELD} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
          <option value="USD">USD</option>
          <option value="INR">INR</option>
        </select>
      </div>
      <div>
        <label className={LABEL}>Balance as of</label>
        <input type="date" className={FIELD} value={asOf} max={todayIso()} onChange={(e) => setAsOf(e.target.value)} />
      </div>
    </div>
  )
}

function AccountForm({ record, onClose }: { record: Account | null; onClose: () => void }) {
  const f = useFormBase(record?.name ?? '', record?.currency ?? 'USD', record?.source.asOf ?? todayIso())
  const [kind, setKind] = useState<AccountKind>(record?.kind ?? 'bank')
  const [balance, setBalance] = useState(record?.balance === null || record === null ? '' : String(record.balance))
  const [notes, setNotes] = useState(record?.notes ?? '')

  const save = () => {
    if (!f.name.trim()) return f.setError('Give the account a name.')
    if (!f.asOf) return f.setError('Set the as-of date for the balance.')
    const bal = balance.trim() === '' ? null : Number(balance.replace(/,/g, ''))
    if (bal !== null && !Number.isFinite(bal)) return f.setError('Balance must be a number (or leave it empty for unknown).')
    upsertAccount({
      id: record?.id ?? uid(),
      name: f.name.trim(),
      kind,
      currency: f.currency,
      balance: bal,
      notes: notes.trim() || undefined,
      source: { origin: 'manual', label: 'Entered by you', asOf: f.asOf },
    })
    onClose()
  }

  return (
    <FormShell title={record ? 'Edit account' : 'Add account'} onClose={onClose} onSave={save} error={f.error}>
      <div>
        <label className={LABEL}>Name</label>
        <input className={FIELD} value={f.name} onChange={(e) => f.setName(e.target.value)} placeholder="e.g. Fidelity Individual" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Type</label>
          <select className={FIELD} value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
            {ACCOUNT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Balance <span className="normal-case text-ink3">(empty = unknown)</span></label>
          <input className={cn(FIELD, 'tnum')} inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="—" />
        </div>
      </div>
      <CurrencyAsOfRow currency={f.currency} setCurrency={f.setCurrency} asOf={f.asOf} setAsOf={f.setAsOf} />
      <div>
        <label className={LABEL}>Notes <span className="normal-case text-ink3">(optional)</span></label>
        <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering" />
      </div>
      <p className="text-[11px] leading-relaxed text-ink3">
        A balance you leave empty shows as “unknown” and is excluded from totals — the app never fills in a number for you.
      </p>
    </FormShell>
  )
}

function AssetForm({ record, onClose }: { record: AssetRecord | null; onClose: () => void }) {
  const f = useFormBase(record?.name ?? '', record?.currency ?? 'USD', record?.source.asOf ?? todayIso())
  const [kind, setKind] = useState<AssetKind>(record?.kind ?? 'property')
  const [value, setValue] = useState(record ? String(record.value) : '')
  const [notes, setNotes] = useState(record?.notes ?? '')

  const save = () => {
    if (!f.name.trim()) return f.setError('Give the asset a name.')
    const v = Number(value.replace(/,/g, ''))
    if (!Number.isFinite(v) || v < 0) return f.setError('Enter the asset’s current value.')
    upsertAsset({
      id: record?.id ?? uid(),
      name: f.name.trim(),
      kind,
      currency: f.currency,
      value: v,
      notes: notes.trim() || undefined,
      source: { origin: 'manual', label: 'Entered by you', asOf: f.asOf },
    })
    onClose()
  }

  return (
    <FormShell title={record ? 'Edit asset' : 'Add asset'} onClose={onClose} onSave={save} error={f.error}>
      <div>
        <label className={LABEL}>Name</label>
        <input className={FIELD} value={f.name} onChange={(e) => f.setName(e.target.value)} placeholder="e.g. Apartment — Whitefield" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Type</label>
          <select className={FIELD} value={kind} onChange={(e) => setKind(e.target.value as AssetKind)}>
            {ASSET_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Current value</label>
          <input className={cn(FIELD, 'tnum')} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <CurrencyAsOfRow currency={f.currency} setCurrency={f.setCurrency} asOf={f.asOf} setAsOf={f.setAsOf} />
      <div>
        <label className={LABEL}>Notes <span className="normal-case text-ink3">(optional)</span></label>
        <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Valuation basis, e.g. recent comparable sale" />
      </div>
    </FormShell>
  )
}

function LiabilityForm({ record, onClose }: { record: LiabilityRecord | null; onClose: () => void }) {
  const f = useFormBase(record?.name ?? '', record?.currency ?? 'USD', record?.source.asOf ?? todayIso())
  const [kind, setKind] = useState<LiabilityKind>(record?.kind ?? 'loan')
  const [balance, setBalance] = useState(record ? String(record.balance) : '')
  const [rate, setRate] = useState(record?.ratePct != null ? String(record.ratePct) : '')
  const [notes, setNotes] = useState(record?.notes ?? '')

  const save = () => {
    if (!f.name.trim()) return f.setError('Give the liability a name.')
    const v = Number(balance.replace(/,/g, ''))
    if (!Number.isFinite(v) || v < 0) return f.setError('Enter the outstanding balance as a positive number.')
    const r = rate.trim() === '' ? null : Number(rate)
    if (r !== null && (!Number.isFinite(r) || r < 0 || r > 100)) return f.setError('Rate must be between 0 and 100 (or leave empty).')
    upsertLiability({
      id: record?.id ?? uid(),
      name: f.name.trim(),
      kind,
      currency: f.currency,
      balance: v,
      ratePct: r,
      notes: notes.trim() || undefined,
      source: { origin: 'manual', label: 'Entered by you', asOf: f.asOf },
    })
    onClose()
  }

  return (
    <FormShell title={record ? 'Edit liability' : 'Add liability'} onClose={onClose} onSave={save} error={f.error}>
      <div>
        <label className={LABEL}>Name</label>
        <input className={FIELD} value={f.name} onChange={(e) => f.setName(e.target.value)} placeholder="e.g. Home loan" autoFocus />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Type</label>
          <select className={FIELD} value={kind} onChange={(e) => setKind(e.target.value as LiabilityKind)}>
            {LIABILITY_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Outstanding</label>
          <input className={cn(FIELD, 'tnum')} inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Rate % <span className="normal-case text-ink3">(opt.)</span></label>
          <input className={cn(FIELD, 'tnum')} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
      </div>
      <CurrencyAsOfRow currency={f.currency} setCurrency={f.setCurrency} asOf={f.asOf} setAsOf={f.setAsOf} />
      <div>
        <label className={LABEL}>Notes <span className="normal-case text-ink3">(optional)</span></label>
        <input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </FormShell>
  )
}
