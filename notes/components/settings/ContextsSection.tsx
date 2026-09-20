'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Check, X, FolderTree } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'
import { dotFor } from '@/lib/ui-helpers'

interface Ctx { id: string; name: string; slug: string; kind: string; description: string | null; noteCount: number }
const KINDS = ['work', 'personal', 'finance', 'family', 'research']

/** Contexts are the categories a notebook is split into. Add, rename, describe, remove. */
export function ContextsSection({ contexts, canEdit }: { contexts: Ctx[]; canEdit: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<{ name: string; description: string }>({ name: '', description: '' })
  const [creating, setCreating] = React.useState(false)
  const [fresh, setFresh] = React.useState({ name: '', kind: 'personal', description: '' })
  const [removing, setRemoving] = React.useState<Ctx | null>(null)
  const [mode, setMode] = React.useState<'move' | 'delete'>('move')
  const [moveTo, setMoveTo] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const startEdit = (c: Ctx) => { setEditing(c.id); setDraft({ name: c.name, description: c.description ?? '' }) }
  const saveEdit = async (c: Ctx) => {
    setBusy(true)
    try {
      await api(`/api/contexts/${c.id}`, { method: 'PATCH', json: { name: draft.name, description: draft.description } })
      setEditing(null)
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) }
  }
  const create = async () => {
    setBusy(true)
    try {
      await api('/api/contexts', { method: 'POST', json: fresh })
      setCreating(false)
      setFresh({ name: '', kind: 'personal', description: '' })
      toast.push({ text: 'Context added', tone: 'success' })
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      const target = mode === 'move' ? moveTo || contexts.find((c) => c.id !== removing.id)?.id : undefined
      const r = await api<{ notes: number; movedTo: string | null }>(`/api/contexts/${removing.id}${target ? `?moveTo=${encodeURIComponent(target)}` : ''}`, { method: 'DELETE' })
      toast.push({ text: r.movedTo ? `Removed ${removing.name}; ${r.notes} ${r.notes === 1 ? 'note' : 'notes'} moved` : `Removed ${removing.name} and everything in it`, tone: 'success' })
      setRemoving(null)
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) }
  }
  const others = removing ? contexts.filter((c) => c.id !== removing.id) : []
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><FolderTree className="h-3.5 w-3.5" /> Contexts</h2>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {contexts.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13.5px]">
            <span className={cx('h-2 w-2 shrink-0 rounded-full', dotFor(c.kind))} />
            {editing === c.id ? (
              <>
                <Input autoFocus value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="w-40" onKeyDown={(e) => { if (e.key === 'Enter') void saveEdit(c); if (e.key === 'Escape') setEditing(null) }} />
                <Input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="What goes here" className="min-w-0 flex-1" />
                <Button size="sm" variant="primary" loading={busy} onClick={() => saveEdit(c)}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                <span className="w-28 font-medium">{c.name}</span>
                <span className="min-w-0 flex-1 truncate text-fg-2">{c.description || <span className="text-fg-3">No description</span>}</span>
                <span className="text-[12px] text-fg-3">{c.noteCount} {c.noteCount === 1 ? 'note' : 'notes'}</span>
                {canEdit ? (
                  <span className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(c)} title="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" disabled={contexts.length <= 1} onClick={() => { setRemoving(c); setMode('move'); setMoveTo(contexts.find((x) => x.id !== c.id)?.id ?? '') }} title="Remove"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </span>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
      {canEdit ? (
        creating ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
            <Input autoFocus placeholder="Name, e.g. Side projects" value={fresh.name} onChange={(e) => setFresh((f) => ({ ...f, name: e.target.value }))} className="w-44" onKeyDown={(e) => { if (e.key === 'Enter') void create() }} />
            <select value={fresh.kind} onChange={(e) => setFresh((f) => ({ ...f, kind: e.target.value }))} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]">{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
            <Input placeholder="What goes here (optional)" value={fresh.description} onChange={(e) => setFresh((f) => ({ ...f, description: e.target.value }))} className="min-w-0 flex-1" />
            <Button variant="primary" loading={busy} disabled={fresh.name.trim().length < 2} onClick={create}>Add</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        ) : (
          <Button className="mt-3" onClick={() => setCreating(true)}><Plus className="h-3.5 w-3.5" /> New context</Button>
        )
      ) : null}
      <p className="mt-2 text-[12.5px] text-fg-3">Each context has its own people, topics, tasks and AI retrieval scope. Search only crosses contexts when you tick the box. The colour comes from the kind you pick.</p>
      {removing ? (
        <Dialog title={`Remove “${removing.name}”`} onClose={() => setRemoving(null)}>
          <p className="mb-3 text-[13.5px] text-fg-2">{removing.noteCount} {removing.noteCount === 1 ? 'note lives' : 'notes live'} in this context, with the people, tasks, decisions and numbers that came from them.</p>
          <div className="space-y-2 text-[13.5px]">
            <label className="flex items-start gap-2 rounded-lg border border-border p-2.5">
              <input type="radio" name="ctx-remove" checked={mode === 'move'} onChange={() => setMode('move')} className="mt-1" />
              <span className="flex-1">
                <span className="font-medium">Move everything to another context</span>
                <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} disabled={mode !== 'move'} className="mt-1.5 block h-9 w-full rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px] disabled:opacity-50">{others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-border p-2.5">
              <input type="radio" name="ctx-remove" checked={mode === 'delete'} onChange={() => setMode('delete')} className="mt-1" />
              <span><span className="font-medium text-danger">Delete everything in it</span><span className="block text-fg-3">Notes, meetings, people, tasks, decisions and numbers of this context are removed for good. Trash does not keep them.</span></span>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>{mode === 'move' ? 'Move and remove' : 'Delete everything'}</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  )
}
