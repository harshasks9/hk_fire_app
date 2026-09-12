import { NextRequest, NextResponse } from 'next/server'
import { getContexts } from '@/lib/context'
import { refreshInsights } from '@/lib/insights'
import { dailyBrief } from '@/lib/briefing'
import { getDb, schema } from '@/lib/db'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Nightly: refresh proactive insights and pre-compute the morning brief for every context. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const contexts = await getContexts()
  const db = await getDb()
  const out: Record<string, unknown> = {}
  for (const c of contexts) {
    await refreshInsights(c.id)
    const brief = await dailyBrief(c.id, process.env.USER_NAME || 'Harsha')
    await db.insert(schema.appMeta).values({ key: `brief:${c.id}`, value: brief }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: brief, updatedAt: new Date() } })
    out[c.slug] = brief.lines.length
  }
  return NextResponse.json({ ok: true, out })
}
