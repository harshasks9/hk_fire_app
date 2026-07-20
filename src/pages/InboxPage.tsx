import React, { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { INBOX_ITEMS } from '@/data/inbox'
import { SUGGESTIONS } from '@/data/suggestions'
import { fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, EmptyState, Segmented } from '@/components/ui'
import { SuggestionCard, CATEGORY_META } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { InboxItem } from '@/data/types'

const KIND_ICONS: Record<string, string> = {
  missing_cost_basis: 'receipt',
  conflicting_values: 'alert',
  stale_valuation: 'clock',
  unknown_instrument: 'search',
  unmatched_transaction: 'refresh',
  duplicate_account: 'layers',
  ambiguous_ownership: 'user',
  overlapping_periods: 'calendar',
  missing_document: 'file',
}

export default function InboxPage() {
  const app = useApp()
  const pro = app.mode === 'pro'
  const [tab, setTab] = useState<'issues' | 'suggestions'>('issues')

  const items = INBOX_ITEMS.map((i) => ({ ...i, status: (app.inboxStatus[i.id] ?? i.status) as InboxItem['status'] }))
  const open = items.filter((i) => i.status === 'open')
  const resolved = items.filter((i) => i.status !== 'open')
  const suggestions = SUGGESTIONS.filter((s) => (app.suggestionStatus[s.id] ?? s.status) !== 'dismissed')

  return (
    <div className="fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[12.5px] leading-relaxed text-ink2">
          {pro
            ? 'Data-quality issues and pending decisions. Resolving these raises the confidence of every number in the product.'
            : 'Questions about your data and suggested actions — resolving them keeps your financial picture accurate.'}
        </p>
        <Segmented
          options={[
            { value: 'issues', label: `Data issues (${open.length})` },
            { value: 'suggestions', label: `Suggestions (${suggestions.filter((s) => (app.suggestionStatus[s.id] ?? s.status) === 'open').length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'issues' && (
        <>
          {open.length === 0 && (
            <Card><EmptyState icon="check" title="Inbox zero" body="No open data issues. New uploads and conflicts will appear here for your decision." /></Card>
          )}
          {open.map((item) => (
            <IssueCard key={item.id} item={item} pro={pro} />
          ))}
          {resolved.length > 0 && (
            <>
              <SectionHead title="Recently resolved" className="px-1 pt-2" />
              {resolved.map((item) => (
                <Card key={item.id} pad className="flex items-center gap-3 opacity-65">
                  <Icon name="check" size={15} className="shrink-0 text-gain" />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink2">{pro ? item.proTitle : item.simpleTitle}</span>
                  <span className="text-[11px] capitalize text-ink3">{item.resolution ?? item.status}</span>
                  {item.options.includes('revert') && (
                    <Button size="sm" variant="ghost" onClick={() => app.setInboxStatus(item.id, 'open')}>Revert</Button>
                  )}
                </Card>
              ))}
            </>
          )}
        </>
      )}

      {tab === 'suggestions' && (
        <div className="space-y-3">
          {suggestions.map((s) => <SuggestionCard key={s.id} s={s} />)}
          {suggestions.length === 0 && (
            <Card><EmptyState icon="sparkles" title="No suggestions" body="Meridian only suggests actions when the supporting data is complete enough to trust." /></Card>
          )}
        </div>
      )}
    </div>
  )
}

function IssueCard({ item, pro }: { item: InboxItem & { status: InboxItem['status'] }; pro: boolean }) {
  const app = useApp()
  const [open, setOpen] = useState(item.severity === 'high')
  const sevTone = item.severity === 'high' ? 'loss' : item.severity === 'medium' ? 'warn' : 'neutral'
  const actions: { key: string; label: string; primary?: boolean }[] = [
    { key: 'accept', label: 'Accept proposed', primary: true },
    { key: 'edit', label: 'Edit value' },
    { key: 'merge', label: 'Merge' },
    { key: 'split', label: 'Split' },
    { key: 'defer', label: 'Defer' },
    { key: 'ignore', label: 'Ignore' },
  ].filter((a) => item.options.includes(a.key as any))

  return (
    <Card pad>
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          sevTone === 'loss' ? 'bg-loss-soft text-loss' : sevTone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-surface2 text-ink2')}>
          <Icon name={(KIND_ICONS[item.kind] ?? 'inbox') as any} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={sevTone as any}>{item.severity} priority</Badge>
            {pro && <Badge tone="neutral">{item.kind.replace(/_/g, ' ')}</Badge>}
            <span className="text-[10.5px] text-ink3">{relDate(item.createdAt)}</span>
          </div>
          <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-ink">{pro ? item.proTitle : item.simpleTitle}</h3>
          {item.entityLabel && <div className="mt-0.5 text-[11.5px] text-ink3">Affects: {item.entityLabel}</div>}

          <button onClick={() => setOpen((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">
            {open ? 'Hide detail' : 'What happened?'}
            <Icon name="chevronDown" size={12} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
          {open && <p className="fade-up mt-2 rounded-lg bg-surface2/70 p-3 text-[12.5px] leading-relaxed text-ink2">{item.detail}</p>}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {actions.map((a) => (
              <Button
                key={a.key}
                size="sm"
                variant={a.primary ? 'primary' : 'ghost'}
                onClick={() => app.setInboxStatus(item.id, a.key === 'accept' || a.key === 'edit' || a.key === 'merge' || a.key === 'split' ? 'resolved' : a.key === 'defer' ? 'deferred' : 'ignored')}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
