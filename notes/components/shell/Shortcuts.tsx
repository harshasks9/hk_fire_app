'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setShell } from './store'
import { createNoteAndOpen } from '@/lib/offline/notes-client'

export function Shortcuts() {
  const router = useRouter()
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setShell((s) => ({ commandOpen: !s.commandOpen, commandQuery: '' })); return }
      if (mod && e.key.toLowerCase() === 'p' && !e.shiftKey) { e.preventDefault(); setShell({ commandOpen: true, commandQuery: '' }); return }
      if (mod && e.key === '\\') { e.preventDefault(); setShell((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })); return }
      if (mod && e.key === '.') { e.preventDefault(); setShell((s) => ({ panelOpen: !s.panelOpen })); return }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); setShell({ captureOpen: true }); return }
      if (e.altKey && (e.code === 'Space' || e.key === ' ')) { e.preventDefault(); setShell({ captureOpen: true }); return }
      if (mod && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault()
        await createNoteAndOpen(router)
        return
      }
      if (e.key === 'Escape') { setShell({ commandOpen: false, captureOpen: false, mobileMenuOpen: false, panelSheet: false }) }
      if (!mod && !typing && e.key === '/' ) { e.preventDefault(); setShell({ commandOpen: true, commandQuery: '' }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])
  return null
}
