import { SUGGESTIONS } from '@/data/suggestions'
import { INBOX_ITEMS } from '@/data/inbox'
import { upcomingObligations } from '@/data/selectors'
import { daysUntil } from '@/lib/format'
import type { IconName } from '@/components/icons'

export interface Notification {
  id: string
  icon: IconName
  tone: 'loss' | 'warn' | 'info' | 'brand'
  title: string
  body: string
  date: string
  to: string
}

export function buildNotifications(): Notification[] {
  const list: Notification[] = []
  for (const s of SUGGESTIONS) {
    if (s.status !== 'open') continue
    if (s.category === 'alert') {
      list.push({
        id: `n-${s.id}`, icon: 'alert', tone: 'loss', title: s.title,
        body: s.what, date: s.createdAt, to: '/inbox',
      })
    } else if (s.category === 'recommendation' && s.urgency !== 'no_rush') {
      list.push({
        id: `n-${s.id}`, icon: 'bulb', tone: 'brand', title: s.title,
        body: s.what, date: s.createdAt, to: '/inbox',
      })
    }
  }
  for (const i of INBOX_ITEMS) {
    if (i.status === 'open' && i.severity === 'high') {
      list.push({
        id: `n-${i.id}`, icon: 'inbox', tone: 'warn', title: i.simpleTitle,
        body: i.detail.slice(0, 120) + '…', date: i.createdAt, to: '/inbox',
      })
    }
  }
  for (const o of upcomingObligations()) {
    const d = daysUntil(o.date)
    if (d <= 14) {
      list.push({
        id: `n-ob-${o.label}`, icon: 'calendar', tone: d <= 5 ? 'warn' : 'info',
        title: o.label,
        body: d === 0 ? 'Due today' : `Due in ${d} day${d === 1 ? '' : 's'}`,
        date: o.date, to: '/plan',
      })
    }
  }
  list.push({
    id: 'n-doc-fid-jul', icon: 'file', tone: 'info',
    title: 'Fidelity July statement ready for review',
    body: '14 positions, 23 transactions and 1 cash balance found. One field needs your attention.',
    date: '2026-07-19', to: '/documents/review/doc-fid-jul',
  })
  return list.sort((a, b) => b.date.localeCompare(a.date))
}
