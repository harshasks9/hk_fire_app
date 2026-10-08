import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
export async function PATCH(req: NextRequest) {
  try {
    const s = await requireSession()
    const b = (await req.json()) as { name?: string; settings?: Record<string, unknown> }
    const db = await getDb()
    await db.update(schema.users).set({ name: b.name ?? s.user.name, settings: { ...s.user.settings, ...(b.settings ?? {}) } }).where(eq(schema.users.id, s.userId))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
