'use client'
import * as React from 'react'
import { Link2, Copy, Check, Ban, Eye, Globe } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, Spinner, useToast, Badge } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'

interface LinkVM { id: string; url: string; expiresAt: string | null; revokedAt: string | null; views: number; createdAt: string; active: boolean }

export function ShareDialog({ noteId, taskId, open, onClose }: { noteId?: string; taskId?: string; open: boolean; onClose: () => void }) {
  const endpoint = taskId ? `/api/tasks/${taskId}/share` : `/api/notes/${noteId}/share`
  const what = taskId ? 'task' : 'note'
  const toast = useToast()
  const [links, setLinks] = React.useState<LinkVM[] | null>(null)
  const [allowed, setAllowed] = React.useState(true)
  const [expiry, setExpiry] = React.useState<'7' | '30' | 'never'>('7')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const load = React.useCallback(() => api<{ links: LinkVM[]; allowed: boolean }>(endpoint).then((r) => { setLinks(r.links); setAllowed(r.allowed) }).catch((e) => toast.push({ text: String(e), tone: 'danger' })), [endpoint, toast])
  React.useEffect(() => { if (open) { setLinks(null); void load() } }, [open, load])
  if (!open) return null
  const copy = async (l: LinkVM) => { try { await navigator.clipboard.writeText(l.url); setCopied(l.id); setTimeout(() => setCopied(null), 1500) } catch { /* ignore */ } }
  return (
    <Dialog title={<span className="inline-flex items-center gap-2"><Globe className="h-4 w-4 text-accent" /> Share a read-only link</span>} onClose={onClose}>
      <p className="mb-3 text-[13px] text-fg-2">{what === 'task' ? 'Anyone with the link can see this task: title, status, owner, due date, details and attachments. No sign-in needed.' : 'Anyone with the link can read this note (title and body only, no AI content, no tasks).'} You can revoke a link at any time.</p>
      {!allowed ? <p className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-warning">Public sharing is turned off for this notebook (Settings → Sharing).</p> : (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select value={expiry} onChange={(e) => setExpiry(e.target.value as '7' | '30' | 'never')} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]">
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
            <option value="never">Never expires</option>
          </select>
          <Button variant="primary" loading={busy === 'create'} onClick={async () => { setBusy('create'); try { const r = await api<{ link: LinkVM }>(endpoint, { method: 'POST', json: { expiresDays: expiry === 'never' ? null : Number(expiry) } }); await load(); await copy(r.link); toast.push({ text: 'Link created and copied', tone: 'success' }) } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }}><Link2 className="h-3.5 w-3.5" /> Create link</Button>
        </div>
      )}
      {links === null ? <div className="flex items-center gap-2 py-4 text-[13.5px] text-fg-3"><Spinner className="h-4 w-4" /> Loading…</div> : links.length === 0 ? <p className="text-[13px] text-fg-3">No links yet.</p> : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-[12.5px]">{l.url}</code>
              <span className="inline-flex items-center gap-1 text-[12px] text-fg-3"><Eye className="h-3.5 w-3.5" /> {l.views}</span>
              {l.active ? <Badge tone="success">{l.expiresAt ? `until ${new Date(l.expiresAt).toLocaleDateString()}` : 'no expiry'}</Badge> : <Badge tone="danger">{l.revokedAt ? 'revoked' : 'expired'}</Badge>}
              <span className="text-[11.5px] text-fg-3">{relativeTime(l.createdAt)}</span>
              {l.active ? <>
                <Button size="sm" variant="ghost" onClick={() => copy(l)}>{copied === l.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Button>
                <Button size="sm" variant="ghost" loading={busy === l.id} onClick={async () => { setBusy(l.id); try { await api(`/api/share/${l.id}`, { method: 'DELETE' }); await load() } finally { setBusy(null) } }} title="Revoke"><Ban className="h-3.5 w-3.5" /></Button>
              </> : null}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
