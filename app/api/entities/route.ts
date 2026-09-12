import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { searchEntitiesByName } from '@/lib/queries'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const ctx = await getActiveContext()
  const q = req.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json(await searchEntitiesByName(ctx.id, q, 8))
}
