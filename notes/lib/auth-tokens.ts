/*
  Email verification and password-reset tokens: random, single use, expiring;
  only the SHA-256 hash is stored. Issuing a new token of a kind invalidates
  the previous ones for that user.
*/
import { and, eq, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import { randomToken, sha256 } from './crypto'
import { uid } from './util'
import type { AuthTokenKind, User } from './db/schema'

export const TOKEN_TTL: Record<AuthTokenKind, number> = { verify: 24 * 3600 * 1000, reset: 3600 * 1000 }

export async function issueAuthToken(userId: string, kind: AuthTokenKind, now = new Date()): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb()
  await db.update(schema.authTokens).set({ usedAt: now }).where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt)))
  const token = randomToken(32)
  const expiresAt = new Date(now.getTime() + TOKEN_TTL[kind])
  await db.insert(schema.authTokens).values({ id: uid('tok'), userId, kind, tokenHash: sha256(token), expiresAt })
  return { token, expiresAt }
}

/** Look a token up without consuming it (for rendering the reset form). */
export async function peekAuthToken(token: string, kind: AuthTokenKind, now = new Date()): Promise<{ user: User; id: string } | null> {
  if (!token || token.length > 200) return null
  const db = await getDb()
  const row = (await db.select().from(schema.authTokens).where(eq(schema.authTokens.tokenHash, sha256(token))))[0]
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt.getTime() < now.getTime()) return null
  const user = (await db.select().from(schema.users).where(eq(schema.users.id, row.userId)))[0]
  return user ? { user, id: row.id } : null
}

/** Consume a token: returns its user, or null when it is unknown, used or expired. */
export async function consumeAuthToken(token: string, kind: AuthTokenKind, now = new Date()): Promise<User | null> {
  const found = await peekAuthToken(token, kind, now)
  if (!found) return null
  const db = await getDb()
  const updated = await db.update(schema.authTokens).set({ usedAt: now }).where(and(eq(schema.authTokens.id, found.id), isNull(schema.authTokens.usedAt))).returning({ id: schema.authTokens.id })
  return updated.length ? found.user : null
}
