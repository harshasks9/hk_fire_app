import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, authEnabled, createSessionToken, rateLimitLogin } from '@/lib/auth'
import { sessionCookieOptions } from '@/lib/api'
import { ensureReady } from '@/lib/bootstrap'
import { signUp, SignupError } from '@/lib/signup'
import { runSeed } from '@/lib/seed/run'
import { notebookAiScope } from '@/lib/ai/notebook-config'
import { runWithAiScope } from '@/lib/ai/scope'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function originOf(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  return host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : new URL(req.url).origin
}

/** Public registration: creates a notebook and its owner, signs them in and sends the verification email. */
export async function POST(req: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ error: 'This deployment runs in open mode; there is nothing to sign up for.' }, { status: 400 })
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const rl = rateLimitLogin(`signup:${ip}`)
  if (!rl.allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterS / 60)} min.` }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string; notebookName?: string; sampleData?: boolean }
  try {
    const r = await signUp({ name: b.name ?? '', email: b.email ?? '', password: b.password ?? '', notebookName: b.notebookName, sampleData: b.sampleData, origin: originOf(req) })
    if (r.notebook.settings.sampleData) {
      // The demo dataset takes a while (it is analyzed like real notes); it fills in behind the welcome screen.
      after(async () => {
        const scope = await notebookAiScope(r.notebook.id, r.user.name)
        await runWithAiScope(scope, () => runSeed({ notebookId: r.notebook.id })).catch((err) => console.error('[signup] sample data', err))
      })
    }
    const res = NextResponse.json({ ok: true, notebookId: r.notebook.id, verification: { required: r.verification.required, sent: r.verification.email.sent, link: r.verification.link ?? null } }, { status: 201 })
    // Signed in immediately unless the deployment insists on verification first.
    if (!r.verification.required) res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: r.user.id, n: r.notebook.id, r: 'owner', v: r.user.tokenVersion ?? 0 }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
    return res
  } catch (e) {
    if (e instanceof SignupError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('[signup]', e)
    return NextResponse.json({ error: 'Could not create the account. Please try again.' }, { status: 500 })
  }
}
