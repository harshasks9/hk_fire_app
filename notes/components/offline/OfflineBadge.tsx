'use client'
import Link from 'next/link'
import { CloudUpload, WifiOff } from 'lucide-react'
import { useOffline } from '@/lib/offline/sync'
import { cx } from '@/lib/util'
import { Spinner } from '@/components/ui'

/** Connectivity + pending-sync pill. Renders nothing when online with nothing queued. */
export function OfflineBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const { online, pending, syncing, failed } = useOffline()
  if (online && pending === 0 && !syncing) return null
  const label = !online ? (pending ? `Offline · ${pending} to sync` : 'Offline') : syncing ? 'Syncing…' : failed ? `${pending} need attention` : `${pending} to sync`
  return (
    <Link href="/offline" className={cx('inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium', !online ? 'border-warning/40 bg-warning/10 text-warning' : failed ? 'border-danger/40 bg-danger/10 text-danger' : 'border-accent-soft-2 bg-accent-soft text-accent', className)} title={label}>
      {!online ? <WifiOff className="h-3.5 w-3.5" /> : syncing ? <Spinner className="h-3.5 w-3.5" /> : <CloudUpload className="h-3.5 w-3.5" />}
      {compact ? (!online ? (pending ? String(pending) : null) : String(pending)) : label}
    </Link>
  )
}
