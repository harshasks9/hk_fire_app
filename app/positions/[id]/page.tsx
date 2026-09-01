import { desc, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { getDb, schema } from '@/lib/db'
import { closesFor, getSetting, latestHypothesis, latestPrices, volFor } from '@/lib/data'
import { bsGreeks, bsPrice, baseRateBreach } from '@/lib/options'
import { closePosition, generateProse, runHypothesisNow } from '@/lib/actions'
import { evaluatePosition, formatExpiry } from '@/lib/exits'
import { daysBetween, nyParts } from '@/lib/week'
import { geminiConfigured } from '@/lib/gemini'
import { BackLink, Btn, Card, Chip, Modelled, SectionTitle, money, pct } from '@/components/ui'
import { Explain, PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

function PayoffSvg({
  spot, strike, T, vol, type, creditPerShare,
}: {
  spot: number; strike: number; T: number; vol: number; type: 'call' | 'put'; creditPerShare: number
}) {
  const w = 640
  const h = 220
  const pad = 34
  const lo = Math.min(spot, strike) * 0.9
  const hi = Math.max(spot, strike) * 1.1
  const xs = (p: number) => pad + ((p - lo) / (hi - lo)) * (w - 2 * pad)
  const atExpiry = (p: number) =>
    creditPerShare - (type === 'call' ? Math.max(0, p - strike) : Math.max(0, strike - p))
  const todayVal = (p: number) => creditPerShare - bsPrice(p, strike, T, vol, type)
  const values: number[] = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const p = lo + ((hi - lo) * i) / N
    values.push(atExpiry(p), T > 0 ? todayVal(p) : atExpiry(p))
  }
  const vLo = Math.min(...values)
  const vHi = Math.max(...values)
  const ys = (v: number) => h - pad - ((v - vLo) / (vHi - vLo || 1)) * (h - 2 * pad)
  const path = (f: (p: number) => number) =>
    Array.from({ length: N + 1 }, (_, i) => {
      const p = lo + ((hi - lo) * i) / N
      return `${i === 0 ? 'M' : 'L'}${xs(p).toFixed(1)},${ys(f(p)).toFixed(1)}`
    }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Payoff per share at expiry and today" className="w-full">
      <line x1={pad} x2={w - pad} y1={ys(0)} y2={ys(0)} stroke="var(--border)" />
      <line x1={xs(strike)} x2={xs(strike)} y1={pad} y2={h - pad} stroke="var(--warn)" strokeDasharray="4 3" />
      <line x1={xs(spot)} x2={xs(spot)} y1={pad} y2={h - pad} stroke="var(--accent)" strokeDasharray="2 3" />
      <path d={path(atExpiry)} fill="none" stroke="var(--fg)" strokeWidth="1.8" />
      {T > 0 ? <path d={path(todayVal)} fill="none" stroke="var(--accent)" strokeWidth="1.4" /> : null}
      <text x={xs(strike) + 4} y={pad + 10} fontSize="11" fill="var(--warn)">strike {strike}</text>
      <text x={xs(spot) + 4} y={h - pad - 6} fontSize="11" fill="var(--accent)">spot {spot.toFixed(0)}</text>
      <text x={pad} y={pad - 8} fontSize="11" fill="var(--muted)">P&L per share: solid = at expiry, blue = modelled today</text>
    </svg>
  )
}

function ConeSvg({ closes, spot, vol, dte }: { closes: number[]; spot: number; vol: number; dte: number }) {
  const w = 640
  const h = 220
  const pad = 34
  const hist = closes.slice(-40)
  const steps = Math.max(1, dte)
  const total = hist.length + steps
  const cone = Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / 365) * (dte / steps)
    const sd = vol * Math.sqrt(t)
    return { up1: spot * Math.exp(sd), dn1: spot * Math.exp(-sd), up2: spot * Math.exp(2 * sd), dn2: spot * Math.exp(-2 * sd) }
  })
  const all = [...hist, ...cone.flatMap((c) => [c.up2, c.dn2])]
  const lo = Math.min(...all) * 0.99
  const hi = Math.max(...all) * 1.01
  const xs = (i: number) => pad + (i / (total - 1)) * (w - 2 * pad)
  const ys = (v: number) => h - pad - ((v - lo) / (hi - lo)) * (h - 2 * pad)
  const histPath = hist.map((c, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(c).toFixed(1)}`).join(' ')
  const band = (k: 'up1' | 'dn1' | 'up2' | 'dn2') =>
    cone.map((c, i) => `${i === 0 ? 'M' : 'L'}${xs(hist.length - 1 + i).toFixed(1)},${ys(c[k]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Actual price path with modelled probability cone" className="w-full">
      <path d={histPath} fill="none" stroke="var(--fg)" strokeWidth="1.6" />
      <path d={band('up1')} fill="none" stroke="var(--accent)" strokeWidth="1" />
      <path d={band('dn1')} fill="none" stroke="var(--accent)" strokeWidth="1" />
      <path d={band('up2')} fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3 3" />
      <path d={band('dn2')} fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3 3" />
      <text x={pad} y={pad - 8} fontSize="11" fill="var(--muted)">actual closes (left) → modelled ±1σ/±2σ cone to expiry</text>
    </svg>
  )
}

export default async function PositionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!isFinite(id)) notFound()
  const db = await getDb()
  const rows = await db.select().from(schema.positions).where(eq(schema.positions.id, id))
  const p = rows[0]
  if (!p) notFound()

  const prices = await latestPrices()
  const info = prices.get(p.symbol)
  const spot = info?.close ?? null
  const vol = await volFor(p.symbol)
  const today = nyParts(new Date()).iso
  const dte = Math.max(0, daysBetween(today, p.expiry))
  const T = dte / 365
  const isOpen = p.closedAt == null

  const status =
    isOpen && spot != null
      ? evaluatePosition(
          {
            id: p.id, symbol: p.symbol, type: p.type as 'call' | 'put', strike: p.strike,
            expiry: p.expiry, lots: p.lots, creditPerContract: p.creditPerContract, entryDelta: p.entryDelta,
          },
          spot, vol.blended, today, info?.stale ?? true,
        )
      : null

  const greeks = spot != null ? bsGreeks(spot, p.strike, T, vol.blended, p.type as 'call' | 'put') : null
  const mid = spot != null ? bsPrice(spot, p.strike, T, vol.blended, p.type as 'call' | 'put') * 100 : null
  const closes = await closesFor(p.symbol)
  const movePct = spot != null && spot > 0 ? Math.abs(p.strike / spot - 1) : null
  const base = movePct != null && closes.length > 20 ? baseRateBreach(closes, 5, movePct, p.type as 'call' | 'put') : null
  const hyp = await latestHypothesis(p.symbol)
  const history = await db
    .select()
    .from(schema.positions)
    .where(eq(schema.positions.symbol, p.symbol))
    .orderBy(desc(schema.positions.openedAt))
  const holding = (await db.select().from(schema.holdings).where(eq(schema.holdings.symbol, p.symbol)))[0]
  const prose = await getSetting<string>(`prose_${p.id}`)

  const label = `${p.symbol} ${formatExpiry(p.expiry)} ${p.strike}${p.type === 'call' ? 'C' : 'P'} ×${p.lots}`
  const effectiveBasis =
    p.type === 'put' ? p.strike - p.creditPerContract / 100 : holding?.avgPrice != null ? holding.avgPrice : null

  return (
    <div>
      <BackLink href="/">Today</BackLink>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{label}</h1>
        <PageHelp entry={GLOSSARY.page_position} />
        {status ? (
          <Chip kind={status.chip}>{status.chip === 'healthy' ? 'Healthy' : status.chip === 'watch' ? 'Watch' : 'Close now'}</Chip>
        ) : (
          <Chip kind="neutral">{p.outcome ?? 'closed'}</Chip>
        )}
        {info?.stale ? <Chip kind="warn">price stale</Chip> : null}
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Pro mode explains this decision; it does not open a new one. Credit received {money(p.creditPerContract)}
        /contract on {p.openedAt.toISOString().slice(0, 10)}
        {p.entryDelta != null ? ` at ${(Math.abs(p.entryDelta) * 100).toFixed(1)} delta` : ''}.
      </p>

      {status?.signal ? (
        <div className="mt-3">
          <Card tone={status.signal.urgent ? 'bad' : 'warn'}>
            <p className="font-medium">{status.signal.instruction}</p>
            <p className="mt-1 text-sm">{status.signal.detail}</p>
            {status.signal.urgent ? (
              <form action={closePosition} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="positionId" value={p.id} />
                <input type="hidden" name="rule" value={status.signal.rule} />
                <label htmlFor="cost" className="text-sm">Close cost/contract</label>
                <input id="cost" name="closeCostPerContract" type="number" step="0.01" min="0" className="w-32" />
                <Btn tone="danger">Mark as closed</Btn>
              </form>
            ) : null}
          </Card>
        </div>
      ) : null}

      <SectionTitle>
        What the greeks mean here <Explain entry={GLOSSARY.greeks} />
      </SectionTitle>
      <Card>
        {greeks && mid != null && spot != null ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Delta {(Math.abs(greeks.delta) * 100).toFixed(1)}</dt>
              <dd style={{ color: 'var(--muted)' }}>
                Roughly the modelled odds this finishes in the money — the chance of{' '}
                {p.type === 'call' ? 'being called away' : 'taking delivery'}.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Theta {money(greeks.theta * 100 * p.lots)}/day</dt>
              <dd style={{ color: 'var(--muted)' }}>What holding all {p.lots} contracts earns per calendar day if nothing moves.</dd>
            </div>
            <div>
              <dt className="font-medium">Gamma {greeks.gamma.toExponential(2)}</dt>
              <dd style={{ color: 'var(--muted)' }}>How fast delta grows if {p.symbol} moves toward the strike — the E5 drift risk.</dd>
            </div>
            <div>
              <dt className="font-medium">Vega {money(greeks.vega * 100 * p.lots)}/vol pt</dt>
              <dd style={{ color: 'var(--muted)' }}>What a one-point IV rise costs the short position, all lots.</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No current price — greeks unavailable.</p>
        )}
        {mid != null ? (
          <p className="mt-3 text-sm tabular">
            <Explain entry={GLOSSARY.mid}>
              <Modelled>Modelled mid {money(mid)}/contract</Modelled>
            </Explain>{' '}
            = {(mid / p.creditPerContract).toFixed(2)}× credit.{' '}
            <Explain entry={GLOSSARY.e_rules}>
              E1 at ≤0.2×; {p.type === 'call' ? 'E2' : 'E3'} at ≥3×
            </Explain>
            .
          </p>
        ) : null}
      </Card>

      {spot != null ? (
        <>
          <SectionTitle>Payoff — at expiry and today</SectionTitle>
          <Card>
            <PayoffSvg spot={spot} strike={p.strike} T={T} vol={vol.blended} type={p.type as 'call' | 'put'} creditPerShare={p.creditPerContract / 100} />
          </Card>

          <SectionTitle>Probability cone vs the actual path</SectionTitle>
          <Card>
            <ConeSvg closes={closes} spot={spot} vol={vol.blended} dte={Math.max(1, dte)} />
            {base ? (
              <p className="mt-2 text-sm">
                The {pct(movePct ?? 0)} move to the strike{' '}
                <Explain entry={GLOSSARY.base_rate}>
                  happened in {base.breaches} of {base.windows} recent 5-day windows ({pct(base.rate)})
                </Explain>{' '}
                — <span style={{ color: 'var(--muted)' }}>{base.caveat}</span>.
              </p>
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionTitle>
        Assignment economics <Explain entry={GLOSSARY.assignment} />
      </SectionTitle>
      <Card>
        {p.type === 'put' ? (
          <p className="text-sm tabular">
            Assignment buys {(p.lots * 100).toLocaleString()} shares at ${p.strike.toFixed(2)}; after the{' '}
            {money(p.creditPerContract)}/contract premium the effective basis is{' '}
            <strong>${effectiveBasis?.toFixed(2)}</strong>. All fourteen 2026 assignments were profitable — E3 is a
            plan, not a problem.
          </p>
        ) : (
          <p className="text-sm tabular">
            Being called away sells {(p.lots * 100).toLocaleString()} shares at ${p.strike.toFixed(2)} plus the{' '}
            {money(p.creditPerContract)}/contract premium
            {holding?.avgPrice != null ? ` — against a ${money(holding.avgPrice)} average cost` : ''}.
            {p.sleeve === 'owl_exit' ? ' In this sleeve, that outcome is the goal.' : ''}
          </p>
        )}
      </Card>

      <SectionTitle>
        Volatility — which number is in play <Explain entry={GLOSSARY.implied_vol} />
      </SectionTitle>
      <Card>
        <ul className="text-sm tabular">
          <li>Blended (in play): <Modelled>{pct(vol.blended)}</Modelled> — source: {vol.source}{vol.asOf ? `, updated ${vol.asOf.toISOString().slice(0, 10)}` : ''}</li>
          <li>Calibrated from fills: {vol.calibratedIv != null ? pct(vol.calibratedIv) : '—'} ({vol.calibrationFills} live fills; seed IV solved from his fills stands in below 1)</li>
          <li>Realized 21-day: {vol.realized21d != null ? pct(vol.realized21d) : 'needs 22 grounded closes'}</li>
          <li>This position’s entry IV: {p.entryIv != null ? pct(p.entryIv) : '—'}</li>
        </ul>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Calibrated IV is the highest-quality signal in the system — it comes from real transacted prices, weighted 70/30 over realized.
        </p>
      </Card>

      <SectionTitle>Hypothesis</SectionTitle>
      <Card>
        {hyp ? (
          <p className="text-sm">
            <Chip kind={hyp.verdict === 'intact' ? 'good' : hyp.verdict === 'watch' ? 'warn' : 'bad'}>{hyp.verdict}</Chip>{' '}
            <span className="ml-1">{hyp.narrative}</span>
            <span className="ml-1 text-xs" style={{ color: 'var(--muted)' }}>({hyp.checkedAt.toISOString().slice(0, 10)})</span>
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No hypothesis check yet.</p>
        )}
        {geminiConfigured() && isOpen ? (
          <form action={runHypothesisNow} className="mt-2">
            <input type="hidden" name="symbol" value={p.symbol} />
            <input type="hidden" name="positionId" value={p.id} />
            <input type="hidden" name="summary" value={`short ${p.type} ${p.strike} exp ${p.expiry} ×${p.lots}`} />
            <Btn>Run check now</Btn>
          </form>
        ) : null}
      </Card>

      <SectionTitle>Plain-language read</SectionTitle>
      <Card>
        {prose ? <div className="whitespace-pre-wrap text-sm">{prose}</div> : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {geminiConfigured() ? 'Generate a three-paragraph explanation of this position’s numbers.' : 'GEMINI_API_KEY not set — prose unavailable.'}
          </p>
        )}
        {geminiConfigured() ? (
          <form action={generateProse} className="mt-2">
            <input type="hidden" name="positionId" value={p.id} />
            <input
              type="hidden"
              name="context"
              value={`${label}; credit ${money(p.creditPerContract)}/contract; modelled mid ${mid != null ? money(mid) : 'n/a'}; delta ${greeks ? (Math.abs(greeks.delta) * 100).toFixed(1) : 'n/a'}; spot ${spot ?? 'n/a'}; DTE ${dte}; blended vol ${pct(vol.blended)}; base rate ${base ? `${base.breaches}/${base.windows}` : 'n/a'}`}
            />
            <Btn>{prose ? 'Regenerate' : 'Generate'}</Btn>
          </form>
        ) : null}
      </Card>

      <SectionTitle>{p.symbol} — complete trade history</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead>
              <tr className="text-left" style={{ color: 'var(--muted)' }}>
                <th className="py-1 pr-3 font-medium">Opened</th>
                <th className="py-1 pr-3 font-medium">Position</th>
                <th className="py-1 pr-3 font-medium">Credit</th>
                <th className="py-1 pr-3 font-medium">Entry Δ</th>
                <th className="py-1 pr-3 font-medium">Outcome</th>
                <th className="py-1 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={h.id === p.id ? { fontWeight: 600 } : undefined}>
                  <td className="py-1 pr-3">{h.openedAt.toISOString().slice(0, 10)}</td>
                  <td className="py-1 pr-3">
                    {h.strike}
                    {h.type === 'call' ? 'C' : 'P'} ×{h.lots}
                    {h.isDeviation ? ' ⚠' : ''}
                  </td>
                  <td className="py-1 pr-3">{money(h.creditPerContract)}</td>
                  <td className="py-1 pr-3">{h.entryDelta != null ? (Math.abs(h.entryDelta) * 100).toFixed(0) : '—'}</td>
                  <td className="py-1 pr-3">{h.outcome ?? 'open'}</td>
                  <td className="py-1" style={{ color: (h.realisedPnl ?? 0) < 0 ? 'var(--bad)' : 'var(--good)' }}>
                    {h.realisedPnl != null ? money(h.realisedPnl) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
