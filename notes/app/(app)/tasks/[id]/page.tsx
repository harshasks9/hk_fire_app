import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Page } from '@/components/shell/AppShell'
import { getTaskDetail } from '@/lib/tasks'
import { assertOwned } from '@/lib/tenant'
import { TaskDetail } from '@/components/tasks/TaskDetail'
export const dynamic = 'force-dynamic'

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try { await assertOwned('task', id) } catch { notFound() }
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const d = await getTaskDetail(id, host ? `${proto}://${host}` : '')
  if (!d) notFound()
  return (
    <Page width="narrow" className="pt-5">
      <TaskDetail d={{ ...d, task: { ...d.task, dueAt: d.task.dueAt?.toISOString() ?? null, createdAt: d.task.createdAt.toISOString(), updatedAt: d.task.updatedAt.toISOString(), completedAt: d.task.completedAt?.toISOString() ?? null }, attachments: d.attachments.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })) }} />
    </Page>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getTaskDetail(id, '').catch(() => null)
  return { title: d ? `${d.task.title} · Task` : 'Task' }
}
