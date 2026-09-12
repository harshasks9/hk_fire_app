/*
  Authentication. Single-owner product: a password gate with a signed cookie.
  If APP_PASSWORD is unset the app runs open (demo mode) and says so in Settings.
  Web Crypto only, so verification also runs in edge middleware.
*/
export const SESSION_COOKIE = 'hkn_session'
export const SESSION_DAYS = 30

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD)
}

function secret(): string {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || 'hk-notes-dev-secret'
}

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  let diff = ab.length ^ bb.length
  const n = Math.max(ab.length, bb.length)
  for (let i = 0; i < n; i++) diff |= (ab[i % ab.length] ?? 0) ^ (bb[i % bb.length] ?? 0)
  return diff === 0
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expiry = String(now + SESSION_DAYS * 86400 * 1000)
  return `${expiry}.${await hmacHex(secret(), expiry)}`
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiry = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  if (!/^\d+$/.test(expiry) || Number(expiry) < now) return false
  return constantTimeEqual(mac, await hmacHex(secret(), expiry))
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected) return false
  return constantTimeEqual(candidate, expected)
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8
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
