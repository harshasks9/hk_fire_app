import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { docById, DOC_KIND_LABELS } from '@/data/documents'
import { accountById } from '@/data/household'
import { fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, ConfidenceMeter, EmptyState, KV } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function DocumentReview() {
  const { docId } = useParams<{ docId: string }>()
  const app = useApp()
  const navigate = useNavigate()
  const doc = docId ? docById(docId) : undefined
  const pro = app.mode === 'pro'
  const [fieldDecisions, setFieldDecisions] = useState<Record<number, 'accept' | 'reject'>>({})
  const [done, setDone] = useState(app.appliedDocs.includes(docId ?? ''))

  if (!doc) {
    return (
      <Card>
        <EmptyState icon="file" title="Document not found" action={<Button variant="primary" onClick={() => navigate('/documents')}>Back to documents</Button>} />
      </Card>
    )
  }

  const applied = done || doc.stage === 'applied'
  const flagged = (doc.extracted ?? []).filter((f) => f.status === 'low_confidence' || f.status === 'conflict')
  const account = doc.accountId ? accountById(doc.accountId) : undefined

  const approve = () => {
    app.applyDoc(doc.id)
    setDone(true)
  }

  return (
    <div className="fade-up space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate('/documents')} className="rounded-lg border border-line p-2 text-ink2 hover:bg-surface2" aria-label="Back">
          <Icon name="chevronLeft" size={16} />
        </button>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface2 text-ink2"><Icon name="file" size={19} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[18px] font-semibold tracking-tight text-ink">{doc.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink3">
            {DOC_KIND_LABELS[doc.kind]} · {doc.institution}
            {doc.periodStart && <span>· {fmtDate(doc.periodStart)} – {fmtDate(doc.periodEnd!)}</span>}
          </div>
        </div>
        {applied ? <Badge tone="gain" icon="check">Applied to your records</Badge> : <Badge tone="warn" icon="alert">Awaiting your approval</Badge>}
      </div>

      {applied && !doc.extracted && (
        <Card pad>
          <div className="flex items-start gap-3">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-gain" />
            <div>
              <p className="text-[13.5px] font-medium text-ink">This document has been processed and applied.</p>
              <p className="mt-1 text-[12.5px] text-ink2">
                {doc.positionsFound != null
                  ? `${doc.positionsFound} positions, ${doc.transactionsFound} transactions and ${doc.cashBalancesFound ?? 0} cash balance(s) were reconciled against your records.`
                  : doc.summary ?? 'Its contents are reflected in your records and available as a source reference.'}
              </p>
              {doc.auditTrail && (
                <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {doc.auditTrail.map((a, i) => (
                    <div key={i} className="flex gap-2.5 text-[12px]">
                      <span className="tnum shrink-0 text-ink3">{fmtDate(a.date.slice(0, 10), 'short')}</span>
                      <span className="text-ink2"><b className="font-medium text-ink">{a.actor}</b> — {a.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {doc.extracted && (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Original document preview */}
          <Card pad className="lg:col-span-2">
            <SectionHead title="Original document" sub={`${doc.pages ?? 1} pages · ${doc.fileType.toUpperCase()}`} />
            <div className="space-y-2 rounded-lg border border-line bg-surface2/60 p-4">
              {/* Faux page preview */}
              <div className="rounded-md bg-surface p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-brand/20" />
                  <div className="text-[9px] text-ink3">Page 1 of {doc.pages}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-3/4 rounded bg-line" />
                  <div className="h-2 w-1/2 rounded bg-line" />
                  <div className="mt-3 h-2 w-full rounded bg-line" />
                  {[92, 78, 85, 60, 88, 72].map((w, i) => (
                    <div key={i} className={cn('h-2 rounded', i === 3 ? 'bg-warn/40' : 'bg-line')} style={{ width: `${w}%` }} />
                  ))}
                  <div className="mt-3 h-2 w-2/3 rounded bg-line" />
                  <div className="h-2 w-5/6 rounded bg-line" />
                </div>
              </div>
              <p className="text-center text-[10.5px] text-ink3">Highlighted region: the low-confidence cost-basis field</p>
            </div>
            <div className="mt-3 space-y-0.5">
              <KV k="Classification" v={<span className="flex items-center gap-2">{DOC_KIND_LABELS[doc.kind]} <ConfidenceMeter value={0.98} /></span>} />
              <KV k="Institution" v={doc.institution} />
              <KV k="Account match" v={account ? `${account.institution} ${account.number}` : '—'} />
              <KV k="Reporting period" v={doc.periodStart ? `${fmtDate(doc.periodStart)} – ${fmtDate(doc.periodEnd!)}` : '—'} />
              {pro && <KV k="Duplicate check" v="3 overlapping transactions deduplicated" />}
              {pro && <KV k="Source precedence" v="Monthly statement > activity export" />}
            </div>
          </Card>

          {/* Extraction review */}
          <div className="space-y-4 lg:col-span-3">
            {/* Simple summary */}
            <Card pad className="border-brand/25 bg-brand-soft/30">
              <div className="flex items-start gap-3">
                <Icon name="sparkles" size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-[13.5px] font-medium leading-relaxed text-ink">{doc.summary}</p>
                  {flagged.length > 0 && (
                    <p className="mt-1 text-[12px] text-ink2">{flagged.length} field needs a closer look before approving.</p>
                  )}
                </div>
              </div>
            </Card>

            <Card pad={false} className="overflow-hidden">
              <div className="px-5 pt-4">
                <SectionHead title={pro ? 'Extracted fields' : 'What we found'} sub={pro ? 'Existing value → proposed value, with extraction confidence' : 'Compare what changes before you approve'} />
              </div>
              <div className="scroll-thin max-h-[420px] overflow-y-auto">
                {(doc.extracted ?? []).filter((f) => pro || f.status !== 'match').map((f, i) => {
                  const decision = fieldDecisions[i]
                  return (
                    <div key={i} className={cn('flex flex-wrap items-center gap-3 border-t border-line px-5 py-3', f.status === 'low_confidence' && 'bg-warn-soft/30', f.status === 'conflict' && 'bg-loss-soft/30')}>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-ink">{f.field}</div>
                        <div className="tnum mt-0.5 flex flex-wrap items-center gap-2 text-[12px]">
                          {f.existing !== null && f.existing !== f.proposed && (
                            <><span className="text-ink3 line-through">{f.existing}</span><Icon name="chevronRight" size={11} className="text-ink3" /></>
                          )}
                          <span className={cn('font-semibold', f.status === 'low_confidence' ? 'text-warn' : 'text-ink')}>{f.proposed}</span>
                          {f.impact && <span className="text-[11px] text-ink2">({f.impact})</span>}
                        </div>
                      </div>
                      {pro && <ConfidenceMeter value={f.confidence} />}
                      {f.status === 'match' && <Badge tone="neutral" icon="check">Match</Badge>}
                      {f.status === 'new' && <Badge tone="info">Update</Badge>}
                      {f.status === 'low_confidence' && !decision && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="secondary" onClick={() => setFieldDecisions({ ...fieldDecisions, [i]: 'accept' })}>Accept</Button>
                          <Button size="sm" variant="ghost" onClick={() => setFieldDecisions({ ...fieldDecisions, [i]: 'reject' })}>Keep existing</Button>
                        </div>
                      )}
                      {decision && <Badge tone={decision === 'accept' ? 'gain' : 'neutral'}>{decision === 'accept' ? 'Accepted' : 'Kept existing'}</Badge>}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Actions */}
            {!applied ? (
              <Card pad>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-md text-[12px] leading-relaxed text-ink2">
                    In the full pipeline, approving would update {doc.positionsFound} positions and add {doc.transactionsFound} transactions.
                    <b> This demo walkthrough changes nothing</b> — the sample household stays exactly as it is.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => navigate('/documents')}>Cancel</Button>
                    {flagged.length > 0 && !Object.keys(fieldDecisions).length && (
                      <Button variant="secondary" icon="alert" onClick={() => document.querySelector('.bg-warn-soft\\/30')?.scrollIntoView({ behavior: 'smooth' })}>
                        Review flagged ({flagged.length})
                      </Button>
                    )}
                    <Button variant="primary" icon="check" onClick={approve}>Approve update</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card pad className="border-gain/40 bg-gain-soft/40">
                <div className="flex items-center gap-3">
                  <Icon name="check" size={20} className="text-gain" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">Walkthrough complete</p>
                    <p className="text-[12px] text-ink2">This is where the statement would become part of your records. The demo dataset is unchanged — the real importer lives in your own data.</p>
                  </div>
                  <Button className="ml-auto" variant="secondary" size="sm" onClick={() => navigate('/')}>Back to Home</Button>
                </div>
              </Card>
            )}

            {/* Audit trail (pro) */}
            {pro && doc.auditTrail && (
              <Card pad>
                <SectionHead title="Audit history" />
                <div className="space-y-1.5">
                  {doc.auditTrail.map((a, i) => (
                    <div key={i} className="flex gap-2.5 text-[12px]">
                      <span className="tnum shrink-0 text-ink3">{a.date.slice(11, 16)}</span>
                      <span className="text-ink2"><b className="font-medium text-ink">{a.actor}</b> — {a.action}</span>
                    </div>
                  ))}
                  {done && <div className="flex gap-2.5 text-[12px]"><span className="tnum shrink-0 text-ink3">now</span><span className="text-ink2"><b className="font-medium text-ink">Harsha</b> — Approved update{Object.keys(fieldDecisions).length ? ` with ${Object.keys(fieldDecisions).length} field decision(s)` : ''}</span></div>}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
