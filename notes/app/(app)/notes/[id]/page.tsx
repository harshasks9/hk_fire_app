import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { getNote, listResearch } from '@/lib/queries'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { NoteActions } from '@/components/notes/NoteActions'
import { NotePanel } from '@/components/notes/NotePanel'
import { AiSummary, EntityChip } from '@/components/entities'
import { relativeTime, pluralize } from '@/lib/util'
import { Badge } from '@/components/ui'
import { Lock, EyeOff } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ highlight?: string }> }) {
  const { id } = await params
  const { highlight } = await searchParams
  const d = await getNote(id)
  if (!d) notFound()
  const research = await listResearch(d.note.contextId)
  const companies = d.entities.filter((e) => e.type === 'company')
  const people = d.entities.filter((e) => e.type === 'person')
  const meta: React.ReactNode[] = [`Updated ${relativeTime(d.note.updatedAt)}`]
  if (companies[0]) meta.push(<EntityChip key="c" id={companies[0].id} name={companies[0].name} type="company" subtle />)
  if (d.meeting) meta.push(<Link key="m" href={`/meetings/${d.meeting.id}`} className="hover:text-fg">{d.meeting.title === d.note.title ? 'Meeting' : d.meeting.title}</Link>)
  if (people.length) meta.push(pluralize(people.length, 'person', 'people'))
  if (d.research) meta.push(<Link key="r" href={`/research/${d.research.id}`} className="hover:text-fg">{d.research.name}</Link>)
  if (d.note.privacy === 'private') meta.push(<span key="p" className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>)
  if (d.note.privacy === 'ai_excluded') meta.push(<span key="a" className="inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> AI excluded</span>)
  return (
    <Page width="narrow" className="pt-5">
      <div className="mb-1 flex items-center justify-end">
        <NoteActions noteId={d.note.id} favorite={d.note.favorite} privacy={d.note.privacy} researchProjects={research.map((r) => ({ id: r.id, name: r.name }))} researchProjectId={d.note.researchProjectId} />
      </div>
      <NoteEditor
        noteId={d.note.id}
        initialTitle={d.note.title}
        initialContent={d.note.contentJson}
        highlight={highlight}
        meta={<>{meta.map((m, i) => <span key={i} className="inline-flex items-center gap-2">{i > 0 ? <span className="text-border-2">·</span> : null}{m}</span>)}{d.note.status === 'processing' ? <Badge tone="accent">AI processing</Badge> : null}</>}
        summary={d.note.summary && d.note.summary.summary.length ? <AiSummary summary={d.note.summary} defaultOpen={d.note.wordCount > 120} /> : null}
      />
      <NotePanel d={d} />
    </Page>
  )
}
