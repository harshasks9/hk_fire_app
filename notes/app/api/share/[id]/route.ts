import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { revokeShareLink } from '@/lib/share'
export const dynamic = 'force-dynamic'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    const { id } = await params
    await revokeShareLink(s.notebookId, id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
