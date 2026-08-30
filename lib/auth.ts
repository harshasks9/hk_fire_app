/*
  Single-user auth. No signup, no reset, no user table.

  Session cookie: "<expiryMs>.<hmac>" where hmac = HMAC-SHA256(SESSION_SECRET,
  expiryMs). Web Crypto only, so verification runs in edge middleware too.
*/

export const SESSION_COOKIE = 'fd_session'
export const SESSION_DAYS = 30

function secretKey(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set')
  return s
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time string comparison (both hex/ascii). */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Length leak is fine for MACs; still fold it into the result.
  let diff = ab.length ^ bb.length
  const n = Math.max(ab.length, bb.length)
  for (let i = 0; i < n; i++) diff |= (ab[i % ab.length] ?? 0) ^ (bb[i % bb.length] ?? 0)
  return diff === 0
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expiry = String(now + SESSION_DAYS * 24 * 3600 * 1000)
  return `${expiry}.${await hmacHex(secretKey(), expiry)}`
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiry = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  if (!/^\d+$/.test(expiry) || Number(expiry) < now) return false
  const expected = await hmacHex(secretKey(), expiry)
  return constantTimeEqual(mac, expected)
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected) return false
  return constantTimeEqual(candidate, expected)
}

/* Login rate limit: 5 attempts per 15 minutes per IP. In-memory — adequate
   for a single-user app; a cold serverless start resets the window, which
   fails open rather than locking the owner out. */
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const attempts = new Map<string, number[]>()

export function rateLimitLogin(ip: string, now = Date.now()): { allowed: boolean; retryAfterS: number } {
  const cutoff = now - WINDOW_MS
  const list = (attempts.get(ip) ?? []).filter((t) => t > cutoff)
  if (list.length >= MAX_ATTEMPTS) {
    attempts.set(ip, list)
    return { allowed: false, retryAfterS: Math.ceil((list[0]! + WINDOW_MS - now) / 1000) }
  }
  list.push(now)
  attempts.set(ip, list)
  return { allowed: true, retryAfterS: 0 }
}
