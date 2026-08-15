import type { IconName } from '@/components/icons'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  badge?: number
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const SIMPLE_NAV: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Home', icon: 'home' },
      { to: '/portfolio', label: 'Portfolio', icon: 'pie' },
      { to: '/income', label: 'Income', icon: 'coins' },
      { to: '/watchlist', label: 'Watchlist', icon: 'eye' },
      { to: '/documents', label: 'Documents', icon: 'file' },
      { to: '/plan', label: 'Plan', icon: 'target' },
    ],
  },
]

export const PRO_NAV: NavGroup[] = [
  {
    items: [{ to: '/', label: 'Overview', icon: 'grid' }],
  },
  {
    label: 'Invest',
    items: [
      { to: '/portfolio', label: 'Portfolio', icon: 'pie' },
      { to: '/research', label: 'Research Lab', icon: 'book' },
      { to: '/income', label: 'Income', icon: 'coins' },
      { to: '/options', label: 'Options', icon: 'layers' },
      { to: '/trading-review', label: 'Trading Review', icon: 'trendUp' },
      { to: '/watchlist', label: 'Watchlists', icon: 'eye' },
    ],
  },
  {
    label: 'Own & Owe',
    items: [
      { to: '/real-estate', label: 'Real Estate', icon: 'building' },
      { to: '/private', label: 'Private Investments', icon: 'briefcase' },
      { to: '/liabilities', label: 'Liabilities', icon: 'scale' },
      { to: '/insurance', label: 'Insurance', icon: 'shield' },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/tax', label: 'Tax', icon: 'receipt' },
      { to: '/plan', label: 'Planning', icon: 'target' },
      { to: '/scenarios', label: 'Scenarios', icon: 'compass' },
      { to: '/reports', label: 'Reports', icon: 'reportChart' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/documents', label: 'Documents', icon: 'file' },
      { to: '/inbox', label: 'Financial Inbox', icon: 'inbox' },
      { to: '/timeline', label: 'Memory', icon: 'clock' },
    ],
  },
]

/** Mobile bottom-nav (per mode). The center slot is the upload action. */
export const MOBILE_NAV_SIMPLE: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/portfolio', label: 'Portfolio', icon: 'pie' },
  { to: '/income', label: 'Income', icon: 'coins' },
]

export const MOBILE_NAV_PRO: NavItem[] = [
  { to: '/', label: 'Overview', icon: 'grid' },
  { to: '/portfolio', label: 'Portfolio', icon: 'pie' },
  { to: '/inbox', label: 'Inbox', icon: 'inbox' },
]

export const PAGE_TITLES: Record<string, { simple: string; pro: string }> = {
  '/': { simple: 'Home', pro: 'Overview' },
  '/portfolio': { simple: 'Portfolio', pro: 'Portfolio' },
  '/income': { simple: 'Income', pro: 'Income' },
  '/watchlist': { simple: 'Watchlist', pro: 'Watchlists' },
  '/documents': { simple: 'Documents', pro: 'Documents' },
  '/plan': { simple: 'Plan', pro: 'Planning' },
  '/options': { simple: 'Options', pro: 'Options' },
  '/trading-review': { simple: 'Trading Review', pro: 'Trading Review' },
  '/real-estate': { simple: 'Real Estate', pro: 'Real Estate' },
  '/private': { simple: 'Private Investments', pro: 'Private Investments' },
  '/liabilities': { simple: 'Liabilities', pro: 'Liabilities' },
  '/insurance': { simple: 'Insurance', pro: 'Insurance' },
  '/tax': { simple: 'Tax', pro: 'Tax' },
  '/scenarios': { simple: 'Scenarios', pro: 'Scenarios' },
  '/reports': { simple: 'Reports', pro: 'Reports' },
  '/inbox': { simple: 'Needs Review', pro: 'Financial Inbox' },
  '/timeline': { simple: 'Your Financial Story', pro: 'Financial Memory' },
  '/research': { simple: 'Research Lab', pro: 'Research Lab' },
}
