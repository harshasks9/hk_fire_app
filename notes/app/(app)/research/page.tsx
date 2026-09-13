import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, Badge } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { listResearch } from '@/lib/queries'
import { NewResearch } from '@/components/notes/NewResearch'
import { ResearchActions } from '@/components/crud/actions'
import { FlaskConical } from 'lucide-react'
import { relativeTime, pluralize } from '@/lib/util'
export const dynamic = 'force-dynamic'
export default async function ResearchPage() {
  const scope = await getActiveScope()
  const contexts = scope.contexts
  // Research projects live in their own context but are reachable from every context.
  const items = await listResearch(!scope.all && scope.active.kind === 'research' ? scope.active.id : undefined)
  return (
    <Page>
      <PageHeader title="Research" subtitle="Long-running investigations. Notes, PDFs, links, screenshots and numbers are synthesized across the whole project." actions={<NewResearch />} />
      {items.length === 0 ? <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No research projects" description="Create one for anything you keep coming back to — an investment idea, a tax question, a purchase." /> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <li key={r.id} className="group relative h-full rounded-xl border border-border bg-surface transition hover:border-border-2 hover:shadow-soft">
              <Link href={`/research/${r.id}`} className="block h-full p-4">
                <div className="flex items-center justify-between gap-2 pr-7">
                  <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{r.name}</h2>
                  <Badge tone={r.status === 'active' ? 'accent' : 'neutral'}>{r.status}</Badge>
                </div>
                {r.question ? <p className="mt-1 line-clamp-2 text-[13.5px] text-fg-2">{r.question}</p> : null}
                {r.synthesis ? <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-fg-2">{r.synthesis}</p> : null}
                <div className="mt-3 text-[12px] text-fg-3">{pluralize(r.noteCount, 'note')} · {contexts.find((c) => c.id === r.contextId)?.name} · updated {relativeTime(r.updatedAt)}</div>
              </Link>
              <ResearchActions project={r} className="absolute right-3 top-3" />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
