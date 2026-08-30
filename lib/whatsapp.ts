/*
  WhatsApp via CallMeBot — outbound ONLY, so all logging happens in the UI
  and there is no inbound parser. Urgent alerts fire immediately; normal ones
  batch into the 21:45 UTC digest. The same rule for the same position never
  fires twice in 24 hours. Every message ends with a deep link. Every send is
  logged; failures surface in settings.
*/
import { and, desc, eq, gte, isNull } from 'drizzle-orm'
import { getDb, schema } from './db'

export function whatsappConfigured(): boolean {
  return Boolean(process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_APIKEY)
}

export function appUrl(path = ''): string {
  const base = process.env.APP_URL ?? 'https://shar.hkfire.app'
  return base.replace(/\/$/, '') + path
}

async function sendRaw(text: string): Promise<{ ok: boolean; error?: string }> {
  const phone = process.env.CALLMEBOT_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY
  if (!phone || !apikey) return { ok: false, error: 'CALLMEBOT_PHONE / CALLMEBOT_APIKEY not set' }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(apikey)}&text=${encodeURIComponent(text)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 300) }
  }
}

export interface AlertInput {
  rule: string
  positionId?: number | null
  symbol?: string | null
  urgency: 'urgent' | 'normal'
  message: string
  deepLinkPath: string
}

/**
 * Queue an alert. Deduplicates (same rule + position/symbol inside 24h),
 * sends urgent ones immediately, leaves normal ones pending for the digest.
 */
export async function queueAlert(input: AlertInput): Promise<void> {
  const db = await getDb()
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000)
  const dupes = await db
    .select()
    .from(schema.alerts)
    .where(and(eq(schema.alerts.rule, input.rule), gte(schema.alerts.createdAt, cutoff)))
  const isDupe = dupes.some(
    (d) =>
      (input.positionId != null && d.positionId === input.positionId) ||
      (input.positionId == null && d.symbol === (input.symbol ?? null)),
  )
  const deepLink = appUrl(input.deepLinkPath)
  const inserted = await db
    .insert(schema.alerts)
    .values({
      rule: input.rule,
      positionId: input.positionId ?? null,
      symbol: input.symbol ?? null,
      urgency: input.urgency,
      message: input.message,
      deepLink,
      sendStatus: isDupe ? 'suppressed_dedupe' : 'pending',
    })
    .returning({ id: schema.alerts.id })
  if (isDupe) return

  if (input.urgency === 'urgent') {
    const res = await sendRaw(`${input.message}\n${deepLink}`)
    await db
      .update(schema.alerts)
      .set({
        sentAt: res.ok ? new Date() : null,
        sendStatus: res.ok ? 'sent' : 'failed',
        sendError: res.error ?? null,
      })
      .where(eq(schema.alerts.id, inserted[0]!.id))
  }
}

/** The 21:45 UTC digest: one message for all pending normal alerts. */
export async function sendDigest(): Promise<{ sent: number }> {
  const db = await getDb()
  const pending = await db
    .select()
    .from(schema.alerts)
    .where(and(eq(schema.alerts.sendStatus, 'pending'), eq(schema.alerts.urgency, 'normal'), isNull(schema.alerts.sentAt)))
    .orderBy(desc(schema.alerts.createdAt))
  if (pending.length === 0) return { sent: 0 }
  const lines = pending.map((a) => `• ${a.message}`)
  const text = `Five Delta digest (${pending.length})\n${lines.join('\n')}\n${appUrl('/')}`
  const res = await sendRaw(text)
  for (const a of pending) {
    await db
      .update(schema.alerts)
      .set({
        sentAt: res.ok ? new Date() : null,
        sendStatus: res.ok ? 'batched' : 'failed',
        sendError: res.error ?? null,
      })
      .where(eq(schema.alerts.id, a.id))
  }
  return { sent: res.ok ? pending.length : 0 }
}

/** Settings-page test button. */
export async function sendTestAlert(): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb()
  const res = await sendRaw(`Five Delta test alert — the pipe works.\n${appUrl('/settings')}`)
  await db.insert(schema.alerts).values({
    rule: 'test',
    urgency: 'normal',
    message: 'Test alert from settings',
    deepLink: appUrl('/settings'),
    sentAt: res.ok ? new Date() : null,
    sendStatus: res.ok ? 'sent' : 'failed',
    sendError: res.error ?? null,
  })
  return res
}

export async function recentAlerts(limit = 50) {
  const db = await getDb()
  return db.select().from(schema.alerts).orderBy(desc(schema.alerts.createdAt)).limit(limit)
}
