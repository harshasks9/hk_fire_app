import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext, resolveContext } from '@/lib/context'
import { createNote, scheduleProcessing } from '@/lib/notes'
import { listNotes } from '@/lib/queries'
import { getSession } from '@/lib/session'
import { getTemplate, renderTemplate } from '@/lib/templates'
import { assertQuota } from '@/lib/plans'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getActiveContext()
  const q = req.nextUrl.searchParams.get('q') ?? undefined
  return NextResponse.json(await listNotes(ctx.id, { q, limit: 50 }))
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { title?: string; markdown?: string; kind?: 'note' | 'meeting' | 'voice' | 'capture' | 'link' | 'document' | 'screenshot' | 'email'; researchProjectId?: string; process?: boolean; contextId?: string; createdAt?: string; source?: string; templateId?: string }
  const ctx = await resolveContext(body.contextId)
  const session = await getSession()
  if (session) { try { await assertQuota(session.notebook, 'notes') } catch (e) { return apiError(e) } }
  const createdAt = body.createdAt && !Number.isNaN(Date.parse(body.createdAt)) ? new Date(body.createdAt) : undefined
  let contentJson: unknown
  let title = body.title
  let kind = body.kind
  if (body.templateId) {
    // New note from a template: placeholders are filled in now.
    const s = await getSession()
    const t = s ? await getTemplate(s.notebookId, body.templateId) : null
    if (!t) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    const r = renderTemplate(t.body, { date: new Date(), notebook: s?.notebook.name, name: s?.user.name, title: body.title })
    contentJson = r.doc
    title = r.title || body.title
    kind = kind ?? (t.summary.kind === 'meeting' ? 'meeting' : 'note')
  }
  const id = await createNote({ contextId: ctx.id, title, markdown: body.markdown, contentJson, kind, researchProjectId: body.researchProjectId, createdAt, source: body.source === 'offline' ? 'offline' : body.templateId ? 'template' : undefined })
  if (body.process || body.markdown) scheduleProcessing(id)
  return NextResponse.json({ id }, { status: 201 })
}
