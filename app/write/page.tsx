import Link from 'next/link'
import { getHomeState, holdingsWithMarks } from '@/lib/state'
import { directionRows, ensureWeekRow, expiringPositions, firstOpenStep, ticketsForWeek, WRITE_STEPS } from '@/lib/write'
import { latestPrices, getSetting } from '@/lib/data'
import { checkLimits, ticketToDrop } from '@/lib/limits'
import { evaluatePosition, formatExpiry } from '@/lib/exits'
import { volFor } from '@/lib/data'
import { nyParts } from '@/lib/week'
import { BAND_LABELS, GATE_LABELS } from '@/lib/valuation'
import {
  approveTicket,
  completeDirectionStep,
  completeLimitsStep,
  completeTicketsStep,
  confirmCloseoutStep,
  confirmDirection,
  confirmExpiry,
  declineTicket,
  finishWeek,
} from '@/lib/actions'
import { Btn, Card, Chip, EmptyState, Modelled, SectionTitle, money, pct } from '@/components/ui'
import { Explain, PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

function StepHeader({ index, title, state }: { index: number; title: string; state: 'done' | 'open' | 'locked' }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold"
        style={{
          borderColor: state === 'done' ? 'var(--good)' : state === 'open' ? 'var(--accent)' : 'var(--border)',
          color: state === 'done' ? 'var(--good)' : state === 'open' ? 'var(--accent)' : 'var(--muted)',
        }}
      >
        {state === 'done' ? '✓' : index}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        {state === 'done' ? 'done' : state === 'locked' ? 'locked until the step above is done' : ''}
      </span>
    </div>
  )
}

