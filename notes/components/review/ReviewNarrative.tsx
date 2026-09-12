'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button, useToast, AiMark } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'

export function ReviewNarrative({ contextId, week, narrative, empty }: { contextId: string; week: string; narrative: { text: string; provider: string | null; updatedAt: string } | null; empty: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState(false)
  const [text, setText] = React.useState(narrative?.text ?? null)
  const [meta, setMeta] = React.useState(narrative ? { provider: narrative.provider, updatedAt: narrative.updatedAt } : null)
  React.useEffect(() => { setText(narrative?.text ?? null); setMeta(narrative ? { provider: narrative.provider, updatedAt: narrative.updatedAt } : null) }, [narrative, week])
  const generate = async () => {
    setBusy(true)
    try {
      const r = await api<{ text: string; provider: string }>('/api/review', { method: 'POST', json: { contextId, week } })
      setText(r.text); setMeta({ provider: r.provider, updatedAt: new Date().toISOString() })
      router.refresh()
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mb-8 rounded-2xl border border-dashed border-accent-soft-2 bg-accent-soft/30 p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <AiMark label={meta ? `Weekly narrative · ${meta.provider === 'local' ? 'heuristic' : meta.provider ?? 'AI'} · ${relativeTime(meta.updatedAt)}` : 'Weekly narrative'} />
        <Button size="sm" variant={text ? 'ghost' : 'primary'} loading={busy} disabled={empty && !text} onClick={generate}>{text ? <><RefreshCw className="h-3.5 w-3.5" /> Rewrite</> : <><Sparkles className="h-3.5 w-3.5" /> Write the narrative</>}</Button>
      </div>
      {text ? <p className="text-[15px] leading-relaxed">{text}</p> : <p className="text-[13.5px] text-fg-2">{empty ? 'Nothing happened in this context this week, so there is nothing to narrate yet.' : 'A short, honest reflection on the week, written from the facts below. Nothing is invented; every sentence traces back to a note.'}</p>}
    </div>
  )
}
