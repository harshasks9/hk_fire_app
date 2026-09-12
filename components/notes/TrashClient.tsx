'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2, FileText } from 'lucide-react'
import { Button, EmptyState, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'

interface Item { id: string; title: string; kind: string; excerpt: string; wordCount: number; deletedAt: string; purgeAt: string; context: string }

export function TrashClient({ items }: { items: Item[] }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  if (items.length === 0) return <EmptyState icon={<Trash2 className="h-5 w-5" />} title="Trash is empty" description="Notes you delete appear here for 30 days." />
  const act = async (key: string, fn: () => Promise<unknown>, msg: string) => { setBusy(key); try { await fn(); toast.push({ text: msg, tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }
  return (
    <div>
      {items.length > 1 ? <div className="mb-3 flex justify-end"><Button variant="danger" size="sm" loading={busy === 'all'} onClick={() => { if (confirm(`Delete all ${items.length} notes forever? This cannot be undone.`)) act('all', async () => { for (const i of items) await api(`/api/notes/${i.id}?purge=1`, { method: 'DELETE' }) }, 'Trash emptied') }}><Trash2 className="h-3.5 w-3.5" /> Empty trash</Button></div> : null}
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {items.map((i) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(i.purgeAt).getTime() - Date.now()) / 86400000))
          return (
            <li key={i.id} className="flex flex-wrap items-start gap-3 px-3 py-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-medium">{i.title || 'Untitled'}</div>
                <div className="line-clamp-2 text-[13px] text-fg-2">{i.excerpt}</div>
                <div className="mt-0.5 text-[12px] text-fg-3" suppressHydrationWarning>{i.context} · {i.wordCount} words · deleted {relativeTime(i.deletedAt)} · {daysLeft === 0 ? 'removed tonight' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" loading={busy === `r:${i.id}`} onClick={() => act(`r:${i.id}`, () => api(`/api/notes/${i.id}/restore`, { method: 'POST' }), 'Note restored')}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
                <Button size="sm" variant="danger" loading={busy === `p:${i.id}`} onClick={() => { if (confirm('Delete this note forever?')) act(`p:${i.id}`, () => api(`/api/notes/${i.id}?purge=1`, { method: 'DELETE' }), 'Deleted forever') }}><Trash2 className="h-3.5 w-3.5" /> Delete forever</Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
