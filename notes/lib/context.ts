import { cache } from 'react'
import { cookies } from 'next/headers'
import { asc, eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { ensureReady } from './bootstrap'
import { getSession } from './session'
import type { Context } from './db/schema'

export const CONTEXT_COOKIE = 'hkn_ctx'
/** The real context to write into while the "All" view is selected. */
export const LAST_CONTEXT_COOKIE = 'hkn_ctx_last'
export const ALL_SLUG = 'all'

/** Contexts of the signed-in notebook only. Signed out (with auth on) → none. */
export const getContexts = cache(async (): Promise<Context[]> => {
  await ensureReady()
  const s = await getSession()
  if (!s) return []
  const db = await getDb()
  return db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, s.notebookId)).orderBy(asc(schema.contexts.position))
})

/** Every context in the system, for background jobs that run across notebooks (cron). */
export async function allContexts(): Promise<Context[]> {
  await ensureReady()
  const db = await getDb()
  return db.select().from(schema.contexts).orderBy(asc(schema.contexts.notebookId), asc(schema.contexts.position))
}

/**
 * The context new things are written into. While "All" is selected this is the
 * context that was active before switching (remembered in a second cookie).
 */
export const getActiveContext = cache(async (): Promise<Context> => {
  const all = await getContexts()
  if (all.length === 0) throw Object.assign(new Error('Sign in required'), { status: 401 })
  const jar = await cookies()
  let slug = jar.get(CONTEXT_COOKIE)?.value
  if (slug === ALL_SLUG) slug = jar.get(LAST_CONTEXT_COOKIE)?.value
  return all.find((c) => c.slug === slug) ?? all.find((c) => c.slug === 'work') ?? all[0]!
})

export interface Scope {
  /** Context ids to read from: every context when "All" is selected, otherwise just the active one. */
  ids: string[]
  all: boolean
  /** "All" or the context name, for page subtitles. */
  label: string
  /** Where writes go. */
  active: Context
  contexts: Context[]
  /** Context name by id, for the badge lists show while viewing All. */
  nameOf: (id: string) => string | undefined
}

/** What list pages should show: one context, or everything in the notebook when "All" is selected. */
export const getActiveScope = cache(async (): Promise<Scope> => {
  const [contexts, active] = await Promise.all([getContexts(), getActiveContext()])
  const jar = await cookies()
  const all = jar.get(CONTEXT_COOKIE)?.value === ALL_SLUG && contexts.length > 0
  const names = new Map(contexts.map((c) => [c.id, c.name]))
  return { ids: all ? contexts.map((c) => c.id) : [active.id], all, label: all ? 'All' : active.name, active, contexts, nameOf: (id) => names.get(id) }
})

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
