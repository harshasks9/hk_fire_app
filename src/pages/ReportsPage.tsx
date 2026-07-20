import React, { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { positionMetrics, netWorthSnapshot, incomeAgg } from '@/data/selectors'
import { POSITIONS } from '@/data/portfolio'
import { INSTRUMENTS } from '@/data/instruments'
import { fmtMoney, fmtDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/cn'

interface ReportDef {
  id: string
  title: string
  desc: string
  icon: IconName
  mode: 'simple' | 'pro'
  formats: string[]
  build?: () => string // returns CSV
}

export default function ReportsPage() {
  const app = useApp()
  const c = app.currency
  const pro = app.mode === 'pro'
  const [generated, setGenerated] = useState<string | null>(null)

  const download = (name: string, content: string, type = 'text/csv') => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
  }

  const holdingsCsv = () => {
    const rows = positionMetrics(c)
    return ['Symbol,Name,Account,Qty,Value,CostBasis,Unrealized,Provenance,AsOf']
      .concat(rows.map((r) => `${r.symbol},"${r.name}","${r.accountLabel}",${r.qty},${r.value.toFixed(0)},${r.cost.toFixed(0)},${r.unrealized.toFixed(0)},${r.provenance},${r.asOf}`))
      .join('\n')
  }
  const lotsCsv = () => {
    const out = ['Symbol,Account,AcquiredDate,Qty,CostPerUnit,Provenance']
    for (const p of POSITIONS) for (const l of p.lots) out.push(`${p.symbol},${p.accountId},${l.date},${l.qty},${l.costPerUnit},${l.source.provenance}`)
    return out.join('\n')
  }

  const REPORTS: ReportDef[] = [
    { id: 'networth', title: 'Net worth statement', desc: 'Assets, liabilities and equity by category and owner', icon: 'wallet', mode: 'simple', formats: ['PDF', 'CSV'], build: () => { const s = netWorthSnapshot(c); return `Category,Value\nInvestable,${s.investable.toFixed(0)}\nCash,${s.cash.toFixed(0)}\nReal estate,${s.realEstateValue.toFixed(0)}\nPrivate,${s.privateValue.toFixed(0)}\nLiabilities,-${s.liabilities.toFixed(0)}\nNet worth,${s.total.toFixed(0)}` } },
    { id: 'portfolio', title: 'Portfolio summary', desc: 'Positions, values, gains and allocation', icon: 'pie', mode: 'simple', formats: ['PDF', 'CSV', 'Excel'], build: holdingsCsv },
    { id: 'income', title: 'Passive income report', desc: 'Received and projected income by stream and month', icon: 'coins', mode: 'simple', formats: ['PDF', 'CSV'], build: () => { const a = incomeAgg(c); return ['Month,Received,Expected'].concat(a.byMonth.map((m) => `${m.month},${m.received.toFixed(0)},${m.expected.toFixed(0)}`)).join('\n') } },
    { id: 'realestate', title: 'Real estate report', desc: 'Values, equity, cash flow and obligations', icon: 'building', mode: 'simple', formats: ['PDF'] },
    { id: 'liabilities', title: 'Liabilities report', desc: 'Balances, rates, payments, payoff dates', icon: 'scale', mode: 'simple', formats: ['PDF', 'CSV'] },
    { id: 'goals', title: 'Goal progress', desc: 'Funding status and projections for each goal', icon: 'target', mode: 'simple', formats: ['PDF'] },
    { id: 'annual', title: 'Annual financial review', desc: 'The complete year in one narrative document', icon: 'book', mode: 'simple', formats: ['PDF'] },
    { id: 'holdings', title: 'Holdings detail', desc: 'Every position with account, basis and provenance', icon: 'reportChart', mode: 'pro', formats: ['CSV', 'Excel'], build: holdingsCsv },
    { id: 'lots', title: 'Tax lots', desc: 'Complete lot-level basis with acquisition dates', icon: 'receipt', mode: 'pro', formats: ['CSV'], build: lotsCsv },
    { id: 'gains', title: 'Realized gains', desc: 'ST/LT gains with lot matching, both jurisdictions', icon: 'trendUp', mode: 'pro', formats: ['CSV', 'PDF'] },
    { id: 'optionspl', title: 'Options P&L', desc: 'Premium by underlying, open risk, assignment log', icon: 'layers', mode: 'pro', formats: ['CSV'] },
    { id: 'property', title: 'Property performance', desc: 'NOI, cap rate, CoC, DSCR per property', icon: 'building', mode: 'pro', formats: ['PDF', 'Excel'] },
    { id: 'synd', title: 'Syndicated investments', desc: 'Capital account, distributions, IRR vs underwriting', icon: 'briefcase', mode: 'pro', formats: ['PDF'] },
    { id: 'fx', title: 'Currency exposure', desc: 'Assets and income by currency with sensitivity', icon: 'compass', mode: 'pro', formats: ['CSV'] },
    { id: 'leverage', title: 'Leverage report', desc: 'LTVs, covenants, rate mix, service coverage', icon: 'scale', mode: 'pro', formats: ['PDF'] },
    { id: 'dq', title: 'Data quality audit', desc: 'Provenance, staleness and conflicts per record', icon: 'shield', mode: 'pro', formats: ['CSV'] },
    { id: 'docaudit', title: 'Document audit trail', desc: 'Every upload, extraction and approval event', icon: 'file', mode: 'pro', formats: ['CSV'] },
  ]

  const visible = REPORTS.filter((r) => pro || r.mode === 'simple')

  return (
    <div className="fade-up space-y-4">
      <Card pad className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold text-ink">Reports</div>
          <p className="text-[12px] text-ink2">Point-in-time documents built from your records. Generated {fmtDate('2026-07-20', 'long')} in {c}.</p>
        </div>
        {pro && <Button variant="secondary" size="sm" icon="plus">Custom report</Button>}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => (
          <Card key={r.id} pad className="flex flex-col">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink2"><Icon name={r.icon} size={16} /></span>
              {r.mode === 'pro' && <Badge tone="violet">Pro</Badge>}
            </div>
            <div className="mt-2.5 text-[13.5px] font-semibold text-ink">{r.title}</div>
            <p className="mt-0.5 flex-1 text-[11.5px] leading-relaxed text-ink2">{r.desc}</p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[10.5px] text-ink3">{r.formats.join(' · ')}</span>
              <Button
                size="sm"
                variant="secondary"
                icon="download"
                onClick={() => {
                  if (r.build) download(`meridian-${r.id}.csv`, r.build())
                  setGenerated(r.id)
                  setTimeout(() => setGenerated(null), 2500)
                }}
              >
                {generated === r.id ? 'Generated ✓' : 'Generate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="px-1 text-[11px] text-ink3">CSV downloads are produced from live records. PDF and Excel rendering use the same data pipeline (CSV provided in this build).</p>
    </div>
  )
}
