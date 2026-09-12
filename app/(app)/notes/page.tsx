import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, LinkTabs } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { listNotes } from '@/lib/queries'
import { NoteRow } from '@/components/entities'
import { NewNoteButton } from '@/components/notes/NewNoteButton'
import { NewFromTemplateButton } from '@/components/notes/TemplatePicker'
import { NotesFilter } from '@/components/notes/NotesFilter'

export const dynamic = 'force-dynamic'

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const { view = 'all', q } = await searchParams
  const ctx = await getActiveContext()
  const notes = await listNotes(ctx.id, { limit: 200, favorite: view === 'favorites', kind: view === 'meetings' ? 'meeting' : view === 'voice' ? 'voice' : undefined, q })
  const groups = groupByDay(notes)
  return (
    <Page>
      <PageHeader title="Notes" subtitle={`${notes.length} in ${ctx.name}`} actions={<div className="flex flex-wrap gap-2"><NewFromTemplateButton /><NewNoteButton /></div>}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LinkTabs active={view} tabs={[{ id: 'all', label: 'All', href: '/notes' }, { id: 'favorites', label: 'Favorites', href: '/notes?view=favorites' }, { id: 'meetings', label: 'Meetings', href: '/notes?view=meetings' }, { id: 'voice', label: 'Voice', href: '/notes?view=voice' }]} className="flex-1" />
          <NotesFilter initial={q ?? ''} view={view} />
        </div>
      </PageHeader>
      {notes.length === 0 ? (
        <EmptyState title={q ? `No notes match “${q}”` : 'No notes yet'} description={q ? 'Try semantic search from the command bar (⌘K) — it understands meaning, not just words.' : 'Press ⌘N to start. Titles, tags and filing happen on their own.'} />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="mb-6">
            <h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{g.label}</h2>
            <div>{g.notes.map((n) => <NoteRow key={n.id} note={n} />)}</div>
          </section>
        ))
      )}
    </Page>
  )
}

function groupByDay<T extends { updatedAt: Date }>(notes: T[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const week = new Date(today); week.setDate(today.getDate() - 7)
  const month = new Date(today); month.setDate(today.getDate() - 30)
  const buckets: { label: string; notes: T[] }[] = [{ label: 'Today', notes: [] }, { label: 'Yesterday', notes: [] }, { label: 'Earlier this week', notes: [] }, { label: 'Earlier this month', notes: [] }, { label: 'Older', notes: [] }]
  for (const n of notes) {
    const d = new Date(n.updatedAt)
    const i = d >= today ? 0 : d >= yesterday ? 1 : d >= week ? 2 : d >= month ? 3 : 4
    buckets[i]!.notes.push(n)
  }
  return buckets.filter((b) => b.notes.length)
}
