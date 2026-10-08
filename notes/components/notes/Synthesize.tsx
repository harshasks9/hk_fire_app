'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'
export function Synthesize({ id, hasSynthesis }: { id: string; hasSynthesis: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState(false)
  return (
    <Button size="sm" variant="secondary" loading={busy} onClick={async () => { setBusy(true); try { await api(`/api/research/${id}`, { method: 'PATCH', json: { synthesize: true } }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) } }}>
      <Sparkles className="h-3.5 w-3.5 text-accent" /> {hasSynthesis ? 'Re-synthesize' : 'Synthesize'}
    </Button>
  )
}
