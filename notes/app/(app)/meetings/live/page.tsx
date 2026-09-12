import { getActiveContext } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { LiveMeeting } from '@/components/meetings/LiveMeeting'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export const dynamic = 'force-dynamic'
export default async function LivePage({ searchParams }: { searchParams: Promise<{ meetingId?: string }> }) {
  const { meetingId } = await searchParams
  const ctx = await getActiveContext()
  const people = await listEntities(ctx.id, 'person')
  let title: string | undefined
  if (meetingId) {
    const db = await getDb()
    title = (await db.select({ title: schema.meetings.title }).from(schema.meetings).where(eq(schema.meetings.id, meetingId)))[0]?.title
  }
  return <LiveMeeting meetingId={meetingId} initialTitle={title} knownPeople={people.map((p) => p.name)} />
}
