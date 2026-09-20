'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ShieldCheck, Cpu, FlaskConical } from 'lucide-react'
import { Button, Input, useToast, Badge } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'

interface View { aiMode: 'shared' | 'own' | 'local'; aiPreference: 'auto' | 'anthropic' | 'gemini'; anthropicKey: string | null; geminiKey: string | null; allowShareLinks: boolean; sharedKeys: { anthropic: boolean; gemini: boolean } }

/** Notebook-level AI configuration: shared keys, your own keys (encrypted at rest), or no model at all. Owner only. */
export function AiSection({ settings, canEdit }: { settings: View; canEdit: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [mode, setMode] = React.useState(settings.aiMode)
  const [pref, setPref] = React.useState(settings.aiPreference)
  const [anthropic, setAnthropic] = React.useState('')
  const [gemini, setGemini] = React.useState('')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [test, setTest] = React.useState<Record<string, unknown> | null>(null)
  const save = async (json: Record<string, unknown>, msg: string) => {
    setBusy('save')
    try { await api('/api/notebook/settings', { method: 'PATCH', json }); toast.push({ text: msg, tone: 'success' }); setAnthropic(''); setGemini(''); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
  const runTest = async () => {
    setBusy('test'); setTest(null)
    try { setTest(await api<Record<string, unknown>>('/api/notebook/settings/test', { method: 'POST' })) } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
  const Option = ({ value, icon, title, desc }: { value: View['aiMode']; icon: React.ReactNode; title: string; desc: string }) => (
    <label className={cx('flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-[13.5px]', mode === value ? 'border-accent bg-accent-soft/40' : 'border-border', !canEdit && 'cursor-default opacity-70')}>
      <input type="radio" className="mt-1" disabled={!canEdit} checked={mode === value} onChange={() => { setMode(value); void save({ aiMode: value }, 'AI mode updated') }} />
      <span><span className="flex items-center gap-1.5 font-medium">{icon} {title}</span><span className="text-fg-2">{desc}</span></span>
    </label>
  )
  const g = test?.generation as { ok: boolean; sample?: string; error?: string; ms?: number } | undefined
  const gp = test?.gemini as { resolved?: { generation: string; embedding: string }; generate?: { status: number | string; error?: string }; embed?: { status: number | string; dims?: number } } | undefined
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">AI for this notebook</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <Option value="shared" icon={<ShieldCheck className="h-4 w-4 text-accent" />} title="Shared keys" desc={`Use the deployment's keys${settings.sharedKeys.anthropic || settings.sharedKeys.gemini ? ` (${[settings.sharedKeys.anthropic && 'Anthropic', settings.sharedKeys.gemini && 'Gemini'].filter(Boolean).join(', ')} configured)` : ' (none configured: runs locally)'}.`} />
        <Option value="own" icon={<Sparkles className="h-4 w-4 text-accent" />} title="My own keys" desc="Bring your own Anthropic or Gemini key. Your usage, your quota. Stored encrypted." />
        <Option value="local" icon={<Cpu className="h-4 w-4 text-accent" />} title="Local only" desc="Never call a model. Extraction, search and briefs use the built-in heuristics." />
      </div>
      {mode === 'own' && canEdit ? (
        <div className="mt-3 grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12.5px] text-fg-2">Anthropic API key {settings.anthropicKey ? <Badge tone="success" className="ml-1">saved {settings.anthropicKey}</Badge> : null}</label>
            <div className="flex gap-2"><Input type="password" value={anthropic} onChange={(e) => setAnthropic(e.target.value)} placeholder="sk-ant-…" autoComplete="off" /><Button loading={busy === 'save'} disabled={!anthropic.trim()} onClick={() => save({ anthropicKey: anthropic }, 'Anthropic key saved')}>Save</Button>{settings.anthropicKey ? <Button variant="ghost" onClick={() => save({ clearAnthropic: true }, 'Anthropic key removed')}>Remove</Button> : null}</div>
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] text-fg-2">Gemini API key {settings.geminiKey ? <Badge tone="success" className="ml-1">saved {settings.geminiKey}</Badge> : null}</label>
            <div className="flex gap-2"><Input type="password" value={gemini} onChange={(e) => setGemini(e.target.value)} placeholder="AIza…" autoComplete="off" /><Button loading={busy === 'save'} disabled={!gemini.trim()} onClick={() => save({ geminiKey: gemini }, 'Gemini key saved')}>Save</Button>{settings.geminiKey ? <Button variant="ghost" onClick={() => save({ clearGemini: true }, 'Gemini key removed')}>Remove</Button> : null}</div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-fg-2">Prefer:</span>
            {(['auto', 'anthropic', 'gemini'] as const).map((p) => <button key={p} onClick={() => { setPref(p); void save({ aiPreference: p }, 'Preference saved') }} className={cx('rounded-full border px-2.5 py-1', pref === p ? 'border-accent bg-accent-soft text-accent' : 'border-border text-fg-2')}>{p}</button>)}
            <span className="text-[12px] text-fg-3">Gemini also provides embeddings, transcription and screenshot understanding.</span>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" loading={busy === 'test'} onClick={runTest}><FlaskConical className="h-3.5 w-3.5" /> Test this configuration</Button>
        {test ? <span className="text-[12.5px] text-fg-2">Provider <strong>{String(test.provider)}</strong>{g ? (g.ok ? <> · generation OK{g.ms ? ` in ${g.ms} ms` : ''}</> : <span className="text-danger"> · generation failed: {g.error}</span>) : null}{gp?.resolved ? <> · Gemini {gp.resolved.generation} / {gp.resolved.embedding}{gp.embed?.dims ? ` (${gp.embed.dims}-d)` : ''}</> : null}{gp?.generate && gp.generate.status !== 200 ? <span className="text-warning"> · Gemini generate: {String(gp.generate.status)}</span> : null}</span> : null}
        {!canEdit ? <span className="text-[12px] text-fg-3">Only the notebook owner can change these.</span> : null}
      </div>
    </section>
  )
}
