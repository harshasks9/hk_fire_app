'use client'
/* New-note flows shared by the sidebar, command bar, shortcuts and mobile nav: online → server note; offline → local draft. */
import type { useRouter } from 'next/navigation'
import { api } from '@/lib/client'
import { createDraft, isNetworkError } from './sync'

type Router = ReturnType<typeof useRouter>

export async function createNoteAndOpen(router: Router, opts: { researchProjectId?: string } = {}): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const n = await api<{ id: string }>('/api/notes', { method: 'POST', json: opts })
      router.push(`/notes/${n.id}`)
      return
    } catch (e) {
      if (!isNetworkError(e)) throw e
    }
  }
  const draft = await createDraft()
  router.push(`/offline?draft=${draft.id}`)
}
