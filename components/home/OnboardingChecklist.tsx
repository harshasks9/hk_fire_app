import Link from 'next/link'
import { CheckCircle2, Circle, PenLine, Mic, Upload, Users, MailCheck, Smartphone } from 'lucide-react'

/** The first-week checklist on Home for a fresh notebook. Disappears once there are a handful of notes. */
export function OnboardingChecklist({ noteCount, verified, canInvite }: { noteCount: number; verified: boolean; canInvite: boolean }) {
  const steps = [
    { done: noteCount > 0, icon: PenLine, title: 'Write your first note', text: 'Anything at all: a thought, a link, a paste. People, numbers and actions are extracted for you.', href: '/notes', cta: 'New note' },
    { done: false, icon: Mic, title: 'Turn a meeting recording into notes', text: 'Send a recording or transcript from your phone; it becomes a structured meeting note.', href: '/meetings/import', cta: 'Import a recording' },
    { done: false, icon: Upload, title: 'Bring what you already have', text: 'Import Markdown, text or a JSON export. Everything is analyzed and filed.', href: '/settings#import', cta: 'Import' },
    { done: verified, icon: MailCheck, title: 'Confirm your email', text: 'So you can reset your password if you ever need to.', href: '/settings#account', cta: 'Account' },
    ...(canInvite ? [{ done: false, icon: Users, title: 'Invite someone', text: 'Members see the same notebook with their own login.', href: '/settings#people', cta: 'People' }] : []),
    { done: false, icon: Smartphone, title: 'Install it on your phone', text: 'Add to Home Screen from the browser share menu. Works offline.', href: '/settings', cta: 'How' },
  ]
  const doneCount = steps.filter((s) => s.done).length
  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Welcome. Here is how to get the most out of the first week.</h2>
        <span className="text-[12px] text-fg-3">{doneCount} of {steps.length}</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.title} className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-2.5">
            {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13.5px] font-medium"><s.icon className="h-3.5 w-3.5 text-fg-3" />{s.title}</div>
              <p className="text-[12.5px] text-fg-2">{s.text}</p>
            </div>
            {!s.done ? <Link href={s.href} className="shrink-0 rounded-md border border-border px-2 py-1 text-[12px] font-medium text-accent hover:bg-accent-soft">{s.cta}</Link> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
