'use client'
import * as React from 'react'
import { Plug, Plus, Ban, Copy, Check } from 'lucide-react'
import { Button, Input, useToast, Badge } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'

interface Token { id: string; label: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }

/** Personal capture tokens for shortcuts, automations and scripts. */
export function TokensSection({ origin }: { origin: string }) {
  const toast = useToast()
  const [tokens, setTokens] = React.useState<Token[] | null>(null)
  const [label, setLabel] = React.useState('')
  const [secret, setSecret] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const load = React.useCallback(() => api<{ tokens: Token[] }>('/api/tokens').then((r) => setTokens(r.tokens)).catch(() => setTokens([])), [])
  React.useEffect(() => { void load() }, [load])
  const curl = secret ?? 'hkn_…'
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><Plug className="h-3.5 w-3.5" /> Capture from anywhere</h2>
      <p className="mb-3 text-[13.5px] text-fg-2">A capture token lets iOS Shortcuts, Zapier, an email forwarder or a script drop text and links straight into your Inbox, where AI files them like any other capture.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. iPhone shortcut" className="max-w-xs" />
        <Button variant="primary" loading={busy === 'new'} onClick={async () => { setBusy('new'); try { const r = await api<{ secret: string }>('/api/tokens', { method: 'POST', json: { label } }); setSecret(r.secret); setLabel(''); await load() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }}><Plus className="h-3.5 w-3.5" /> New token</Button>
      </div>
      {secret ? (
        <div className="mb-3 rounded-xl border border-accent-soft-2 bg-accent-soft/30 p-3 text-[13px]">
          <div className="mb-1 font-medium">Copy your token now. It is not shown again.</div>
          <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2.5 py-1.5">{secret}</code><Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ } }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy</Button></div>
        </div>
      ) : null}
      {tokens === null ? null : tokens.length === 0 ? <p className="mb-3 text-[13px] text-fg-3">No tokens yet.</p> : (
        <ul className="mb-3 divide-y divide-border rounded-xl border border-border">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate"><strong>{t.label}</strong> <code className="text-fg-3">{t.prefix}…</code></span>
              <span className="text-[12px] text-fg-3">{t.lastUsedAt ? `used ${relativeTime(t.lastUsedAt)}` : 'never used'} · created {relativeTime(t.createdAt)}</span>
              {t.revokedAt ? <Badge tone="danger">revoked</Badge> : <Button size="sm" variant="ghost" loading={busy === t.id} onClick={async () => { setBusy(t.id); try { await api(`/api/tokens/${t.id}`, { method: 'DELETE' }); await load() } finally { setBusy(null) } }}><Ban className="h-3.5 w-3.5" /> Revoke</Button>}
            </li>
          ))}
        </ul>
      )}
      <details className="rounded-xl border border-border p-3 text-[13px]">
        <summary className="cursor-pointer font-medium">How to use it</summary>
        <div className="mt-2 space-y-2 text-fg-2">
          <p><strong>curl</strong> (JSON):</p>
          <pre className="overflow-x-auto rounded-lg bg-surface-2 p-2.5 text-[12px]">{`curl -X POST ${origin}/api/capture \\
  -H "Authorization: Bearer ${curl}" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Samsung wants a 3% buffer on the commit", "context": "work"}'`}</pre>
          <p><strong>iOS Shortcut</strong>: add a <em>Get Contents of URL</em> action → URL <code>{origin}/api/capture</code>, Method POST, Headers <code>Authorization: Bearer &lt;token&gt;</code>, Request Body JSON with a <code>text</code> field set to <em>Shortcut Input</em>. Add it to the Share Sheet to capture from any app.</p>
          <p><strong>Zapier / Make / email forwarders</strong>: a webhook step posting <code>{`{"text": "…", "url": "…"}`}</code> with the same header. Optional fields: <code>context</code> (work, personal, finance, family, research) and <code>capturedAt</code> (ISO time).</p>
        </div>
      </details>
    </section>
  )
}
