'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Menu, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'

/** The "⋯" at the end of a row: edit, delete, and any extra items. Keeps every list editable in place. */
export function RowActions({ onEdit, onDelete, deleteLabel = 'Delete', confirmText, extra = [], className, always }: { onEdit?: () => void; onDelete?: () => Promise<void> | void; deleteLabel?: string; confirmText?: string; extra?: { label: string; onSelect: () => void; icon?: React.ReactNode; danger?: boolean }[]; className?: string; always?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const items = [
    ...(onEdit ? [{ label: 'Edit', icon: <Pencil className="h-3.5 w-3.5" />, onSelect: onEdit }] : []),
    ...extra.map((e) => ({ label: e.label, icon: e.icon, onSelect: e.onSelect, danger: e.danger })),
    ...(onDelete ? [{ label: deleteLabel, icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: async () => { if (confirmText && !confirm(confirmText)) return; try { await onDelete(); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } } }] : []),
  ]
  if (!items.length) return null
  return (
    <span className={cx('shrink-0', !always && 'opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100', className)} onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Menu align="end" trigger={<button type="button" className="rounded-md p-1 text-fg-3 hover:bg-surface-3 hover:text-fg pointer-coarse:p-2" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>} items={items} />
    </span>
  )
}

/** Fire a mutation, refresh the page, surface errors. */
export function useMutate() {
  const router = useRouter()
  const toast = useToast()
  return React.useCallback(async (path: string, init: Parameters<typeof api>[1], success?: string) => {
    try { await api(path, init); if (success) toast.push({ text: success, tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }); throw e }
  }, [router, toast])
}
