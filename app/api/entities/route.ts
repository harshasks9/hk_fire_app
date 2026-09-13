import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getActiveScope, resolveContext } from '@/lib/context'
import { searchEntitiesByName } from '@/lib/queries'
import { getDb, schema } from '@/lib/db'
import { slugify, uid } from '@/lib/util'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = { id: (await getActiveScope()).ids }
  const q = req.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json(await searchEntitiesByName(ctx.id, q, 8))
}

/** Create a person, company, topic or project by hand. An existing one with the same name is returned instead of duplicated. */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { type?: 'person' | 'company' | 'topic' | 'project'; name?: string; attributes?: Record<string, string>; aliases?: string[]; contextId?: string }
    const type = b.type && ['person', 'company', 'topic', 'project'].includes(b.type) ? b.type : 'person'
    const name = (b.name ?? '').trim().slice(0, 120)
    if (!name) return NextResponse.json({ error: 'A name is required' }, { status: 400 })
    const ctx = await resolveContext(b.contextId)
    const db = await getDb()
    const slug = slugify(name)
    const existing = (await db.select({ id: schema.entities.id }).from(schema.entities).where(and(eq(schema.entities.contextId, ctx.id), eq(schema.entities.type, type), eq(schema.entities.slug, slug))))[0]
    if (existing) return NextResponse.json({ id: existing.id, existed: true })
    const id = uid('ent')
    await db.insert(schema.entities).values({ id, contextId: ctx.id, type, name, slug, aliases: (b.aliases ?? []).map((a) => a.trim()).filter(Boolean).slice(0, 20), attributes: clean(b.attributes), lastSeenAt: new Date() })
    return NextResponse.json({ id }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}

function clean(a?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(a ?? {})) if (typeof v === 'string' && v.trim() && k.length < 40) out[k] = v.trim().slice(0, 200)
  return out
}
