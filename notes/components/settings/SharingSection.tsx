'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useToast } from '@/components/ui'
import { api } from '@/lib/client'

export function SharingSection({ allowed, canEdit }: { allowed: boolean; canEdit: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [on, setOn] = React.useState(allowed)
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><Globe className="h-3.5 w-3.5" /> Sharing</h2>
      <label className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" disabled={!canEdit} checked={on} onChange={async (e) => { setOn(e.target.checked); try { await api('/api/notebook/settings', { method: 'PATCH', json: { allowShareLinks: e.target.checked } }); toast.push({ text: e.target.checked ? 'Public links enabled' : 'Public links disabled; existing links stop working' }); router.refresh() } catch (err) { toast.push({ text: String(err), tone: 'danger' }) } }} /> Allow read-only public links to notes (Share… in a note's menu)</label>
      <p className="mt-1 text-[12.5px] text-fg-3">Links show only the note's title and body, never AI content, tasks or attachments. Turning this off disables every existing link immediately.</p>
    </section>
  )
}
