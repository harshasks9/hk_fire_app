import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Drawer, Badge, EmptyState } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { relDate } from '@/lib/format'
import type { Notification } from './notifications'

export function NotificationCenter({ notifications }: { notifications: Notification[] }) {
  const app = useApp()
  const navigate = useNavigate()
  const tones = {
    loss: 'bg-loss-soft text-loss',
    warn: 'bg-warn-soft text-warn',
    info: 'bg-info-soft text-info',
    brand: 'bg-brand-soft text-brand',
  }
  const unread = notifications.filter((n) => !app.readNotifs.includes(n.id))
  const read = notifications.filter((n) => app.readNotifs.includes(n.id))
  return (
    <Drawer open={app.notifOpen} onClose={() => app.setNotifOpen(false)} title={
      <span className="flex items-center gap-2">Notifications {unread.length > 0 && <Badge tone="loss">{unread.length} new</Badge>}</span>
    }>
      <div className="p-3">
        {notifications.length === 0 && (
          <EmptyState icon="bell" title="All caught up" body="Alerts, reviews and reminders will appear here as your financial data changes." />
        )}
        {[...unread, ...read].map((n) => {
          const isRead = app.readNotifs.includes(n.id)
          return (
            <button
              key={n.id}
              onClick={() => {
                app.markNotifRead(n.id)
                app.setNotifOpen(false)
                navigate(n.to)
              }}
              className={cn('mb-1.5 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors', isRead ? 'border-transparent opacity-60 hover:opacity-90' : 'border-line bg-surface hover:bg-surface2')}
            >
              <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tones[n.tone])}>
                <Icon name={n.icon} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-snug text-ink">{n.title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ink2">{n.body}</span>
                <span className="mt-1 block text-[10.5px] text-ink3">{relDate(n.date)}</span>
              </span>
              {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
            </button>
          )
        })}
      </div>
    </Drawer>
  )
}
