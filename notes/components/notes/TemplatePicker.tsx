'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Users, GitBranch, CalendarRange, FlaskConical, Building2, PenLine, FileText, Sparkles } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, Spinner, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'
import { setShell, useShell } from '@/components/shell/store'

export interface TemplateSummaryVM { id: string; name: string; description: string | null; icon: string | null; kind: string; builtIn: boolean }
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { calendar: CalendarDays, users: Users, 'git-branch': GitBranch, 'calendar-range': CalendarRange, flask: FlaskConical, building: Building2, pen: PenLine, file: FileText }

/**
  Choose a template. mode "create" makes a new note from it and opens it;
  mode "insert" hands the rendered body back (used by the editor's /template).
*/
export function TemplatePicker({ open, onClose, mode = 'create', onInsert }: { open: boolean; onClose: () => void; mode?: 'create' | 'insert'; onInsert?: (doc: unknown, title: string) => void }) {
  const router = useRouter()
  const toast = useToast()
  const [templates, setTemplates] = React.useState<TemplateSummaryVM[] | null>(null)
  const [title, setTitle] = React.useState('')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [q, setQ] = React.useState('')
  React.useEffect(() => {
    if (!open) return
    setTemplates(null)
    api<{ templates: TemplateSummaryVM[] }>('/api/templates').then((r) => setTemplates(r.templates)).catch((e) => { toast.push({ text: String(e), tone: 'danger' }); onClose() })
  }, [open, onClose, toast])
  if (!open) return null
  const choose = async (t: TemplateSummaryVM) => {
    setBusy(t.id)
    try {
      if (mode === 'insert') {
        const r = await api<{ rendered: { doc: { content?: unknown[] }; title: string } }>(`/api/templates/${t.id}?title=${encodeURIComponent(title)}`)
        onInsert?.(r.rendered.doc, r.rendered.title)
        onClose()
      } else {
        const n = await api<{ id: string }>('/api/notes', { method: 'POST', json: { templateId: t.id, title: title.trim() || undefined } })
        onClose()
        router.push(`/notes/${n.id}`)
      }
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }
  const list = (templates ?? []).filter((t) => !q.trim() || `${t.name} ${t.description ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Dialog title={mode === 'insert' ? 'Insert a template' : 'New note from template'} onClose={onClose} wide>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter templates" className="h-10 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[14px] outline-none focus:border-accent" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Subject, e.g. Nissan or Priya (fills {{title}})" className="h-10 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[14px] outline-none focus:border-accent" />
      </div>
      {templates === null ? <div className="flex items-center gap-2 py-6 text-[13.5px] text-fg-3"><Spinner className="h-4 w-4" /> Loading templates…</div> : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((t) => {
            const Icon = ICONS[t.icon ?? 'file'] ?? FileText
            return (
              <button key={t.id} disabled={busy !== null} onClick={() => choose(t)} className={cx('flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-accent hover:bg-accent-soft/30', busy === t.id && 'opacity-60')}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">{busy === t.id ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14px] font-medium">{t.name}{!t.builtIn ? <span className="rounded bg-accent-soft px-1 text-[10.5px] font-medium text-accent">yours</span> : null}</span>
                  <span className="block text-[12.5px] leading-snug text-fg-2">{t.description}</span>
                </span>
              </button>
            )
          })}
          {list.length === 0 ? <p className="text-[13.5px] text-fg-3">No templates match.</p> : null}
        </div>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-fg-3"><Sparkles className="h-3.5 w-3.5 text-accent" /> Save any note as a template from its menu. Placeholders: {'{{date}} {{time}} {{weekday}} {{title}} {{notebook}} {{name}}'}.</p>
    </Dialog>
  )
}

/** Global picker driven by the shell store (command bar, Notes page). */
export function GlobalTemplatePicker() {
  const { templatePickerOpen } = useShell()
  const close = React.useCallback(() => setShell({ templatePickerOpen: false }), [])
  return <TemplatePicker open={templatePickerOpen} onClose={close} />
}

export function NewFromTemplateButton() {
  return <Button variant="secondary" size="md" onClick={() => setShell({ templatePickerOpen: true })}><FileText className="h-4 w-4" /> From template</Button>
}
