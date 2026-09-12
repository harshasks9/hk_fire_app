'use client'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/client'
export function NewNoteButton({ researchProjectId, label = 'New note' }: { researchProjectId?: string; label?: string }) {
  const router = useRouter()
  return (
    <Button variant="primary" size="md" onClick={async () => { const n = await api<{ id: string }>('/api/notes', { method: 'POST', json: { researchProjectId } }); router.push(`/notes/${n.id}`) }}>
      <Plus className="h-4 w-4" /> {label}
    </Button>
  )
}
