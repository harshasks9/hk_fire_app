import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { guardOwned } from '@/lib/api'
import { parseNumberish } from '@/lib/sheet/formula'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('fact', id)
  if (denied) return denied
  const b = (await req.json()) as { label?: string; value?: string; unit?: string | null; observedAt?: string }
  const db = await getDb()
  const set: Record<string, unknown> = {}
  if (b.label !== undefined && b.label.trim()) set.label = b.label.trim().slice(0, 120)
  if (b.value !== undefined && b.value.trim()) { set.value = b.value.trim().slice(0, 120); set.numericValue = parseNumberish(b.value) }
  if (b.unit !== undefined) set.unit = b.unit?.trim() || null
  if (b.observedAt && !Number.isNaN(Date.parse(b.observedAt))) set.observedAt = new Date(b.observedAt)
  if (Object.keys(set).length) await db.update(schema.facts).set(set).where(eq(schema.facts.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('fact', id)
  if (denied) return denied
  const db = await getDb()
  await db.update(schema.facts).set({ supersededById: null }).where(eq(schema.facts.supersededById, id))
  await db.delete(schema.facts).where(eq(schema.facts.id, id))
  return new NextResponse(null, { status: 204 })
}
