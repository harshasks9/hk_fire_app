'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/client'
export function NewTask({ sourceNoteId, entityId }: { sourceNoteId?: string; entityId?: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [due, setDue] = React.useState('')
  const submit = async () => {
    if (!title.trim()) return
    await api('/api/tasks', { method: 'POST', json: { title, dueAt: due ? new Date(due + 'T17:00').toISOString() : undefined, sourceNoteId, entityId } })
    setTitle(''); setDue(''); setOpen(false)
    router.refresh()
  }
  return (
    <div className="relative">
      <Button variant="primary" onClick={() => setOpen((o) => !o)}><Plus className="h-4 w-4" /> Task</Button>
      {open ? (
        <div className="animate-pop absolute right-0 top-full z-40 mt-1 w-80 rounded-xl border border-border bg-surface p-3 shadow-pop">
          <Input autoFocus placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="mb-2" />
          <div className="flex items-center gap-2"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="flex-1" /><Button size="md" variant="primary" onClick={submit}>Add</Button></div>
        </div>
      ) : null}
    </div>
  )
}
