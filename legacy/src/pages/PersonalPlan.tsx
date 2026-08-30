import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { deleteGoal, uid, upsertGoal } from '@/store/store'
import { netWorthBreakdown } from '@/store/selectors'
import type { Goal } from '@/store/types'
import type { CurrencyCode } from '@/data/types'
import { convert } from '@/data/fx'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Modal, ProgressBar, SectionHead } from '@/components/ui'
import { Icon } from '@/components/icons'

const FIELD = 'h-9 w-full rounded-ctl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand'
const LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink3'

export default function PersonalPlan() {
  const app = useApp()
  const store = useStore()
  const c = app.currency
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null)

  const nw = useMemo(() => netWorthBreakdown(store, c), [store, c])
  const hasBase = store.accounts.length + store.assets.length > 0

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <SectionHead
          title="Goals"
          sub={hasBase
            ? `Progress is measured against your current net worth (${fmtMoney(nw.netWorth, c)}) — the same number as everywhere else`
            : 'Add accounts first — without a net worth there is nothing honest to measure progress against'}
          right={<Button size="sm" icon="plus" onClick={() => setEditing('new')}>Add goal</Button>}
        />
        {store.goals.length === 0 ? (
          <EmptyState
            icon="target"
            title="No goals yet"
            body="A goal is a target amount and an optional date. Progress uses your real net worth — nothing simulated."
            action={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Set your first goal</Button>}
          />
        ) : (
          <div className="space-y-4">
            {store.goals.map((g) => {
              const cur = convert(nw.netWorth, c, g.currency)
              const pct = g.target > 0 ? Math.max(0, Math.min(100, (cur / g.target) * 100)) : 0
              const remaining = Math.max(0, g.target - cur)
              const monthsLeft = g.targetDate
                ? Math.max(0, Math.round((new Date(g.targetDate + 'T12:00:00').getTime() - Date.now()) / (86400000 * 30.44)))
                : null
              return (
                <div key={g.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">{g.name}</span>
                    {g.targetDate && <Badge tone="neutral" icon="calendar">{fmtDate(g.targetDate, 'medium')}</Badge>}
                    <span className="ml-auto flex gap-1">
                      <button onClick={() => setEditing(g)} className="rounded-lg p-1.5 text-ink3 hover:bg-surface2 hover:text-ink" aria-label={`Edit ${g.name}`}><Icon name="settings" size={14} /></button>
                      <button onClick={() => setConfirmDelete(g)} className="rounded-lg p-1.5 text-ink3 hover:bg-loss-soft hover:text-loss" aria-label={`Delete ${g.name}`}><Icon name="x" size={14} /></button>
                    </span>
                  </div>
                  <div className="tnum mt-2 flex items-baseline justify-between text-[12.5px]">
                    <span className="text-ink2">{hasBase ? fmtMoney(cur, g.currency) : '—'} of {fmtMoney(g.target, g.currency)}</span>
                    <span className="font-semibold text-ink">{hasBase ? `${pct.toFixed(0)}%` : 'needs net worth'}</span>
                  </div>
                  <ProgressBar pct={hasBase ? pct : 0} className="mt-1.5" tone={pct >= 100 ? 'gain' : 'brand'} />
                  {hasBase && remaining > 0 && (
                    <p className="tnum mt-1.5 text-[11.5px] text-ink3">
                      {fmtMoney(remaining, g.currency)} to go
                      {monthsLeft !== null && monthsLeft > 0 ? ` · ≈ ${fmtMoney(remaining / monthsLeft, g.currency)}/month until ${fmtDate(g.targetDate!, 'short')} (straight-line, not a forecast)` : ''}
                    </p>
                  )}
                  {g.note && <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink2">{g.note}</p>}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card pad>
        <div className="flex flex-wrap items-center gap-3">
          <Icon name="compass" size={18} className="text-brand" />
          <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink2">
            Want to project forward? <strong className="text-ink">Projections</strong> runs compounding and Monte Carlo
            simulations from your real net worth and assumptions you set yourself — every assumption is labeled as one.
          </p>
          <Link to="/scenarios"><Button size="sm">Open Projections</Button></Link>
        </div>
      </Card>

      {editing && (
        <GoalForm
          goal={editing === 'new' ? null : editing}
          defaultCurrency={c}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Remove goal?">
        <p className="text-[13px] text-ink2">“{confirmDelete?.name}” will be removed. This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(null)}>Keep it</Button>
          <Button variant="danger" onClick={() => { if (confirmDelete) deleteGoal(confirmDelete.id); setConfirmDelete(null) }}>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}

function GoalForm({ goal, defaultCurrency, onClose }: { goal: Goal | null; defaultCurrency: CurrencyCode; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal ? String(goal.target) : '')
  const [currency, setCurrency] = useState<CurrencyCode>(goal?.currency ?? defaultCurrency)
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [note, setNote] = useState(goal?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!name.trim()) return setError('Give the goal a name.')
    const t = Number(target.replace(/,/g, ''))
    if (!Number.isFinite(t) || t <= 0) return setError('Target must be a positive amount.')
    upsertGoal({
      id: goal?.id ?? uid(),
      name: name.trim(),
      target: t,
      currency,
      targetDate: targetDate || null,
      note: note.trim() || undefined,
      createdAt: goal?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={goal ? 'Edit goal' : 'Add goal'}>
      <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-3">
        <div>
          <label className={LABEL}>Name</label>
          <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Financial independence" autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={LABEL}>Target</label>
            <input className={FIELD + ' tnum'} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Currency</label>
            <select className={FIELD} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>By when <span className="normal-case text-ink3">(opt.)</span></label>
            <input type="date" className={FIELD} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Note <span className="normal-case text-ink3">(optional)</span></label>
          <input className={FIELD} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What this goal means" />
        </div>
        {error && <p className="flex items-center gap-1.5 text-[12px] font-medium text-loss"><Icon name="alert" size={13} />{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  )
}
