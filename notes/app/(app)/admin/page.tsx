import { notFound } from 'next/navigation'
import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { getSession } from '@/lib/session'
import { listNotebooksWithStats, platformTotals, recentAdminEvents } from '@/lib/notebooks'
import { AdminClient } from '@/components/admin/AdminClient'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin' }

/** Platform administration: notebooks for other people, usage and the audit trail. Admin role only. */
export default async function AdminPage() {
  const s = await getSession()
  if (!s || s.role !== 'admin') notFound()
  const [notebooks, totals, events] = await Promise.all([listNotebooksWithStats(), platformTotals(), recentAdminEvents(100)])
  return (
    <Page width="wide">
      <PageHeader title="Admin" subtitle="Create notebooks for other people, manage their access and watch usage. Everything here is logged." />
      <AdminClient
        currentNotebookId={s.notebookId}
        currentUserId={s.userId}
        totals={totals}
        notebooks={notebooks.map((r) => ({ ...r, notebook: { ...r.notebook, createdAt: r.notebook.createdAt.toISOString(), updatedAt: r.notebook.updatedAt.toISOString(), lastActiveAt: r.notebook.lastActiveAt?.toISOString() ?? null }, members: r.members.map((m) => ({ ...m, lastLoginAt: m.lastLoginAt?.toISOString() ?? null })) }))}
        events={events.map((e) => ({ id: e.id, actorName: e.actorName, action: e.action, targetType: e.targetType, targetName: e.targetName, meta: e.meta, createdAt: e.createdAt.toISOString() }))}
      />
    </Page>
  )
}
