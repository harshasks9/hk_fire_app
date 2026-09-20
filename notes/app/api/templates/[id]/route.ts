import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { deleteTemplate, getTemplate, renderTemplate, updateTemplate } from '@/lib/templates'
export const dynamic = 'force-dynamic'

/** A template body, rendered for now (used by the editor's /template command). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    const { id } = await params
    const t = await getTemplate(s.notebookId, id)
    if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const title = req.nextUrl.searchParams.get('title') ?? ''
    return NextResponse.json({ template: t.summary, rendered: renderTemplate(t.body, { date: new Date(), notebook: s.notebook.name, name: s.user.name, title }) })
  } catch (e) {
    return apiError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    const { id } = await params
    const b = (await req.json().catch(() => ({}))) as { name?: string; description?: string }
    await updateTemplate(s.notebookId, id, b)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireSession()
    const { id } = await params
    await deleteTemplate(s.notebookId, id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return apiError(e)
  }
}
