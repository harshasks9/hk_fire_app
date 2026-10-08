import { NextRequest, NextResponse } from 'next/server'
import { resolveContext } from '@/lib/context'
import { getSession } from '@/lib/session'
import { ensureDailyNote, parseDayKey, readerTimeZone } from '@/lib/today'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

/** Find or create the daily note for a day (`{ day: 'YYYY-MM-DD', contextId? }`), in the writing context. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { day?: string; contextId?: string }
    const [ctx, session, tz] = await Promise.all([resolveContext(body.contextId), getSession(), readerTimeZone()])
    const day = parseDayKey(body.day, tz)
    const r = await ensureDailyNote({ contextId: ctx.id, day, tz, notebookId: session?.notebookId, notebookName: session?.notebook.name, userName: session?.user.name })
    return NextResponse.json({ ...r, day }, { status: r.created ? 201 : 200 })
  } catch (e) {
    return apiError(e)
  }
}
