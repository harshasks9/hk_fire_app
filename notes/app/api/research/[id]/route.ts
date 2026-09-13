import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { getDb, schema } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { getResearch } from '@/lib/queries'
import { getProvider } from '@/lib/ai/provider'
import { withNotebookAi } from '@/lib/session'
import { embedOwner } from '@/lib/pipeline'
export const maxDuration = 90

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('research', id)
  if (denied) return denied
  const b = (await req.json()) as { synthesize?: boolean; name?: string; question?: string; description?: string; status?: 'active' | 'parked' | 'done' }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.name) set.name = b.name
  if (b.question !== undefined) set.question = b.question
  if (b.description !== undefined) set.description = b.description
  if (b.status) set.status = b.status
  if (b.synthesize) {
    const r = await getResearch(id)
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    let synthesis = ''
    await withNotebookAi(async () => {
    const provider = getProvider()
    if (provider.isLLM && r.notes.length) {
      const notes = await db.select({ title: schema.notes.title, text: schema.notes.contentText }).from(schema.notes).where(eq(schema.notes.researchProjectId, id))
      synthesis = await provider.complete(`Synthesize this research project into 1-2 paragraphs answering the question. Cite specific numbers. Be honest about gaps. End with a one-line working conclusion.\n\nProject: ${r.project.name}\nQuestion: ${r.project.question ?? r.project.description ?? ''}\n\n${notes.map((n) => `## ${n.title}\n${n.text.slice(0, 6000)}`).join('\n\n')}`, { purpose: 'research-synthesis', maxTokens: 1200 }).catch(() => '')
    }
    })
    if (!synthesis) {
      const facts = r.facts.slice(0, 8).map((f) => `${f.entityName} ${f.label.toLowerCase()} ${f.value}`)
      synthesis = `${r.project.name}: ${r.notes.length} notes collected${r.notes[0] ? `, most recently "${r.notes[0].title}"` : ''}. ${facts.length ? `Key figures: ${facts.join('; ')}. ` : ''}${r.decisions.length ? `Working conclusion: ${r.decisions[0]!.statement}` : 'No conclusion recorded yet.'}`
    }
    set.synthesis = synthesis
    set.synthesisUpdatedAt = new Date()
    await embedOwner(r.project.contextId, 'research', id, `${r.project.name}\n${r.project.question ?? ''}\n${synthesis}`)
  }
  await db.update(schema.researchProjects).set(set).where(eq(schema.researchProjects.id, id))
  return NextResponse.json({ ok: true, synthesis: set.synthesis })
}

/** Delete the project. Notes filed under it stay, unfiled. */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('research', id)
  if (denied) return denied
  const db = await getDb()
  await db.update(schema.notes).set({ researchProjectId: null }).where(eq(schema.notes.researchProjectId, id))
  await db.delete(schema.embeddings).where(and(eq(schema.embeddings.ownerType, 'research'), eq(schema.embeddings.ownerId, id)))
  await db.delete(schema.researchProjects).where(eq(schema.researchProjects.id, id))
  return new NextResponse(null, { status: 204 })
}
