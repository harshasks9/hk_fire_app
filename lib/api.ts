/* Small helpers for route handlers: consistent error responses for auth failures. */
import { NextResponse } from 'next/server'
import { AuthError } from './session'
import { assertOwned } from './tenant'

export function apiError(e: unknown): NextResponse {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
  const status = (e as { status?: number }).status
  if (typeof status === 'number' && status >= 400 && status < 600) return NextResponse.json({ error: String((e as Error).message ?? e) }, { status })
  console.error('[api]', e)
  return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 })
}

export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' }
}

/** For mutation routes: a 404 response when the row is not in the session's notebook, else null. */
export async function guardOwned(kind: Parameters<typeof assertOwned>[0], id: string): Promise<NextResponse | null> {
  try {
    await assertOwned(kind, id)
    return null
  } catch (e) {
    return apiError(e)
  }
}
