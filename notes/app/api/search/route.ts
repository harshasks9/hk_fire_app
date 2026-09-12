import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext, getContexts } from '@/lib/context'
import { search } from '@/lib/search'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const all = req.nextUrl.searchParams.get('all') === '1'
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 8)
  const ctx = await getActiveContext()
  const ids = all ? (await getContexts()).map((c) => c.id) : [ctx.id]
  return NextResponse.json(await search(ids, q, { limit }))
}
