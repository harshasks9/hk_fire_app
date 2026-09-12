import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { assertContext } from '@/lib/tenant'
import { generateNarrative, parseWeekKey } from '@/lib/review'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Write (or rewrite) the narrative for a context's week. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    const b = (await req.json().catch(() => ({}))) as { contextId?: string; week?: string }
    if (!b.contextId) return NextResponse.json({ error: 'contextId required' }, { status: 400 })
    await assertContext(b.contextId)
    const r = await generateNarrative(b.contextId, parseWeekKey(b.week), s.user.name)
    return NextResponse.json({ ok: true, ...r })
  } catch (e) {
    return apiError(e)
  }
}
