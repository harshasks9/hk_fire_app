import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const b = (await req.json()) as { title: string; owner?: string; dueAt?: string; priority?: 'low' | 'normal' | 'high' | 'urgent'; sourceNoteId?: string; entityId?: string }
  if (!b.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const db = await getDb()
  const id = uid('task')
  await db.insert(schema.tasks).values({ id, contextId: ctx.id, title: b.title.trim(), owner: b.owner ?? (process.env.USER_NAME || 'Harsha'), dueAt: b.dueAt ? new Date(b.dueAt) : undefined, priority: b.priority ?? 'normal', sourceNoteId: b.sourceNoteId, entityId: b.entityId, aiGenerated: false })
  return NextResponse.json({ id }, { status: 201 })
}
