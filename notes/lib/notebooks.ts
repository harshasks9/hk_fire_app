/*
  Notebook lifecycle for the admin console: create, invite, accept, reset
  passwords, enable/disable, delete, and the usage figures the console shows.
  Every administrative action is written to admin_events.
*/
import { and, asc, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { uid, slugify } from './util'
import { hashPassword, randomToken, sha256, temporaryPassword } from './crypto'
import { ensureDefaultContexts, runSeed, wipeNotebookData, DEFAULT_NOTEBOOK } from './seed/run'
import type { Notebook, User, UserRole } from './db/schema'

export const INVITE_DAYS = 7

export async function logAdminEvent(actor: { id: string; name: string } | null, action: string, target?: { type: string; id: string; name?: string }, meta: Record<string, unknown> = {}) {
  const db = await getDb()
  await db.insert(schema.adminEvents).values({ id: uid('evt'), actorUserId: actor?.id, actorName: actor?.name, action, targetType: target?.type, targetId: target?.id, targetName: target?.name, meta })
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase()
  return e ? e : null
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb()
  return (await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${email.toLowerCase()}`))[0]
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb()
  const root = slugify(base) || 'notebook'
  let slug = root
  for (let i = 2; i < 1000; i++) {
    const exists = (await db.select({ id: schema.notebooks.id }).from(schema.notebooks).where(eq(schema.notebooks.slug, slug)))[0]
    if (!exists) return slug
    slug = `${root}-${i}`
  }
  return `${root}-${Date.now().toString(36)}`
}

export interface CreateNotebookInput {
  name: string
  ownerName: string
  ownerEmail: string
  /** 'password' → a temporary password is generated; 'invite' → an invite link is generated instead. */
  onboarding: 'password' | 'invite'
  sampleData?: boolean
  actor: { id: string; name: string }
}

export interface CreateNotebookResult { notebook: Notebook; owner: User | null; temporaryPassword?: string; inviteToken?: string; inviteExpiresAt?: Date }

export async function createNotebook(input: CreateNotebookInput): Promise<CreateNotebookResult> {
  const db = await getDb()
  const email = normalizeEmail(input.ownerEmail)
  if (!input.name.trim()) throw new Error('Notebook name is required')
  if (!email) throw new Error('Owner email is required')
  if (await findUserByEmail(email)) throw new Error('A user with that email already exists')
  const id = uid('nb')
  const slug = await uniqueSlug(input.name)
  await db.insert(schema.notebooks).values({ id, slug, name: input.name.trim(), settings: { aiMode: 'shared', allowShareLinks: true, sampleData: Boolean(input.sampleData) } })
  let owner: User | null = null
  let temporaryPassword: string | undefined
  let inviteToken: string | undefined
  let inviteExpiresAt: Date | undefined
  if (input.onboarding === 'password') {
    temporaryPassword = temporaryPasswordForNew()
    const userId = uid('user')
    await db.insert(schema.users).values({ id: userId, name: input.ownerName.trim() || email, email, notebookId: id, role: 'owner', passwordHash: hashPassword(temporaryPassword), settings: { theme: 'system', aiProvider: 'auto', aiEnabled: true, proactiveInsights: true, dailyBriefHour: 7, defaultContext: 'work' } })
    owner = (await db.select().from(schema.users).where(eq(schema.users.id, userId)))[0] ?? null
    await db.update(schema.notebooks).set({ ownerUserId: userId }).where(eq(schema.notebooks.id, id))
  } else {
    const inv = await createInvite({ notebookId: id, email, role: 'owner', name: input.ownerName, createdBy: input.actor.id })
    inviteToken = inv.token
    inviteExpiresAt = inv.expiresAt
  }
  await ensureDefaultContexts(id)
  if (input.sampleData) await runSeed({ notebookId: id })
  await logAdminEvent(input.actor, 'notebook.create', { type: 'notebook', id, name: input.name.trim() }, { ownerEmail: email, onboarding: input.onboarding, sampleData: Boolean(input.sampleData) })
  const notebook = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, id)))[0]!
  return { notebook, owner, temporaryPassword, inviteToken, inviteExpiresAt }
}

function temporaryPasswordForNew() {
  return temporaryPassword()
}

export async function createInvite(input: { notebookId: string; email?: string | null; role: UserRole; name?: string; createdBy: string }): Promise<{ id: string; token: string; expiresAt: Date }> {
  const db = await getDb()
  const token = randomToken(32)
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86400 * 1000)
  const id = uid('inv')
  await db.insert(schema.invites).values({ id, notebookId: input.notebookId, email: normalizeEmail(input.email), role: input.role === 'admin' ? 'member' : input.role, tokenHash: sha256(token), createdBy: input.createdBy, expiresAt })
  return { id, token, expiresAt }
}

export async function inviteByToken(token: string) {
  const db = await getDb()
  const inv = (await db.select().from(schema.invites).where(eq(schema.invites.tokenHash, sha256(token))))[0]
  if (!inv) return null
  const notebook = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, inv.notebookId)))[0]
  if (!notebook) return null
  const valid = !inv.acceptedAt && inv.expiresAt.getTime() > Date.now() && notebook.status === 'active'
  return { invite: inv, notebook, valid }
}

/** Accept an invite: creates the user (owner or member) and returns them signed-in-ready. */
export async function acceptInvite(token: string, input: { name: string; email?: string; password: string }): Promise<User> {
  const db = await getDb()
  const found = await inviteByToken(token)
  if (!found || !found.valid) throw new Error('This invite link is no longer valid')
  const email = normalizeEmail(input.email ?? found.invite.email)
  if (!email) throw new Error('An email address is required')
  if (input.password.length < 8) throw new Error('Password must be at least 8 characters')
  if (await findUserByEmail(email)) throw new Error('A user with that email already exists. Sign in instead.')
  const userId = uid('user')
  await db.insert(schema.users).values({ id: userId, name: input.name.trim() || email, email, notebookId: found.notebook.id, role: found.invite.role, passwordHash: hashPassword(input.password), lastLoginAt: new Date(), settings: { theme: 'system', aiProvider: 'auto', aiEnabled: true, proactiveInsights: true, dailyBriefHour: 7, defaultContext: 'work' } })
  await db.update(schema.invites).set({ acceptedAt: new Date(), acceptedUserId: userId }).where(eq(schema.invites.id, found.invite.id))
  if (found.invite.role === 'owner' && !found.notebook.ownerUserId) await db.update(schema.notebooks).set({ ownerUserId: userId }).where(eq(schema.notebooks.id, found.notebook.id))
  await logAdminEvent({ id: userId, name: input.name }, 'invite.accept', { type: 'notebook', id: found.notebook.id, name: found.notebook.name }, { email, role: found.invite.role })
  return (await db.select().from(schema.users).where(eq(schema.users.id, userId)))[0]!
}

export async function resetUserPassword(userId: string, actor: { id: string; name: string }): Promise<string> {
  const db = await getDb()
  const u = (await db.select().from(schema.users).where(eq(schema.users.id, userId)))[0]
  if (!u) throw new Error('User not found')
  const pw = temporaryPassword()
  await db.update(schema.users).set({ passwordHash: hashPassword(pw) }).where(eq(schema.users.id, userId))
  await logAdminEvent(actor, 'user.reset-password', { type: 'user', id: userId, name: u.name })
  return pw
}

export async function setNotebookStatus(notebookId: string, status: 'active' | 'disabled', actor: { id: string; name: string }) {
  const db = await getDb()
  if (notebookId === DEFAULT_NOTEBOOK.id && status === 'disabled') throw new Error('The Primary notebook cannot be disabled')
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  if (!nb) throw new Error('Notebook not found')
  await db.update(schema.notebooks).set({ status, updatedAt: new Date() }).where(eq(schema.notebooks.id, notebookId))
  await logAdminEvent(actor, status === 'disabled' ? 'notebook.disable' : 'notebook.enable', { type: 'notebook', id: notebookId, name: nb.name })
}

export async function deleteNotebook(notebookId: string, actor: { id: string; name: string }) {
  const db = await getDb()
  if (notebookId === DEFAULT_NOTEBOOK.id) throw new Error('The Primary notebook cannot be deleted')
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  if (!nb) throw new Error('Notebook not found')
  await wipeNotebookData(notebookId)
  await db.delete(schema.apiTokens).where(eq(schema.apiTokens.notebookId, notebookId))
  await db.delete(schema.invites).where(eq(schema.invites.notebookId, notebookId))
  await db.delete(schema.templates).where(eq(schema.templates.notebookId, notebookId))
  await db.delete(schema.shareLinks).where(eq(schema.shareLinks.notebookId, notebookId))
  await db.delete(schema.users).where(and(eq(schema.users.notebookId, notebookId), sql`${schema.users.role} <> 'admin'`))
  await db.delete(schema.notebooks).where(eq(schema.notebooks.id, notebookId))
  await logAdminEvent(actor, 'notebook.delete', { type: 'notebook', id: notebookId, name: nb.name })
}

export async function renameNotebook(notebookId: string, name: string) {
  const db = await getDb()
  await db.update(schema.notebooks).set({ name: name.trim(), updatedAt: new Date() }).where(eq(schema.notebooks.id, notebookId))
}

export interface NotebookRow {
  notebook: Notebook
  owner: { id: string; name: string; email: string | null } | null
  members: { id: string; name: string; email: string | null; role: UserRole; status: string; lastLoginAt: Date | null }[]
  pendingInvites: number
  notes: number
  aiCalls7d: number
  aiFailed7d: number
}

export async function listNotebooksWithStats(): Promise<NotebookRow[]> {
  const db = await getDb()
  const nbs = await db.select().from(schema.notebooks).orderBy(asc(schema.notebooks.createdAt))
  const users = await db.select().from(schema.users).orderBy(asc(schema.users.createdAt))
  const ctxRows = await db.select({ id: schema.contexts.id, nb: schema.contexts.notebookId }).from(schema.contexts)
  const noteCounts = await db.select({ ctx: schema.notes.contextId, n: sql<number>`count(*)` }).from(schema.notes).where(isNull(schema.notes.deletedAt)).groupBy(schema.notes.contextId)
  const since = new Date(Date.now() - 7 * 86400 * 1000)
  const calls = await db.select({ nb: schema.aiCalls.notebookId, ok: schema.aiCalls.ok, n: sql<number>`count(*)` }).from(schema.aiCalls).where(gte(schema.aiCalls.createdAt, since)).groupBy(schema.aiCalls.notebookId, schema.aiCalls.ok)
  const invites = await db.select({ nb: schema.invites.notebookId, n: sql<number>`count(*)` }).from(schema.invites).where(and(isNull(schema.invites.acceptedAt), gte(schema.invites.expiresAt, new Date()))).groupBy(schema.invites.notebookId)
  const ctxByNb = new Map<string, string[]>()
  for (const c of ctxRows) ctxByNb.set(c.nb, [...(ctxByNb.get(c.nb) ?? []), c.id])
  const notesByCtx = new Map(noteCounts.map((r) => [r.ctx, Number(r.n)]))
  return nbs.map((nb) => {
    const members = users.filter((u) => u.notebookId === nb.id).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, lastLoginAt: u.lastLoginAt }))
    const ownerUser = users.find((u) => u.id === nb.ownerUserId) ?? members[0]
    const notes = (ctxByNb.get(nb.id) ?? []).reduce((a, c) => a + (notesByCtx.get(c) ?? 0), 0)
    const c = calls.filter((r) => r.nb === nb.id)
    return {
      notebook: nb,
      owner: ownerUser ? { id: ownerUser.id, name: ownerUser.name, email: ownerUser.email } : null,
      members,
      pendingInvites: Number(invites.find((i) => i.nb === nb.id)?.n ?? 0),
      notes,
      aiCalls7d: c.reduce((a, r) => a + Number(r.n), 0),
      aiFailed7d: c.filter((r) => !r.ok).reduce((a, r) => a + Number(r.n), 0),
    }
  })
}

export async function platformTotals() {
  const db = await getDb()
  const dayAgo = new Date(Date.now() - 86400 * 1000)
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000)
  const [nb, users, notes, callsDay, callsWeek, failedWeek] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(schema.notebooks),
    db.select({ n: sql<number>`count(*)` }).from(schema.users),
    db.select({ n: sql<number>`count(*)` }).from(schema.notes).where(isNull(schema.notes.deletedAt)),
    db.select({ n: sql<number>`count(*)` }).from(schema.aiCalls).where(gte(schema.aiCalls.createdAt, dayAgo)),
    db.select({ n: sql<number>`count(*)` }).from(schema.aiCalls).where(gte(schema.aiCalls.createdAt, weekAgo)),
    db.select({ n: sql<number>`count(*)` }).from(schema.aiCalls).where(and(gte(schema.aiCalls.createdAt, weekAgo), eq(schema.aiCalls.ok, false))),
  ])
  return { notebooks: Number(nb[0]?.n ?? 0), users: Number(users[0]?.n ?? 0), notes: Number(notes[0]?.n ?? 0), aiCallsToday: Number(callsDay[0]?.n ?? 0), aiCalls7d: Number(callsWeek[0]?.n ?? 0), aiFailed7d: Number(failedWeek[0]?.n ?? 0) }
}

export async function recentAdminEvents(limit = 200) {
  const db = await getDb()
  return db.select().from(schema.adminEvents).orderBy(desc(schema.adminEvents.createdAt)).limit(limit)
}

export { inArray }
