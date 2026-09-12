'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/client'
export function NewResearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [question, setQuestion] = React.useState('')
  const submit = async () => {
    if (!name.trim()) return
    const r = await api<{ id: string }>('/api/research', { method: 'POST', json: { name, question } })
    router.push(`/research/${r.id}`)
    router.refresh()
  }
  return (
    <div className="relative">
      <Button variant="primary" onClick={() => setOpen((o) => !o)}><Plus className="h-4 w-4" /> Project</Button>
      {open ? (
        <div className="animate-pop absolute right-0 top-full z-40 mt-1 w-80 rounded-xl border border-border bg-surface p-3 shadow-pop">
          <Input autoFocus placeholder="Leveraged ETFs" value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />
          <Input placeholder="The question you want answered" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="mb-3" />
          <div className="flex justify-end gap-1.5"><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" variant="primary" onClick={submit}>Create</Button></div>
        </div>
      ) : null}
    </div>
  )
}
