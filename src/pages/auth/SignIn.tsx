import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Button } from '@/components/ui'

/**
 * Shared access key for the workspace.
 *
 * This is a single client-side gate, not authentication: the key ships in the
 * JavaScript bundle and anyone who can load the page can read it. It keeps a
 * casual visitor out of a demo build; it does not protect anything, and no real
 * secret should ever be placed behind it.
 *
 * Override per-deployment with VITE_ACCESS_KEY rather than editing this file.
 */
const ACCESS_KEY = (import.meta.env.VITE_ACCESS_KEY ?? '').trim() || '888888'

export default function SignIn() {
  const app = useApp()
  const navigate = useNavigate()
  // Read at submit time: password-manager autofill paints a value without
  // firing React onChange, so component state alone can wrongly read as empty.
  const keyRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const entered = keyRef.current?.value.trim() ?? ''
    if (!entered) {
      setError('Enter your access key.')
      return
    }
    if (entered !== ACCESS_KEY) {
      setError('That key is not right. Try again.')
      return
    }
    setError('')
    setBusy(true)
    setTimeout(() => {
      app.setAuthenticated(true)
      navigate(app.onboarded ? '/' : '/onboarding')
    }, 400)
  }

  return (
    <div className="flex min-h-dvh">
      {/* Brand panel */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-brand2 p-10 lg:flex">
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" />
              <path d="M3 21.5h18" opacity="0.65" />
            </svg>
          </div>
          <span className="font-display text-[19px] font-semibold text-white">Meridian</span>
        </div>
        <div className="relative">
          <h1 className="font-display max-w-md text-[32px] font-semibold leading-tight text-white">
            Every account, property, policy and rupee — one operating system.
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-white/70">
            What you own. What you owe. What changed, why it changed, and what to do next — with every number traceable to a source document.
          </p>
          <div className="mt-8 flex gap-6 text-white/60">
            {[
              ['🇺🇸 + 🇮🇳', 'Multi-country'],
              ['⌁', 'Document-native'],
              ['◎', 'Provenance on every value'],
            ].map(([a, b]) => (
              <div key={b} className="text-[12px]"><span className="mr-1.5">{a}</span>{b}</div>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-white/40">Encrypted at rest and in transit · SOC 2 in progress · You own your data</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-bg px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-invert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" /><path d="M3 21.5h18" opacity="0.65" /></svg>
            </div>
            <span className="font-display text-[18px] font-semibold text-ink">Meridian</span>
          </div>

          <form onSubmit={submit} className="fade-up">
            <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">Welcome back</h2>
            <p className="mt-1 text-[13px] text-ink2">Enter your access key to open the workspace.</p>
            <label className="mt-6 block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink2">Access key</span>
              <input
                ref={keyRef}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={32}
                placeholder="••••••"
                onChange={() => setError('')}
                className="tnum h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-center text-[18px] tracking-[0.4em] text-ink outline-none focus:border-brand"
              />
            </label>
            {error && <p role="alert" className="mt-2 text-[12px] text-loss">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>
              {busy ? 'Opening…' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
