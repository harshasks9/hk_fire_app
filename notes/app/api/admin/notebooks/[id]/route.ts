import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { deleteNotebook, renameNotebook, setNotebookStatus, setNotebookPlan, logAdminEvent } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    const b = (await req.json().catch(() => ({}))) as { status?: 'active' | 'disabled'; name?: string; plan?: string; planExpiresAt?: string | null }
    if (b.status) await setNotebookStatus(id, b.status, { id: s.userId, name: s.user.name })
    if (b.plan !== undefined) await setNotebookPlan(id, b.plan, b.planExpiresAt === undefined ? undefined : b.planExpiresAt ? new Date(b.planExpiresAt) : null, { id: s.userId, name: s.user.name })
    if (b.name && b.name.trim()) { await renameNotebook(id, b.name); await logAdminEvent({ id: s.userId, name: s.user.name }, 'notebook.rename', { type: 'notebook', id, name: b.name.trim() }) }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    if (id === s.notebookId || id === s.homeNotebookId) return NextResponse.json({ error: 'You cannot delete the notebook you are in' }, { status: 400 })
    await deleteNotebook(id, { id: s.userId, name: s.user.name })
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
