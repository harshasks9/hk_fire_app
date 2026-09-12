import { cookies } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { ensureReady } from './bootstrap'
import { getSession } from './session'
import type { Context } from './db/schema'

export const CONTEXT_COOKIE = 'hkn_ctx'

/** Contexts of the signed-in notebook only. Signed out (with auth on) → none. */
export async function getContexts(): Promise<Context[]> {
  await ensureReady()
  const s = await getSession()
  if (!s) return []
  const db = await getDb()
  return db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, s.notebookId)).orderBy(asc(schema.contexts.position))
}

/** Every context in the system, for background jobs that run across notebooks (cron). */
export async function allContexts(): Promise<Context[]> {
  await ensureReady()
  const db = await getDb()
  return db.select().from(schema.contexts).orderBy(asc(schema.contexts.notebookId), asc(schema.contexts.position))
}

export async function getActiveContext(): Promise<Context> {
  const all = await getContexts()
  if (all.length === 0) throw Object.assign(new Error('Sign in required'), { status: 401 })
  const jar = await cookies()
  const slug = jar.get(CONTEXT_COOKIE)?.value
  return all.find((c) => c.slug === slug) ?? all.find((c) => c.slug === 'work') ?? all[0]!
}

/** The active context, unless the caller names one explicitly (offline replays carry the context they were written in). Foreign contexts are ignored. */
export async function resolveContext(explicitId?: string | null): Promise<Context> {
  if (explicitId) {
    const all = await getContexts()
    const c = all.find((x) => x.id === explicitId)
    if (c) return c
  }
  return getActiveContext()
}

export async function getContextById(id: string): Promise<Context | undefined> {
  const db = await getDb()
  return (await db.select().from(schema.contexts).where(eq(schema.contexts.id, id)))[0]
}
