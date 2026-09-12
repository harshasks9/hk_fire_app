import { cookies } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { ensureReady } from './bootstrap'
import type { Context } from './db/schema'

export const CONTEXT_COOKIE = 'hkn_ctx'

export async function getContexts(): Promise<Context[]> {
  await ensureReady()
  const db = await getDb()
  return db.select().from(schema.contexts).orderBy(asc(schema.contexts.position))
}

export async function getActiveContext(): Promise<Context> {
  const all = await getContexts()
  const jar = await cookies()
  const slug = jar.get(CONTEXT_COOKIE)?.value
  return all.find((c) => c.slug === slug) ?? all.find((c) => c.slug === 'work') ?? all[0]!
}

/** The active context, unless the caller names one explicitly (offline replays carry the context they were written in). */
export async function resolveContext(explicitId?: string | null): Promise<Context> {
  if (explicitId) {
    const c = await getContextById(explicitId)
    if (c) return c
  }
  return getActiveContext()
}

export async function getContextById(id: string): Promise<Context | undefined> {
  const db = await getDb()
  return (await db.select().from(schema.contexts).where(eq(schema.contexts.id, id)))[0]
}
