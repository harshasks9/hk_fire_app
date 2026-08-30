import { getDb, schema } from '@/lib/db'
import { asc } from 'drizzle-orm'
import { latestPrices } from '@/lib/data'
import { geminiConfigured, recentAiCalls } from '@/lib/gemini'
import { recentAlerts, whatsappConfigured } from '@/lib/whatsapp'
import { confirmHolding, testAlert } from '@/lib/actions'
import { Btn, Card, Chip, SectionTitle, money } from '@/components/ui'
import { PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const db = await getDb()
  const holdings = await db.select().from(schema.holdings).orderBy(asc(schema.holdings.symbol))
  const prices = await latestPrices()
  const alerts = await recentAlerts(20)
  const aiCalls = await recentAiCalls(10)
  const unconfirmed = holdings.filter((h) => !h.confirmed).length

  const env = [
    { key: 'DATABASE_URL', ok: Boolean(process.env.DATABASE_URL), note: process.env.DATABASE_URL ? 'Postgres' : 'embedded PGlite (dev)' },
    { key: 'GEMINI_API_KEY', ok: geminiConfigured(), note: geminiConfigured() ? 'set' : 'prices will go stale; no parsing, checks or prose' },
    { key: 'CALLMEBOT_PHONE / APIKEY', ok: whatsappConfigured(), note: whatsappConfigured() ? 'set' : 'alerts logged but not delivered' },
    { key: 'CRON_SECRET', ok: Boolean(process.env.CRON_SECRET), note: Boolean(process.env.CRON_SECRET) ? 'set' : 'cron endpoints will refuse' },
    { key: 'APP_URL', ok: Boolean(process.env.APP_URL), note: process.env.APP_URL ?? 'defaults to https://shar.hkfire.app' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Settings <PageHelp entry={GLOSSARY.page_settings} />
        </h1>
        <form method="post" action="/api/logout">
          <Btn>Sign out</Btn>
        </form>
      </div>

      <SectionTitle>Environment</SectionTitle>
      <Card>
        <ul className="flex flex-col gap-1 text-sm">
          {env.map((e) => (
            <li key={e.key} className="flex flex-wrap items-center justify-between gap-2">
              <code>{e.key}</code>
              <span>
                <Chip kind={e.ok ? 'good' : 'warn'}>{e.ok ? 'ok' : 'missing'}</Chip>
                <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>{e.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>WhatsApp</SectionTitle>
      <Card>
        <form action={testAlert}>
          <Btn tone="primary">Send test alert</Btn>
        </form>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {alerts.length === 0 ? (
            <li style={{ color: 'var(--muted)' }}>No alerts yet.</li>
          ) : (
            alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  [{a.rule}] {a.message.slice(0, 90)}
                  {a.message.length > 90 ? '…' : ''}
                </span>
                <span>
                  <Chip kind={a.sendStatus === 'sent' || a.sendStatus === 'batched' ? 'good' : a.sendStatus === 'failed' ? 'bad' : 'neutral'}>
                    {a.sendStatus}
                  </Chip>
                  {a.sendError ? <span className="ml-1 text-xs" style={{ color: 'var(--bad)' }}>{a.sendError}</span> : null}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>

      <SectionTitle>Gemini calls</SectionTitle>
      <Card>
        <ul className="flex flex-col gap-1 text-sm">
          {aiCalls.length === 0 ? (
            <li style={{ color: 'var(--muted)' }}>No calls yet.</li>
          ) : (
            aiCalls.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {c.createdAt.toISOString().slice(5, 16).replace('T', ' ')} · {c.model} · {c.purpose}
                </span>
                <Chip kind={c.ok ? 'good' : 'bad'}>{c.ok ? 'ok' : c.error?.slice(0, 40) ?? 'failed'}</Chip>
              </li>
            ))
          )}
        </ul>
      </Card>

      <SectionTitle>
        <span id="holdings">Holdings — {unconfirmed > 0 ? `${unconfirmed} unconfirmed` : 'all confirmed'}</span>
      </SectionTitle>
      <p className="mb-2 text-sm" style={{ color: 'var(--muted)' }}>
        Share counts were imported unverified. Confirm each against the broker; every equity-based limit depends on
        them. Tax-free shares are the portion in sheltered accounts.
      </p>
      <div className="flex flex-col gap-2">
        {holdings.map((h) => (
          <Card key={h.symbol} tone={h.confirmed ? undefined : 'warn'}>
            <form action={confirmHolding} className="flex flex-wrap items-end gap-3 text-sm">
              <input type="hidden" name="symbol" value={h.symbol} />
              <span className="w-14 font-medium">{h.symbol}</span>
              <label>
                Shares
                <input name="shares" type="number" step="any" min="0" defaultValue={h.shares} className="mt-1 block w-28" />
              </label>
              <label>
                Tax-free shares
                <input name="taxFreeShares" type="number" step="any" min="0" defaultValue={h.taxFreeShares} className="mt-1 block w-28" />
              </label>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {h.assetClass === 'reit' ? 'REIT' : 'Non-REIT'} · mark{' '}
                {prices.get(h.symbol) ? `$${prices.get(h.symbol)!.close}` : h.avgPrice != null ? `$${h.avgPrice} (avg)` : '—'} ·
                div {money(h.annualDividend)}/yr
              </span>
              <span className="ml-auto flex items-center gap-2">
                {h.confirmed ? <Chip kind="good">confirmed</Chip> : <Chip kind="warn">unconfirmed</Chip>}
                <Btn>{h.confirmed ? 'Update' : 'Confirm'}</Btn>
              </span>
            </form>
          </Card>
        ))}
      </div>
    </div>
  )
}
