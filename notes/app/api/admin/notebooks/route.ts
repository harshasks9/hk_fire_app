import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { createNotebook, listNotebooksWithStats, platformTotals, recentAdminEvents } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  try {
    await requireAdmin()
    const [notebooks, totals, events] = await Promise.all([listNotebooksWithStats(), platformTotals(), recentAdminEvents(100)])
    return NextResponse.json({ notebooks, totals, events })
  } catch (e) {
    return apiError(e)
  }
}

/** Create a notebook for someone else. Returns the one-time password or invite link. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireAdmin()
    const b = (await req.json().catch(() => ({}))) as { name?: string; ownerName?: string; ownerEmail?: string; onboarding?: 'password' | 'invite'; sampleData?: boolean }
    const r = await createNotebook({ name: b.name ?? '', ownerName: b.ownerName ?? '', ownerEmail: b.ownerEmail ?? '', onboarding: b.onboarding === 'invite' ? 'invite' : 'password', sampleData: Boolean(b.sampleData), actor: { id: s.userId, name: s.user.name } })
    const origin = req.headers.get('x-forwarded-host') ? `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('x-forwarded-host')}` : new URL(req.url).origin
    return NextResponse.json({ ok: true, notebook: r.notebook, owner: r.owner, temporaryPassword: r.temporaryPassword, inviteUrl: r.inviteToken ? `${origin}/invite/${r.inviteToken}` : undefined, inviteExpiresAt: r.inviteExpiresAt }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
