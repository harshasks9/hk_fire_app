/*
  Self-service registration and account recovery for the SaaS deployment:
  sign up (notebook + owner), email verification, forgot/reset password and
  the session-invalidating "sign out everywhere". Administrative creation of
  notebooks lives in lib/notebooks.ts and shares the same building blocks.
*/
import { eq, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { uid, slugify } from './util'
import { hashPassword } from './crypto'
import { ensureDefaultContexts } from './seed/run'
import { findUserByEmail, logAdminEvent, normalizeEmail } from './notebooks'
import { getPlatformSettings, appUrl } from './platform'
import { issueAuthToken, consumeAuthToken } from './auth-tokens'
import { sendEmail, verifyEmailMessage, resetPasswordMessage, emailConfigured, type EmailResult } from './email'
import type { Notebook, User } from './db/schema'

export const PASSWORD_MIN = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export class SignupError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function validatePassword(pw: string): string | null {
  if (typeof pw !== 'string' || pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`
  if (pw.length > 200) return 'That password is too long'
  if (/^(.)\1+$/.test(pw) || ['password', '12345678', 'qwertyui'].includes(pw.toLowerCase())) return 'Choose a less guessable password'
  return null
}

export function validateEmail(email: string | null): string | null {
  if (!email || !EMAIL_RE.test(email) || email.length > 200) return 'Enter a valid email address'
  return null
}

export interface SignupInput { name: string; email: string; password: string; notebookName?: string; sampleData?: boolean; origin?: string }
export interface SignupResult { user: User; notebook: Notebook; verification: { required: boolean; email: EmailResult; link?: string } }

const DEFAULT_USER_SETTINGS = { theme: 'system', aiProvider: 'auto', aiEnabled: true, proactiveInsights: true, dailyBriefHour: 7, defaultContext: 'work' } as const

/** Create a notebook and its owner from the public sign-up form. Sample data, if wanted, is loaded by the caller afterwards. */
export async function signUp(input: SignupInput): Promise<SignupResult> {
  const settings = await getPlatformSettings()
  if (settings.signupMode === 'closed') throw new SignupError('Registration is closed on this deployment. Contact the administrator for an account.', 403)
  if (settings.signupMode === 'invite') throw new SignupError('This deployment is invite-only. Ask the administrator or a notebook owner for an invitation link.', 403)
  const email = normalizeEmail(input.email)
  const emailErr = validateEmail(email)
  if (emailErr || !email) throw new SignupError(emailErr ?? 'Enter a valid email address')
  const pwErr = validatePassword(input.password)
  if (pwErr) throw new SignupError(pwErr)
  const name = (input.name ?? '').trim().slice(0, 80)
  if (!name) throw new SignupError('Tell us your name')
  if (await findUserByEmail(email)) throw new SignupError('An account with that email already exists. Sign in instead, or reset your password.', 409)

  const db = await getDb()
  const notebookId = uid('nb')
  const userId = uid('user')
  const nbName = (input.notebookName ?? '').trim().slice(0, 80) || `${name.split(/\s+/)[0]}'s notebook`
  const slug = await uniqueSlug(nbName)
  const wantsSample = Boolean(input.sampleData) && settings.allowSampleData
  await db.insert(schema.notebooks).values({ id: notebookId, slug, name: nbName, ownerUserId: userId, settings: { aiMode: 'shared', allowShareLinks: true, sampleData: wantsSample } })
  await db.insert(schema.users).values({ id: userId, name, email, notebookId, role: 'owner', passwordHash: hashPassword(input.password), lastLoginAt: new Date(), settings: { ...DEFAULT_USER_SETTINGS } })
  await ensureDefaultContexts(notebookId)
  const user = (await db.select().from(schema.users).where(eq(schema.users.id, userId)))[0]!
  const notebook = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]!
  const verification = await sendVerification(user, input.origin)
  await logAdminEvent({ id: userId, name }, 'user.signup', { type: 'notebook', id: notebookId, name: nbName }, { email, sampleData: wantsSample, verificationSent: verification.email.sent })
  return { user, notebook, verification: { required: settings.requireEmailVerification, ...verification } }
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb()
  const root = slugify(base) || 'notebook'
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? root : `${root}-${i}`
    const exists = (await db.select({ id: schema.notebooks.id }).from(schema.notebooks).where(eq(schema.notebooks.slug, slug)))[0]
    if (!exists) return slug
  }
  return `${root}-${Date.now().toString(36)}`
}

/** Send (or re-send) the verification email. When email is not configured the link is returned for the UI to show. */
export async function sendVerification(user: User, origin?: string): Promise<{ email: EmailResult; link?: string }> {
  if (!user.email) return { email: { sent: false, provider: 'log', error: 'no email' } }
  const settings = await getPlatformSettings()
  const { token } = await issueAuthToken(user.id, 'verify')
  const link = `${appUrl(origin)}/api/auth/verify?token=${token}`
  const email = await sendEmail(verifyEmailMessage({ to: user.email, name: user.name, link, productName: settings.productName }), { productName: settings.productName })
  return { email, link: emailConfigured() && email.sent ? undefined : link }
}

/** Mark the token's user verified. Returns the user, or null for an unknown/used/expired token. */
export async function verifyEmailToken(token: string): Promise<User | null> {
  const user = await consumeAuthToken(token, 'verify')
  if (!user) return null
  const db = await getDb()
  if (!user.emailVerifiedAt) await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, user.id))
  return { ...user, emailVerifiedAt: user.emailVerifiedAt ?? new Date() }
}

/** Password reset request. Always resolves (no account enumeration); the link is returned only when email is not configured. */
export async function requestPasswordReset(emailRaw: string, origin?: string): Promise<{ email?: EmailResult; link?: string }> {
  const email = normalizeEmail(emailRaw)
  if (!email) return {}
  const user = await findUserByEmail(email)
  if (!user || user.status !== 'active') return {}
  const settings = await getPlatformSettings()
  const { token } = await issueAuthToken(user.id, 'reset')
  const link = `${appUrl(origin)}/reset/${token}`
  const sent = await sendEmail(resetPasswordMessage({ to: email, name: user.name, link, productName: settings.productName }), { productName: settings.productName })
  return { email: sent, link: emailConfigured() && sent.sent ? undefined : link }
}

/** Set a new password from a reset token, invalidating every existing session. */
export async function resetPasswordWithToken(token: string, password: string): Promise<User> {
  const pwErr = validatePassword(password)
  if (pwErr) throw new SignupError(pwErr)
  const user = await consumeAuthToken(token, 'reset')
  if (!user) throw new SignupError('This reset link is no longer valid. Request a new one.', 400)
  const db = await getDb()
  const updated = (await db.update(schema.users).set({ passwordHash: hashPassword(password), tokenVersion: sql`${schema.users.tokenVersion} + 1`, emailVerifiedAt: user.emailVerifiedAt ?? new Date(), lastLoginAt: new Date() }).where(eq(schema.users.id, user.id)).returning())[0]!
  return updated
}

/** Invalidate every session of a user (their next request signs them out). Returns the new token version. */
export async function signOutEverywhere(userId: string): Promise<number> {
  const db = await getDb()
  const r = (await db.update(schema.users).set({ tokenVersion: sql`${schema.users.tokenVersion} + 1` }).where(eq(schema.users.id, userId)).returning({ v: schema.users.tokenVersion }))[0]
  return r?.v ?? 0
}
