import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { revokeInvite } from '@/lib/members'
export const dynamic = 'force-dynamic'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can revoke invitations' }, { status: 403 })
    const { id } = await params
    await revokeInvite(s.notebookId, id, { id: s.userId, name: s.user.name })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
