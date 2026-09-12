'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Radio, CalendarPlus } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { api } from '@/lib/client'

export function MeetingActions() {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [when, setWhen] = React.useState(() => { const d = new Date(Date.now() + 3600000); d.setMinutes(0, 0, 0); return toLocal(d) })
  const schedule = async () => {
    if (!title.trim()) return
    const startsAt = new Date(when)
    const r = await api<{ meetingId: string }>('/api/meetings', { method: 'POST', json: { title, startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + 45 * 60000).toISOString(), status: 'upcoming' } })
    toast.push({ text: 'Scheduled', tone: 'success' })
    setOpen(false)
    router.push(`/meetings/${r.meetingId}`)
    router.refresh()
  }
  return (
    <div className="relative flex items-center gap-1.5">
      <Button variant="secondary" size="md" onClick={() => setOpen((o) => !o)}><CalendarPlus className="h-4 w-4" /> Schedule</Button>
      <Button variant="primary" size="md" onClick={() => router.push('/meetings/live')}><Radio className="h-4 w-4" /> Live meeting</Button>
      {open ? (
        <div className="animate-pop absolute right-0 top-full z-40 mt-1 w-80 rounded-xl border border-border bg-surface p-3 shadow-pop">
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3">New meeting</div>
          <Input autoFocus placeholder="Nissan — Treasury POC review" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && schedule()} className="mb-2" />
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mb-3" />
          <div className="flex justify-end gap-1.5"><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" variant="primary" onClick={schedule}>Schedule</Button></div>
          <p className="mt-2 text-[11.5px] text-fg-3">Calendar sync is the integration boundary here — meetings created from your calendar will land in this same list.</p>
        </div>
      ) : null}
    </div>
  )
}
function toLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
