import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { createToken, listTokens } from '@/lib/tokens'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const s = await requireSession()
    return NextResponse.json({ tokens: await listTokens(s.notebookId) })
  } catch (e) {
    return apiError(e)
  }
}

/** Create a capture token; the secret is returned exactly once. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    const b = (await req.json().catch(() => ({}))) as { label?: string }
    const r = await createToken({ notebookId: s.notebookId, userId: s.userId, label: b.label ?? '' })
    return NextResponse.json({ ok: true, token: r.item, secret: r.secret }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
