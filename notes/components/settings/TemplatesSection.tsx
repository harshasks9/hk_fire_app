'use client'
import * as React from 'react'
import { LayoutTemplate, Trash2, Pencil } from 'lucide-react'
import { Button, useToast, Badge } from '@/components/ui'
import { api } from '@/lib/client'
import { setShell } from '@/components/shell/store'

interface T { id: string; name: string; description: string | null; kind: string; builtIn: boolean; updatedAt?: string }

export function TemplatesSection() {
  const toast = useToast()
  const [templates, setTemplates] = React.useState<T[] | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const load = React.useCallback(() => api<{ templates: T[] }>('/api/templates').then((r) => setTemplates(r.templates)).catch(() => setTemplates([])), [])
  React.useEffect(() => { void load() }, [load])
  const custom = (templates ?? []).filter((t) => !t.builtIn)
  const builtIn = (templates ?? []).filter((t) => t.builtIn)
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><LayoutTemplate className="h-3.5 w-3.5" /> Templates</h2>
      <p className="mb-3 text-[13.5px] text-fg-2">Start notes from a structure. Save any note as a template from its menu; type <code className="rounded bg-surface-2 px-1">/template</code> in the editor to insert one. <button className="text-accent underline-offset-2 hover:underline" onClick={() => setShell({ templatePickerOpen: true })}>New note from template</button></p>
      {custom.length ? (
        <ul className="mb-3 divide-y divide-border rounded-xl border border-border">
          {custom.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate"><strong>{t.name}</strong>{t.description ? <span className="text-fg-3"> · {t.description}</span> : null}</span>
              <Badge tone="outline">{t.kind}</Badge>
              <Button size="sm" variant="ghost" onClick={async () => { const name = prompt('Template name', t.name); if (name === null) return; const description = prompt('Description', t.description ?? '') ?? t.description ?? ''; await api(`/api/templates/${t.id}`, { method: 'PATCH', json: { name, description } }); await load() }}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" loading={busy === t.id} onClick={async () => { if (!confirm(`Delete template “${t.name}”?`)) return; setBusy(t.id); try { await api(`/api/templates/${t.id}`, { method: 'DELETE' }); toast.push({ text: 'Template deleted' }); await load() } finally { setBusy(null) } }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </li>
          ))}
        </ul>
      ) : <p className="mb-3 text-[13px] text-fg-3">No custom templates yet.</p>}
      <p className="text-[12.5px] text-fg-3">Built in: {builtIn.map((t) => t.name).join(' · ')}</p>
    </section>
  )
}
