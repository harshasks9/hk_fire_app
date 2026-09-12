import Link from 'next/link'
import { Mic, Sparkles, Search, Share2, TrendingUp, ShieldCheck, Smartphone, Table2, Tag } from 'lucide-react'
import { getPlatformSettings } from '@/lib/platform'
import { getSession } from '@/lib/session'
import { authEnabled } from '@/lib/auth'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
export const metadata = { title: 'Welcome' }

const FEATURES = [
  { icon: Sparkles, title: 'AI does the filing', text: 'Write or paste anything. People, companies, decisions, numbers and actions are extracted and linked, and every note lands in the right context.' },
  { icon: Mic, title: 'Meetings from your phone', text: 'Record on your iPhone, send the recording or transcript, and get a structured meeting note with speakers, decisions and follow-ups.' },
  { icon: Search, title: 'Ask, with citations', text: 'Questions across everything you have written, answered from your own notes with links back to the source.' },
  { icon: Tag, title: 'Tags and a graph', text: 'Automatic content tags, and an interactive graph of how people, topics, notes and decisions connect.' },
  { icon: Table2, title: 'Sheets and charts', text: 'Excel-style formulas inside notes (PMT, NPV, IRR and sixty more) with bar, line, area and pie charts.' },
  { icon: TrendingUp, title: 'Numbers that move', text: 'Every figure mentioned in your notes becomes a tile with history, so you see what changed and when.' },
  { icon: Smartphone, title: 'Works offline', text: 'Install it on your phone. Notes taken without a signal sync when you are back online.' },
  { icon: Share2, title: 'Share and invite', text: 'Read-only links for anyone, and members in your notebook for people you work with.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Your notebook is yours. Bring your own AI keys, run local-only, export everything, delete it all in one click.' },
]

export default async function WelcomePage() {
  const [settings, session] = await Promise.all([getPlatformSettings(), getSession().catch(() => null)])
  const cta = session || !authEnabled() ? { href: '/', label: 'Open my notebook' } : settings.signupMode === 'open' ? { href: '/signup', label: 'Create your notebook' } : { href: '/login', label: 'Sign in' }
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-8">
      <section className="py-16 text-center sm:py-24">
        <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-accent">AI-native notes</p>
        <h1 className="mx-auto max-w-[760px] text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[54px]">Capture anything. Organize nothing. Find everything.</h1>
        <p className="mx-auto mt-5 max-w-[620px] text-[16px] text-fg-2 sm:text-[18px]">{settings.productName} turns notes, meeting recordings and quick captures into a personal intelligence system: people, decisions, numbers, open loops and a daily brief, without you filing a thing.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={cta.href} className="rounded-xl bg-accent px-5 py-3 text-[15px] font-medium text-accent-fg">{cta.label}</Link>
          <Link href="/pricing" className="rounded-xl border border-border-2 px-5 py-3 text-[15px] font-medium hover:bg-surface-2">See pricing</Link>
        </div>
        {settings.signupMode === 'open' && !session && authEnabled() ? <p className="mt-3 text-[12.5px] text-fg-3">Free plan, no card needed. Upgrade when you outgrow it.</p> : null}
        {settings.signupMode === 'invite' && !session ? <p className="mt-3 text-[12.5px] text-fg-3">Registration is by invitation on this deployment.</p> : null}
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
            <f.icon className="mb-3 h-5 w-5 text-accent" />
            <h3 className="text-[15px] font-semibold">{f.title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-fg-2">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="pb-20">
        <h2 className="mb-2 text-center text-[26px] font-semibold tracking-[-0.02em]">Simple plans</h2>
        <p className="mb-8 text-center text-[14px] text-fg-2">Start free. Pay only when you need more room or more people.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id]
            return (
              <div key={id} className={`rounded-2xl border p-5 ${id === 'pro' ? 'border-accent bg-accent-soft/30' : 'border-border bg-surface'}`}>
                <div className="flex items-baseline justify-between"><h3 className="text-[17px] font-semibold">{p.name}</h3><span className="text-[22px] font-semibold tabular-nums">{p.priceMonthly ? `$${p.priceMonthly}` : 'Free'}<span className="text-[12px] font-normal text-fg-3">{p.priceMonthly ? '/mo' : ''}</span></span></div>
                <p className="mt-1 text-[13px] text-fg-2">{p.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-[13.5px]">{p.highlights.map((h) => <li key={h} className="flex gap-2"><span className="text-accent">✓</span>{h}</li>)}</ul>
              </div>
            )
          })}
        </div>
        <p className="mt-6 text-center"><Link href="/pricing" className="text-[13.5px] font-medium text-accent">Compare every quota →</Link></p>
      </section>
    </div>
  )
}
