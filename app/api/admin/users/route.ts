import { NextRequest, NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

/** Every account on the platform, newest first, with its notebook. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
    const db = await getDb()
    const rows = await db.select({ u: schema.users, nbName: schema.notebooks.name, nbStatus: schema.notebooks.status }).from(schema.users).leftJoin(schema.notebooks, eq(schema.notebooks.id, schema.users.notebookId)).orderBy(desc(schema.users.createdAt), asc(schema.users.name)).limit(2000)
    const users = rows
      .map(({ u, nbName, nbStatus }) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, verified: Boolean(u.emailVerifiedAt), createdAt: u.createdAt.toISOString(), lastLoginAt: u.lastLoginAt?.toISOString() ?? null, notebookId: u.notebookId, notebookName: nbName, notebookStatus: nbStatus }))
      .filter((u) => !q || `${u.name} ${u.email ?? ''} ${u.notebookName ?? ''}`.toLowerCase().includes(q))
    return NextResponse.json({ users })
  } catch (e) {
    return apiError(e)
  }
}
