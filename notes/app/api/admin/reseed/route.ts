import { NextResponse } from 'next/server'
import { runSeed } from '@/lib/seed/run'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
export const maxDuration = 300
/** Replace this notebook's data with the sample dataset. */
export async function POST() {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can reset its data' }, { status: 403 })
    const r = await runSeed({ force: true, notebookId: s.notebookId })
    return NextResponse.json(r)
  } catch (e) {
    return apiError(e)
  }
}
