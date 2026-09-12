'use client'
import { useRouter } from 'next/navigation'
import { Zap, Mic, Link2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { setShell } from '@/components/shell/store'

export function InboxActions() {
  const router = useRouter()
  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="secondary" onClick={() => setShell({ captureOpen: true })}><Zap className="h-3.5 w-3.5" /> Capture</Button>
      <Button size="sm" variant="secondary" onClick={() => router.push('/capture/voice')}><Mic className="h-3.5 w-3.5" /> Voice</Button>
      <Button size="sm" variant="ghost" onClick={() => setShell({ captureOpen: true })} title="Paste a link"><Link2 className="h-3.5 w-3.5" /></Button>
    </div>
  )
}
