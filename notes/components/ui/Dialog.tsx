'use client'
import * as React from 'react'
import { X } from 'lucide-react'

/** Modal dialog: bottom sheet on phones, centered card on larger screens. Esc and backdrop close it. */
export function Dialog({ title, children, onClose, wide }: { title: React.ReactNode; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-3 backdrop-blur-[2px] sm:items-center" onMouseDown={onClose}>
      <div className={`animate-pop max-h-[90dvh] w-full overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-pop ${wide ? 'max-w-[760px]' : 'max-w-[560px]'}`} onMouseDown={(e) => e.stopPropagation()} role="dialog">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h3><button onClick={onClose} className="rounded-md p-1.5 text-fg-3 hover:bg-surface-2 hover:text-fg" aria-label="Close"><X className="h-4 w-4" /></button></div>
        {children}
      </div>
    </div>
  )
}
