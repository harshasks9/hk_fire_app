import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { changeMemberRole, removeMember } from '@/lib/members'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change roles' }, { status: 403 })
    const { id } = await params
    const b = (await req.json().catch(() => ({}))) as { role?: 'member' | 'owner' }
    if (b.role !== 'member' && b.role !== 'owner') return NextResponse.json({ error: 'role must be member or owner' }, { status: 400 })
    await changeMemberRole(s.notebook, id, b.role, { id: s.userId, name: s.user.name })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can remove people' }, { status: 403 })
    const { id } = await params
    if (id === s.userId) return NextResponse.json({ error: 'You cannot remove yourself. Delete the account from Settings → Account instead.' }, { status: 400 })
    await removeMember(s.notebook, id, { id: s.userId, name: s.user.name })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
