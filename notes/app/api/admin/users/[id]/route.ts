import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { logAdminEvent } from '@/lib/notebooks'
import { signOutEverywhere } from '@/lib/signup'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    if (id === s.userId) return NextResponse.json({ error: 'You cannot change your own account here' }, { status: 400 })
    const b = (await req.json().catch(() => ({}))) as { status?: 'active' | 'disabled'; role?: 'owner' | 'member'; verified?: boolean; signOutEverywhere?: boolean }
    const db = await getDb()
    const u = (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0]
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (u.role === 'admin') return NextResponse.json({ error: 'Admin accounts cannot be changed here' }, { status: 400 })
    const set: Record<string, unknown> = {}
    if (b.status) set.status = b.status
    if (b.role) set.role = b.role
    if (typeof b.verified === 'boolean') set.emailVerifiedAt = b.verified ? new Date() : null
    if (Object.keys(set).length) await db.update(schema.users).set(set).where(eq(schema.users.id, id))
    if (b.signOutEverywhere) await signOutEverywhere(id)
    const action = b.status ? (b.status === 'disabled' ? 'user.disable' : 'user.enable') : b.role ? 'user.role' : typeof b.verified === 'boolean' ? (b.verified ? 'user.verify' : 'user.unverify') : b.signOutEverywhere ? 'user.signout-all' : 'user.update'
    await logAdminEvent({ id: s.userId, name: s.user.name }, action, { type: 'user', id, name: u.name }, { role: b.role })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    if (id === s.userId) return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    const db = await getDb()
    const u = (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0]
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (u.role === 'admin') return NextResponse.json({ error: 'Admin accounts cannot be removed here' }, { status: 400 })
    await db.delete(schema.apiTokens).where(eq(schema.apiTokens.userId, id))
    await db.delete(schema.users).where(eq(schema.users.id, id))
    await logAdminEvent({ id: s.userId, name: s.user.name }, 'user.remove', { type: 'user', id, name: u.name }, { notebookId: u.notebookId })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
