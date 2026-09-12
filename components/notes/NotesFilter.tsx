'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
export function NotesFilter({ initial, view }: { initial: string; view: string }) {
  const router = useRouter()
  const [q, setQ] = React.useState(initial)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams()
      if (view !== 'all') p.set('view', view)
      if (q.trim()) p.set('q', q.trim())
      router.replace(`/notes${p.toString() ? `?${p}` : ''}`)
    }, 250)
    return () => clearTimeout(t)
  }, [q, view, router])
  return (
    <label className="flex h-8 items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] text-fg-3 focus-within:border-accent pointer-coarse:h-10">
      <Search className="h-3.5 w-3.5" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter notes" className="w-36 bg-transparent text-fg outline-none placeholder:text-fg-3 sm:w-48" />
    </label>
  )
}
