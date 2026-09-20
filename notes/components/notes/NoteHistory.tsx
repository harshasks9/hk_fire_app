'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { History, RotateCcw, Save } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, Spinner, useToast, Badge } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime, formatDateTime } from '@/lib/util'

interface VersionVM { id: string; title: string; wordCount: number; reason: string; createdAt: string; preview: string; delta: number }

export function NoteHistory({ noteId, open, onClose }: { noteId: string; open: boolean; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [versions, setVersions] = React.useState<VersionVM[] | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const load = React.useCallback(() => api<{ versions: VersionVM[] }>(`/api/notes/${noteId}/versions`).then((r) => setVersions(r.versions)).catch((e) => toast.push({ text: String(e), tone: 'danger' })), [noteId, toast])
  React.useEffect(() => { if (open) { setVersions(null); void load() } }, [open, load])
  if (!open) return null
  return (
    <Dialog title={<span className="inline-flex items-center gap-2"><History className="h-4 w-4 text-accent" /> Version history</span>} onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-fg-2">
        <span>A version is kept each time the note is analyzed, and before every restore. Restoring puts that content back and re-analyzes.</span>
        <Button size="sm" loading={busy === 'snap'} onClick={async () => { setBusy('snap'); try { const r = await api<{ created: boolean }>(`/api/notes/${noteId}/versions`, { method: 'POST' }); toast.push({ text: r.created ? 'Version saved' : 'Nothing changed since the last version' }); await load() } finally { setBusy(null) } }}><Save className="h-3.5 w-3.5" /> Save a version now</Button>
      </div>
      {versions === null ? <div className="flex items-center gap-2 py-6 text-[13.5px] text-fg-3"><Spinner className="h-4 w-4" /> Loading…</div> : versions.length === 0 ? <p className="py-6 text-center text-[13.5px] text-fg-3">No versions yet. They appear after the note is analyzed.</p> : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {versions.map((v, i) => (
            <li key={v.id} className="flex flex-wrap items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                  <span className="font-medium" title={formatDateTime(v.createdAt)}>{relativeTime(v.createdAt)}</span>
                  {i === 0 ? <Badge tone="accent">latest</Badge> : null}
                  <Badge tone="outline">{v.reason}</Badge>
                  <span className="text-[12px] text-fg-3">{v.wordCount} words{v.delta ? ` (${v.delta > 0 ? '+' : ''}${v.delta})` : ''}</span>
                </div>
                <div className="truncate text-[13px] text-fg-2">{v.title || 'Untitled'}</div>
                <div className="line-clamp-2 text-[12.5px] text-fg-3">{v.preview}</div>
              </div>
              <Button size="sm" variant="secondary" loading={busy === v.id} onClick={async () => { if (!confirm('Restore this version? The current content is saved as a version first.')) return; setBusy(v.id); try { await api(`/api/notes/${noteId}/versions/${v.id}/restore`, { method: 'POST' }); toast.push({ text: 'Version restored', tone: 'success' }); onClose(); router.refresh(); setTimeout(() => window.location.reload(), 300) } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
