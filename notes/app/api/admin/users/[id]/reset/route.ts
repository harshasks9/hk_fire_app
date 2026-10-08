import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { resetUserPassword } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    const temporaryPassword = await resetUserPassword(id, { id: s.userId, name: s.user.name })
    return NextResponse.json({ ok: true, temporaryPassword })
  } catch (e) {
    return apiError(e)
  }
}
