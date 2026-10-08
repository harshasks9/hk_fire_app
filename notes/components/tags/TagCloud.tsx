'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Menu, useToast } from '@/components/ui'
import { EditDialog } from '@/components/crud/EditDialog'
import { api } from '@/lib/client'
import { tagHref } from '@/lib/tag-href'
import type { TagCount } from '@/lib/tags'

/** The tag cloud, with rename and remove on every tag (right-click or the ⋯ that appears on hover). */
export function TagCloud({ tags }: { tags: TagCount[] }) {
  const router = useRouter()
  const toast = useToast()
  const [rename, setRename] = React.useState<string | null>(null)
  const max = tags[0]?.count ?? 1
  const remove = async (tag: string) => {
    if (!confirm(`Remove #${tag} from every note it is on?`)) return
    try { const r = await api<{ notes: number }>(`/api/tags?tag=${encodeURIComponent(tag)}`, { method: 'DELETE' }); toast.push({ text: `Removed #${tag} from ${r.notes} note${r.notes === 1 ? '' : 's'}`, tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) }
  }
  return (
    <>
      <div className="flex flex-wrap gap-x-2 gap-y-2">
        {tags.map((t) => {
          const size = 12 + Math.round((Math.log(t.count + 1) / Math.log(max + 1)) * 12)
          return (
            <span key={t.tag} className="group inline-flex items-center rounded-md hover:bg-accent-soft">
              <Link href={tagHref(t.tag)} className="inline-flex items-baseline gap-1 px-1.5 py-0.5 text-fg-2 hover:text-accent" style={{ fontSize: `${size}px` }}>
                <span className="text-fg-3">#</span>{t.tag}<span className="text-[11px] text-fg-3">{t.count}</span>
              </Link>
              <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
                <Menu align="start" trigger={<button type="button" className="rounded p-0.5 text-fg-3 hover:text-fg" aria-label={`Actions for #${t.tag}`}><span className="block h-3 w-3 text-[10px] leading-3">⋯</span></button>} items={[
                  { label: 'Rename', icon: <Pencil className="h-3.5 w-3.5" />, onSelect: () => setRename(t.tag) },
                  { label: 'Remove from all notes', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: () => remove(t.tag) },
                ]} />
              </span>
            </span>
          )
        })}
      </div>
      {rename ? (
        <EditDialog title={`Rename #${rename}`} submitLabel="Rename" fields={[{ name: 'to', label: 'New name', required: true, help: 'Lowercase letters, numbers and dashes. Merges into the target if it already exists.' }]} initial={{ to: rename }} onClose={() => setRename(null)} onSubmit={async (v) => {
          const r = await api<{ notes: number }>('/api/tags', { method: 'PATCH', json: { from: rename, to: v.to } })
          toast.push({ text: `Renamed on ${r.notes} note${r.notes === 1 ? '' : 's'}`, tone: 'success' }); router.refresh()
        }} />
      ) : null}
    </>
  )
}
