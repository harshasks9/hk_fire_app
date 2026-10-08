import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { requireSession } from '@/lib/session'
import { createContext, listContexts } from '@/lib/contexts-admin'
import type { ContextKind } from '@/lib/db/schema'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const s = await requireSession()
    return NextResponse.json({ contexts: await listContexts(s.notebookId) })
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change contexts' }, { status: 403 })
    const b = (await req.json()) as { name: string; kind?: ContextKind; description?: string }
    const c = await createContext({ notebookId: s.notebookId, name: b.name ?? '', kind: b.kind, description: b.description })
    return NextResponse.json({ context: c }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
