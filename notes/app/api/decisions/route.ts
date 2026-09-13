import { NextRequest, NextResponse } from 'next/server'
import { resolveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

/** Record a decision by hand. */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { title?: string; statement?: string; decidedAt?: string; reasoning?: string; context?: string; status?: 'active' | 'proposed'; contextId?: string }
    const title = (b.title ?? '').trim().slice(0, 200)
    if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 })
    const ctx = await resolveContext(b.contextId)
    const db = await getDb()
    const id = uid('dec')
    const decidedAt = b.decidedAt && !Number.isNaN(Date.parse(b.decidedAt)) ? new Date(b.decidedAt) : new Date()
    const statement = (b.statement ?? '').trim() || title
    await db.insert(schema.decisions).values({ id, contextId: ctx.id, title, statement, decidedAt, reasoning: b.reasoning?.trim() || null, context: b.context?.trim() || null, status: b.status === 'proposed' ? 'proposed' : 'active', aiGenerated: false })
    await db.insert(schema.decisionRevisions).values({ id: uid('rev'), decisionId: id, occurredAt: decidedAt, statement, kind: b.status === 'proposed' ? 'proposed' : 'made' })
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
