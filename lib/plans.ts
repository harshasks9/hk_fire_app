/*
  Plan enforcement on the server: month-to-date usage, quota checks and the
  AI budget. Definitions and pure helpers live in ./plans-spec.
*/
import { and, count, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import type { Notebook, PlanId } from './db/schema'
import { PLANS, UNLIMITED, effectivePlan, monthStart, type QuotaKind, type Usage } from './plans-spec'
export * from './plans-spec'

export async function usageFor(notebookId: string, now = new Date()): Promise<Usage> {
  const db = await getDb()
  const since = monthStart(now)
  const ctxIds = (await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, notebookId))).map((r) => r.id)
  const ids = ctxIds.length ? ctxIds : ['__none__']
  const [notes, calls, storage, members, recordings] = await Promise.all([
    db.select({ n: count() }).from(schema.notes).where(and(inArray(schema.notes.contextId, ids), isNull(schema.notes.deletedAt))),
    db.select({ n: count() }).from(schema.aiCalls).where(and(eq(schema.aiCalls.notebookId, notebookId), gte(schema.aiCalls.createdAt, since))),
    db.select({ n: sql<number>`coalesce(sum(${schema.attachments.size}), 0)` }).from(schema.attachments).innerJoin(schema.notes, eq(schema.notes.id, schema.attachments.noteId)).where(inArray(schema.notes.contextId, ids)),
    db.select({ n: count() }).from(schema.users).where(and(eq(schema.users.notebookId, notebookId), sql`${schema.users.role} <> 'admin'`)),
    db.select({ n: count() }).from(schema.meetings).where(and(inArray(schema.meetings.contextId, ids), gte(schema.meetings.ingestStageAt, since), sql`${schema.meetings.ingestStatus} is not null`)),
  ])
  return { notes: Number(notes[0]?.n ?? 0), aiCallsMonth: Number(calls[0]?.n ?? 0), storageBytes: Number(storage[0]?.n ?? 0), members: Number(members[0]?.n ?? 0), recordingsMonth: Number(recordings[0]?.n ?? 0), monthStart: since.toISOString() }
}

export class QuotaError extends Error {
  status = 402
  kind: QuotaKind
  plan: PlanId
  constructor(kind: QuotaKind, plan: PlanId, message: string) {
    super(message)
    this.kind = kind
    this.plan = plan
  }
}

const QUOTA_MESSAGES: Record<QuotaKind, (limit: number, plan: string) => string> = {
  notes: (l, p) => `The ${p} plan holds up to ${l.toLocaleString()} notes. Upgrade in Settings → Plan & usage, or delete notes you no longer need.`,
  aiCallsMonth: (l, p) => `The ${p} plan includes ${l.toLocaleString()} AI actions a month and they are used up; the app keeps working with local analysis until next month. Upgrade for more.`,
  storageMB: (l, p) => `The ${p} plan includes ${l.toLocaleString()} MB of attachments and this file would go over. Upgrade in Settings → Plan & usage.`,
  members: (l, p) => `The ${p} plan allows ${l === 1 ? 'one person' : `${l} people`} in a notebook. Upgrade to invite more.`,
  recordingsMonth: (l, p) => `The ${p} plan processes ${l.toLocaleString()} meeting recordings a month and they are used up. Upgrade in Settings → Plan & usage.`,
}

/** Check one quota before adding `extra` units; throws a 402 QuotaError when it would be exceeded. */
export async function assertQuota(nb: Pick<Notebook, 'id' | 'plan' | 'planExpiresAt'>, kind: QuotaKind, extra = 1): Promise<void> {
  const plan = effectivePlan(nb)
  const limit = PLANS[plan][kind]
  if (limit === UNLIMITED) return
  const u = await usageFor(nb.id)
  const used = kind === 'storageMB' ? u.storageBytes / 1048576 : u[kind]
  if (used + extra > limit) throw new QuotaError(kind, plan, QUOTA_MESSAGES[kind](limit, PLANS[plan].name))
}

/** True when the month's model budget is spent (AI then runs locally instead of failing). */
export async function aiBudgetExhausted(nb: Pick<Notebook, 'id' | 'plan' | 'planExpiresAt'>): Promise<boolean> {
  const plan = effectivePlan(nb)
  const limit = PLANS[plan].aiCallsMonth
  if (limit === UNLIMITED) return false
  const db = await getDb()
  const r = (await db.select({ n: count() }).from(schema.aiCalls).where(and(eq(schema.aiCalls.notebookId, nb.id), gte(schema.aiCalls.createdAt, monthStart()))))[0]
  return Number(r?.n ?? 0) >= limit
}
