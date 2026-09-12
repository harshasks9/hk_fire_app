import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState } from '@/components/ui'
import { getActiveContext, getContexts } from '@/lib/context'
import { search, highlight } from '@/lib/search'
import { SearchBox } from '@/components/ask/SearchBox'
import { EntityIcon, NoteKindIcon } from '@/components/entities'
import { formatDate } from '@/lib/util'
import { Sparkles, ArrowRight, CheckSquare, GitBranch, FlaskConical, Repeat } from 'lucide-react'
export const dynamic = 'force-dynamic'
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; all?: string }> }) {
  const { q = '', all } = await searchParams
  const ctx = await getActiveContext()
  const ids = all === '1' ? (await getContexts()).map((c) => c.id) : [ctx.id]
  const result = q ? await search(ids, q, { limit: 10 }) : null
  return (
    <Page>
      <PageHeader title="Search" subtitle="Exact keywords, meaning, people, companies, topics and questions — one box." />
      <SearchBox initial={q} all={all === '1'} contextName={ctx.name} />
      {result && q ? (
        <div className="mt-6">
          {result.isQuestion ? (
            <Link href={`/ask?q=${encodeURIComponent(q)}`} className="mb-6 flex items-center gap-3 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-4 py-3 text-[14px] hover:bg-accent-soft">
              <Sparkles className="h-4 w-4 text-accent" /><span className="flex-1">This looks like a question. Ask your notes for a synthesized answer with citations.</span><ArrowRight className="h-4 w-4 text-accent" />
            </Link>
          ) : null}
          {result.groups.length === 0 ? <EmptyState title={`Nothing for “${q}”`} description="Try a person, a company, a phrase you remember, or ask it as a question." /> : null}
          {result.groups.map((g) => (
            <section key={g.type} className="mb-7">
              <h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{g.label} <span className="font-normal">{g.hits.length}</span></h2>
              <ul>
                {g.hits.map((h) => {
                  const Icon = h.type === 'task' ? CheckSquare : h.type === 'decision' ? GitBranch : h.type === 'research' ? FlaskConical : h.type === 'commitment' ? Repeat : null
                  return (
                    <li key={h.type + h.id}>
                      <Link href={h.href} className="group -mx-3 flex items-start gap-3 rounded-lg px-3 py-2 row-hover">
                        <span className="mt-[3px] text-fg-3">{Icon ? <Icon className="h-4 w-4" /> : h.type === 'note' || h.type === 'meeting' ? <NoteKindIcon kind={h.type} /> : <EntityIcon type={h.type} className="h-4 w-4" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-[14.5px] font-medium group-hover:text-accent" dangerouslySetInnerHTML={{ __html: highlight(h.title, q) }} />{h.matchKind === 'semantic' ? <span className="text-[10.5px] text-accent">semantic match</span> : null}</span>
                          {h.subtitle ? <span className="block text-[12.5px] text-fg-3">{h.subtitle}</span> : null}
                          {h.snippet ? <span className="block text-[13px] text-fg-2 [&_mark]:rounded [&_mark]:bg-warning/25 [&_mark]:px-0.5" dangerouslySetInnerHTML={{ __html: highlight(h.snippet, q) }} /> : null}
                        </span>
                        {h.date ? <span className="shrink-0 text-[12px] text-fg-3">{formatDate(h.date)}</span> : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-[13.5px] text-fg-3">
          <p className="mb-2">Try:</p>
          <ul className="flex flex-wrap gap-1.5">{['Nissan', 'marketplace cap', 'Samsung Korea', 'What did we decide with TCS about ODCs?', 'Show every commitment I made to Thomas', 'dedicated capacity'].map((s) => <li key={s}><Link href={`/search?q=${encodeURIComponent(s)}`} className="rounded-md border border-border px-2 py-1 text-fg-2 hover:bg-surface-2 hover:text-fg">{s}</Link></li>)}</ul>
        </div>
      )}
    </Page>
  )
}
