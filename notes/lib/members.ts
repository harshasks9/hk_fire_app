/*
  Members of a notebook, managed by its owner: list, invite (email or link),
  revoke invitations and remove people. The platform admin console uses the
  same functions on any notebook.
*/
import { and, asc, eq, gte, isNull, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { createInvite, logAdminEvent, normalizeEmail } from './notebooks'
import { assertQuota } from './plans'
import { getPlatformSettings, appUrl } from './platform'
import { inviteMessage, sendEmail, emailConfigured } from './email'
import type { Notebook, UserRole } from './db/schema'

export interface MemberView { id: string; name: string; email: string | null; role: UserRole; status: string; verified: boolean; lastLoginAt: string | null; createdAt: string }
export interface PendingInviteView { id: string; email: string | null; role: UserRole; expiresAt: string; createdAt: string }

export async function listMembers(notebookId: string): Promise<{ members: MemberView[]; invites: PendingInviteView[] }> {
  const db = await getDb()
  const users = await db.select().from(schema.users).where(and(eq(schema.users.notebookId, notebookId), sql`${schema.users.role} <> 'admin'`)).orderBy(asc(schema.users.createdAt))
  const invites = await db.select().from(schema.invites).where(and(eq(schema.invites.notebookId, notebookId), isNull(schema.invites.acceptedAt), gte(schema.invites.expiresAt, new Date()))).orderBy(asc(schema.invites.createdAt))
  return {
    members: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, verified: Boolean(u.emailVerifiedAt), lastLoginAt: u.lastLoginAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString() })),
    invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt.toISOString(), createdAt: i.createdAt.toISOString() })),
  }
}

/** Invite someone: checks the plan's people quota (members + open invitations), emails the link when possible. */
export async function inviteMember(nb: Notebook, input: { email?: string | null; role: 'member' | 'owner'; actor: { id: string; name: string }; origin?: string }): Promise<{ inviteUrl: string; expiresAt: Date; emailed: boolean }> {
  const email = normalizeEmail(input.email)
  const current = await listMembers(nb.id)
  await assertQuota(nb, 'members', current.invites.length + 1)
  if (email && current.members.some((m) => (m.email ?? '').toLowerCase() === email)) throw Object.assign(new Error('That person is already in this notebook'), { status: 400 })
  const inv = await createInvite({ notebookId: nb.id, email, role: input.role, createdBy: input.actor.id })
  const inviteUrl = `${appUrl(input.origin)}/invite/${inv.token}`
  let emailed = false
  if (email && emailConfigured()) {
    const settings = await getPlatformSettings()
    const r = await sendEmail(inviteMessage({ to: email, inviter: input.actor.name, notebook: nb.name, link: inviteUrl, productName: settings.productName, role: input.role }), { productName: settings.productName })
    emailed = r.sent
  }
  await logAdminEvent(input.actor, 'invite.create', { type: 'notebook', id: nb.id, name: nb.name }, { email, role: input.role, emailed })
  return { inviteUrl, expiresAt: inv.expiresAt, emailed }
}

export async function revokeInvite(notebookId: string, inviteId: string, actor: { id: string; name: string }): Promise<void> {
  const db = await getDb()
  const inv = (await db.select().from(schema.invites).where(and(eq(schema.invites.id, inviteId), eq(schema.invites.notebookId, notebookId))))[0]
  if (!inv) throw Object.assign(new Error('Invitation not found'), { status: 404 })
  await db.delete(schema.invites).where(eq(schema.invites.id, inviteId))
  await logAdminEvent(actor, 'invite.revoke', { type: 'notebook', id: notebookId }, { email: inv.email })
}

/** Remove a member (never the owner, never an admin). Their tokens go with them; notes stay with the notebook. */
export async function removeMember(nb: Notebook, userId: string, actor: { id: string; name: string }): Promise<void> {
  const db = await getDb()
  const u = (await db.select().from(schema.users).where(and(eq(schema.users.id, userId), eq(schema.users.notebookId, nb.id))))[0]
  if (!u) throw Object.assign(new Error('Person not found in this notebook'), { status: 404 })
  if (u.role === 'admin') throw Object.assign(new Error('The administrator cannot be removed'), { status: 400 })
  if (u.id === nb.ownerUserId) throw Object.assign(new Error('The owner cannot be removed. Transfer ownership first or delete the notebook.'), { status: 400 })
  await db.delete(schema.apiTokens).where(eq(schema.apiTokens.userId, userId))
  await db.delete(schema.authTokens).where(eq(schema.authTokens.userId, userId))
  await db.delete(schema.users).where(eq(schema.users.id, userId))
  await logAdminEvent(actor, 'user.remove', { type: 'user', id: userId, name: u.name }, { notebookId: nb.id })
}

export async function changeMemberRole(nb: Notebook, userId: string, role: 'member' | 'owner', actor: { id: string; name: string }): Promise<void> {
  const db = await getDb()
  const u = (await db.select().from(schema.users).where(and(eq(schema.users.id, userId), eq(schema.users.notebookId, nb.id))))[0]
  if (!u || u.role === 'admin') throw Object.assign(new Error('Person not found in this notebook'), { status: 404 })
  if (u.id === nb.ownerUserId && role !== 'owner') throw Object.assign(new Error('The notebook owner keeps the owner role'), { status: 400 })
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, userId))
  await logAdminEvent(actor, 'user.role', { type: 'user', id: userId, name: u.name }, { role })
}
