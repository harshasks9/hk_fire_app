import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { getSession, requireSession } from '@/lib/session'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
import { detailsFromText } from '@/lib/tasks'
import { docToText } from '@/lib/markdown'
import { createShareLink } from '@/lib/share'
import { requestOrigin } from '@/lib/api'

export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const s = await getSession()
  const b = (await req.json()) as { title: string; owner?: string; dueAt?: string; priority?: 'low' | 'normal' | 'high' | 'urgent'; sourceNoteId?: string; entityId?: string; details?: unknown; detailsText?: string; public?: boolean }
  if (!b.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const db = await getDb()
  const id = uid('task')
  const details = b.details && typeof b.details === 'object' ? b.details : b.detailsText ? detailsFromText(b.detailsText) : null
  await db.insert(schema.tasks).values({ id, contextId: ctx.id, title: b.title.trim(), owner: b.owner?.trim() || s?.user.name || process.env.USER_NAME || 'You', dueAt: b.dueAt ? new Date(b.dueAt) : undefined, priority: b.priority ?? 'normal', sourceNoteId: b.sourceNoteId, entityId: b.entityId, aiGenerated: false, details, detailsText: details ? docToText(details) : '' })
  let shareUrl: string | null = null
  if (b.public) {
    const sess = await requireSession()
    if (sess.notebook.settings?.allowShareLinks === false) return NextResponse.json({ id, shareUrl: null, warning: 'Public sharing is turned off for this notebook' }, { status: 201 })
    shareUrl = (await createShareLink({ taskId: id, notebookId: sess.notebookId, userId: sess.userId, expiresDays: null, origin: requestOrigin(req) })).url
  }
  return NextResponse.json({ id, shareUrl }, { status: 201 })
}
