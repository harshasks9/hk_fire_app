import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireSession } from '@/lib/session'
import { hashPassword, verifyPassword } from '@/lib/crypto'
import { checkPassword } from '@/lib/auth'
import { findUserByEmail, normalizeEmail } from '@/lib/notebooks'

/** The signed-in user's own account: name, email, password. */
export async function PATCH(req: NextRequest) {
  const s = await requireSession().catch(() => null)
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; currentPassword?: string; newPassword?: string }
  const db = await getDb()
  const set: Record<string, unknown> = {}
  if (typeof b.name === 'string' && b.name.trim()) set.name = b.name.trim()
  if (typeof b.email === 'string') {
    const email = normalizeEmail(b.email)
    if (email && email !== (s.user.email ?? '').toLowerCase()) {
      const other = await findUserByEmail(email)
      if (other && other.id !== s.userId) return NextResponse.json({ error: 'That email is already in use' }, { status: 400 })
    }
    set.email = email
  }
  if (b.newPassword) {
    if (b.newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    const current = b.currentPassword ?? ''
    const ok = s.user.passwordHash ? verifyPassword(current, s.user.passwordHash) : checkPassword(current) || !process.env.APP_PASSWORD
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    set.passwordHash = hashPassword(b.newPassword)
  }
  if (Object.keys(set).length) await db.update(schema.users).set(set).where(eq(schema.users.id, s.userId))
  return NextResponse.json({ ok: true })
}
