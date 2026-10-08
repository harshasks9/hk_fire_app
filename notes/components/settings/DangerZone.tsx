'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarRange, Trash2 } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'
import type { WipeCounts } from '@/lib/wipe'

const LABELS: [keyof WipeCounts, string][] = [['notes', 'notes'], ['meetings', 'meetings'], ['entities', 'people, companies & topics'], ['tasks', 'tasks'], ['decisions', 'decisions'], ['loops', 'open loops'], ['facts', 'numbers'], ['research', 'research projects'], ['attachments', 'attachments']]

function describe(c: WipeCounts | null): string {
  if (!c) return ''
  const parts = LABELS.filter(([k]) => c[k] > 0).map(([k, l]) => `${c[k].toLocaleString()} ${l}`)
  return parts.length ? parts.join(', ') : 'nothing'
}

/** Settings → Danger zone: the master delete, everything or everything in a date window. */
export function DangerZone({ canManage }: { canManage: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [since, setSince] = React.useState('')
  const [until, setUntil] = React.useState('')
  const [preview, setPreview] = React.useState<WipeCounts | null>(null)
  const [confirm, setConfirm] = React.useState<{ mode: 'all' | 'range' } | null>(null)
  const [password, setPassword] = React.useState('')
  const [typed, setTyped] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const rangeParams = React.useCallback(() => {
    const q = new URLSearchParams()
    if (since) q.set('since', new Date(since + 'T00:00:00').toISOString())
    if (until) q.set('until', new Date(until + 'T23:59:59.999').toISOString())
    return q
  }, [since, until])
  React.useEffect(() => {
    if (!confirm) return
    const q = confirm.mode === 'range' ? rangeParams() : new URLSearchParams()
    setPreview(null)
    api<WipeCounts>(`/api/notebook/wipe?${q.toString()}`).then(setPreview).catch(() => setPreview(null))
  }, [confirm, rangeParams])
  const run = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      const q = rangeParams()
      const r = await api<WipeCounts>('/api/notebook/wipe', { method: 'POST', json: { mode: confirm.mode, since: q.get('since'), until: q.get('until'), password, confirm: typed } })
      toast.push({ text: `Deleted ${describe(r)}`, tone: 'success' })
      setConfirm(null); setPassword(''); setTyped('')
      router.refresh()
    } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } finally { setBusy(false) }
  }
  if (!canManage) return null
  return (
    <section id="danger">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-danger"><AlertTriangle className="h-3.5 w-3.5" /> Danger zone</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-danger/30 bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold"><CalendarRange className="h-4 w-4 text-fg-3" /> Delete everything from a date range</div>
          <p className="mt-1 text-[12.5px] text-fg-2">Notes, meetings, people, numbers, decisions, loops and research created in the window go, with everything derived from them. Leave a side blank for an open end.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <label className="text-fg-2">from</label><Input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-40" />
            <label className="text-fg-2">to</label><Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="w-40" />
            <Button variant="danger" size="md" disabled={!since && !until} onClick={() => setConfirm({ mode: 'range' })}><Trash2 className="h-3.5 w-3.5" /> Delete in range…</Button>
          </div>
        </div>
        <div className="rounded-xl border border-danger/30 bg-surface p-4">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold"><Trash2 className="h-4 w-4 text-fg-3" /> Delete everything</div>
          <p className="mt-1 text-[12.5px] text-fg-2">Empties this notebook completely. Your contexts, account, members, capture tokens and templates stay. There is no undo; export first if you want a copy.</p>
          <div className="mt-3"><Button variant="danger" size="md" onClick={() => setConfirm({ mode: 'all' })}><Trash2 className="h-3.5 w-3.5" /> Delete everything…</Button></div>
        </div>
      </div>
      {confirm ? (
        <Dialog onClose={() => { if (!busy) setConfirm(null) }} title={confirm.mode === 'all' ? 'Delete everything in this notebook' : `Delete everything ${since ? `from ${since}` : ''}${until ? ` to ${until}` : ''}`}>
          <div className="space-y-3 text-[13.5px]">
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-fg-2">{preview ? <>This will permanently delete <strong className="text-fg">{describe(preview)}</strong>.</> : 'Counting…'}</p>
            <div><label className="mb-1 block text-[12.5px] text-fg-2">Your password</label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div><label className="mb-1 block text-[12.5px] text-fg-2">Type DELETE to confirm</label><Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" /></div>
            <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button><Button variant="danger" loading={busy} disabled={busy || !password || typed.trim().toUpperCase() !== 'DELETE' || !preview} onClick={run}>Delete forever</Button></div>
          </div>
        </Dialog>
      ) : null}
    </section>
  )
}
