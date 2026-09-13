'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button, useToast } from '@/components/ui'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { api } from '@/lib/client'
import { Download, RefreshCw, Database, Trash2 } from 'lucide-react'

export function SettingsClient({ settings, sampleData = true, canEdit = true }: { userName?: string; authEnabled?: boolean; settings: Record<string, unknown>; sampleData?: boolean; canEdit?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [proactive, setProactive] = React.useState(settings.proactiveInsights !== false)
  const [aiEnabled, setAiEnabled] = React.useState(settings.aiEnabled !== false)
  const save = async (patch: Record<string, unknown>) => { await api('/api/settings', { method: 'PATCH', json: patch }); router.refresh() }
  const [progress, setProgress] = React.useState<string | null>(null)
  const [sample, setSample] = React.useState<{ notes: number; meetings: number } | null>(null)
  React.useEffect(() => { if (sampleData) api<{ counts: { notes: number; meetings: number } }>('/api/admin/sample').then((r) => setSample(r.counts)).catch(() => setSample(null)) }, [sampleData])
  const removeSample = async () => {
    if (!confirm('Remove the sample dataset? Everything you wrote yourself stays. This cannot be undone.')) return
    setBusy('sample')
    try {
      const r = await api<{ notes: number; meetings: number; entities: number }>('/api/admin/sample', { method: 'DELETE' })
      toast.push({ text: `Removed ${r.notes} sample notes, ${r.meetings} meetings and ${r.entities} people/companies/topics`, tone: 'success' })
      setSample(null)
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
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
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Preferences</h2>
        <div className="space-y-2 text-[13.5px]">
          <div className="flex items-center gap-3"><span className="text-fg-2">Appearance</span><ThemeToggle /></div>
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
          {canEdit && sampleData && sample && sample.notes > 0 ? <Button variant="danger" loading={busy === 'sample'} onClick={removeSample}><Trash2 className="h-3.5 w-3.5" /> Remove sample data ({sample.notes} notes)</Button> : null}
          {canEdit ? <Button variant="ghost" loading={busy === 'reseed'} onClick={() => { if (confirm('Replace ALL data in this notebook with the sample dataset? This cannot be undone.')) run('reseed', '/api/admin/reseed', 'Sample data loaded') }}>Reset to sample data</Button> : null}
        </div>
        {canEdit && sampleData && sample && sample.notes > 0 ? <p className="mt-2 text-[12.5px] text-fg-3">The demo notes, meetings, people and decisions that came with the app are still here. Removing them keeps everything you wrote and stops them from ever coming back.</p> : null}
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-fg-3"><Database className="h-3.5 w-3.5" /> Deleting a note removes its open extracted tasks and loops; history that other notes confirmed stays.</p>
      </section>
    </div>
  )
}
