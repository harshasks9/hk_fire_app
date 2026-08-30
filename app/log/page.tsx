import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { formatExpiry } from '@/lib/exits'
import LogForm from '@/components/LogForm'
import { SectionTitle } from '@/components/ui'
import { PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const db = await getDb()
  const approved = await db.select().from(schema.tickets).where(eq(schema.tickets.status, 'approved'))
  const options = approved.map((t) => ({
    id: t.id,
    label: `${t.symbol} ${formatExpiry(t.expiry)} ${t.strike}${t.type === 'call' ? 'C' : 'P'} ×${t.lots} (modelled $${Math.round(t.modelledCredit)})`,
    symbol: t.symbol,
    type: t.type as 'call' | 'put',
    strike: t.strike,
    expiry: t.expiry,
    lots: t.lots,
    modelledCredit: t.modelledCredit,
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Log a fill <PageHelp entry={GLOSSARY.page_log} />
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        The loop closes here. Enter the broker’s actual numbers — the modelled ones were never the trade.
      </p>
      <SectionTitle>Fill</SectionTitle>
      <LogForm tickets={options} />
    </div>
  )
}
