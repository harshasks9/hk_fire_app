'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, useToast } from '@/components/ui'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { api } from '@/lib/client'
import { Download, RefreshCw, Database, LogOut, Trash2 } from 'lucide-react'

export function SettingsClient({ userName, authEnabled, settings }: { userName: string; authEnabled: boolean; settings: Record<string, unknown> }) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = React.useState(userName)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [proactive, setProactive] = React.useState(settings.proactiveInsights !== false)
  const [aiEnabled, setAiEnabled] = React.useState(settings.aiEnabled !== false)
  const save = async (patch: Record<string, unknown>) => { await api('/api/settings', { method: 'PATCH', json: patch }); router.refresh() }
  const [progress, setProgress] = React.useState<string | null>(null)
  const run = async (key: string, path: string, msg: string) => {
    setBusy(key)
    try { await api(path, { method: 'POST' }); toast.push({ text: msg, tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
  // Re-analysis runs in resumable slices so it never trips the serverless time limit and respects model rate limits.
  const reindex = async () => {
    setBusy('reindex')
    let offset = 0
    let byModel = 0
    let byLocal = 0
    try {
      while (true) {
        const r = await api<{ processed: number; byModel: number; byLocal: number; total: number; next: number | null }>('/api/admin/reindex', { method: 'POST', json: { offset } })
        byModel += r.byModel
        byLocal += r.byLocal
        if (r.next === null) {
          const total = byModel + byLocal
          toast.push({ text: byLocal === 0 ? `Re-analyzed ${total} notes` : `Re-analyzed ${total} notes (${byModel} with the model, ${byLocal} locally because the model was rate-limited; run again later to retry those)`, tone: byLocal === 0 ? 'success' : 'neutral' })
          break
        }
        offset = r.next
        setProgress(`${offset} of ${r.total} notes…`)
      }
      router.refresh()
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }
  return (
    <div className="space-y-10">
      <section id="account">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Account</h2>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
          <label className="text-[13.5px] text-fg-2">Your name</label>
          <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" /><Button onClick={() => save({ name })}>Save</Button></div>
          <label className="text-[13.5px] text-fg-2">Appearance</label>
          <div><ThemeToggle /></div>
          <label className="text-[13.5px] text-fg-2">Sign-in</label>
          <div className="flex items-center gap-3 text-[13.5px]">{authEnabled ? <><span>Password protection is on.</span><Button size="sm" variant="ghost" onClick={async () => { await api('/api/logout', { method: 'POST' }); router.push('/login') }}><LogOut className="h-3.5 w-3.5" /> Sign out</Button></> : <span className="text-fg-2">Open access. Set <code className="rounded bg-surface-2 px-1">APP_PASSWORD</code> to require a password.</span>}</div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">AI controls</h2>
        <div className="space-y-2 text-[13.5px]">
          <label className="flex items-center gap-2"><input type="checkbox" checked={aiEnabled} onChange={(e) => { setAiEnabled(e.target.checked); save({ settings: { aiEnabled: e.target.checked } }) }} /> Automatic understanding of new notes (entities, tasks, decisions, numbers)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={proactive} onChange={(e) => { setProactive(e.target.checked); save({ settings: { proactiveInsights: e.target.checked } }) }} /> Proactive observations on Home and entity pages</label>
          <p className="text-[12.5px] text-fg-3">Per-note controls live in each note’s menu: mark private, or exclude a note from AI entirely. Raw notes are never modified by AI.</p>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Data</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] font-medium hover:bg-surface-2"><Download className="h-3.5 w-3.5" /> Export everything (JSON + Markdown)</a>
          <Button loading={busy === 'reindex'} onClick={reindex}><RefreshCw className="h-3.5 w-3.5" /> {progress ? `Rebuilding ${progress}` : 'Rebuild index'}</Button>
          <Button variant="danger" loading={busy === 'reseed'} onClick={() => { if (confirm('Replace ALL data with the sample dataset? This cannot be undone.')) run('reseed', '/api/admin/reseed', 'Sample data loaded') }}><Trash2 className="h-3.5 w-3.5" /> Reset to sample data</Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-fg-3"><Database className="h-3.5 w-3.5" /> Deleting a note removes its open extracted tasks and loops; history that other notes confirmed stays.</p>
      </section>
    </div>
  )
}
