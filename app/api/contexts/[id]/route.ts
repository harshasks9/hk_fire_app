import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { requireSession } from '@/lib/session'
import { CONTEXT_COOKIE } from '@/lib/context'
import { deleteContext, updateContext } from '@/lib/contexts-admin'
import type { ContextKind } from '@/lib/db/schema'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change contexts' }, { status: 403 })
    const b = (await req.json()) as { name?: string; description?: string | null; kind?: ContextKind; position?: number }
    return NextResponse.json({ context: await updateContext(s.notebookId, id, b) })
  } catch (e) {
    return apiError(e)
  }
}

/** DELETE /api/contexts/:id?moveTo=<contextId> moves the contents first; without it everything in the context is removed. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change contexts' }, { status: 403 })
    const r = await deleteContext(s.notebookId, id, { moveTo: req.nextUrl.searchParams.get('moveTo') })
    const res = NextResponse.json(r)
    // The active-context cookie may now point at nothing; the app falls back to the first context.
    res.cookies.set(CONTEXT_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  } catch (e) {
    return apiError(e)
  }
}
