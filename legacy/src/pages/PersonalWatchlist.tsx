import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { addWatch, removeWatchItem, updateWatchNote } from '@/store/store'
import { coverageUniverse } from '@/research/providers'
import { fmtDate } from '@/lib/format'
import { Badge, Button, Card, EmptyState, SectionHead } from '@/components/ui'
import { Icon } from '@/components/icons'

export default function PersonalWatchlist() {
  const store = useStore()
  const [symbol, setSymbol] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const covered = new Set(coverageUniverse().filter((u) => u.tier !== 'none').map((u) => u.symbol))

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    addWatch(symbol)
    setSymbol('')
  }

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <SectionHead
          title="Watchlist"
          sub="Names you are tracking. No market-data provider is connected, so Meridian does not show prices it cannot fetch — research coverage links are real."
        />
        <form onSubmit={add} className="flex gap-2">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Add a ticker, e.g. NVDA"
            className="h-9 w-56 rounded-ctl border border-line bg-surface px-3 text-[13px] uppercase text-ink outline-none focus:border-brand"
            maxLength={8}
          />
          <Button type="submit" variant="primary" icon="plus" disabled={!symbol.trim()}>Add</Button>
        </form>
      </Card>

      {store.watchlist.length === 0 ? (
        <Card pad={false}>
          <EmptyState icon="eye" title="Nothing on the list yet" body="Add tickers above. Anything covered by the Research Lab links straight to its dossier." />
        </Card>
      ) : (
        <Card pad>
          <div className="divide-y divide-line">
            {store.watchlist.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-16 text-[13.5px] font-semibold text-ink">{w.symbol}</span>
                {covered.has(w.symbol) ? (
                  <Link to={`/research/${w.symbol}`}><Badge tone="brand" icon="book">Research dossier</Badge></Link>
                ) : (
                  <Badge tone="neutral">No research coverage</Badge>
                )}
                <span className="text-[11px] text-ink3">added {fmtDate(w.addedAt.slice(0, 10), 'medium')}</span>
                <div className="min-w-0 flex-1">
                  {editingNote === w.id ? (
                    <input
                      autoFocus
                      defaultValue={w.note ?? ''}
                      onBlur={(e) => { updateWatchNote(w.id, e.target.value.trim()); setEditingNote(null) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingNote(null) }}
                      placeholder="Why you're watching it"
                      className="h-8 w-full rounded-ctl border border-brand bg-surface px-2.5 text-[12px] outline-none"
                    />
                  ) : (
                    <button onClick={() => setEditingNote(w.id)} className="max-w-full truncate rounded-md px-1.5 py-0.5 text-left text-[12px] text-ink2 hover:bg-surface2">
                      {w.note || <span className="text-ink3">+ add a note</span>}
                    </button>
                  )}
                </div>
                <button onClick={() => removeWatchItem(w.id)} className="rounded-lg p-1.5 text-ink3 hover:bg-loss-soft hover:text-loss" aria-label={`Remove ${w.symbol}`}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            Live quotes need a market-data key (Twelve Data or similar) wired through a small backend — the adapter
            interface exists in <code>src/research/providers.ts</code>. Until then this list stores exactly what you typed.
          </p>
        </Card>
      )}
    </div>
  )
}
