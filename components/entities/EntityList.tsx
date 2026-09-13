import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, Avatar, Badge } from '@/components/ui'
import { EntityIcon } from '@/components/entities'
import { EntityActions } from '@/components/crud/actions'
import { NewEntity } from '@/components/crud/editors'
import type { EntityListItem } from '@/lib/queries'
import { relativeTime, pluralize } from '@/lib/util'
import { Star } from 'lucide-react'

export function EntityList({ title, subtitle, items, type, emptyText }: { title: string; subtitle?: string; items: EntityListItem[]; type: 'person' | 'company' | 'topic'; emptyText: string }) {
  const href = (id: string) => (type === 'person' ? `/people/${id}` : type === 'company' ? `/companies/${id}` : `/topics/${id}`)
  return (
    <Page>
      <PageHeader title={title} subtitle={subtitle ?? `${items.length} · created automatically from your notes, or add your own`} actions={<NewEntity type={type} />} />
      {items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} description={emptyText} action={<NewEntity type={type} />} />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((e) => (
            <li key={e.id} className="group -mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 row-hover">
              <Link href={href(e.id)} className="flex min-w-0 flex-1 items-center gap-3">
                {type === 'person' ? <Avatar name={e.name} size={32} /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-2"><EntityIcon type={e.type} className="h-4 w-4" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-medium group-hover:text-accent">{e.name}</span>
                    {e.pinned ? <Star className="h-3 w-3 fill-warning text-warning" /> : null}
                    {e.attributes.status && type === 'company' ? <Badge tone={/risk|escalation/i.test(e.attributes.status) ? 'warning' : 'neutral'}>{e.attributes.status}</Badge> : null}
                  </div>
                  <div className="truncate text-[12.5px] text-fg-3">
                    {type === 'person' ? [e.attributes.role, e.attributes.company].filter(Boolean).join(' · ') : type === 'company' ? [e.attributes.stage, e.attributes.location].filter(Boolean).join(' · ') : e.summary ? e.summary.slice(0, 100) : ''}
                  </div>
                </div>
                <div className="hidden shrink-0 text-right text-[12px] text-fg-3 sm:block">
                  <div>{pluralize(e.noteCount, 'note')}{e.openTasks ? ` · ${pluralize(e.openTasks, 'open action')}` : ''}</div>
                  <div>{e.lastSeenAt ? relativeTime(e.lastSeenAt) : ''}</div>
                </div>
              </Link>
              <EntityActions entity={{ id: e.id, type: e.type, name: e.name, attributes: e.attributes, aliases: e.aliases, summary: e.summary }} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
