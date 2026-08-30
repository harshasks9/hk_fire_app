import type { Page } from '@playwright/test'

export interface BootOpts {
  mode?: 'simple' | 'pro'
  /** Which dataset the app runs on. Legacy specs assert the sample household, so 'demo' is the default here. */
  dataMode?: 'personal' | 'demo'
  auth?: boolean
  onboarded?: boolean
  currency?: 'USD' | 'INR'
  /** Seed the personal canonical store before the app boots. */
  store?: unknown
}

/** Seed persisted app state before any app script runs. */
export async function boot(page: Page, opts: BootOpts = {}) {
  const { mode = 'simple', dataMode = 'demo', auth = true, onboarded = true, currency = 'USD', store } = opts
  await page.addInitScript(
    (s) => {
      localStorage.setItem('meridian.mode', JSON.stringify(s.mode))
      localStorage.setItem('meridian.dataMode', JSON.stringify(s.dataMode))
      localStorage.setItem('meridian.auth', JSON.stringify(s.auth))
      localStorage.setItem('meridian.onboarded', JSON.stringify(s.onboarded))
      localStorage.setItem('meridian.currency', JSON.stringify(s.currency))
      localStorage.setItem('meridian.theme', 'light')
      if (s.store) {
        localStorage.setItem('meridian.store.v1', JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data: s.store }))
      }
    },
    { mode, dataMode, auth, onboarded, currency, store },
  )
}

export function go(page: Page, path: string) {
  return page.goto(`/#${path}`)
}
