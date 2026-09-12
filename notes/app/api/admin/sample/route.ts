import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { removeSampleData, sampleCounts } from '@/lib/seed/remove'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** How much sample content this notebook still carries. */
export async function GET() {
  try {
    const s = await requireSession()
    return NextResponse.json({ counts: await sampleCounts(s.notebookId), sampleData: s.notebook.settings?.sampleData !== false })
  } catch (e) {
    return apiError(e)
  }
}

/** Remove the sample dataset, keeping everything the owner wrote. */
export async function DELETE() {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can remove data' }, { status: 403 })
    const r = await removeSampleData(s.notebookId)
    return NextResponse.json(r)
  } catch (e) {
    return apiError(e)
  }
}
