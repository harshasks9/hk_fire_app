'use client'
import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { api } from '@/lib/client'
import { Skeleton } from '@/components/ui'

export function Briefing({ initialLines, scopeAll }: { initialLines: string[]; scopeAll?: boolean }) {
  const [brief, setBrief] = React.useState<{ lines: string[]; narrative: string | null } | null>(null)
  React.useEffect(() => {
    let alive = true
    api<{ lines: string[]; narrative: string | null }>('/api/brief').then((b) => alive && setBrief(b)).catch(() => alive && setBrief({ lines: initialLines, narrative: null }))
    return () => { alive = false }
  }, [initialLines])
  const lines = brief?.lines ?? initialLines
  return (
    <div className="rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-4 py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-accent"><Sparkles className="h-3.5 w-3.5" /> Today{scopeAll ? <span className="font-normal normal-case tracking-normal text-fg-3"> · across every context</span> : null}</div>
      {brief === null && !initialLines.length ? (
        <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
      ) : brief?.narrative ? (
        <p className="text-[15px] leading-relaxed">{brief.narrative}</p>
      ) : (
        <ul className="space-y-1 text-[14.5px] leading-snug">{lines.map((l, i) => <li key={i} className="flex gap-2"><span className="text-fg-3">–</span><span>{l}</span></li>)}</ul>
      )}
    </div>
  )
}
