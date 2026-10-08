import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, LinkTabs } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { listTasks, taskCounts, type TaskView } from '@/lib/queries'
import { TaskRow } from '@/components/entities'
import { NewTask } from '@/components/notes/NewTask'

export const dynamic = 'force-dynamic'

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string; highlight?: string }> }) {
  const { view = 'all', highlight } = await searchParams
  const scope = await getActiveScope()
  const ctx = { id: scope.ids }
  const v = (['today', 'week', 'overdue', 'waiting', 'delegated', 'completed', 'all'].includes(view) ? view : 'all') as TaskView
  const [tasks, counts] = await Promise.all([listTasks(ctx.id, v), taskCounts(ctx.id)])
  const byEntity = new Map<string, typeof tasks>()
  for (const t of tasks) {
    const k = t.entityName ?? 'General'
    byEntity.set(k, [...(byEntity.get(k) ?? []), t])
  }
  return (
    <Page>
      <PageHeader title="Tasks" subtitle={`Extracted from notes and meetings automatically, or added by hand${scope.all ? ' · every context' : ''}. Open a task for details, files and a public link.`} actions={<NewTask />}>
        <LinkTabs active={v} tabs={[
          { id: 'today', label: 'Today', href: '/tasks?view=today', count: counts.today },
          { id: 'week', label: 'This week', href: '/tasks?view=week', count: counts.week },
          { id: 'overdue', label: 'Overdue', href: '/tasks?view=overdue', count: counts.overdue },
          { id: 'waiting', label: 'Waiting', href: '/tasks?view=waiting', count: counts.waiting },
          { id: 'delegated', label: 'Delegated', href: '/tasks?view=delegated', count: counts.delegated },
          { id: 'completed', label: 'Completed', href: '/tasks?view=completed', count: counts.completed },
          { id: 'all', label: 'All open', href: '/tasks', count: counts.all },
        ]} />
      </PageHeader>
      {tasks.length === 0 ? (
        <EmptyState title={v === 'completed' ? 'Nothing completed yet' : v === 'overdue' ? 'Nothing overdue' : 'No tasks here'} description={v === 'all' ? 'Write "Team to send the enablement plan by Friday" in any note and it appears here, owner and due date included.' : undefined} />
      ) : (
        [...byEntity.entries()].map(([name, list]) => (
          <section key={name} className="mb-6">
            <h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{name} <span className="font-normal text-fg-3">{list.length}</span></h2>
            {list.map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} showEntity={false} highlight={highlight === t.id} contextName={scope.all ? scope.nameOf(t.contextId) : undefined} />)}
          </section>
        ))
      )}
    </Page>
  )
}
