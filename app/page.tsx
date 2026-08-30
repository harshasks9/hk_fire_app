import Link from 'next/link'
import { getHomeState } from '@/lib/state'
import { closePosition, startWriteSequence } from '@/lib/actions'
import { formatExpiry } from '@/lib/exits'
import { Btn, Card, Chip, EmptyState, Modelled, SectionTitle, money, pct } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const state = await getHomeState()

  if (state.kind === 'EMPTY') {
    return (
      <EmptyState title="Nothing here yet.">
        <p>
          The database is empty. Run <code>npm run db:seed</code> to load the universe, holdings and the 2026
          record, then confirm your share counts in <Link href="/settings" style={{ color: 'var(--accent)' }}>Settings</Link>.
        </p>
      </EmptyState>
    )
  }

  /* State EXIT — one sentence, one button. Nothing else is offered. */
  if (state.kind === 'EXIT' && state.urgent) {
    const u = state.urgent
    return (
      <div className="mt-10">
        <Card tone="bad">
          <p className="text-2xl font-semibold leading-snug">{u.instruction}</p>
          <p className="mt-3" style={{ color: 'var(--muted)' }}>
            {u.detail}
          </p>
          <form action={closePosition} className="mt-6">
            <input type="hidden" name="positionId" value={u.positionId} />
            <input type="hidden" name="rule" value={u.rule} />
            <label htmlFor="closeCostPerContract" className="mb-1 block text-sm">
              Cost to close, per contract (optional — records the realised P&L)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input id="closeCostPerContract" name="closeCostPerContract" type="number" step="0.01" min="0" inputMode="decimal" className="w-36" />
              <Btn tone="danger">Mark as closed</Btn>
            </div>
          </form>
        </Card>
        <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
          Everything else waits until this is done.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* The L4 breach lives on the home screen from day one. */}
      {state.l4Detail ? (
        <Card tone="warn">
          <p className="text-sm">
            <strong>Concentration limit L4 breached:</strong> {state.l4Detail}.{' '}
            <Link href="/owl" style={{ color: 'var(--accent)' }}>
              The OWL exit sleeve is the plan →
            </Link>
          </p>
        </Card>
      ) : null}

      {state.staleSymbols.length > 0 ? (
        <div className="mt-3">
          <Card tone="warn">
            <p className="text-sm">
              <strong>Stale prices:</strong> {state.staleSymbols.join(', ')} — last fetch failed; previous closes
              carried forward. Nothing here is a current price.
            </p>
          </Card>
        </div>
      ) : null}

      {state.writingPaused ? (
        <div className="mt-3">
          <Card tone="bad">
            <p className="text-sm">
              <strong>Writing is paused (L8):</strong> two E2 stops inside a week. The next write waits.
            </p>
          </Card>
        </div>
      ) : null}

      {/* The state line */}
      <div className="mt-8">
        {state.kind === 'WRITE' ? (
          <div>
            <h1 className="text-3xl font-semibold">Friday. Write week {state.week.number % 100}.</h1>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>
              A guided sequence: close out, direction, tickets, limits, done. Skipping it is recorded as a missed
              week.
            </p>
            <form action={startWriteSequence} className="mt-4">
              <Btn tone="primary">Start the sequence</Btn>
            </form>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold">
              {state.statuses.some((s) => s.signal) ? 'Steady. Watch the flagged rows.' : 'Nothing to do.'}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              {state.week.completed
                ? `Week ${state.week.number % 100} is written. Next decision: Friday ${state.week.friday}.`
                : `Next decision: Friday ${state.week.friday}.`}
            </p>
          </div>
        )}
      </div>

      {/* Unlogged fills nag */}
      {state.unloggedTickets.length > 0 ? (
        <div className="mt-6">
          <Card tone="warn">
            <p className="text-sm font-medium">Approved but not logged:</p>
            <ul className="mt-1 text-sm">
              {state.unloggedTickets.map((t) => (
                <li key={t.id}>
                  {t.label} — approved {t.approvedAt}.{' '}
                  <Link href="/log" style={{ color: 'var(--accent)' }}>
                    Log the fill →
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {/* Live positions, one chip each */}
      <SectionTitle>Live positions</SectionTitle>
      {state.statuses.length === 0 ? (
        <EmptyState title="No open positions." />
      ) : (
        <ul className="divide-y rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {state.statuses.map((s) => (
            <li key={s.position.id} className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <Link href={`/positions/${s.position.id}`} className="min-w-0 flex-1">
                <span className="font-medium">
                  {s.position.symbol} {formatExpiry(s.position.expiry)} {s.position.strike}
                  {s.position.type === 'call' ? 'C' : 'P'} ×{s.position.lots}
                </span>
                <span className="ml-2 text-sm" style={{ color: 'var(--muted)' }}>
                  {s.midPerContract != null ? (
                    <Modelled>mid {money(s.midPerContract)}</Modelled>
                  ) : (
                    'no price'
                  )}
                  {s.stale ? ' · stale' : ''}
                </span>
              </Link>
              <Chip kind={s.chip}>
                {s.chip === 'healthy' ? 'Healthy' : s.chip === 'watch' ? `Watch${s.signal ? ` · ${s.signal.rule}` : ''}` : 'Close now'}
              </Chip>
            </li>
          ))}
        </ul>
      )}

      {/* Discipline strip — adherence on the home screen, P&L one level down. */}
      <SectionTitle>Discipline</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {state.discipline.components.map((c) => (
          <Link key={c.key} href="/scoreboard">
            <Card>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {c.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular">
                {c.value == null ? '—' : pct(c.value, 0)}
              </p>
              <p className="text-xs tabular" style={{ color: 'var(--muted)' }}>
                {c.denominator > 0 ? `${c.numerator} of ${c.denominator}` : 'no data yet'}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {state.unconfirmedHoldings > 0 ? (
        <p className="mt-6 text-sm" style={{ color: 'var(--muted)' }}>
          {state.unconfirmedHoldings} holding{state.unconfirmedHoldings === 1 ? '' : 's'} unconfirmed —{' '}
          <Link href="/settings#holdings" style={{ color: 'var(--accent)' }}>
            confirm share counts
          </Link>
          . Until then every equity-based limit is an estimate.
        </p>
      ) : null}
    </div>
  )
}
