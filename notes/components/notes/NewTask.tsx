'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe } from 'lucide-react'
import { Button, Input, Textarea, useToast } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'

/** Add a task by hand: title, due date, details, and optionally a public link right away. */
export function NewTask({ sourceNoteId, entityId }: { sourceNoteId?: string; entityId?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [due, setDue] = React.useState('')
  const [owner, setOwner] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [isPublic, setPublic] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const reset = () => { setTitle(''); setDue(''); setOwner(''); setDetails(''); setPublic(false) }
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      const r = await api<{ id: string; shareUrl: string | null; warning?: string }>('/api/tasks', { method: 'POST', json: { title, owner: owner || undefined, dueAt: due ? new Date(due + 'T17:00').toISOString() : undefined, sourceNoteId, entityId, detailsText: details, public: isPublic } })
      if (r.shareUrl) { try { await navigator.clipboard.writeText(r.shareUrl) } catch { /* ignore */ } toast.push({ text: 'Task added · public link copied', tone: 'success' }) }
      else if (r.warning) toast.push({ text: r.warning, tone: 'danger' })
      else toast.push({ text: 'Task added', tone: 'success' })
      reset(); setOpen(false)
      if (details.trim() || isPublic) router.push(`/tasks/${r.id}`)
      router.refresh()
    } catch (err) { toast.push({ text: String((err as Error).message ?? err), tone: 'danger' }) } finally { setBusy(false) }
  }
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Task</Button>
      {open ? (
        <Dialog title="New task" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <Input autoFocus placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-[12.5px] text-fg-2">Due</label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
              <div><label className="mb-1 block text-[12.5px] text-fg-2">Owner</label><Input placeholder="Me" value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
            </div>
            <div>
              <label className="mb-1 block text-[12.5px] text-fg-2">Details</label>
              <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={'Context, links, steps. Use "- " for a list.\nImages, screenshots, audio and files can be added on the task page.'} />
            </div>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 text-[13px]">
              <input type="checkbox" checked={isPublic} onChange={(e) => setPublic(e.target.checked)} className="mt-0.5 h-3.5 w-3.5" />
              <span><span className="inline-flex items-center gap-1 font-medium"><Globe className="h-3.5 w-3.5 text-accent" /> Anyone with the link can see it</span><span className="block text-[12px] text-fg-3">Creates a public, read-only link (title, status, due date, details, files) and copies it. You can revoke it later.</span></span>
            </label>
            <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={busy} disabled={!title.trim() || busy}>Add task</Button></div>
          </form>
        </Dialog>
      ) : null}
    </>
  )
}
