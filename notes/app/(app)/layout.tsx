import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { AppShell } from '@/components/shell/AppShell'
import { getActiveScope } from '@/lib/context'
import { sidebarData } from '@/lib/queries'
import { getSession, touchNotebook } from '@/lib/session'
import { getPlatformSettings } from '@/lib/platform'
import { authEnabled } from '@/lib/auth'

export const dynamic = 'force-dynamic'
// First request on a fresh instance migrates and seeds the embedded database.
export const maxDuration = 60

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const [scope, platform] = await Promise.all([getActiveScope(), getPlatformSettings()])
  const contexts = scope.contexts
  const active = scope.all ? { id: 'all', slug: 'all', name: 'All', kind: 'all' } : scope.active
  const side = await sidebarData(scope.ids)
  // Keep the activity stamp out of the request's critical path.
  after(() => touchNotebook(session.notebookId).catch(() => undefined))
  return (
    <AppShell
      sidebar={{ contexts, active, writeTo: scope.all ? scope.active.name : undefined, favorites: side.favorites, recents: side.recents, pinned: side.pinned, inboxCount: side.inboxCount, userName: session.user.name, isAdmin: session.role === 'admin', notebookName: session.notebook.name }}
      viewingAsAdmin={session.homeNotebookId ? { notebookName: session.notebook.name } : null}
      announcement={platform.announcement}
      verifyEmail={authEnabled() && session.user.email && !session.user.emailVerifiedAt && session.role !== 'admin' ? session.user.email : null}
    >
      {children}
    </AppShell>
  )
}
