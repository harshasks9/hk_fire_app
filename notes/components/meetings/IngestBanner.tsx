'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { StageList, usePollStatus, type StatusView } from './ImportRecording'

/** On the meeting page while a recording is still being turned into a note (or after it failed). */
export function IngestBanner({ initial }: { initial: StatusView }) {
  const router = useRouter()
  const toast = useToast()
  const [key, setKey] = React.useState(0)
  const status = usePollStatus(initial.status === 'done' ? null : `${initial.meetingId}`, initial)
  const [busy, setBusy] = React.useState(false)
  const st = status ?? initial
  React.useEffect(() => {
    if (st.status === 'done' && initial.status !== 'done') router.refresh()
  }, [st.status, initial.status, router])
  if (st.status === 'done' || !st.status) return null
  const retry = async () => {
    setBusy(true)
    try {
      await api(`/api/recordings/${initial.meetingId}`, { method: 'POST' })
      setKey((k) => k + 1)
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) }
  }
  return (
    <div key={key} className="mb-6 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-accent"><Sparkles className="h-3.5 w-3.5" /> {st.status === 'failed' ? 'Structuring failed' : 'Structuring this recording'}</div>
      <StageList status={st.status} error={st.error} hasRecording={st.hasRecording} compact />
      {st.status === 'failed' ? <Button size="sm" variant="primary" className="mt-3" loading={busy} onClick={retry}><RefreshCw className="h-3.5 w-3.5" /> Try again</Button> : null}
    </div>
  )
}
