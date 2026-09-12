import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(req: NextRequest) {
  const b = (await req.json()) as { name?: string; settings?: Record<string, unknown> }
  const db = await getDb()
  const u = (await db.select().from(schema.users))[0]
  if (!u) return NextResponse.json({ error: 'no user' }, { status: 404 })
  await db.update(schema.users).set({ name: b.name ?? u.name, settings: { ...u.settings, ...(b.settings ?? {}) } }).where(eq(schema.users.id, u.id))
  return NextResponse.json({ ok: true })
}
