import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { slugify, uid } from '@/lib/util'
export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const b = (await req.json()) as { name: string; question?: string; description?: string }
  if (!b.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const db = await getDb()
  const id = uid('rp')
  await db.insert(schema.researchProjects).values({ id, contextId: ctx.id, name: b.name.trim(), slug: slugify(b.name), question: b.question, description: b.description })
  return NextResponse.json({ id }, { status: 201 })
}
