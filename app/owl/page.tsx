import { isNull, and, eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { latestPrices, getSetting, volFor } from '@/lib/data'
import { holdingsWithMarks } from '@/lib/state'
import { owlSleeveView, OWL_SLEEVE_DEFAULTS, type OwlSleeveConfig } from '@/lib/owl'
import { setOwlTrimTarget } from '@/lib/actions'
import { formatExpiry } from '@/lib/exits'
import { nyParts } from '@/lib/week'
import { Btn, Card, EmptyState, Modelled, SectionTitle, money, pct } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function OwlPage() {
  const prices = await latestPrices()
  const owlPrice = prices.get('OWL')
  if (!owlPrice) return <EmptyState title="Seed the database first." />

  const db = await getDb()
  const holdings = await holdingsWithMarks(prices)
  const owl = holdings.find((h) => h.symbol === 'OWL')
  const equity = holdings.reduce((s, h) => s + h.shares * h.mark, 0)
  const cfg = { ...OWL_SLEEVE_DEFAULTS, ...((await getSetting<Partial<OwlSleeveConfig>>('owl_sleeve')) ?? {}) }
  const vol = await volFor('OWL')
  const view = owlSleeveView(owlPrice.close, owl?.shares ?? 0, equity, vol.blended, nyParts(new Date()).iso, cfg)

  const openSleeve = await db
    .select()
    .from(schema.positions)
    .where(and(isNull(schema.positions.closedAt), eq(schema.positions.sleeve, 'owl_exit')))

  return (
    <div>
      <h1 className="text-2xl font-semibold">OWL — concentration exit</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Not income. At ~$12 with 50-cent strikes, a 7-day 5-delta call is worth about a dollar a contract — not a
        business. This sleeve is paid waiting: 30–45 DTE calls at 15–20 delta, where being called away trims a
        limit breach at a price chosen in advance.
      </p>

      <SectionTitle>The breach</SectionTitle>
      <Card tone="warn">
        <p className="tabular text-sm">
          {view.shares.toLocaleString()} shares × ${view.spot.toFixed(2)} = {money(view.positionValue)} —{' '}
          <strong>{pct(view.exposurePct)}</strong> of a {money(view.equity)} book. The 15% line is{' '}
          {money(view.equity * view.targetPct)}; the excess is <strong>{money(view.excessValue)}</strong> (
          {view.excessShares.toLocaleString()} shares).
        </p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }} aria-hidden>
          <div className="h-3" style={{ width: `${Math.min(100, (view.targetPct / view.exposurePct) * 100)}%`, background: 'var(--good)' }} />
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          Progress toward the 15% line: assignment moves the marker. OWL <strong>puts are blocked</strong> — adding
          is the one direction that cannot help.
        </p>
      </Card>

      <SectionTitle>This cycle</SectionTitle>
      <Card>
        <p className="text-lg font-medium">
          Write {formatExpiry(view.expiry)} ({view.dte} DTE) {view.strike.toFixed(2)} calls ×{cfg.lotsPerCycle}
        </p>
        <p className="mt-2 text-sm tabular">
          <Modelled>credit {money(view.creditPerContract)}/contract</Modelled> ·{' '}
          <Modelled>{money(view.creditPerCycle)} per cycle</Modelled> ·{' '}
          <Modelled>≈{money(view.annualizedCredit)} a year</Modelled> ·{' '}
          <Modelled>delta {(view.trimChance * 100).toFixed(0)}</Modelled>
        </p>
        <p className="mt-2 text-sm">
          If called away: {view.sharesTrimmedIfCalled.toLocaleString()} shares sold at ${view.strike.toFixed(2)} —{' '}
          {pct(view.trimPriceVsSpotPct)} above spot. That is not a loss; it is the plan executing.
        </p>
        <form action={setOwlTrimTarget} className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="lotsPerCycle" className="text-sm">
            Lots per cycle
          </label>
          <input id="lotsPerCycle" name="lotsPerCycle" type="number" min="1" max="1200" step="1" defaultValue={cfg.lotsPerCycle} className="w-24" />
          <Btn>Set</Btn>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            1,200 contracts coverable in total
          </span>
        </form>
      </Card>

      <SectionTitle>Live sleeve positions</SectionTitle>
      {openSleeve.length === 0 ? (
        <EmptyState title="No sleeve position open." />
      ) : (
        <ul className="divide-y rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {openSleeve.map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm tabular" style={{ borderColor: 'var(--border)' }}>
              OWL {formatExpiry(p.expiry)} {p.strike}C ×{p.lots} · credit {money(p.creditPerContract)}/contract ·
              opened {p.openedAt.toISOString().slice(0, 10)}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
        Capacity is not tradeability: the other idle holdings (IWGFF, OTF, MSDL, IDVO, XDTE, FEPI, YMAG, small
        REITs) are marked <code>chain: none</code> until a usable chain is verified — no opportunity is presented
        there.
      </p>
    </div>
  )
}
