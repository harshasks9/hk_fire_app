'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'

/** Older notes were written before tagging existed: read them once so they get tags too. */
export function TagBackfill({ remaining }: { remaining: number }) {
  const router = useRouter()
  const toast = useToast()
  const [left, setLeft] = React.useState(remaining)
  const [running, setRunning] = React.useState(false)
  const [done, setDone] = React.useState(0)
  const stop = React.useRef(false)
  const run = async () => {
    setRunning(true)
    stop.current = false
    try {
      let rem = left
      while (rem > 0 && !stop.current) {
        const r = await api<{ processed: number; remaining: number }>('/api/tags', { method: 'POST' })
        setDone((d) => d + r.processed)
        rem = r.remaining
        setLeft(rem)
        if (r.processed === 0) break
      }
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setRunning(false) }
  }
  if (left <= 0 && !running) return null
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-4 py-3 text-[13.5px]">
      <Sparkles className="h-4 w-4 text-accent" />
      <span className="flex-1">{left} {left === 1 ? 'note has' : 'notes have'} no tags yet{done ? ` · ${done} tagged so far` : ''}.</span>
      {running ? <Button size="sm" variant="secondary" onClick={() => { stop.current = true }}>Stop</Button> : <Button size="sm" variant="primary" onClick={run}>Tag them now</Button>}
    </div>
  )
}
