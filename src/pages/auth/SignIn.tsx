import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

type Step = 'credentials' | 'mfa' | 'create'

export default function SignIn() {
  const app = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('harshasks@gmail.com')
  // Password is read from the DOM at submit time: browser/password-manager
  // autofill paints a value without firing React onChange, so state alone
  // would wrongly report the field as empty.
  const passwordRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = () => {
    setBusy(true)
    setTimeout(() => {
      app.setAuthenticated(true)
      navigate(app.onboarded ? '/' : '/onboarding')
    }, 600)
  }

  const submitCreds = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordRef.current?.value) {
      setError('Enter your password — or use a passkey below.')
      return
    }
    setError('')
    setStep('mfa')
  }

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.join('').length < 6) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setError('')
    finish()
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

          {step === 'credentials' && (
            <form onSubmit={submitCreds} className="fade-up">
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">Welcome back</h2>
              <p className="mt-1 text-[13px] text-ink2">Sign in to your wealth workspace.</p>
              <label className="mt-6 block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-brand" />
              </label>
              <label className="mt-3.5 block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Password</span>
                <input ref={passwordRef} type="password" onChange={() => setError('')} autoComplete="current-password" placeholder="••••••••••••"
                  className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-brand" />
              </label>
              {error && <p role="alert" className="mt-2 text-[12px] text-loss">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>Continue</Button>
              <Button type="button" variant="secondary" size="lg" icon="fingerprint" className="mt-2.5 w-full" onClick={finish}>
                Sign in with passkey
              </Button>
              <p className="mt-6 text-center text-[12.5px] text-ink2">
                New to Meridian?{' '}
                <button type="button" onClick={() => setStep('create')} className="font-medium text-brand hover:underline">Create an account</button>
              </p>
            </form>
          )}

          {step === 'mfa' && (
            <form onSubmit={submitCode} className="fade-up">
              <button type="button" onClick={() => setStep('credentials')} className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-ink2 hover:text-ink"><Icon name="chevronLeft" size={13} />Back</button>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon name="lock" size={20} /></div>
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">Two-factor check</h2>
              <p className="mt-1 text-[13px] text-ink2">Enter the 6-digit code from your authenticator app.</p>
              <div className="mt-6 flex gap-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    aria-label={`Digit ${i + 1}`}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      const next = [...code]
                      next[i] = v
                      setCode(next)
                      if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
                    }}
                    className="tnum h-13 w-full rounded-ctl border border-line bg-surface text-center text-[20px] font-semibold text-ink outline-none focus:border-brand"
                  />
                ))}
              </div>
              {error && <p role="alert" className="mt-2 text-[12px] text-loss">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify & sign in'}</Button>
              <p className="mt-4 text-center text-[12px] text-ink3">Lost your device? Use a recovery code.</p>
            </form>
          )}

          {step === 'create' && (
            <form onSubmit={(e) => { e.preventDefault(); app.setOnboarded(false); finish() }} className="fade-up">
              <button type="button" onClick={() => setStep('credentials')} className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-ink2 hover:text-ink"><Icon name="chevronLeft" size={13} />Back</button>
              <h2 className="font-display text-[22px] font-semibold tracking-tight text-ink">Create your workspace</h2>
              <p className="mt-1 text-[13px] text-ink2">A few minutes now; a complete financial picture after your first upload.</p>
              <label className="mt-6 block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Email</span>
                <input type="email" defaultValue={email} className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-brand" />
              </label>
              <label className="mt-3.5 block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Password</span>
                <input type="password" placeholder="12+ characters" className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] text-ink outline-none focus:border-brand" />
                <span className="mt-1 block text-[11px] text-ink3">You'll set up MFA and an optional passkey during onboarding.</span>
              </label>
              <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>Create account</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
