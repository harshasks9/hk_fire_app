import { useRef, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { exportBackup, importBackup } from '@/store/store'
import { netWorthBreakdown } from '@/store/selectors'
import { fmtMoney } from '@/lib/format'
import { Badge, Button, Card, SectionHead } from '@/components/ui'
import { Icon } from '@/components/icons'
import type { StoreData } from '@/store/types'

function download(fileName: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

const csvEscape = (v: unknown): string => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const toCsv = (header: string[], rows: unknown[][]): string =>
  [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n')

function buildLedgerCsv(s: StoreData): string {
  return toCsv(
    ['date', 'action', 'symbol', 'description', 'qty', 'price', 'amount', 'fees', 'kind', 'category'],
    s.ledger.map((t) => [t.date, t.action, t.symbol, t.desc, t.qty, t.price, t.amount, t.fees, t.kind, t.category ?? '']),
  )
}

function buildBalancesCsv(s: StoreData): string {
  return toCsv(
    ['type', 'name', 'kind', 'currency', 'value', 'as_of', 'origin', 'notes'],
    [
      ...s.accounts.map((a) => ['account', a.name, a.kind, a.currency, a.balance ?? 'unknown', a.source.asOf, a.source.origin, a.notes ?? '']),
      ...s.assets.map((a) => ['asset', a.name, a.kind, a.currency, a.value, a.source.asOf, a.source.origin, a.notes ?? '']),
      ...s.liabilities.map((l) => ['liability', l.name, l.kind, l.currency, -l.balance, l.source.asOf, l.source.origin, l.notes ?? '']),
    ],
  )
}

function buildGoalsCsv(s: StoreData): string {
  return toCsv(
    ['name', 'target', 'currency', 'target_date', 'note'],
    s.goals.map((g) => [g.name, g.target, g.currency, g.targetDate ?? '', g.note ?? '']),
  )
}

export default function PersonalReports() {
  const app = useApp()
  const store = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const nw = netWorthBreakdown(store, app.currency)
  const stamp = new Date().toISOString().slice(0, 10)

  const reports = [
    {
      id: 'ledger',
      title: 'Transaction ledger',
      desc: `Every imported broker row with derived kind and your categories — ${store.ledger.length.toLocaleString()} rows.`,
      disabled: store.ledger.length === 0,
      run: () => download(`meridian-ledger-${stamp}.csv`, buildLedgerCsv(store)),
    },
    {
      id: 'balances',
      title: 'Balance sheet',
      desc: `Accounts, assets and liabilities with as-of dates — net worth ${fmtMoney(nw.netWorth, app.currency)}.`,
      disabled: store.accounts.length + store.assets.length + store.liabilities.length === 0,
      run: () => download(`meridian-balances-${stamp}.csv`, buildBalancesCsv(store)),
    },
    {
      id: 'goals',
      title: 'Goals',
      desc: `Your goals and targets — ${store.goals.length} record${store.goals.length === 1 ? '' : 's'}.`,
      disabled: store.goals.length === 0,
      run: () => download(`meridian-goals-${stamp}.csv`, buildGoalsCsv(store)),
    },
  ]

  const restore = async (file: File) => {
    const text = await file.text()
    const res = importBackup(text)
    setRestoreMsg(res.ok
      ? { ok: true, text: 'Backup restored. Every page now reflects the restored data.' }
      : { ok: false, text: res.error })
  }

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <SectionHead title="Exports" sub="CSV only — that is the format this build actually produces. Empty datasets disable their button instead of downloading an empty file." />
        <div className="grid gap-3 sm:grid-cols-3">
          {reports.map((r) => (
            <div key={r.id} className="flex flex-col rounded-xl border border-line p-3.5">
              <span className="text-[13px] font-semibold text-ink">{r.title}</span>
              <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-ink2">{r.desc}</p>
              <Button size="sm" className="mt-2.5 self-start" icon="download" disabled={r.disabled} onClick={r.run}>
                {r.disabled ? 'No data yet' : 'Download CSV'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card pad>
        <SectionHead
          title="Backup & restore"
          sub="Your data lives only in this browser. The backup file is the entire store, verbatim — keep one somewhere safe."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon="download" onClick={() => download(`meridian-backup-${stamp}.json`, exportBackup(), 'application/json')}>
            Export full backup (JSON)
          </Button>
          <Button icon="upload" onClick={() => fileRef.current?.click()}>Restore from backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void restore(e.target.files[0]); e.target.value = '' }}
          />
          <Badge tone="warn" className="ml-auto">Restoring replaces everything currently in the app</Badge>
        </div>
        {restoreMsg && (
          <p className={`mt-3 flex items-center gap-1.5 text-[12.5px] font-medium ${restoreMsg.ok ? 'text-gain' : 'text-loss'}`}>
            <Icon name={restoreMsg.ok ? 'check' : 'alert'} size={14} />{restoreMsg.text}
          </p>
        )}
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
          Clearing browser data erases the store — the backup file is your recovery path. A synced backend (Supabase) is
          specced in docs/ARCHITECTURE-V1.md and needs credentials only you can provision.
        </p>
      </Card>
    </div>
  )
}
