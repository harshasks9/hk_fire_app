/*
  Passwords, secrets and tokens (Node runtime only; the edge middleware uses lib/auth.ts).
  - Passwords: scrypt (N=16384, r=8, p=1), 16-byte salt, 32-byte key. Format: scrypt$<saltB64>$<hashB64>
  - Secrets at rest (API keys): AES-256-GCM with a key derived from SESSION_SECRET. Format: v1.<base64url(iv|tag|ciphertext)>
  - Opaque tokens: 32 random bytes, base64url; only the SHA-256 hash is stored.
*/
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 }

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize('NFKC'), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const [algo, saltB64, hashB64] = stored.split('$')
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

/** A memorable-enough temporary password: 3 words + 2 digits, from a small unambiguous alphabet. */
export function temporaryPassword(): string {
  const words = ['amber', 'birch', 'cedar', 'delta', 'ember', 'fjord', 'grove', 'harbor', 'ivory', 'juniper', 'kestrel', 'lumen', 'maple', 'nova', 'orchid', 'pine', 'quartz', 'river', 'summit', 'tundra', 'umber', 'violet', 'willow', 'zephyr']
  const pick = () => words[randomBytes(1)[0]! % words.length]!
  const n = (randomBytes(1)[0]! % 90) + 10
  return `${pick()}-${pick()}-${pick()}-${n}`
}

function secretKey(): Buffer {
  const material = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || process.env.APP_PASSWORD || 'hk-notes-dev-secret'
  return createHash('sha256').update(`hkn-secret:${material}`).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return 'v1.' + Buffer.concat([iv, tag, ct]).toString('base64url')
}

export function decryptSecret(enc: string | null | undefined): string | null {
  if (!enc || !enc.startsWith('v1.')) return null
  try {
    const buf = Buffer.from(enc.slice(3), 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const ct = buf.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/** Last four characters for display, never the secret itself. */
export function maskSecret(plain: string | null): string | null {
  if (!plain) return null
  return `••••${plain.slice(-4)}`
}
