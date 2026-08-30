import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { commitImport, deleteImportBatch } from '@/store/store'
import { parseFidelityCsv, type ParseResult } from '@/store/csv'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Badge, Button, Card, Modal, SectionHead } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

interface PendingFile {
  fileName: string
  result: ParseResult
  newCount: number
  dupCount: number
}

export default function ImportCenter() {
  const store = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending, setPending] = useState<PendingFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [committed, setCommitted] = useState<{ added: number; duplicates: number } | null>(null)
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<{ id: string; name: string; rows: number } | null>(null)

  const existingPrints = useMemo(() => new Set(store.ledger.map((t) => t.fingerprint)), [store.ledger])

  const handleFiles = async (files: FileList | File[]) => {
    setCommitted(null)
    const errs: string[] = []
    const parsed: PendingFile[] = []
    for (const file of Array.from(files)) {
      if (!/\.(csv|txt)$/i.test(file.name)) {
        errs.push(`${file.name}: not a CSV. PDFs and images are not parsed in this build — export the CSV version from Fidelity (Activity & Orders → History → Download).`)
        continue
      }
      const text = await file.text()
      const result = parseFidelityCsv(text)
      if (!result.ok) {
        errs.push(`${file.name}: ${result.error}`)
        continue
      }
      const newCount = result.txns.filter((t) => !existingPrints.has(t.fingerprint)).length
      parsed.push({ fileName: file.name, result, newCount, dupCount: result.txns.length - newCount })
    }
    setErrors(errs)
    setPending((prev) => [...prev, ...parsed])
  }

  const commitAll = () => {
    let added = 0
    let duplicates = 0
    for (const p of pending) {
      const r = commitImport(p.fileName, p.result.txns)
      added += r.added
      duplicates += r.duplicates
    }
    setPending([])
    setCommitted({ added, duplicates })
  }

  const totalNew = pending.reduce((s, p) => s + p.newCount, 0)

  return (
    <div className="fade-up space-y-5">
      {/* Drop zone */}
      <Card pad>
        <SectionHead
          title="Import broker data"
          sub="Fidelity Accounts_History CSV exports are parsed right here in your browser — the file never leaves this device"
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); void handleFiles(e.dataTransfer.files) }}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragOver ? 'border-brand bg-brand-soft/30' : 'border-line2',
          )}
        >
          <Icon name="upload" size={26} className="mb-2 text-ink3" />
          <p className="text-[13.5px] font-medium text-ink">Drop CSV files here</p>
          <p className="mt-0.5 text-[12px] text-ink3">or</p>
          <Button variant="primary" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>Choose files</Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void handleFiles(e.target.files); e.target.value = '' }}
          />
          <p className="mt-3 max-w-md text-[11px] leading-relaxed text-ink3">
            Supported today: <strong>Fidelity Accounts_History CSV</strong>. Every row is shown to you before anything is
            saved, duplicates are detected against your existing ledger, and no value is ever invented. Other formats and
            PDF statements need a parsing backend that isn't configured yet — they will be rejected, not faked.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="fade-up mt-3 rounded-lg bg-loss-soft/50 p-3">
            {errors.map((e, i) => (
              <p key={i} className="flex items-start gap-2 py-0.5 text-[12px] leading-relaxed text-ink2">
                <Icon name="alert" size={12} className="mt-0.5 shrink-0 text-loss" />{e}
              </p>
            ))}
          </div>
        )}
      </Card>

      {/* Review stage */}
      {pending.length > 0 && (
        <Card pad className="border-brand/40">
          <SectionHead
            title="Review before committing"
            sub="Nothing has been saved yet — this is exactly what will enter your ledger"
            right={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setPending([])}>Discard</Button>
                <Button size="sm" variant="primary" disabled={totalNew === 0} onClick={commitAll}>
                  Commit {totalNew.toLocaleString()} new row{totalNew === 1 ? '' : 's'}
                </Button>
              </div>
            }
          />
          <div className="space-y-3">
            {pending.map((p, i) => (
              <div key={i} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon name="file" size={14} className="text-ink3" />
                  <span className="text-[13px] font-semibold text-ink">{p.fileName}</span>
                  <Badge tone="gain">{p.newCount.toLocaleString()} new</Badge>
                  {p.dupCount > 0 && <Badge tone="warn">{p.dupCount.toLocaleString()} already in ledger — will be skipped</Badge>}
                  {p.result.duplicatesInFile > 0 && <Badge tone="neutral">{p.result.duplicatesInFile} duplicate rows inside file</Badge>}
                  <button onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))} className="ml-auto rounded-lg p-1 text-ink3 hover:text-loss" aria-label={`Remove ${p.fileName}`}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div className="tnum mt-1.5 text-[11.5px] text-ink2">
                  {p.result.dateFrom && p.result.dateTo ? `${fmtDate(p.result.dateFrom)} → ${fmtDate(p.result.dateTo)}` : 'No dated rows'}
                  {' · '}
                  {Object.entries(p.result.kinds).map(([k, n]) => `${n} ${k.replace('_', ' ')}`).join(' · ')}
                </div>
                <PreviewTable p={p} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {committed && (
        <Card pad className="fade-up border-gain/40 bg-gain-soft/30">
          <div className="flex flex-wrap items-center gap-3">
            <Icon name="check" size={18} className="text-gain" />
            <p className="text-[13px] text-ink">
              <strong>{committed.added.toLocaleString()} transactions committed</strong>
              {committed.duplicates > 0 ? ` · ${committed.duplicates.toLocaleString()} duplicates skipped` : ''} — they are now in your ledger and every derived number.
            </p>
            <div className="ml-auto flex gap-2">
              <Link to="/ledger"><Button size="sm">Open ledger</Button></Link>
              <Link to="/income"><Button size="sm" variant="primary">See income</Button></Link>
            </div>
          </div>
        </Card>
      )}

      {/* Import history */}
      <Card pad>
        <SectionHead title="Import history" sub="Each batch can be removed cleanly — its transactions leave the ledger with it" />
        {store.importBatches.length === 0 ? (
          <p className="py-1 text-[12.5px] text-ink3">Nothing imported yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {store.importBatches.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Icon name="file" size={15} className="text-ink3" />
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-medium text-ink">{b.fileName}</span>
                  <div className="tnum mt-0.5 text-[11px] text-ink3">
                    {fmtDate(b.importedAt.slice(0, 10), 'medium')} · {b.rowsCommitted.toLocaleString()} committed
                    {b.rowsDuplicate > 0 ? ` · ${b.rowsDuplicate} skipped as duplicates` : ''}
                    {b.dateFrom && b.dateTo ? ` · covers ${fmtDate(b.dateFrom, 'short')} → ${fmtDate(b.dateTo, 'short')}` : ''}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteBatch({ id: b.id, name: b.fileName, rows: b.rowsCommitted })}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={confirmDeleteBatch !== null} onClose={() => setConfirmDeleteBatch(null)} title="Remove this import?">
        <p className="text-[13px] leading-relaxed text-ink2">
          “{confirmDeleteBatch?.name}” and its {confirmDeleteBatch?.rows.toLocaleString()} transactions will be removed from
          the ledger and every number derived from them. Re-importing the same file brings them back identically.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmDeleteBatch(null)}>Keep</Button>
          <Button variant="danger" onClick={() => { if (confirmDeleteBatch) deleteImportBatch(confirmDeleteBatch.id); setConfirmDeleteBatch(null) }}>Remove import</Button>
        </div>
      </Modal>
    </div>
  )
}

