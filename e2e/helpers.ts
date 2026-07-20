import type { Page } from '@playwright/test'

export interface BootOpts {
  mode?: 'simple' | 'pro'
  auth?: boolean
  onboarded?: boolean
  currency?: 'USD' | 'INR'
}

/** Seed persisted app state before any app script runs. */
export async function boot(page: Page, opts: BootOpts = {}) {
  const { mode = 'simple', auth = true, onboarded = true, currency = 'USD' } = opts
  await page.addInitScript(
    (s) => {
      localStorage.setItem('meridian.mode', JSON.stringify(s.mode))
      localStorage.setItem('meridian.auth', JSON.stringify(s.auth))
      localStorage.setItem('meridian.onboarded', JSON.stringify(s.onboarded))
      localStorage.setItem('meridian.currency', JSON.stringify(s.currency))
      localStorage.setItem('meridian.theme', 'light')
    },
    { mode, auth, onboarded, currency },
  )
}

export function go(page: Page, path: string) {
  return page.goto(`/#${path}`)
}
