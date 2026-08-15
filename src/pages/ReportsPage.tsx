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
    /* Only reports that actually build a file exist here. Anything this build
       can't produce is not shown as a card — no fake "Generated ✓". */
    { id: 'networth', title: 'Net worth statement', desc: 'Assets, liabilities and equity by category', icon: 'wallet', mode: 'simple', formats: ['CSV'], build: () => { const s = netWorthSnapshot(c); return `Category,Value\nInvestable,${s.investable.toFixed(0)}\nCash,${s.cash.toFixed(0)}\nReal estate,${s.realEstateValue.toFixed(0)}\nPrivate,${s.privateValue.toFixed(0)}\nLiabilities,-${s.liabilities.toFixed(0)}\nNet worth,${s.total.toFixed(0)}` } },
    { id: 'portfolio', title: 'Portfolio summary', desc: 'Positions, values, gains and allocation', icon: 'pie', mode: 'simple', formats: ['CSV'], build: holdingsCsv },
    { id: 'income', title: 'Passive income report', desc: 'Received and projected income by stream and month', icon: 'coins', mode: 'simple', formats: ['CSV'], build: () => { const a = incomeAgg(c); return ['Month,Received,Expected'].concat(a.byMonth.map((m) => `${m.month},${m.received.toFixed(0)},${m.expected.toFixed(0)}`)).join('\n') } },
    { id: 'holdings', title: 'Holdings detail', desc: 'Every position with account, basis and provenance', icon: 'reportChart', mode: 'pro', formats: ['CSV'], build: holdingsCsv },
    { id: 'lots', title: 'Tax lots', desc: 'Complete lot-level basis with acquisition dates', icon: 'receipt', mode: 'pro', formats: ['CSV'], build: lotsCsv },
  ]

  const visible = REPORTS.filter((r) => pro || r.mode === 'simple')

  return (
    <div className="fade-up space-y-4">
      <Card pad className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold text-ink">Reports</div>
          <p className="text-[12px] text-ink2">Point-in-time CSVs built from the demo dataset at the moment you click, in {c}.</p>
        </div>
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
      <p className="px-1 text-[11px] text-ink3">
        Every button above downloads a real file. PDF/Excel rendering and the removed report types (real estate, gains,
        options P&L…) return when their data pipelines are real — they are not listed until then.
      </p>
    </div>
  )
}
