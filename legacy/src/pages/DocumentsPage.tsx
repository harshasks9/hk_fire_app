import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { DOCUMENTS, DOC_KIND_LABELS } from '@/data/documents'
import { fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, EmptyState } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { DocStage } from '@/data/types'

const STAGE_META: Record<DocStage, { label: string; tone: 'gain' | 'warn' | 'info' | 'loss' | 'neutral' }> = {
  uploaded: { label: 'Uploaded', tone: 'neutral' },
  classified: { label: 'Classified', tone: 'info' },
  extracting: { label: 'Extracting', tone: 'info' },
  matching: { label: 'Matching', tone: 'info' },
  reconciling: { label: 'Reconciling', tone: 'info' },
  review: { label: 'Needs review', tone: 'warn' },
  applied: { label: 'Applied', tone: 'gain' },
  failed: { label: 'Failed', tone: 'loss' },
}

export default function DocumentsPage() {
  const app = useApp()
  const pro = app.mode === 'pro'
  const [filter, setFilter] = useState<string>('')
  const docs = useMemo(() => {
    let d = [...DOCUMENTS].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    if (filter === 'review') d = d.filter((x) => x.stage === 'review' && !app.appliedDocs.includes(x.id))
    else if (filter) d = d.filter((x) => x.kind === filter)
    return d
  }, [filter, app.appliedDocs])

  const needsReview = DOCUMENTS.filter((d) => d.stage === 'review' && !app.appliedDocs.includes(d.id))
  const kinds = [...new Set(DOCUMENTS.map((d) => d.kind))]

  return (
    <div className="fade-up space-y-4">
      {/* Review banner */}
      {needsReview.length > 0 && (
        <Card pad className="border-warn/40 bg-warn-soft/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-soft text-warn"><Icon name="alert" size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-ink">{needsReview.length} document{needsReview.length > 1 ? 's' : ''} waiting for your review</div>
              <p className="text-[12px] text-ink2">Nothing changes your records until you approve it.</p>
            </div>
            <Link to={`/documents/review/${needsReview[0].id}`}><Button variant="primary" size="sm" icon="check">Review now</Button></Link>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="scroll-thin -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1">
          <Chip active={!filter} onClick={() => setFilter('')}>All</Chip>
          <Chip active={filter === 'review'} onClick={() => setFilter('review')}>Needs review</Chip>
          {kinds.slice(0, 6).map((k) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(filter === k ? '' : k)}>{DOC_KIND_LABELS[k]}</Chip>
          ))}
        </div>
        <Button variant="primary" size="sm" icon="upload" onClick={() => app.setUploadOpen(true)}>Upload</Button>
      </div>

      {docs.length === 0 ? (
        <Card>
          <EmptyState icon="file" title="No documents in this view" body="Upload statements, tax returns, deeds, policies or sponsor reports — Meridian reads them and keeps every value traceable to its source." action={<Button variant="primary" icon="upload" onClick={() => app.setUploadOpen(true)}>Upload a document</Button>} />
        </Card>
      ) : (
        <Card pad={false} className="overflow-hidden">
          {docs.map((d, i) => {
            const applied = app.appliedDocs.includes(d.id)
            const stage = applied ? 'applied' : d.stage
            const meta = STAGE_META[stage]
            const inner = (
              <>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', d.fileType === 'csv' || d.fileType === 'xlsx' ? 'bg-info-soft text-info' : d.fileType === 'image' ? 'bg-violet-soft text-violet' : 'bg-surface2 text-ink2')}>
                  <Icon name={d.fileType === 'image' ? 'camera' : 'file'} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{d.name}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-ink3">
                    {DOC_KIND_LABELS[d.kind]} · {d.institution}
                    {d.periodStart && <span>· period {fmtDate(d.periodStart, 'short')}–{fmtDate(d.periodEnd!, 'short')}</span>}
                    {pro && d.pages && <span>· {d.pages} pp</span>}
                  </span>
                </span>
                {pro && d.positionsFound != null && (
                  <span className="tnum hidden text-right text-[11px] text-ink2 lg:block">
                    {d.positionsFound} positions<br />{d.transactionsFound} transactions
                  </span>
                )}
                <span className="hidden text-right text-[11px] text-ink3 sm:block">{relDate(d.uploadedAt.slice(0, 10))}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <Icon name="chevronRight" size={15} className="text-ink3" />
              </>
            )
            const cls = cn('flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-surface2', i > 0 && 'border-t border-line')
            return stage === 'review' ? (
              <Link key={d.id} to={`/documents/review/${d.id}`} className={cls}>{inner}</Link>
            ) : (
              <Link key={d.id} to={`/documents/review/${d.id}`} className={cls}>{inner}</Link>
            )
          })}
        </Card>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-ink3">
        Supported: brokerage &amp; bank statements, tax returns, capital-gains statements, mortgage &amp; loan documents, insurance policies, MF statements
        (CAS), property records, rental agreements, capital-call notices, distribution statements, sponsor reports, salary and equity documents — as PDF, image, CSV or Excel.
      </p>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors', active ? 'border-brand bg-brand text-invert' : 'border-line bg-surface text-ink2 hover:border-brand')}>
      {children}
    </button>
  )
}
