'use client'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { createNoteAndOpen } from '@/lib/offline/notes-client'
export function NewNoteButton({ researchProjectId, label = 'New note' }: { researchProjectId?: string; label?: string }) {
  const router = useRouter()
  return (
    <Button variant="primary" size="md" onClick={() => createNoteAndOpen(router, { researchProjectId })}>
      <Plus className="h-4 w-4" /> {label}
    </Button>
  )
}
