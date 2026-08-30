import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Modal, Button, Badge } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { DocStage } from '@/data/types'

const STAGES: { key: DocStage; label: string }[] = [
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'classified', label: 'Classified' },
  { key: 'extracting', label: 'Extracting' },
  { key: 'matching', label: 'Matching' },
  { key: 'reconciling', label: 'Reconciling' },
  { key: 'review', label: 'Ready for review' },
]

const SAMPLE_FILES = [
  { name: 'Fidelity_Statement_Jul2026.pdf', kind: 'Brokerage statement', icon: 'file' as const },
  { name: 'Zerodha_PnL_FY2526.csv', kind: 'Capital gains statement', icon: 'file' as const },
  { name: 'CedarBend_Q2_2026_Report.pdf', kind: 'Sponsor report', icon: 'briefcase' as const },
  { name: 'Lease_Renewal_UnitB_scan.jpg', kind: 'Rental agreement', icon: 'building' as const },
]

export function UploadModal() {
  const app = useApp()
  const navigate = useNavigate()
  const [dragOver, setDragOver] = useState(false)
  const sim = app.uploadSim
  const stageIdx = sim ? STAGES.findIndex((s) => s.key === sim.stage) : -1

  const close = () => {
    app.setUploadOpen(false)
    app.setUploadSim(null)
  }

  const start = (name: string) => app.startUploadSim(name)

  return (
    <Modal
      open={app.uploadOpen}
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          Upload a document
          <Badge tone="warn" icon="alert">Simulated demo flow</Badge>
        </span>
      }
      wide
    >
      {!sim && (
        <>
          <p className="mb-4 text-[13px] leading-relaxed text-ink2">
            This walkthrough shows what the document pipeline will feel like — <strong>no file is actually read or
            parsed</strong>, and nothing changes in any dataset. The real, working importer (Fidelity CSVs, parsed in your
            browser) lives in your own data: Settings → Dataset → My data, then Import.
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); start(e.dataTransfer.files[0]?.name ?? 'Statement.pdf') }}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              dragOver ? 'border-brand bg-brand-soft' : 'border-line2 bg-surface2/50',
            )}
          >
            <Icon name="upload" size={26} className="mb-2 text-ink3" />
            <p className="text-[13.5px] font-medium text-ink">Drop a file here</p>
            <p className="mt-0.5 text-[12px] text-ink3">PDF · image · CSV · Excel — up to 50 MB</p>
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" icon="file" onClick={() => start('Statement_Upload.pdf')}>Browse files</Button>
              <Button variant="secondary" size="sm" icon="camera" className="sm:hidden" onClick={() => start('Camera_Capture.jpg')}>Take photo</Button>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">Or try a sample document</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SAMPLE_FILES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => start(f.name)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-brand"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink2"><Icon name={f.icon} size={16} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-ink">{f.name}</span>
                    <span className="block text-[11px] text-ink3">{f.kind}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {sim && (
        <div>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface2/60 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name="file" size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">{sim.fileName}</div>
              <div className="text-[11.5px] text-ink3">
                {stageIdx < STAGES.length - 1 ? 'Processing — this usually takes under a minute' : 'Processing complete'}
              </div>
            </div>
            {stageIdx >= STAGES.length - 1 && <Badge tone="gain" icon="check">Ready</Badge>}
          </div>

          <ol className="relative space-y-0">
            {STAGES.map((s, i) => {
              const done = i < stageIdx
              const active = i === stageIdx
              const isLast = i === STAGES.length - 1
              return (
                <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast && <span className={cn('absolute left-[11px] top-6 h-full w-0.5', done ? 'bg-brand' : 'bg-line')} />}
                  <span
                    className={cn(
                      'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                      done && 'border-brand bg-brand text-invert',
                      active && !isLast && 'border-brand bg-surface text-brand',
                      active && isLast && 'border-gain bg-gain text-invert',
                      !done && !active && 'border-line bg-surface text-ink3',
                    )}
                  >
                    {done || (active && isLast) ? <Icon name="check" size={12} /> : i + 1}
                  </span>
                  <div className="pt-0.5">
                    <div className={cn('text-[13px] font-medium', active || done ? 'text-ink' : 'text-ink3')}>{s.label}</div>
                    {active && !isLast && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink3">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                        {s.key === 'classified' && 'Identified as a Fidelity brokerage statement (98% confidence)'}
                        {s.key === 'extracting' && 'Reading 46 fields across 14 pages…'}
                        {s.key === 'matching' && 'Matched to Fidelity •••7842 by account number'}
                        {s.key === 'reconciling' && 'Comparing against existing positions and tax lots…'}
                        {s.key === 'uploaded' && 'Encrypting and scanning…'}
                      </div>
                    )}
                    {active && isLast && (
                      <div className="mt-0.5 text-[11.5px] text-ink2">
                        14 positions, 23 transactions, 1 cash balance found · 1 field flagged for review
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close}>Close</Button>
            {stageIdx >= STAGES.length - 1 && (
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  close()
                  navigate('/documents/review/doc-fid-jul')
                }}
              >
                Review extracted data
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
