'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
export function SearchBox({ initial, all, contextName }: { initial: string; all: boolean; contextName: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState(initial)
  const [scope, setScope] = React.useState(all)
  const go = (value: string, scopeAll: boolean) => { const p = new URLSearchParams(); if (value.trim()) p.set('q', value.trim()); if (scopeAll) p.set('all', '1'); router.replace(`/search?${p}`) }
  React.useEffect(() => { const t = setTimeout(() => go(q, scope), 220); return () => clearTimeout(t) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scope])
  return (
    <div>
      <label className="flex h-12 items-center gap-3 rounded-xl border border-border-2 bg-surface px-4 focus-within:border-accent">
        <Search className="h-4 w-4 text-fg-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && /\?$/.test(q.trim())) router.push(`/ask?q=${encodeURIComponent(q.trim())}`) }} placeholder="Nissan · marketplace cap · What did we decide with TCS about ODCs?" className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-3" />
      </label>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-fg-3">
        <input type="checkbox" checked={scope} onChange={(e) => setScope(e.target.checked)} className="h-3.5 w-3.5 rounded border-border-2 accent-[var(--accent)]" />
        Search across all contexts <span className="block text-fg-3 sm:inline">(default: {contextName} only — contexts never leak into each other unless you ask)</span>
      </label>
    </div>
  )
}
