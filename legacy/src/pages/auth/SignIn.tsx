import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { setProfileName } from '@/store/store'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons'

/* Honest device lock.

   There is no server and no account. What this screen really does:
   - first run: capture a display name and (optionally) a passcode whose
     SHA-256 hash is stored on this device;
   - later runs: verify the passcode against that hash, or just enter if
     none was set.
   It says exactly that on screen. No fake MFA, no fake passkeys, no
   security claims the build cannot keep. */

const PASS_KEY = 'meridian.passcodeHash'

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function SignIn() {
  const app = useApp()
  const store = useStore()
  const navigate = useNavigate()
  const hasPasscode = !!localStorage.getItem(PASS_KEY)
  const firstRun = !store.profileName && !hasPasscode

  const [name, setName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const passRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (app.authenticated) navigate('/', { replace: true })
  }, [app.authenticated, navigate])

  const enter = () => {
    app.setAuthenticated(true)
    navigate('/', { replace: true })
  }

  const setup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Enter a name — it only labels this space.')
    if (passcode) {
      if (passcode.length < 4) return setError('Passcode needs at least 4 characters.')
      if (passcode !== confirm) return setError('Passcodes don’t match.')
      setBusy(true)
      localStorage.setItem(PASS_KEY, await sha256(passcode))
    }
    setProfileName(name.trim())
    // Personal setup goes straight in — the guided demo onboarding is for the sample household.
    app.setOnboarded(true)
    enter()
  }

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!hasPasscode) return enter()
    const typed = passRef.current?.value ?? ''
    if (!typed) return setError('Enter your passcode.')
    setBusy(true)
    const hash = await sha256(typed)
    if (hash === localStorage.getItem(PASS_KEY)) enter()
    else {
      setBusy(false)
      setError('That’s not the passcode set on this device.')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-invert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" />
              <path d="M3 21.5h18" opacity="0.65" />
            </svg>
          </div>
          <div>
            <div className="font-display text-[20px] font-semibold tracking-tight text-ink">Meridian</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink3">Wealth OS</div>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          {firstRun ? (
            <form onSubmit={setup} className="space-y-4">
              <div>
                <h1 className="text-[17px] font-semibold text-ink">Set up this device</h1>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">
                  Your data lives only in this browser. A passcode adds a lock for anyone opening this device — it is
                  not an online account.
                </p>
              </div>
              <div>
                <label htmlFor="profile-name" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink3">Your name</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-ctl border border-line bg-surface px-3 text-[13.5px] text-ink outline-none focus:border-brand"
                  autoFocus
                  maxLength={40}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="passcode" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink3">Passcode <span className="normal-case text-ink3">(optional)</span></label>
                  <input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="h-10 w-full rounded-ctl border border-line bg-surface px-3 text-[13.5px] outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="passcode-confirm" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink3">Confirm</label>
                  <input
                    id="passcode-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-10 w-full rounded-ctl border border-line bg-surface px-3 text-[13.5px] outline-none focus:border-brand"
                    disabled={!passcode}
                  />
                </div>
              </div>
              {error && <p className="flex items-center gap-1.5 text-[12px] font-medium text-loss"><Icon name="alert" size={13} />{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Setting up…' : 'Start'}
              </Button>
              <p className="text-[10.5px] leading-relaxed text-ink3">
                Forgot-passcode recovery does not exist by design — there is no server to reset from. Your backup file
                (Reports → Backup) is the recovery path.
              </p>
            </form>
          ) : (
            <form onSubmit={unlock} className="space-y-4">
              <div>
                <h1 className="text-[17px] font-semibold text-ink">
                  {store.profileName ? `Welcome back, ${store.profileName}` : 'Welcome back'}
                </h1>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">
                  {hasPasscode
                    ? 'Enter the passcode set on this device.'
                    : 'No passcode is set on this device — you can add one in Settings.'}
                </p>
              </div>
              {hasPasscode && (
                <input
                  ref={passRef}
                  type="password"
                  placeholder="Passcode"
                  className="h-10 w-full rounded-ctl border border-line bg-surface px-3 text-[13.5px] outline-none focus:border-brand"
                  autoFocus
                />
              )}
              {error && <p className="flex items-center gap-1.5 text-[12px] font-medium text-loss"><Icon name="alert" size={13} />{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Checking…' : hasPasscode ? 'Unlock' : 'Enter'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink3">
          Device lock only — data stays in this browser and never leaves it.
        </p>
      </div>
    </div>
  )
}
