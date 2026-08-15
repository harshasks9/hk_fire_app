import { useStore } from '@/store/useStore'
import { fmtDate } from '@/lib/format'
import { Badge, Card, EmptyState, SectionHead } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons'

const KIND_META: Record<string, { icon: IconName; tone: 'brand' | 'gain' | 'loss' | 'neutral' | 'info' }> = {
  import: { icon: 'upload', tone: 'brand' },
  edit: { icon: 'settings', tone: 'neutral' },
  create: { icon: 'plus', tone: 'gain' },
  delete: { icon: 'x', tone: 'loss' },
  restore: { icon: 'refresh', tone: 'info' },
}

export default function PersonalTimeline() {
  const store = useStore()

  return (
    <div className="fade-up space-y-5">
      <Card pad>
        <SectionHead
          title="Activity"
          sub="A factual log of every change to your data — imports, edits, deletions, restores. Nothing else is recorded."
        />
        {store.activity.length === 0 ? (
          <EmptyState icon="clock" title="No activity yet" body="Add a record or import a CSV and the change lands here with a timestamp." />
        ) : (
          <div className="space-y-0.5">
            {store.activity.map((a) => {
              const meta = KIND_META[a.kind] ?? KIND_META.edit
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-surface2/60">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-ink3">
                    <Icon name={meta.icon} size={12} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-relaxed text-ink">{a.text}</p>
                    <p className="tnum mt-0.5 text-[10.5px] text-ink3">
                      {fmtDate(a.at.slice(0, 10), 'medium')} · {a.at.slice(11, 16)} UTC
                    </p>
                  </div>
                  <Badge tone={meta.tone}>{a.kind}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
