import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { GraphView } from '@/components/graph/GraphView'
import { GRAPH_TYPES, type GraphNodeType } from '@/lib/graph'

export const dynamic = 'force-dynamic'

export default async function GraphPage({ searchParams }: { searchParams: Promise<{ focus?: string; types?: string; depth?: string; all?: string }> }) {
  const sp = await searchParams
  const ctx = await getActiveContext()
  const types = (sp.types ?? '').split(',').map((s) => s.trim()).filter((s): s is GraphNodeType => (GRAPH_TYPES as string[]).includes(s))
  return (
    <Page width="wide">
      <PageHeader title="Graph" subtitle={`People, companies, topics, tags, notes, meetings and decisions in ${ctx.name}, and how they connect. Click anything to explore from there.`} />
      <GraphView initial={{ focus: sp.focus ?? null, types, depth: sp.depth === '2' ? 2 : 1, all: sp.all === '1' }} />
    </Page>
  )
}
