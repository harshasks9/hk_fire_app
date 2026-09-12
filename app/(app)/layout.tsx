import { AppShell } from '@/components/shell/AppShell'
import { getActiveContext, getContexts } from '@/lib/context'
import { sidebarData } from '@/lib/queries'

export const dynamic = 'force-dynamic'
// First request on a fresh instance migrates and seeds the embedded database.
export const maxDuration = 60

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [contexts, active] = await Promise.all([getContexts(), getActiveContext()])
  const side = await sidebarData(active.id)
  return (
    <AppShell sidebar={{ contexts, active, favorites: side.favorites, recents: side.recents, pinned: side.pinned, inboxCount: side.inboxCount, userName: process.env.USER_NAME || 'Harsha' }}>
      {children}
    </AppShell>
  )
}
