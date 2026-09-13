import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { getActiveScope } from '@/lib/context'
import { buildGraph, GRAPH_TYPES, type GraphNodeType } from '@/lib/graph'
export const dynamic = 'force-dynamic'

/**
 * GET /api/graph?types=person,company&focus=note:<id>&depth=2&all=1
 * Nodes and edges for the graph explorer, scoped to the active context (or every context with all=1).
 */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams
    const scope = await getActiveScope()
    const ids = p.get('all') === '1' ? scope.contexts.map((c) => c.id) : scope.ids
    const types = (p.get('types') ?? '').split(',').map((s) => s.trim()).filter((s): s is GraphNodeType => (GRAPH_TYPES as string[]).includes(s))
    const f = p.get('focus')
    let focus: { type: GraphNodeType; id: string } | null = null
    if (f && f.includes(':')) {
      const [t, ...rest] = f.split(':')
      if ((GRAPH_TYPES as string[]).includes(t!)) focus = { type: t as GraphNodeType, id: rest.join(':') }
    }
    const depth = p.get('depth') === '2' ? 2 : 1
    const data = await buildGraph({ contextIds: ids, types, focus, depth, limit: Math.min(400, Number(p.get('limit') ?? 160) || 160) })
    return NextResponse.json(data)
  } catch (e) {
    return apiError(e)
  }
}
