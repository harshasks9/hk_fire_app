import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
import { apiError, guardOwned } from '@/lib/api'
import { parseNumberish } from '@/lib/sheet/formula'
import { eq } from 'drizzle-orm'
export const dynamic = 'force-dynamic'

/** Record a number about a person, company or topic by hand. */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { entityId?: string; label?: string; value?: string; unit?: string; observedAt?: string }
    const label = (b.label ?? '').trim().slice(0, 120)
    const value = (b.value ?? '').trim().slice(0, 120)
    if (!b.entityId || !label || !value) return NextResponse.json({ error: 'Pick who it is about, what it measures and the value' }, { status: 400 })
    const denied = await guardOwned('entity', b.entityId)
    if (denied) return denied
    const db = await getDb()
    const ent = (await db.select({ contextId: schema.entities.contextId }).from(schema.entities).where(eq(schema.entities.id, b.entityId)))[0]
    if (!ent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const id = uid('fact')
    const numericValue = parseNumberish(value)
    const unit = (b.unit ?? '').trim() || (value.startsWith('$') ? '$' : value.endsWith('%') ? '%' : null)
    await db.insert(schema.facts).values({ id, contextId: ent.contextId, entityId: b.entityId, label, value, numericValue, unit, observedAt: b.observedAt && !Number.isNaN(Date.parse(b.observedAt)) ? new Date(b.observedAt) : new Date() })
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
