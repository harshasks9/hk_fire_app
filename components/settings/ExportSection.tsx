'use client'
import * as React from 'react'
import { Download, FolderArchive, ChevronDown } from 'lucide-react'
import { Menu } from '@/components/ui'

/** Settings → Data: one zip per context, or the whole notebook. Markdown + attachments + data.json, re-importable. */
export function ExportSection({ contexts, notebookName }: { contexts: { id: string; name: string; noteCount: number }[]; notebookName: string }) {
  const total = contexts.reduce((n, c) => n + c.noteCount, 0)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href="/api/export?context=all" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] font-medium hover:bg-surface-2" title={`Every note in ${notebookName} as Markdown with attachments, plus data.json`}>
        <FolderArchive className="h-3.5 w-3.5" /> Export everything (.zip{total ? `, ${total} notes` : ''})
      </a>
      {contexts.length > 1 ? (
        <Menu
          align="start"
          trigger={<button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] font-medium hover:bg-surface-2"><Download className="h-3.5 w-3.5" /> Export one context <ChevronDown className="h-3.5 w-3.5 text-fg-3" /></button>}
          items={contexts.map((c) => ({ label: `${c.name} (${c.noteCount})`, href: `/api/export?context=${c.id}` }))}
        />
      ) : null}
      <a href="/api/admin/export" className="inline-flex h-8 items-center gap-1.5 rounded-[9px] px-2 text-[13px] text-fg-3 hover:text-fg" title="Every note as Markdown inside one JSON file, plus the structured data">JSON only</a>
    </div>
  )
}
