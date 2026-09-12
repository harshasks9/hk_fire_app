import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { createPortal } from '@/lib/billing'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can manage billing' }, { status: 403 })
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const origin = host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : new URL(req.url).origin
    return NextResponse.json({ url: await createPortal(s.notebookId, origin) })
  } catch (e) {
    return apiError(e)
  }
}
