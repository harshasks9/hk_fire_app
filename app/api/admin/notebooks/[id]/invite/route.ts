import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, loadNotebook } from '@/lib/session'
import { apiError } from '@/lib/api'
import { createInvite, logAdminEvent } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    const nb = await loadNotebook(id)
    if (!nb) return NextResponse.json({ error: 'Notebook not found' }, { status: 404 })
    const b = (await req.json().catch(() => ({}))) as { email?: string; role?: 'owner' | 'member' }
    const inv = await createInvite({ notebookId: id, email: b.email, role: b.role === 'owner' ? 'owner' : 'member', createdBy: s.userId })
    await logAdminEvent({ id: s.userId, name: s.user.name }, 'invite.create', { type: 'notebook', id, name: nb.name }, { email: b.email ?? null, role: b.role ?? 'member' })
    const origin = req.headers.get('x-forwarded-host') ? `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('x-forwarded-host')}` : new URL(req.url).origin
    return NextResponse.json({ ok: true, inviteUrl: `${origin}/invite/${inv.token}`, expiresAt: inv.expiresAt }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
