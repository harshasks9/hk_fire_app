/*
  Plan definitions and pure quota helpers. No database imports, so client
  components (pricing, Settings, sign-up, admin) can use them directly.
*/
import type { Notebook, PlanId } from './db/schema'

export const UNLIMITED = -1

export interface PlanSpec {
  id: PlanId
  name: string
  /** USD per month; 0 = free. */
  priceMonthly: number
  tagline: string
  /** Quotas: -1 = unlimited. */
  notes: number
  aiCallsMonth: number
  storageMB: number
  members: number
  recordingsMonth: number
  highlights: string[]
}

export const PLANS: Record<PlanId, PlanSpec> = {
  free: { id: 'free', name: 'Free', priceMonthly: 0, tagline: 'For trying it on your own notes.', notes: 500, aiCallsMonth: 300, storageMB: 100, members: 1, recordingsMonth: 5, highlights: ['500 notes', '300 AI actions a month', '5 meeting recordings a month', '100 MB of attachments', 'Just you'] },
  pro: { id: 'pro', name: 'Pro', priceMonthly: 12, tagline: 'For people who run their work from their notes.', notes: 20000, aiCallsMonth: 5000, storageMB: 2048, members: 3, recordingsMonth: 100, highlights: ['20,000 notes', '5,000 AI actions a month', '100 meeting recordings a month', '2 GB of attachments', 'Up to 3 people', 'Bring your own AI keys'] },
  team: { id: 'team', name: 'Team', priceMonthly: 39, tagline: 'For a small team sharing one notebook.', notes: UNLIMITED, aiCallsMonth: 25000, storageMB: 10240, members: 25, recordingsMonth: 500, highlights: ['Unlimited notes', '25,000 AI actions a month', '500 meeting recordings a month', '10 GB of attachments', 'Up to 25 people', 'Priority support'] },
}

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'team']

export function isPlanId(s: unknown): s is PlanId {
  return s === 'free' || s === 'pro' || s === 'team'
}

/** The plan in force: a lapsed paid plan counts as free. */
export function effectivePlan(nb: Pick<Notebook, 'plan' | 'planExpiresAt'>, now = new Date()): PlanId {
  const plan = isPlanId(nb.plan) ? nb.plan : 'free'
  if (plan !== 'free' && nb.planExpiresAt && nb.planExpiresAt.getTime() < now.getTime()) return 'free'
  return plan
}

export type QuotaKind = 'notes' | 'aiCallsMonth' | 'storageMB' | 'members' | 'recordingsMonth'

export interface Usage { notes: number; aiCallsMonth: number; storageBytes: number; members: number; recordingsMonth: number; monthStart: string }

export function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

export interface QuotaLine { kind: QuotaKind; label: string; used: number; limit: number; unit: string; pct: number | null }

/** The five usage lines Settings shows, with percentages (null when unlimited). */
export function quotaLines(plan: PlanId, u: Usage): QuotaLine[] {
  const p = PLANS[plan]
  const mk = (kind: QuotaKind, label: string, used: number, limit: number, unit = ''): QuotaLine => ({ kind, label, used, limit, unit, pct: limit === UNLIMITED ? null : Math.min(100, Math.round((used / Math.max(1, limit)) * 100)) })
  return [
    mk('notes', 'Notes', u.notes, p.notes),
    mk('aiCallsMonth', 'AI actions this month', u.aiCallsMonth, p.aiCallsMonth),
    mk('recordingsMonth', 'Meeting recordings this month', u.recordingsMonth, p.recordingsMonth),
    mk('storageMB', 'Attachments', Math.round(u.storageBytes / 1048576), p.storageMB, 'MB'),
    mk('members', 'People', u.members, p.members),
  ]
}
