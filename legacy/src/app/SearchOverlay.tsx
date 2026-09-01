import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/cn'
import { POSITIONS } from '@/data/portfolio'
import { INSTRUMENTS } from '@/data/instruments'
import { ACCOUNTS } from '@/data/household'
import { PROPERTIES, SYNDICATIONS } from '@/data/realestate'
import { DOCUMENTS } from '@/data/documents'
import { WATCHLIST } from '@/data/watchlist'
import { PAGE_TITLES, PERSONAL_PRO_NAV } from './nav'
import { useStore } from '@/store/useStore'
import { ledgerSymbols } from '@/store/selectors'
import type { StoreData } from '@/store/types'
import { coverageUniverse } from '@/research/providers'

interface Result {
  id: string
  icon: IconName
  title: string
  sub: string
  to: string
  group: string
}

function buildIndex(): Result[] {
  const out: Result[] = []
  const seen = new Set<string>()
  for (const p of POSITIONS) {
    if (seen.has(p.symbol)) continue
    seen.add(p.symbol)
    const inst = INSTRUMENTS[p.symbol]
    out.push({ id: `s-${p.symbol}`, icon: 'trendUp', title: `${p.symbol} — ${inst?.name ?? ''}`, sub: 'Holding', to: `/position/${p.symbol}`, group: 'Holdings' })
  }
  for (const w of WATCHLIST) {
    out.push({ id: `w-${w.symbol}`, icon: 'eye', title: w.symbol, sub: 'Watchlist', to: '/watchlist', group: 'Watchlist' })
  }
  for (const a of ACCOUNTS) {
    out.push({ id: `a-${a.id}`, icon: 'wallet', title: `${a.institution} — ${a.name}`, sub: `Account ${a.number}`, to: '/portfolio', group: 'Accounts' })
  }
  for (const p of PROPERTIES) {
    out.push({ id: `p-${p.id}`, icon: 'building', title: p.name, sub: p.address, to: `/real-estate/${p.id}`, group: 'Real Estate' })
  }
  for (const s of SYNDICATIONS) {
    out.push({ id: `sy-${s.id}`, icon: 'briefcase', title: s.name, sub: s.sponsor, to: '/private', group: 'Private Investments' })
  }
  for (const d of DOCUMENTS.slice(0, 12)) {
    out.push({ id: `d-${d.id}`, icon: 'file', title: d.name, sub: d.institution, to: '/documents', group: 'Documents' })
  }
  for (const [path, t] of Object.entries(PAGE_TITLES)) {
    out.push({ id: `pg-${path}`, icon: 'grid', title: t.pro, sub: 'Page', to: path, group: 'Pages' })
  }
  return out
}

/* Personal index — only things that really exist: the user's records, their
   ledger symbols, research coverage, and the personal-mode pages. */
function buildPersonalIndex(store: StoreData): Result[] {
  const out: Result[] = []
  for (const a of store.accounts) {
    out.push({ id: `a-${a.id}`, icon: 'wallet', title: a.name, sub: `Account · ${a.kind}`, to: '/balances', group: 'Your records' })
  }
  for (const a of store.assets) {
    out.push({ id: `as-${a.id}`, icon: 'building', title: a.name, sub: `Asset · ${a.kind}`, to: '/balances', group: 'Your records' })
  }
  for (const l of store.liabilities) {
    out.push({ id: `l-${l.id}`, icon: 'scale', title: l.name, sub: `Liability · ${l.kind}`, to: '/balances', group: 'Your records' })
  }
  for (const g of store.goals) {
    out.push({ id: `g-${g.id}`, icon: 'target', title: g.name, sub: 'Goal', to: '/plan', group: 'Your records' })
  }
  for (const w of store.watchlist) {
    out.push({ id: `w-${w.id}`, icon: 'eye', title: w.symbol, sub: 'Watchlist', to: '/watchlist', group: 'Watchlist' })
  }
  for (const s of ledgerSymbols(store).slice(0, 60)) {
    out.push({ id: `ls-${s}`, icon: 'receipt', title: s, sub: 'In your ledger', to: '/ledger', group: 'Ledger symbols' })
  }
  for (const u of coverageUniverse()) {
    if (u.tier !== 'none') out.push({ id: `r-${u.symbol}`, icon: 'book', title: `${u.symbol} research`, sub: 'Sample dossier', to: `/research/${u.symbol}`, group: 'Research' })
  }
  for (const g of PERSONAL_PRO_NAV) {
    for (const it of g.items) {
      out.push({ id: `pg-${it.to}`, icon: it.icon, title: it.label, sub: 'Page', to: it.to, group: 'Pages' })
    }
  }
  return out
}

export function SearchOverlay() {
  const app = useApp()
  const store = useStore()
  const navigate = useNavigate()
  const personal = app.dataMode === 'personal'
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const index = useMemo(() => (personal ? buildPersonalIndex(store) : buildIndex()), [personal, store])

  useEffect(() => {
    if (app.searchOpen) {
      setQ('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [app.searchOpen])

  if (!app.searchOpen) return null

  const results = q.trim()
    ? index.filter((r) => (r.title + ' ' + r.sub + ' ' + r.group).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12)
    : index.filter((r) => (personal ? ['Your records', 'Pages'] : ['Holdings', 'Real Estate']).includes(r.group)).slice(0, 8)

  const go = (r: Result) => {
    app.setSearchOpen(false)
    navigate(r.to)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12dvh]" role="dialog" aria-modal aria-label="Global search">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => app.setSearchOpen(false)} />
      <div className="fade-up relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Icon name="search" size={17} className="text-ink3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
              if (e.key === 'Enter' && results[sel]) go(results[sel])
            }}
            placeholder="Search positions, accounts, properties, documents, pages…"
            className="h-12 w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
          />
          <kbd className="rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] text-ink3">esc</kbd>
        </div>
        <div className="scroll-thin max-h-[50dvh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-ink2">No matches for “{q}”. Try a ticker, account, property or page name.</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => go(r)}
              onMouseEnter={() => setSel(i)}
              className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left', i === sel ? 'bg-brand-soft' : '')}
            >
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', i === sel ? 'bg-brand text-invert' : 'bg-surface2 text-ink2')}>
                <Icon name={r.icon} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{r.title}</span>
                <span className="block truncate text-[11px] text-ink3">{r.sub}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide text-ink3">{r.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
