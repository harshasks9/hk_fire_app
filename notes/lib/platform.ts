/*
  Platform-wide settings the administrator controls from /admin → Settings.
  Stored as one row in app_meta so they can change without a deploy.
*/
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'

export type SignupMode = 'open' | 'invite' | 'closed'

export interface PlatformSettings {
  /** open = anyone can register; invite = only invite links; closed = no new accounts at all. */
  signupMode: SignupMode
  /** Block sign-in until the email address is verified (needs email sending configured). */
  requireEmailVerification: boolean
  /** Let people load the demo dataset when they register. */
  allowSampleData: boolean
  /** Short message shown to everyone at the top of the app (empty = none). */
  announcement: string
  /** Public product name shown on the landing page and in emails. */
  productName: string
  /** Support address shown on public pages and in emails. */
  supportEmail: string
}

export const PLATFORM_KEY = 'platform:settings'

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  signupMode: 'open',
  requireEmailVerification: false,
  allowSampleData: true,
  announcement: '',
  productName: 'Notes',
  supportEmail: '',
}

const SIGNUP_MODES: SignupMode[] = ['open', 'invite', 'closed']

/** Merge a stored (possibly partial or malformed) value with the defaults. */
export function normalizePlatformSettings(raw: unknown): PlatformSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof PlatformSettings, unknown>>
  return {
    signupMode: SIGNUP_MODES.includes(r.signupMode as SignupMode) ? (r.signupMode as SignupMode) : DEFAULT_PLATFORM_SETTINGS.signupMode,
    requireEmailVerification: typeof r.requireEmailVerification === 'boolean' ? r.requireEmailVerification : DEFAULT_PLATFORM_SETTINGS.requireEmailVerification,
    allowSampleData: typeof r.allowSampleData === 'boolean' ? r.allowSampleData : DEFAULT_PLATFORM_SETTINGS.allowSampleData,
    announcement: typeof r.announcement === 'string' ? r.announcement.slice(0, 300) : '',
    productName: typeof r.productName === 'string' && r.productName.trim() ? r.productName.trim().slice(0, 60) : DEFAULT_PLATFORM_SETTINGS.productName,
    supportEmail: typeof r.supportEmail === 'string' ? r.supportEmail.trim().slice(0, 200) : '',
  }
}

async function load(): Promise<PlatformSettings> {
  try {
    const db = await getDb()
    const row = (await db.select({ value: schema.appMeta.value }).from(schema.appMeta).where(eq(schema.appMeta.key, PLATFORM_KEY)))[0]
    return normalizePlatformSettings(row?.value)
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS }
  }
}

/** Current settings, read once per request. */
export const getPlatformSettings = cache(load)

export async function updatePlatformSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const db = await getDb()
  const next = normalizePlatformSettings({ ...(await load()), ...patch })
  await db.insert(schema.appMeta).values({ key: PLATFORM_KEY, value: next, updatedAt: new Date() }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value: next, updatedAt: new Date() } })
  return next
}

/** The public origin of this deployment, for links in emails. */
export function appUrl(fallbackOrigin?: string): string {
  const env = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  return (env || fallbackOrigin || 'http://localhost:3000').replace(/\/$/, '')
}
