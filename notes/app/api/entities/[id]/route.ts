import { guardOwned, apiError } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { slugify } from '@/lib/util'
import { deleteEntities } from '@/lib/wipe'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('entity', id)
  if (denied) return denied
  const b = (await req.json()) as { pinned?: boolean; name?: string; attributes?: Record<string, string>; aliases?: string[]; summary?: string; type?: 'person' | 'company' | 'topic' | 'project' }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.pinned !== undefined) set.pinned = b.pinned
  if (b.name && b.name.trim()) { set.name = b.name.trim().slice(0, 120); set.slug = slugify(b.name) }
  if (b.type && ['person', 'company', 'topic', 'project'].includes(b.type)) set.type = b.type
  if (b.attributes) { const out: Record<string, string> = {}; for (const [k, v] of Object.entries(b.attributes)) if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 200); set.attributes = out }
  if (b.aliases) set.aliases = b.aliases.map((a) => String(a).trim()).filter(Boolean).slice(0, 20)
  if (b.summary !== undefined) { set.summary = b.summary; set.summaryUpdatedAt = new Date() }
  try {
    await db.update(schema.entities).set(set).where(eq(schema.entities.id, id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (String(e).includes('entities_ctx_type_slug')) return NextResponse.json({ error: 'Another entry already has that name' }, { status: 409 })
    return apiError(e)
  }
}

/** Remove the person/company/topic. Notes stay; numbers about it go; tasks, loops and decisions lose the link. */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('entity', id)
  if (denied) return denied
  await deleteEntities([id])
  return new NextResponse(null, { status: 204 })
}
