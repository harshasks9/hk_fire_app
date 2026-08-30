import Link from 'next/link'
import { getHomeState } from '@/lib/state'
import { getDb, schema } from '@/lib/db'
import { ruleTrend } from '@/lib/discipline'
import { getSetting } from '@/lib/data'
import { Card, EmptyState, SectionTitle, pct } from '@/components/ui'

export const dynamic = 'force-dynamic'

interface Baseline {
  positions: number
  winners: number
  netCredit: number
  cadenceWritten: number
  cadenceAvailable: number
}

export default async function ScoreboardPage() {
  const state = await getHomeState()
  if (state.kind === 'EMPTY') return <EmptyState title="Seed the database first." />

  const db = await getDb()
  const positions = await db.select().from(schema.positions)
  const trend = ruleTrend(
    positions
      .filter((p) => p.entryDelta != null)
      .map((p) => ({ entryDelta: p.entryDelta, openedAt: p.openedAt, type: p.type as 'call' | 'put' })),
  )
  const baseline = await getSetting<Baseline>('baseline2026')

  return (
    <div>
      <h1 className="text-2xl font-semibold">Scoreboard</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Adherence is the input and it is entirely controlled. P&L is the output —{' '}
        <Link href="/scoreboard/pnl" style={{ color: 'var(--accent)' }}>
          it lives one level down →
        </Link>
      </p>

      <SectionTitle>The Discipline Score</SectionTitle>
      <div className="flex flex-col gap-3">
        {state.discipline.components.map((c) => (
          <Card key={c.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{c.label}</p>
              <p className="text-xl font-semibold tabular">
                {c.value == null ? 'no data yet' : `${pct(c.value, 0)}`}
                {c.denominator > 0 ? (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--muted)' }}>
                    {c.numerator} of {c.denominator}
                  </span>
                ) : null}
              </p>
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {c.detail}
            </p>
          </Card>
        ))}
      </div>

      <SectionTitle>Rule score by month — the drift detector</SectionTitle>
      <Card>
        {trend.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No tickets with recorded deltas yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {trend.map((t) => (
              <li key={t.month} className="flex items-center gap-3 text-sm">
                <span className="w-16 tabular">{t.month}</span>
                <span
                  className="block h-3 rounded-sm"
                  aria-hidden
                  style={{
                    width: `${Math.max(2, (t.value ?? 0) * 100) * 0.7}%`,
                    background: (t.value ?? 0) >= 0.9 ? 'var(--good)' : (t.value ?? 0) >= 0.7 ? 'var(--warn)' : 'var(--bad)',
                  }}
                />
                <span className="tabular" style={{ color: 'var(--muted)' }}>
                  {t.value == null ? '—' : pct(t.value, 0)} ({t.n})
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          A falling Rule score in August is exactly the signal that would have caught the drift before it cost
          anything. Partial record: seeded rows carry the count, not the full 139.
        </p>
      </Card>

      {baseline ? (
        <>
          <SectionTitle>2026 baseline (from the imported record)</SectionTitle>
          <Card>
            <p className="text-sm tabular">
              {baseline.winners} winners in {baseline.positions} positions · ${baseline.netCredit.toLocaleString()}{' '}
              net credit · cadence {baseline.cadenceWritten} of {baseline.cadenceAvailable} weeks. The strategy
              needs no improvement — this board exists to keep it executed.
            </p>
          </Card>
        </>
      ) : null}
    </div>
  )
}
