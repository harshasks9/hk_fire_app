/*
  Authentication primitives shared by the edge middleware and server code.
  Sessions are signed cookies carrying the user, the notebook they act in and
  their role. If APP_PASSWORD is unset the app runs open (demo mode) as the
  Primary notebook's owner. Web Crypto only, so this also runs at the edge.
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

export interface SessionPayload {
  /** user id */
  u: string
  /** notebook id the session is acting in */
  n: string
  /** role: admin (platform), owner or member */
  r: 'admin' | 'owner' | 'member'
  /** the admin's home notebook when they have entered another one */
  h?: string
  exp: number
}

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s: string): string | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/** Signed session: base64url(JSON payload).hmac. Verified in the edge middleware and read in server code. */
export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>, now = Date.now()): Promise<string> {
  const body = b64url(JSON.stringify({ ...payload, exp: now + SESSION_DAYS * 86400 * 1000 }))
  return `${body}.${await hmacHex(secret(), body)}`
}

export async function readSessionToken(token: string | undefined, now = Date.now()): Promise<SessionPayload | null> {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  if (!constantTimeEqual(mac, await hmacHex(secret(), body))) return null
  const json = fromB64url(body)
  if (!json) return null
  try {
    const p = JSON.parse(json) as SessionPayload
    if (typeof p.exp !== 'number' || p.exp < now || typeof p.u !== 'string' || typeof p.n !== 'string') return null
    return p
  } catch {
    return null
  }
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  return (await readSessionToken(token, now)) !== null
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
