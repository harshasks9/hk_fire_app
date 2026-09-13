import { NextRequest, NextResponse } from 'next/server'
import { allContexts } from '@/lib/context'
import { refreshInsights } from '@/lib/insights'
import { dailyBrief } from '@/lib/briefing'
import { getDb, schema } from '@/lib/db'
import { notebookOwnerName } from '@/lib/tenant'
import { notebookAiScope } from '@/lib/ai/notebook-config'
import { runWithAiScope } from '@/lib/ai/scope'
import { purgeExpiredTrash } from '@/lib/trash'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Nightly: refresh proactive insights and pre-compute the morning brief for every context of every notebook; purge old trash. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const contexts = await allContexts()
  const db = await getDb()
  const out: Record<string, unknown> = {}
  const names = new Map<string, string>()
  for (const c of contexts) {
    const owner = names.get(c.notebookId) ?? (await notebookOwnerName(c.notebookId))
    names.set(c.notebookId, owner)
    const scope = await notebookAiScope(c.notebookId, owner)
    await runWithAiScope(scope, async () => {
      await refreshInsights(c.id)
      const brief = await dailyBrief(c.id, owner)
      await db.insert(schema.appMeta).values({ key: `brief:${c.id}`, value: brief }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: brief, updatedAt: new Date() } })
      out[`${c.notebookId}/${c.slug}`] = brief.lines.length
    })
  }
  const purged = await purgeExpiredTrash()
  return NextResponse.json({ ok: true, out, purged })
}
