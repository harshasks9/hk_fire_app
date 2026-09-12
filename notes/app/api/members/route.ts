import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { inviteMember, listMembers } from '@/lib/members'
import { PLANS, effectivePlan } from '@/lib/plans'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const s = await requireSession()
    const r = await listMembers(s.notebookId)
    return NextResponse.json({ ...r, limit: PLANS[effectivePlan(s.notebook)].members, canManage: s.role !== 'member' })
  } catch (e) {
    return apiError(e)
  }
}

/** Owner: invite someone by email (sent when email is configured) or as a link. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can invite people' }, { status: 403 })
    const b = (await req.json().catch(() => ({}))) as { email?: string; role?: 'member' | 'owner' }
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const origin = host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : undefined
    const r = await inviteMember(s.notebook, { email: b.email, role: b.role === 'owner' ? 'owner' : 'member', actor: { id: s.userId, name: s.user.name }, origin })
    return NextResponse.json({ ok: true, inviteUrl: r.inviteUrl, expiresAt: r.expiresAt, emailed: r.emailed }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
