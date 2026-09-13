/* Personal capture tokens: `hkn_<random>`; only the SHA-256 hash is stored. */
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'
import { randomToken, sha256 } from './crypto'
import { uid } from './util'

export interface TokenItem { id: string; label: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }

export async function listTokens(notebookId: string): Promise<TokenItem[]> {
  const db = await getDb()
  const rows = await db.select().from(schema.apiTokens).where(eq(schema.apiTokens.notebookId, notebookId)).orderBy(desc(schema.apiTokens.createdAt))
  return rows.map((t) => ({ id: t.id, label: t.label, prefix: t.prefix, createdAt: t.createdAt.toISOString(), lastUsedAt: t.lastUsedAt?.toISOString() ?? null, revokedAt: t.revokedAt?.toISOString() ?? null }))
}

export async function createToken(input: { notebookId: string; userId: string; label: string }): Promise<{ item: TokenItem; secret: string }> {
  const db = await getDb()
  const secret = `hkn_${randomToken(24)}`
  const id = uid('tok')
  const prefix = secret.slice(0, 10)
  await db.insert(schema.apiTokens).values({ id, notebookId: input.notebookId, userId: input.userId, label: input.label.trim() || 'Capture token', tokenHash: sha256(secret), prefix })
  const row = (await db.select().from(schema.apiTokens).where(eq(schema.apiTokens.id, id)))[0]!
  return { item: { id: row.id, label: row.label, prefix: row.prefix, createdAt: row.createdAt.toISOString(), lastUsedAt: null, revokedAt: null }, secret }
}

export async function revokeToken(notebookId: string, id: string) {
  const db = await getDb()
  await db.update(schema.apiTokens).set({ revokedAt: new Date() }).where(and(eq(schema.apiTokens.id, id), eq(schema.apiTokens.notebookId, notebookId), isNull(schema.apiTokens.revokedAt)))
}

/** Validate a bearer secret. Returns the notebook and user it belongs to, or null. Disabled notebooks reject their tokens. */
export async function resolveToken(secret: string | null | undefined) {
  if (!secret || !secret.startsWith('hkn_')) return null
  const db = await getDb()
  const t = (await db.select().from(schema.apiTokens).where(and(eq(schema.apiTokens.tokenHash, sha256(secret)), isNull(schema.apiTokens.revokedAt))))[0]
  if (!t) return null
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, t.notebookId)))[0]
  if (!nb || nb.status !== 'active') return null
  await db.update(schema.apiTokens).set({ lastUsedAt: new Date() }).where(eq(schema.apiTokens.id, t.id))
  return { token: t, notebook: nb }
}
