import { NextRequest, NextResponse } from 'next/server'
import { getContexts } from '@/lib/context'
import { getSession } from '@/lib/session'
import { contextZip, safeFilename } from '@/lib/export'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** A zip of one context (`?context=<id>`) or of the whole notebook (`?context=all`, the default). */
export async function GET(req: NextRequest) {
  try {
    const contexts = await getContexts()
    const wanted = req.nextUrl.searchParams.get('context') ?? 'all'
    const selected = wanted === 'all' ? contexts : contexts.filter((c) => c.id === wanted || c.slug === wanted)
    if (!selected.length) return NextResponse.json({ error: 'Unknown context' }, { status: 404 })
    const session = await getSession()
    const label = wanted === 'all' ? (session?.notebook.name ?? 'Notebook') : selected[0]!.name
    const zip = await contextZip({ contexts: selected, label })
    const name = `${safeFilename(label, 'notes')} ${new Date().toISOString().slice(0, 10)}.zip`
    return new NextResponse(zip as unknown as BodyInit, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`, 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    return apiError(e)
  }
}
