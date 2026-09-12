import { NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { getSession } from '@/lib/session'
import { dailyBrief } from '@/lib/briefing'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET() {
  const ctx = await getActiveContext()
  const s = await getSession()
  return NextResponse.json(await dailyBrief(ctx.id, s?.user.name ?? process.env.USER_NAME ?? 'You'))
}
