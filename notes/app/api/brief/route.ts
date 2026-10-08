import { NextResponse } from 'next/server'
import { getActiveScope } from '@/lib/context'
import { getSession } from '@/lib/session'
import { dailyBrief } from '@/lib/briefing'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET() {
  const scope = await getActiveScope()
  const ctx = { id: scope.ids, key: scope.all ? `all:${scope.active.notebookId}` : scope.active.id }
  const s = await getSession()
  return NextResponse.json(await dailyBrief(ctx.id, ctx.key, s?.user.name ?? process.env.USER_NAME ?? 'You'))
}
