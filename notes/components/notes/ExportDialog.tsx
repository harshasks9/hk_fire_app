'use client'
import * as React from 'react'
import { Download, FileText, FileCode2, FileType2, Printer, FolderArchive, Braces } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui'
import { cx } from '@/lib/util'

type Format = 'md' | 'html' | 'pdf' | 'docx' | 'zip' | 'json'

const FORMATS: { id: Format; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'md', label: 'Markdown (.md)', description: 'Plain text with front matter. Opens in Obsidian, Bear, Logseq and any editor. Images are linked, not embedded.', icon: FileText },
  { id: 'docx', label: 'Word (.docx)', description: 'Headings, lists, tables, checklists, sheets and images, ready for Word, Pages or Google Docs.', icon: FileType2 },
  { id: 'pdf', label: 'PDF (print)', description: 'Opens a clean print view in a new tab with the print dialog ready. Choose “Save as PDF” there.', icon: Printer },
  { id: 'html', label: 'Web page (.html)', description: 'One self-contained file with the images embedded. Opens in any browser.', icon: FileCode2 },
  { id: 'zip', label: 'Everything (.zip)', description: 'Markdown, HTML, the attachments as files and the note’s JSON in one archive.', icon: FolderArchive },
  { id: 'json', label: 'Data (.json)', description: 'The raw note with what the AI extracted from it: entities, tasks, decisions, numbers, sources.', icon: Braces },
]

export function exportHref(noteId: string, f: Format): string {
  if (f === 'pdf') return `/api/notes/${noteId}/export?format=html&print=1`
  return `/api/notes/${noteId}/export?format=${f}`
}

/** Pick a format, download. PDF goes through the browser's print dialog, which is how every note app does it without a headless browser. */
export function ExportDialog({ noteId, open, onClose }: { noteId: string; open: boolean; onClose: () => void }) {
  const [format, setFormat] = React.useState<Format>('md')
  if (!open) return null
  const go = () => {
    const href = exportHref(noteId, format)
    if (format === 'pdf') window.open(href, '_blank', 'noopener')
    else {
      const a = document.createElement('a')
      a.href = href
      a.download = ''
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
    onClose()
  }
  return (
    <Dialog title={<span className="inline-flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Export this note</span>} onClose={onClose}>
      <p className="mb-3 text-[13px] text-fg-2">Your notes are yours. Every format below is readable without this app.</p>
      <ul className="mb-4 divide-y divide-border rounded-xl border border-border" role="radiogroup">
        {FORMATS.map((f) => (
          <li key={f.id}>
            <button type="button" role="radio" aria-checked={format === f.id} onClick={() => setFormat(f.id)} onDoubleClick={() => { setFormat(f.id); setTimeout(go, 0) }} className={cx('flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl', format === f.id ? 'bg-accent-soft' : 'hover:bg-surface-2')}>
              <f.icon className={cx('mt-0.5 h-4 w-4 shrink-0', format === f.id ? 'text-accent' : 'text-fg-3')} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">{f.label}</span>
                <span className="block text-[12.5px] text-fg-3">{f.description}</span>
              </span>
              <span className={cx('mt-1 h-3.5 w-3.5 shrink-0 rounded-full border', format === f.id ? 'border-accent bg-accent shadow-[inset_0_0_0_2.5px_var(--surface)]' : 'border-border-2')} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-fg-3">Whole notebook or one context: Settings → Data → Export.</span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={go}><Download className="h-3.5 w-3.5" /> {format === 'pdf' ? 'Open print view' : 'Download'}</Button>
        </div>
      </div>
    </Dialog>
  )
}
