'use client'
import * as React from 'react'
import { MailWarning, Megaphone, X } from 'lucide-react'
import { api } from '@/lib/client'

/** A platform-wide announcement the admin set; dismissible per browser (by its text). */
export function AnnouncementBanner({ text }: { text: string }) {
  const [hidden, setHidden] = React.useState(true)
  React.useEffect(() => { try { setHidden(localStorage.getItem('hkn-announcement') === text) } catch { setHidden(false) } }, [text])
  if (!text || hidden) return null
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-accent/30 bg-accent-soft/50 px-3 py-1.5 text-[12.5px]">
      <Megaphone className="h-3.5 w-3.5 shrink-0 text-accent" /><span className="min-w-0 flex-1">{text}</span>
      <button className="rounded p-0.5 text-fg-3 hover:text-fg" aria-label="Dismiss" onClick={() => { try { localStorage.setItem('hkn-announcement', text) } catch { /* ignore */ } setHidden(true) }}><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

/** Shown until the account's email address is confirmed. */
export function VerifyBanner({ email }: { email: string }) {
  const [state, setState] = React.useState<'idle' | 'busy' | 'sent' | { link: string }>('idle')
  const resend = async () => {
    setState('busy')
    try { const r = await api<{ sent: boolean; link: string | null }>('/api/auth/resend', { method: 'POST' }); setState(r.sent ? 'sent' : r.link ? { link: r.link } : 'idle') } catch { setState('idle') }
  }
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-warning/40 bg-warning/10 px-3 py-1.5 text-[12.5px] text-warning">
      <MailWarning className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1">Confirm your email address ({email}) so you can recover your account.</span>
      {state === 'sent' ? <span className="font-medium">Sent. Check your inbox.</span> : typeof state === 'object' ? <a href={state.link} className="truncate font-medium underline">Open the confirmation link</a> : <button disabled={state === 'busy'} className="rounded-md border border-warning/40 px-2 py-0.5 font-medium hover:bg-warning/10" onClick={resend}>{state === 'busy' ? 'Sending…' : 'Resend email'}</button>}
    </div>
  )
}