export default async function WritePage() {
  const home = await getHomeState()
  const now = new Date()

  if (home.kind === 'EMPTY') {
    return <EmptyState title="Seed the database first." />
  }

  // A live urgent exit locks the ticket builder — no wandering in with a broken position open.
  if (home.kind === 'EXIT') {
    return (
      <Card tone="bad">
        <p className="font-medium">There is an urgent exit open. The write sequence waits.</p>
        <p className="mt-2 text-sm">
          <Link href="/" style={{ color: 'var(--accent)' }}>
            Go handle it →
          </Link>
        </p>
      </Card>
    )
  }

  const week = await ensureWeekRow(now)
  const progress = week.progress ?? {}
  const openStep = firstOpenStep(progress)
  const stepState = (s: (typeof WRITE_STEPS)[number]): 'done' | 'open' | 'locked' =>
    progress[s] ? 'done' : s === openStep ? 'open' : 'locked'

  if (week.completedAt != null) {
    return (
      <div className="mt-10">
        <Card tone="good">
          <p className="text-2xl font-semibold">
            Week {week.weekNumber % 100} written{week.ticketsWritten != null ? `, ${week.ticketsWritten} tickets` : ''}
            {week.credit != null ? `, ${money(week.credit)} credit` : ''}.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Completed {week.completedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC. The week is closed. Log
            fills as they come back — <Link href="/log" style={{ color: 'var(--accent)' }}>Log →</Link>
          </p>
        </Card>
      </div>
    )
  }

  if (!home.week.isFriday) {
    return (
      <EmptyState title="It is not Friday.">
        <p>
          The write sequence opens on Friday {home.week.friday} (New York). Today the answer is: nothing to do.
        </p>
      </EmptyState>
    )
  }

  if (home.writingPaused) {
    return (
      <Card tone="bad">
        <p className="font-medium">Writing is paused — rule L8.</p>
        <p className="mt-1 text-sm">Two E2 stops inside a week. This Friday sits out; the pause is the system working.</p>
      </Card>
    )
  }

  /* ---------- Step 1: close out ---------- */
  const expiring = await expiringPositions(now)
  const prices = await latestPrices()
  const today = nyParts(now).iso
  const expiringViews = await Promise.all(
    expiring.map(async (p) => {
      const vol = await volFor(p.symbol)
      const status = evaluatePosition(
        {
          id: p.id, symbol: p.symbol, type: p.type as 'call' | 'put', strike: p.strike,
          expiry: p.expiry, lots: p.lots, creditPerContract: p.creditPerContract, entryDelta: p.entryDelta,
        },
        prices.get(p.symbol)?.close ?? null,
        vol.blended,
        today,
        prices.get(p.symbol)?.stale ?? true,
      )
      return { p, status }
    }),
  )

  /* ---------- Step 2: direction ---------- */
  const directions = await directionRows()
  const confirmedMap = (await getSetting<Record<string, boolean>>(`direction_confirmed_${week.id}`)) ?? {}
  const allDirectionsConfirmed = directions.every((d) => confirmedMap[d.symbol])

  /* ---------- Step 3: tickets ---------- */
  const tickets = await ticketsForWeek(week.id)
  const proposed = tickets.filter((t) => t.status === 'proposed')
  const approved = tickets.filter((t) => t.status === 'approved')

  /* ---------- Step 4: limits ---------- */
  const open = home.statuses.map((s) => ({
    symbol: s.position.symbol, type: s.position.type, strike: s.position.strike, lots: s.position.lots,
  }))
  const approvedLite = approved.map((t) => ({ symbol: t.symbol, type: t.type, strike: t.strike, lots: t.lots }))
  const holdings = await holdingsWithMarks(prices)
  const limitChecks = checkLimits([...open, ...approvedLite], holdings, 0)
  const aggregateChecks = limitChecks.filter((c) => c.id !== 'L4' && c.id !== 'L8')
  const limitsOk = aggregateChecks.every((c) => c.ok)
  const drop = limitsOk ? null : ticketToDrop(approvedLite, open, holdings)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Write week {week.weekNumber % 100} <PageHelp entry={GLOSSARY.page_write} />
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Friday {week.fridayDate}. Five steps, in order, no skipping. Completion is stamped; a skipped Friday is a
          recorded miss.
        </p>
      </div>

      {/* Step 1 — Close out */}
      <Card>
        <StepHeader index={1} title="Close out" state={stepState('closeout')} />
        {stepState('closeout') !== 'locked' ? (
          <div className="mt-3">
            {expiringViews.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Nothing expires today.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {expiringViews.map(({ p, status }) => (
                  <li key={p.id} className="rounded-md border p-3" style={{ borderColor: 'var(--border)' }}>
                    <p className="font-medium">
                      {p.symbol} {formatExpiry(p.expiry)} {p.strike}
                      {p.type === 'call' ? 'C' : 'P'} ×{p.lots}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                      {status.signal ? `${status.signal.instruction} ${status.signal.detail}` : 'Out of the money — expires. Rule E4: do nothing.'}
                    </p>
                    <form action={confirmExpiry} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="positionId" value={p.id} />
                      {status.signal?.rule === 'E2' || (status.signal?.rule === 'E1' && p.type === 'call') ? (
                        <>
                          <label htmlFor={`cost-${p.id}`} className="text-sm">
                            Close cost/contract
                          </label>
                          <input id={`cost-${p.id}`} name="closeCostPerContract" type="number" step="0.01" min="0" className="w-28" />
                        </>
                      ) : null}
                      <Btn>Confirm</Btn>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {stepState('closeout') === 'open' && expiringViews.length === 0 ? (
              <form action={confirmCloseoutStep} className="mt-3">
                <input type="hidden" name="weekId" value={week.id} />
                <Btn tone="primary">Step 1 done</Btn>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Step 2 — Direction */}
      <Card>
        <StepHeader index={2} title="Direction" state={stepState('direction')} />
        {stepState('direction') !== 'locked' ? (
          <div className="mt-3 flex flex-col gap-3">
            {directions.map((d) => (
              <div key={d.symbol} className="rounded-md border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.symbol}</span>
                  {d.insufficient ? (
                    <Chip kind="neutral">Insufficient data ({d.inputsPopulated} of 5 inputs) — both sides</Chip>
                  ) : (
                    <Chip kind="neutral">
                      {d.band ? BAND_LABELS[d.band] : '—'} → {GATE_LABELS[d.gate]}
                    </Chip>
                  )}
                  {d.provisionalBand ? (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      provisional read: {BAND_LABELS[d.provisionalBand]}
                    </span>
                  ) : null}
                  {confirmedMap[d.symbol] ? <Chip kind="good">confirmed</Chip> : null}
                </div>
                {!confirmedMap[d.symbol] && stepState('direction') === 'open' ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <form action={confirmDirection}>
                      <input type="hidden" name="weekId" value={week.id} />
                      <input type="hidden" name="symbol" value={d.symbol} />
                      <input type="hidden" name="gateSaid" value={GATE_LABELS[d.gate]} />
                      <Btn>Confirm {GATE_LABELS[d.gate].split(' — ')[0]}</Btn>
                    </form>
                    <details>
                      <summary className="cursor-pointer text-sm" style={{ color: 'var(--muted)' }}>
                        Override the gate (recorded in the deviation ledger)
                      </summary>
                      <form action={confirmDirection} className="mt-2 flex flex-col gap-2">
                        <input type="hidden" name="weekId" value={week.id} />
                        <input type="hidden" name="symbol" value={d.symbol} />
                        <input type="hidden" name="override" value="1" />
                        <input type="hidden" name="gateSaid" value={GATE_LABELS[d.gate]} />
                        <label htmlFor={`why-${d.symbol}`} className="text-sm">
                          Why (required — this goes in the ledger verbatim)
                        </label>
                        <textarea id={`why-${d.symbol}`} name="reason" required rows={2} />
                        <div>
                          <Btn tone="danger">Override</Btn>
                        </div>
                      </form>
                    </details>
                  </div>
                ) : null}
              </div>
            ))}
            {stepState('direction') === 'open' && allDirectionsConfirmed ? (
              <form action={completeDirectionStep}>
                <input type="hidden" name="weekId" value={week.id} />
                <Btn tone="primary">Step 2 done</Btn>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Step 3 — The tickets */}
      <Card>
        <StepHeader index={3} title="The tickets" state={stepState('tickets')} />
        {stepState('tickets') !== 'locked' ? (
          <div className="mt-3 flex flex-col gap-3">
            {tickets.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No tickets could be generated — check that prices are fresh.
              </p>
            ) : null}
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-md border p-3"
                style={{ borderColor: t.disagreementFlag && t.status === 'proposed' ? 'var(--warn)' : 'var(--border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {t.symbol} {formatExpiry(t.expiry)} {t.strike} {t.type === 'call' ? 'Call' : 'Put'} ×{t.lots}
                  </p>
                  <Chip kind={t.status === 'approved' ? 'good' : t.status === 'declined' ? 'neutral' : t.status === 'logged' ? 'good' : 'warn'}>
                    {t.status}
                  </Chip>
                </div>
                <p className="mt-1 text-sm tabular">
                  <Explain entry={GLOSSARY.premium_credit}>credit</Explain>{' '}
                  <Modelled>{money(t.modelledCredit)}/contract</Modelled> ·{' '}
                  <Explain entry={GLOSSARY.delta}>delta</Explain>{' '}
                  <Modelled>{(Math.abs(t.modelledDelta) * 100).toFixed(1)}</Modelled>
                  {t.obligation > 0 ? (
                    <>
                      {' '}
                      · <Explain entry={GLOSSARY.obligation}>obligation</Explain> {money(t.obligation)}
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-sm">
                  <Explain entry={GLOSSARY.pre_mortem}>Pre-mortem</Explain>: {t.premortem}
                </p>
                {t.baseRate != null && t.baseRateWindows != null ? (
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    Base rate: recent regime, small sample — {t.baseRateWindows} overlapping windows, autocorrelated.
                  </p>
                ) : null}
                {t.disagreementFlag ? (
                  <p className="mt-2 text-sm font-medium" style={{ color: 'var(--warn)' }}>
                    ⚠️ History disagrees with the model by{' '}
                    {t.baseRate != null && t.modelledDelta !== 0 ? (t.baseRate / Math.abs(t.modelledDelta)).toFixed(1) : '>2'}
                    ×. The modelled delta describes a distribution; the base rate describes this stock in this regime.
                  </p>
                ) : null}
                {t.coverage ? (
                  <p className="mt-1 text-sm" style={{ color: t.coverage.level === 'block' ? 'var(--bad)' : t.coverage.level === 'warn' ? 'var(--warn)' : 'var(--muted)' }}>
                    Coverage: {t.coverage.detail}
                  </p>
                ) : null}
                {t.status === 'proposed' && stepState('tickets') === 'open' ? (
                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    {t.coverage?.level === 'block' ? (
                      <p className="text-sm font-medium" style={{ color: 'var(--bad)' }}>
                        Blocked — not enough shares. Decline it.
                      </p>
                    ) : (
                      <form action={approveTicket} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="ticketId" value={t.id} />
                        {t.disagreementFlag ? (
                          <label className="flex items-center gap-1 text-sm">
                            <input type="checkbox" name="acceptDisagreement" value="1" required /> I read the base
                            rate
                          </label>
                        ) : null}
                        <Btn tone="primary">Approve</Btn>
                      </form>
                    )}
                    <form action={declineTicket} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="ticketId" value={t.id} />
                      <input name="reason" placeholder="reason (optional)" className="w-44" aria-label="Decline reason" />
                      <Btn>Decline</Btn>
                    </form>
                  </div>
                ) : null}
                {t.declineReason ? (
                  <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    declined: {t.declineReason}
                  </p>
                ) : null}
              </div>
            ))}
            {stepState('tickets') === 'open' && proposed.length === 0 && tickets.length > 0 ? (
              <form action={completeTicketsStep}>
                <input type="hidden" name="weekId" value={week.id} />
                <Btn tone="primary">Step 3 done — every ticket has a yes or a no</Btn>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Step 4 — Limits */}
      <Card>
        <StepHeader index={4} title="Limits" state={stepState('limits')} />
        {stepState('limits') !== 'locked' ? (
          <div className="mt-3">
            <ul className="flex flex-col gap-1 text-sm">
              {aggregateChecks.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>
                    {c.id} — {c.label}
                  </span>
                  <span className="tabular" style={{ color: c.ok ? 'var(--good)' : 'var(--bad)' }}>
                    {c.ok ? 'ok' : 'BINDS'} · {c.detail}
                  </span>
                </li>
              ))}
            </ul>
            {!limitsOk && drop ? (
              <div className="mt-3 rounded-md border p-3" style={{ borderColor: 'var(--bad)' }}>
                <p className="text-sm font-medium">{drop.why}</p>
                <form action={declineTicket} className="mt-2">
                  <input type="hidden" name="ticketId" value={approved[drop.index]!.id} />
                  <input type="hidden" name="reason" value="dropped: limit bound" />
                  <Btn tone="danger">
                    Drop {approved[drop.index]!.symbol} {approved[drop.index]!.strike} ×{approved[drop.index]!.lots}
                  </Btn>
                </form>
              </div>
            ) : null}
            {stepState('limits') === 'open' && limitsOk ? (
              <form action={completeLimitsStep} className="mt-3">
                <input type="hidden" name="weekId" value={week.id} />
                <Btn tone="primary">Step 4 done — limits clear</Btn>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Step 5 — Done */}
      <Card>
        <StepHeader index={5} title="Done" state={stepState('done')} />
        {stepState('done') === 'open' ? (
          <form action={finishWeek} className="mt-3">
            <input type="hidden" name="weekId" value={week.id} />
            <p className="mb-2 text-sm" style={{ color: 'var(--muted)' }}>
              {approved.length} ticket{approved.length === 1 ? '' : 's'} approved,{' '}
              <Modelled>{money(approved.reduce((s, t) => s + t.modelledCredit * t.lots, 0))} modelled credit</Modelled>.
              Stamping closes the week.
            </p>
            <Btn tone="primary">Stamp the week</Btn>
          </form>
        ) : null}
      </Card>
    </div>
  )
}
