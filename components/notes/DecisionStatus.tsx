'use client'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'
export function DecisionStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  return (
    <select value={status} onChange={async (e) => { await api(`/api/decisions/${id}`, { method: 'PATCH', json: { status: e.target.value } }); router.refresh() }} className="h-8 rounded-lg border border-border-2 bg-surface px-2 text-[13px]">
      {['active', 'proposed', 'revisited', 'superseded', 'reversed'].map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
