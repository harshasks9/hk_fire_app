import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireSession, DEFAULT_NOTEBOOK_ID } from '@/lib/session'
import { apiError } from '@/lib/api'
import { SESSION_COOKIE, checkPassword } from '@/lib/auth'
import { verifyPassword } from '@/lib/crypto'
import { deleteNotebook, logAdminEvent } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
  Delete my account. The owner of a notebook takes the whole notebook with
  them (every note, member, token and link); a member leaves the notebook
  intact. The platform admin cannot delete their own account this way.
*/
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    const b = (await req.json().catch(() => ({}))) as { password?: string; confirm?: string }
    if (s.role === 'admin') return NextResponse.json({ error: 'The platform administrator account cannot be deleted from here' }, { status: 400 })
    if (s.homeNotebookId) return NextResponse.json({ error: 'Leave the notebook you entered as admin first' }, { status: 400 })
    const ok = s.user.passwordHash ? verifyPassword(b.password ?? '', s.user.passwordHash) : checkPassword(b.password ?? '')
    if (!ok) return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    if ((b.confirm ?? '').trim().toUpperCase() !== 'DELETE') return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 })
    const db = await getDb()
    const actor = { id: s.userId, name: s.user.name }
    const isOwner = s.notebook.ownerUserId === s.userId || s.role === 'owner'
    if (isOwner && s.notebookId !== DEFAULT_NOTEBOOK_ID) {
      await deleteNotebook(s.notebookId, actor)
    } else {
      await db.delete(schema.apiTokens).where(eq(schema.apiTokens.userId, s.userId))
      await db.delete(schema.authTokens).where(eq(schema.authTokens.userId, s.userId))
      await db.delete(schema.users).where(eq(schema.users.id, s.userId))
      await logAdminEvent(actor, 'user.delete-self', { type: 'user', id: s.userId, name: s.user.name }, { notebookId: s.notebookId })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  } catch (e) {
    return apiError(e)
  }
}