function PreviewTable({ p }: { p: PendingFile }) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? p.result.txns.slice(0, 200) : p.result.txns.slice(0, 6)
  return (
    <div className="mt-2">
      <div className="scroll-thin overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] text-[11.5px]">
          <thead className="border-b border-line bg-surface2/60 text-[9.5px] uppercase tracking-wide text-ink3">
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold">Date</th>
              <th className="px-2 py-1.5 text-left font-semibold">Action</th>
              <th className="px-2 py-1.5 text-left font-semibold">Symbol</th>
              <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
              <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={i} className="tnum border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-1.5 text-ink2">{t.date}</td>
                <td className="max-w-[280px] truncate px-2 py-1.5 text-ink" title={t.action}>{t.action}</td>
                <td className="px-2 py-1.5 font-medium text-ink">{t.symbol.replace(/^ ?-/, '') || '—'}</td>
                <td className="px-2 py-1.5 text-right text-ink2">{t.qty || '—'}</td>
                <td className={cn('px-2 py-1.5 text-right font-medium', t.amount > 0 ? 'text-gain' : t.amount < 0 ? 'text-loss' : 'text-ink2')}>{fmtMoney(t.amount, 'USD', { decimals: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {p.result.txns.length > 6 && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-1.5 text-[11.5px] font-medium text-brand hover:underline">
          {expanded ? 'Show fewer' : `Show ${Math.min(p.result.txns.length, 200)} of ${p.result.txns.length.toLocaleString()} rows`}
        </button>
      )}
    </div>
  )
}
