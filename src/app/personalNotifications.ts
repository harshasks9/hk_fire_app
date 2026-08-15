/* Notifications for personal mode. Every entry is derived from a real record:
   the imported live option book, or the user's own accounts. Nothing is
   fabricated; if there is nothing real to say, the list is empty. */

import { LIVE_OPTION_BOOK, TRADING_WINDOW } from '@/data/fidelityTrading'
import type { StoreData } from '@/store/types'
import { setupStatus } from '@/store/selectors'
import type { Notification } from './notifications'

const DAY = 86400000

export function buildPersonalNotifications(s: StoreData): Notification[] {
  const list: Notification[] = []
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  /* Short/long option contracts from the imported book that expire soon.
     The book is as of the last CSV export — state after that date is unknown,
     and the copy says so. */
  for (const p of LIVE_OPTION_BOOK) {
    const days = Math.round((new Date(p.expiry + 'T12:00:00').getTime() - now.getTime()) / DAY)
    if (days < 0 || days > 14) continue
    const side = p.netQty < 0 ? 'short' : 'long'
    list.push({
      id: `pn-exp-${p.under}-${p.expiry}-${p.strike}${p.type[0]}`,
      icon: 'calendar',
      tone: p.netQty < 0 ? 'warn' : 'info',
      title: `${Math.abs(p.netQty)}× ${p.under} $${p.strike} ${p.type === 'call' ? 'C' : 'P'} (${side}) expires ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`,
      body: `Open as of your last import (${TRADING_WINDOW.to}). If you have closed it since, re-import a fresh CSV to update.`,
      date: p.expiry,
      to: '/trading-review',
    })
  }

  /* Balance hygiene from the user's own records. */
  for (const a of s.accounts) {
    if (a.balance === null) {
      list.push({
        id: `pn-nobal-${a.id}`, icon: 'alert', tone: 'warn',
        title: `“${a.name}” has no balance`,
        body: 'Unknown balances are excluded from net worth. Add one to make totals complete.',
        date: today, to: '/balances',
      })
    } else if ((now.getTime() - new Date(a.source.asOf + 'T12:00:00').getTime()) / DAY > 45) {
      list.push({
        id: `pn-stale-${a.id}-${a.source.asOf}`, icon: 'clock', tone: 'info',
        title: `“${a.name}” balance is from ${a.source.asOf}`,
        body: 'Over 45 days old — update it so net worth stays trustworthy.',
        date: a.source.asOf, to: '/balances',
      })
    }
  }

  /* First-run setup nudge — one item, not a pile. */
  const setup = setupStatus(s)
  if (setup.nextSteps.length > 0 && s.accounts.length === 0 && s.ledger.length === 0) {
    list.push({
      id: 'pn-setup', icon: 'bulb', tone: 'brand',
      title: 'Finish setting up your data',
      body: setup.nextSteps[0],
      date: today, to: '/balances',
    })
  }

  return list.sort((a, b) => b.date.localeCompare(a.date))
}
