'use client'

import { useState } from 'react'
import { logFill } from '@/lib/actions'

export interface TicketOption {
  id: number
  label: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  lots: number
  modelledCredit: number
}

interface Fields {
  symbol: string
  type: 'call' | 'put'
  strike: string
  expiry: string
  lots: string
  creditPerContract: string
  ticketId: string
}

export default function LogForm({ tickets }: { tickets: TicketOption[] }) {
  const [fields, setFields] = useState<Fields>({
    symbol: '', type: 'call', strike: '', expiry: '', lots: '', creditPerContract: '', ticketId: '',
  })
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedNote, setParsedNote] = useState<string | null>(null)

  function pickTicket(id: string) {
    const t = tickets.find((t) => String(t.id) === id)
    if (!t) {
      setFields((f) => ({ ...f, ticketId: '' }))
      return
    }
    setFields({
      symbol: t.symbol,
      type: t.type,
      strike: String(t.strike),
      expiry: t.expiry,
      lots: String(t.lots),
      creditPerContract: '',
      ticketId: id,
    })
  }

  async function parseScreenshot(file: File) {
    setParsing(true)
    setParseError(null)
    setParsedNote(null)
    try {
      const fd = new FormData()
      fd.set('screenshot', file)
      const res = await fetch('/api/parse-screenshot', { method: 'POST', body: fd })
      const json = (await res.json()) as Record<string, unknown> & { error?: string }
      if (!res.ok || json.error) {
        setParseError(json.error ?? `parse failed (${res.status})`)
        return
      }
      setFields((f) => ({
        ...f,
        symbol: typeof json.symbol === 'string' ? json.symbol.toUpperCase() : f.symbol,
        type: json.type === 'put' ? 'put' : json.type === 'call' ? 'call' : f.type,
        strike: typeof json.strike === 'number' ? String(json.strike) : f.strike,
        expiry: typeof json.expiry === 'string' ? json.expiry : f.expiry,
        lots: typeof json.lots === 'number' ? String(json.lots) : f.lots,
        creditPerContract: typeof json.creditPerContract === 'number' ? String(json.creditPerContract) : f.creditPerContract,
      }))
      setParsedNote('Parsed — check every field before saving. Nothing is saved without your confirmation.')
    } catch (err) {
      setParseError(String(err))
    } finally {
      setParsing(false)
    }
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <label htmlFor="ticket" className="block text-sm font-medium">
          Log against an approved ticket
        </label>
        <select id="ticket" className="mt-1 w-full" value={fields.ticketId} onChange={(e) => pickTicket(e.target.value)}>
          <option value="">— manual entry —</option>
          {tickets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="mt-4">
          <label htmlFor="screenshot" className="block text-sm font-medium">
            Or paste a broker screenshot
          </label>
          <input
            id="screenshot"
            type="file"
            accept="image/*"
            className="mt-1"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void parseScreenshot(f)
            }}
          />
          {parsing ? <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Parsing…</p> : null}
          {parseError ? (
            <p role="alert" className="mt-1 text-sm" style={{ color: 'var(--bad)' }}>
              {parseError}
            </p>
          ) : null}
          {parsedNote ? (
            <p className="mt-1 text-sm" style={{ color: 'var(--warn)' }}>
              {parsedNote}
            </p>
          ) : null}
        </div>
      </div>

      <form action={logFill} className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <input type="hidden" name="ticketId" value={fields.ticketId} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium">Symbol</label>
            <input id="symbol" name="symbol" required value={fields.symbol} onChange={set('symbol')} className="mt-1 w-full uppercase" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Type</label>
            <select id="type" name="type" value={fields.type} onChange={set('type')} className="mt-1 w-full">
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>
          <div>
            <label htmlFor="strike" className="block text-sm font-medium">Strike</label>
            <input id="strike" name="strike" type="number" step="0.01" min="0.01" required value={fields.strike} onChange={set('strike')} className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium">Expiry</label>
            <input id="expiry" name="expiry" type="date" required value={fields.expiry} onChange={set('expiry')} className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="lots" className="block text-sm font-medium">Lots</label>
            <input id="lots" name="lots" type="number" step="1" min="1" required value={fields.lots} onChange={set('lots')} className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="creditPerContract" className="block text-sm font-medium">Credit $/contract</label>
            <input id="creditPerContract" name="creditPerContract" type="number" step="0.01" min="0.01" required value={fields.creditPerContract} onChange={set('creditPerContract')} className="mt-1 w-full" />
          </div>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          Logging records the trade, recalibrates {fields.symbol || 'the name'}’s implied volatility from this real
          transacted price, and updates the scoreboard. Fills outside the rules are recorded in the deviation
          ledger automatically.
        </p>
        <button
          type="submit"
          className="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
        >
          Save fill
        </button>
      </form>
    </div>
  )
}
