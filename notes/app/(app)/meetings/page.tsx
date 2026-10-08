import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, Section } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { listMeetings } from '@/lib/queries'
import { MeetingRow } from '@/components/entities'
import { MeetingActions } from '@/components/meetings/MeetingActions'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const scope = await getActiveScope()
  const nameOf = (id: string) => (scope.all ? scope.nameOf(id) : undefined)
  const { upcoming, past } = await listMeetings(scope.ids)
  return (
    <Page>
      <PageHeader title="Meetings" subtitle="Every meeting becomes a summary, decisions, actions and context for the next one." actions={<MeetingActions />} />
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState title="No meetings yet" description="Import a recording from your phone, start a live meeting to capture a running transcript, or paste a transcript into a note." />
      ) : (
        <>
          <Section title="Upcoming" count={upcoming.length} hint="prep is generated automatically">
            {upcoming.length ? upcoming.map((m) => <MeetingRow key={m.id} m={m} showStatus={m.status === 'live'} contextName={nameOf(m.contextId)} />) : <p className="text-[13.5px] text-fg-3">Nothing scheduled.</p>}
          </Section>
          <Section title="Past" count={past.length}>
            {past.map((m) => <MeetingRow key={m.id} m={m} contextName={nameOf(m.contextId)} />)}
          </Section>
        </>
      )}
    </Page>
  )
}
