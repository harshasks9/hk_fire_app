/**
 * The shared-key gate, run by Vercel's routing middleware in front of every request.
 *
 * One passphrase in front of every page. A correct POST sets a cookie carrying a
 * hash of the key, so the key itself never sits in the browser; every later request
 * passes on the cookie alone. /logout clears it.
 *
 * `gate` is a pure function over the Fetch API — it returns a Response when it wants
 * to intercept the request and undefined when the request may proceed — so it is
 * unit-tested in Node and reused by serve.ts for local preview. Everything lives in
 * this one file because Vercel compiles the middleware entrypoint on its own and
 * cannot follow a relative import to another .ts file.
 *
 * It keeps casual eyes off the memos. It is not real security: anyone the key is
 * shared with can share it on, and the pages are served in full once past the gate.
 */
import { next } from '@vercel/functions'

export const config = { matcher: '/(.*)', runtime: 'nodejs' }

export default async function middleware(req: Request): Promise<Response> {
  return (await gate(req)) ?? next()
}

export const DEFAULT_KEY = '888888'
export const COOKIE = 'hkr_access'
const COOKIE_DAYS = 30
/** Bound to the site so the same key used elsewhere does not produce the same cookie. */
const SALT = 'hk-fire-research-v1'

export function configuredKey(): string {
  const fromEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ACCESS_KEY
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : DEFAULT_KEY
}

/** SHA-256 of salt + key, hex. This is what the cookie carries. */
export async function tokenFor(key: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${SALT}:${key}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

/** Constant-time string equality — both inputs are fixed-length hex digests. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Only ever redirect within the site. */
function safePath(p: string): string {
  return p.startsWith('/') && !p.startsWith('//') ? p : '/'
}

export async function gate(req: Request, key: string = configuredKey()): Promise<Response | undefined> {
  const url = new URL(req.url)
  const cookieBase = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax`

  if (url.pathname === '/logout') {
    return new Response(null, {
      status: 303,
      headers: { Location: '/', 'Set-Cookie': `${cookieBase}; Max-Age=0` },
    })
  }

  const expected = await tokenFor(key)
  const presented = parseCookies(req.headers.get('cookie'))[COOKIE]
  if (presented && same(presented, expected)) return undefined

  if (req.method === 'POST') {
    let submitted = ''
    try {
      const form = await req.formData()
      submitted = String(form.get('key') ?? '').trim()
    } catch {
      submitted = ''
    }
    if (submitted && same(await tokenFor(submitted), expected)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: safePath(url.pathname),
          'Set-Cookie': `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_DAYS * 86400}`,
        },
      })
    }
    return gatePage(true)
  }

  return gatePage(false)
}

export function gatePage(wrongKey: boolean): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>HK Fire — research</title>
<style>
  :root { color-scheme: light dark; --ink: #0b0b0b; --ink3: #6e6d68; --line: #e3e2dd; --bg: #f6f6f4; --surface: #fff; --accent: #2a78d6; --crit: #d03b3b; }
  @media (prefers-color-scheme: dark) { :root { --ink: #fff; --ink3: #a09f95; --line: #34342f; --bg: #121211; --surface: #1a1a19; --accent: #3987e5; --crit: #e66767; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--ink);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; padding: 16px; }
  form { width: 100%; max-width: 360px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 28px; }
  h1 { font-size: 16px; margin: 0 0 4px; letter-spacing: -0.01em; }
  p { margin: 0 0 18px; color: var(--ink3); font-size: 13px; }
  label { display: block; font-size: 12px; color: var(--ink3); margin-bottom: 6px; }
  input { width: 100%; font: inherit; font-variant-numeric: tabular-nums; letter-spacing: 0.2em; padding: 10px 12px;
          border: 1px solid var(--line); border-radius: 8px; background: transparent; color: var(--ink); }
  input:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
  button { margin-top: 14px; width: 100%; font: inherit; font-weight: 600; padding: 10px; border: 0; border-radius: 8px;
           background: var(--accent); color: #fff; cursor: pointer; }
  .err { color: var(--crit); font-size: 13px; margin: 10px 0 0; }
</style>
</head>
<body>
<form method="post" autocomplete="off">
  <h1>HK Fire — forensic memoranda</h1>
  <p>Private research. Enter the access key to continue.</p>
  <label for="key">Access key</label>
  <input id="key" name="key" type="password" inputmode="numeric" autofocus required>
  <button type="submit">Open</button>
  ${wrongKey ? '<p class="err" role="alert">That key is not right.</p>' : ''}
</form>
</body>
</html>`
  return new Response(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
