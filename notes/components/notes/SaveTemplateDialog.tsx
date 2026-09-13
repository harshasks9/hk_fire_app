'use client'
import * as React from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'

export function SaveTemplateDialog({ noteId, open, onClose, defaultName }: { noteId: string; open: boolean; onClose: () => void; defaultName: string }) {
  const toast = useToast()
  const [name, setName] = React.useState(defaultName)
  const [description, setDescription] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => { if (open) setName(defaultName) }, [open, defaultName])
  if (!open) return null
  const field = 'h-10 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[14px] outline-none focus:border-accent'
  return (
    <Dialog title="Save as template" onClose={onClose}>
      <p className="mb-3 text-[13px] text-fg-2">The note's structure becomes a reusable template for this notebook. Use placeholders like {'{{date}}'} or {'{{title}}'} in the text; they are filled in when you create a note from it.</p>
      <label className="mb-1 block text-[12.5px] text-fg-2">Template name</label>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={field} />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Description (optional)</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to use it" className={field} />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Default note title (optional, supports placeholders)</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly review — week of {{date}}" className={field} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={busy} disabled={!name.trim()} onClick={async () => { setBusy(true); try { await api('/api/templates', { method: 'POST', json: { noteId, name, description, title: title || undefined } }); toast.push({ text: 'Template saved', tone: 'success' }); onClose() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) } }}>Save template</Button>
      </div>
    </Dialog>
  )
}
