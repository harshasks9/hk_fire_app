import { NextRequest, NextResponse } from 'next/server'
import { resolveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

const KINDS = ['promised', 'waiting', 'follow_up', 'question'] as const

/** Add an open loop by hand: something you promised, are waiting on, or must follow up. */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { text?: string; kind?: string; byWhom?: string; dueAt?: string | null; dueHint?: string; priority?: 'low' | 'normal' | 'high' | 'urgent'; contextId?: string }
    const text = (b.text ?? '').trim().slice(0, 500)
    if (!text) return NextResponse.json({ error: 'Describe the loop' }, { status: 400 })
    const kind = (KINDS as readonly string[]).includes(b.kind ?? '') ? (b.kind as (typeof KINDS)[number]) : 'follow_up'
    const ctx = await resolveContext(b.contextId)
    const db = await getDb()
    const id = uid('cmt')
    await db.insert(schema.commitments).values({ id, contextId: ctx.id, text, kind, byWhom: (b.byWhom ?? '').trim() || (kind === 'waiting' ? 'Them' : 'Me'), dueAt: b.dueAt && !Number.isNaN(Date.parse(b.dueAt)) ? new Date(b.dueAt) : null, dueHint: b.dueHint?.trim() || null, priority: b.priority ?? 'normal' })
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
