import { NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { dailyBrief } from '@/lib/briefing'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET() {
  const ctx = await getActiveContext()
  return NextResponse.json(await dailyBrief(ctx.id, process.env.USER_NAME || 'Harsha'))
}
