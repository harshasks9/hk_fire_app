import { Suspense } from 'react'
import { Page } from '@/components/shell/AppShell'
import { OfflineNotepad } from '@/components/offline/OfflineNotepad'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Offline notes' }

/**
  The one page the service worker always keeps cached, so it opens with no
  network at all. Everything on it runs on the device (IndexedDB + localStorage).
*/
export default function OfflinePage() {
  return (
    <Page width="narrow">
      <Suspense fallback={null}>
        <OfflineNotepad />
      </Suspense>
    </Page>
  )
}
