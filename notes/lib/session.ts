/*
  The current session on the server: who is signed in, which notebook they act
  in and their role. In open mode (no APP_PASSWORD) this is the Primary
  notebook's owner. Every scoped query goes through here.
*/
import { cache } from 'react'
import { cookies } from 'next/headers'
import { and, asc, eq } from 'drizzle-orm'
import { SESSION_COOKIE, authEnabled, readSessionToken, type SessionPayload } from './auth'
import { getDb, schema } from './db'
import { ensureReady } from './bootstrap'
import type { Notebook, User, UserRole } from './db/schema'
import { scopeForNotebook } from './ai/notebook-config'
import { currentAiScope, runWithAiScope, type AiScope } from './ai/scope'

export interface Session {
  userId: string
  /** the cookie payload, so routes that re-issue the cookie keep the same claims */
  payload?: SessionPayload
  notebookId: string
  role: UserRole
  /** Set while a platform admin has entered another notebook. */
  homeNotebookId?: string
  user: User
  notebook: Notebook
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export const DEFAULT_NOTEBOOK_ID = 'nb_default'

async function loadUser(id: string): Promise<User | undefined> {
  const db = await getDb()
  return (await db.select().from(schema.users).where(eq(schema.users.id, id)))[0]
}

export async function loadNotebook(id: string): Promise<Notebook | undefined> {
  const db = await getDb()
  return (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, id)))[0]
}

/** The platform owner: the admin user, else the oldest user. */
export async function ownerUser(): Promise<User | undefined> {
  const db = await getDb()
  const admin = (await db.select().from(schema.users).where(eq(schema.users.role, 'admin')).orderBy(asc(schema.users.createdAt)).limit(1))[0]
  if (admin) return admin
  return (await db.select().from(schema.users).orderBy(asc(schema.users.createdAt)).limit(1))[0]
}

/** Resolve the session for this request, or null when nobody is signed in. Cached per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  await ensureReady()
  if (!authEnabled()) {
    const user = await ownerUser()
    if (!user) return null
    const notebook = await loadNotebook(user.notebookId ?? DEFAULT_NOTEBOOK_ID)
    if (!notebook) return null
    return { userId: user.id, notebookId: notebook.id, role: user.role === 'admin' ? 'admin' : user.role, user, notebook }
  }
  const jar = await cookies()
  const payload = await readSessionToken(jar.get(SESSION_COOKIE)?.value)
  if (!payload) return null
  const user = await loadUser(payload.u)
  if (!user || user.status !== 'active') return null
  // "Sign out everywhere" and password resets bump the version; older cookies stop working.
  if ((payload.v ?? 0) !== (user.tokenVersion ?? 0)) return null
  const notebook = await loadNotebook(payload.n)
  if (!notebook) return null
  // A non-admin can only act inside their own notebook, and only while it is active.
  if (user.role !== 'admin' && (user.notebookId !== notebook.id || notebook.status !== 'active')) return null
  return { userId: user.id, payload, notebookId: notebook.id, role: user.role, homeNotebookId: payload.h, user, notebook }
})

/** The AI scope for the signed-in notebook (shared env keys when signed out or in a background job). */
export async function sessionAiScope(): Promise<AiScope> {
  try {
    const s = await getSession()
    return s ? scopeForNotebook(s.notebook, s.user.name) : { mode: 'shared' }
  } catch {
    return { mode: 'shared' }
  }
}

/**
  Run `fn` with the notebook's AI configuration in effect. AsyncLocalStorage
  only propagates to work started inside `run`, so request-time AI callers
  wrap their body in this rather than relying on getSession() as a side effect.
  An existing scope (e.g. background processing) is kept.
*/
export async function withNotebookAi<T>(fn: () => Promise<T>): Promise<T> {
  if (currentAiScope()) return fn()
  const scope = await sessionAiScope()
  return runWithAiScope(scope, fn)
}

export async function requireSession(): Promise<Session> {
  const s = await getSession()
  if (!s) throw new AuthError('Sign in required', 401)
  return s
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireSession()
  if (s.role !== 'admin') throw new AuthError('Admin only', 403)
  return s
}

/** Touch the notebook's last-active stamp at most once a minute per process. */
const touched = new Map<string, number>()
export async function touchNotebook(id: string) {
  const last = touched.get(id) ?? 0
  if (Date.now() - last < 60_000) return
  touched.set(id, Date.now())
  try {
    const db = await getDb()
    await db.update(schema.notebooks).set({ lastActiveAt: new Date() }).where(and(eq(schema.notebooks.id, id)))
  } catch {
    /* best effort */
  }
}
