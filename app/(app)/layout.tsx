import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { AppShell } from '@/components/shell/AppShell'
import { getActiveContext, getContexts } from '@/lib/context'
import { sidebarData } from '@/lib/queries'
import { getSession, touchNotebook } from '@/lib/session'

export const dynamic = 'force-dynamic'
// First request on a fresh instance migrates and seeds the embedded database.
export const maxDuration = 60

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const [contexts, active] = await Promise.all([getContexts(), getActiveContext()])
  const side = await sidebarData(active.id)
  // Keep the activity stamp out of the request's critical path.
  after(() => touchNotebook(session.notebookId).catch(() => undefined))
  return (
    <AppShell
      sidebar={{ contexts, active, favorites: side.favorites, recents: side.recents, pinned: side.pinned, inboxCount: side.inboxCount, userName: session.user.name, isAdmin: session.role === 'admin', notebookName: session.notebook.name }}
      viewingAsAdmin={session.homeNotebookId ? { notebookName: session.notebook.name } : null}
    >
      {children}
    </AppShell>
  )
}
