'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent, BubbleMenu, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Mention from '@tiptap/extension-mention'
import { Bold, Italic, Code, Link2, Sparkles, Wand2, Scissors, Lightbulb, ListChecks, GitBranch, MessageCircleQuestion, X, Check, ArrowDownToLine, Heading2, List, ListTodo, Quote, Undo2, Redo2, ImagePlus, SlashSquare, WifiOff } from 'lucide-react'
import { Callout, HighlightRange } from './extensions'
import { SlashCommand, slashItems, mentionSuggestion } from './SlashMenu'
import { api } from '@/lib/client'
import { cx, relativeTime } from '@/lib/util'
import { useToast, Spinner, AiMark } from '@/components/ui'
import type { RewriteMode } from '@/lib/ai/types'
import { isNetworkError, pendingPatchFor, savePatchOffline, useOffline } from '@/lib/offline/sync'

export interface NoteEditorProps {
  noteId: string
  initialTitle: string
  initialContent: unknown
  highlight?: string
  readOnly?: boolean
  onSaved?: (at: Date) => void
  onProcessed?: () => void
  placeholder?: string
  meta?: React.ReactNode
  summary?: React.ReactNode
}

type AiResult = { mode: RewriteMode; text: string; provider: string; from: number; to: number; top: number; left: number }

export function NoteEditor({ noteId, initialTitle, initialContent, highlight, readOnly, onSaved, placeholder, meta, summary }: NoteEditorProps) {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = React.useState(initialTitle)
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'offline'>('idle')
  const { online } = useOffline()
  const [savedAt, setSavedAt] = React.useState<Date | null>(null)
  const [aiBusy, setAiBusy] = React.useState<string | null>(null)
  const [aiResult, setAiResult] = React.useState<AiResult | null>(null)
  const [askOpen, setAskOpen] = React.useState(false)
  const [askQ, setAskQ] = React.useState('')
  const saveTimer = React.useRef<number | undefined>(undefined)
  const processTimer = React.useRef<number | undefined>(undefined)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const uploadKind = React.useRef<'image' | 'file'>('image')
  const titleRef = React.useRef<HTMLTextAreaElement>(null)
  const titleValue = React.useRef(initialTitle)

  const persist = React.useCallback(async (patch: { title?: string; contentJson?: unknown }, process = false) => {
    setSaveState('saving')
    const keepLocally = async () => {
      // No network: keep the latest content on this device; it is replayed when the connection returns.
      await savePatchOffline({ noteId, title: patch.title ?? titleValue.current, contentJson: patch.contentJson ?? editorRef.current?.getJSON() })
      setSavedAt(new Date())
      setSaveState('offline')
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) { await keepLocally(); return }
    try {
      await api(`/api/notes/${noteId}`, { method: 'PATCH', json: { ...patch, process } })
      const at = new Date()
      setSavedAt(at)
      setSaveState('saved')
      onSaved?.(at)
      if (process) setTimeout(() => router.refresh(), 2500)
    } catch (e) {
      if (isNetworkError(e)) { await keepLocally(); return }
      setSaveState('idle')
      toast.push({ text: `Save failed: ${String(e)}`, tone: 'danger' })
    }
  }, [noteId, onSaved, router, toast])

  const scheduleSave = React.useCallback((editor: Editor) => {
    window.clearTimeout(saveTimer.current)
    window.clearTimeout(processTimer.current)
    saveTimer.current = window.setTimeout(() => persist({ title: titleValue.current, contentJson: editor.getJSON() }), 700)
    processTimer.current = window.setTimeout(() => persist({ title: titleValue.current, contentJson: editor.getJSON() }, true), 4000)
  }, [persist])

  const runInlineAi = React.useCallback(async (mode: RewriteMode, editor: Editor, opts: { question?: string; whole?: boolean } = {}) => {
    const { from, to } = editor.state.selection
    const text = opts.whole ? editor.getText() : editor.state.doc.textBetween(from, to, '\n')
    if (!text.trim()) { toast.push({ text: 'Select some text first' }); return }
    setAiBusy(mode)
    try {
      const r = await api<{ text: string; provider: string }>('/api/ai/rewrite', { method: 'POST', json: { mode, text, question: opts.question, noteTitle: title, context: editor.getText().slice(0, 6000) } })
      const coords = editor.view.coordsAtPos(opts.whole ? editor.state.doc.content.size : to)
      const box = editor.view.dom.getBoundingClientRect()
      setAiResult({ mode, text: r.text, provider: r.provider, from: opts.whole ? 0 : from, to: opts.whole ? editor.state.doc.content.size : to, top: coords.bottom - box.top + 8, left: 0 })
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setAiBusy(null)
    }
  }, [title, toast])

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: {}, dropcursor: { color: 'var(--accent)', width: 2 } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write, or type '/' for commands. Everything else is automatic." }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ allowBase64: true, inline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Mention.configure({ HTMLAttributes: { class: 'mention' }, suggestion: { ...mentionSuggestion, command: ({ editor, range, props }) => { const p = props as { id: string; name: string }; editor.chain().focus().insertContentAt(range, [{ type: 'mention', attrs: { id: p.id, label: p.name } }, { type: 'text', text: ' ' }]).run() } }, renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`, renderHTML: ({ options, node }) => ['span', { ...options.HTMLAttributes, 'data-id': node.attrs.id }, `@${node.attrs.label ?? node.attrs.id}`] }),
      Callout,
      HighlightRange,
      SlashCommand(() => slashItems({
        upload: (kind) => { uploadKind.current = kind; fileInput.current?.click() },
        ai: (kind) => {
          if (!editorRef.current) return
          if (kind === 'summary') runInlineAi('summarize', editorRef.current, { whole: true })
          if (kind === 'rewrite') runInlineAi('rewrite', editorRef.current, { whole: true })
          if (kind === 'actions') runInlineAi('extract_tasks', editorRef.current, { whole: true })
        },
      })),
    ],
    content: (initialContent as object) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: { class: 'editor-prose', spellcheck: 'true' },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? [])
        if (!files.length) return false
        event.preventDefault()
        files.forEach((f) => uploadFile(f))
        return true
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (!files.length) return false
        event.preventDefault()
        files.forEach((f) => uploadFile(f))
        return true
      },
    },
    onUpdate: ({ editor }) => scheduleSave(editor),
  })
  const editorRef = React.useRef<Editor | null>(null)
  editorRef.current = editor

  // An edit made offline that has not synced yet is newer than what the server rendered: show it.
  React.useEffect(() => {
    if (!editor || readOnly) return
    let alive = true
    pendingPatchFor(noteId).then((p) => {
      if (!alive || !p) return
      editor.commands.setContent(p.contentJson as object, false)
      setTitle(p.title)
      titleValue.current = p.title
      setSaveState('offline')
      setSavedAt(new Date(p.updatedAt))
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, noteId])

  async function uploadFile(file: File) {
    if (!editorRef.current) return
    const fd = new FormData()
    fd.set('noteId', noteId)
    fd.set('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed')
      const j = (await res.json()) as { url: string; name: string; mime: string }
      if (j.mime.startsWith('image/')) editorRef.current.chain().focus().setImage({ src: j.url, alt: j.name }).run()
      else editorRef.current.chain().focus().insertContent(`<p><a href="${j.url}" target="_blank">📎 ${j.name}</a></p>`).run()
      router.refresh()
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    }
  }

  // Highlight a source passage when arriving from "View source".
  React.useEffect(() => {
    if (!editor || !highlight) return
    const t = setTimeout(() => {
      const ok = editor.commands.highlightText(highlight)
      if (!ok) toast.push({ text: 'Source passage has changed since it was extracted' })
      setTimeout(() => editor.commands.clearHighlight(), 6000)
    }, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, highlight])

  // Cmd+Enter → AI action on selection (or summarize note)
  React.useEffect(() => {
    if (!editor) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const { from, to } = editor.state.selection
        if (from !== to) runInlineAi('rewrite', editor)
        else runInlineAi('summarize', editor, { whole: true })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, runInlineAi])

  React.useEffect(() => {
    const el = titleRef.current
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [title])
  // A brand-new note starts with the cursor in the title.
  React.useEffect(() => {
    if (!initialTitle && !readOnly) titleRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTitle = (v: string) => {
    setTitle(v)
    titleValue.current = v
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => persist({ title: v, contentJson: editorRef.current?.getJSON() }, false), 600)
    window.clearTimeout(processTimer.current)
    processTimer.current = window.setTimeout(() => persist({ title: v, contentJson: editorRef.current?.getJSON() }, true), 4000)
  }

  const applyAi = (how: 'replace' | 'insert') => {
    if (!editor || !aiResult) return
    if (how === 'replace') {
      editor.chain().focus().deleteRange({ from: aiResult.from, to: aiResult.to }).insertContentAt(aiResult.from, textToContent(aiResult.text)).run()
    } else {
      editor.chain().focus().setTextSelection(aiResult.to).insertCallout('ai', aiResult.text).run()
    }
    setAiResult(null)
  }

  const modeLabel: Record<RewriteMode, string> = { rewrite: 'Rewrite', shorten: 'Shorten', clearer: 'Make clearer', summarize: 'Summary', extract_tasks: 'Tasks', extract_decisions: 'Decisions', ask: 'Answer' }

  return (
    <div className="relative">
      <input ref={fileInput} type="file" className="hidden" accept={uploadKind.current === 'image' ? 'image/*' : undefined} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => onTitle(e.target.value.replace(/\n/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus('start') } }}
        placeholder="Untitled"
        rows={1}
        readOnly={readOnly}
        data-large
        className="w-full resize-none bg-transparent text-[26px] font-semibold leading-tight tracking-[-0.02em] outline-none placeholder:text-fg-3 sm:text-[30px]"
      />
      <div className="mb-5 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fg-3">
        {meta}
        <span className={cx('transition', saveState === 'saving' && 'text-fg-2', saveState === 'offline' && 'text-warning')}>{saveState === 'saving' ? '· Saving…' : saveState === 'offline' ? <span className="inline-flex items-center gap-1"><WifiOff className="h-3 w-3" /> Saved on this device{online ? ' · syncing shortly' : ' · syncs when online'}</span> : savedAt ? `· Saved ${relativeTime(savedAt)}` : ''}</span>
        {aiBusy ? <span className="inline-flex items-center gap-1 text-accent"><Spinner className="h-3 w-3" /> AI working…</span> : null}
      </div>
      {summary ? <div className="mb-6">{summary}</div> : null}

      {editor ? (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 120, placement: 'top', maxWidth: 'none' }} shouldShow={({ editor, from, to }) => from !== to && !editor.isActive('image') && !readOnly}>
          <div className="no-scrollbar flex max-w-[calc(100vw-24px)] items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-pop">
            <Tb active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-3.5 w-3.5" /></Tb>
            <Tb active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-3.5 w-3.5" /></Tb>
            <Tb active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code"><Code className="h-3.5 w-3.5" /></Tb>
            <Tb active={editor.isActive('link')} onClick={() => { const url = window.prompt('Link URL', editor.getAttributes('link').href ?? 'https://'); if (url === null) return; if (!url) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: url }).run() }} title="Link"><Link2 className="h-3.5 w-3.5" /></Tb>
            <span className="mx-1 h-4 w-px bg-border" />
            <Tb ai onClick={() => runInlineAi('rewrite', editor)} title="Rewrite"><Wand2 className="h-3.5 w-3.5" /><span>Rewrite</span></Tb>
            <Tb ai onClick={() => runInlineAi('shorten', editor)} title="Shorten"><Scissors className="h-3.5 w-3.5" /><span>Shorten</span></Tb>
            <Tb ai onClick={() => runInlineAi('clearer', editor)} title="Make clearer"><Lightbulb className="h-3.5 w-3.5" /><span>Clearer</span></Tb>
            <Tb ai onClick={() => runInlineAi('summarize', editor)} title="Summarize"><Sparkles className="h-3.5 w-3.5" /><span>Summarize</span></Tb>
            <Tb ai onClick={() => runInlineAi('extract_tasks', editor)} title="Extract tasks"><ListChecks className="h-3.5 w-3.5" /><span>Tasks</span></Tb>
            <Tb ai onClick={() => runInlineAi('extract_decisions', editor)} title="Extract decisions"><GitBranch className="h-3.5 w-3.5" /><span>Decisions</span></Tb>
            <Tb ai onClick={() => { setAskOpen(true); setAskQ('') }} title="Ask AI about the selection"><MessageCircleQuestion className="h-3.5 w-3.5" /><span>Ask</span></Tb>
          </div>
        </BubbleMenu>
      ) : null}

      {askOpen && editor ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-accent-soft-2 bg-accent-soft/50 px-3 py-2">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          <input autoFocus value={askQ} onChange={(e) => setAskQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && askQ.trim()) { runInlineAi('ask', editor, { question: askQ }); setAskOpen(false) } if (e.key === 'Escape') setAskOpen(false) }} placeholder="Ask about the selected text…" className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-fg-3" />
          <button onClick={() => setAskOpen(false)} className="text-fg-3 hover:text-fg" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      ) : null}

      {editor && !readOnly ? <MobileToolbar editor={editor} onUpload={() => { uploadKind.current = 'image'; fileInput.current?.click() }} /> : null}
      <EditorContent editor={editor} />

      {aiResult ? (
        <div className="animate-up sticky bottom-4 z-20 mt-4 rounded-xl border border-accent-soft-2 bg-surface p-4 shadow-pop">
          <div className="mb-2 flex items-center justify-between">
            <AiMark label={`${modeLabel[aiResult.mode]} · ${aiResult.provider === 'local' ? 'heuristic' : aiResult.provider}`} />
            <div className="flex items-center gap-1">
              {aiResult.mode === 'rewrite' || aiResult.mode === 'shorten' || aiResult.mode === 'clearer' ? (
                <button className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[12.5px] font-medium text-accent-fg" onClick={() => applyAi('replace')}><Check className="h-3.5 w-3.5" /> Replace selection</button>
              ) : null}
              <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[12.5px] font-medium hover:bg-surface-2" onClick={() => applyAi('insert')}><ArrowDownToLine className="h-3.5 w-3.5" /> Insert as AI block</button>
              <button className="rounded-lg p-1 text-fg-3 hover:text-fg" onClick={() => setAiResult(null)} aria-label="Discard"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap text-[14px] leading-relaxed">{aiResult.text}</div>
          <p className="mt-2 text-[11.5px] text-fg-3">Nothing changes in your note until you choose an action.</p>
        </div>
      ) : null}
    </div>
  )
}

/**
  Formatting bar for phones and tablets, where there are no keyboard shortcuts.
  Sticks to the top of the scroll area while the note is being edited; buttons
  keep the editor focused so the on-screen keyboard stays open.
*/
function MobileToolbar({ editor, onUpload }: { editor: Editor; onUpload: () => void }) {
  const [, force] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    editor.on('transaction', force)
    return () => { editor.off('transaction', force) }
  }, [editor])
  const keep = (e: React.MouseEvent) => e.preventDefault()
  const B = ({ active, label, onClick, children }: { active?: boolean; label: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onMouseDown={keep} onClick={onClick} aria-label={label} title={label} className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition', active ? 'bg-surface-3 text-fg' : 'text-fg-2 active:bg-surface-2')}>
      {children}
    </button>
  )
  return (
    <div className="no-scrollbar sticky top-0 z-20 -mx-5 mb-2 flex items-center gap-0.5 overflow-x-auto border-b border-border bg-bg/95 px-3 py-1 backdrop-blur md:hidden">
      <B label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-[18px] w-[18px]" /></B>
      <B label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-[18px] w-[18px]" /></B>
      <B label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-[18px] w-[18px]" /></B>
      <B label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-[18px] w-[18px]" /></B>
      <B label="Task list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo className="h-[18px] w-[18px]" /></B>
      <B label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-[18px] w-[18px]" /></B>
      <B label="Link" active={editor.isActive('link')} onClick={() => { const url = window.prompt('Link URL', editor.getAttributes('link').href ?? 'https://'); if (url === null) return; if (!url) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: url }).run() }}><Link2 className="h-[18px] w-[18px]" /></B>
      <B label="Add image" onClick={onUpload}><ImagePlus className="h-[18px] w-[18px]" /></B>
      <B label="Commands" onClick={() => editor.chain().focus().insertContent('/').run()}><SlashSquare className="h-[18px] w-[18px]" /></B>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <B label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-[18px] w-[18px]" /></B>
      <B label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-[18px] w-[18px]" /></B>
    </div>
  )
}

function Tb({ children, active, ai, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; ai?: boolean }) {
  return (
    <button {...p} className={cx('inline-flex h-7 items-center gap-1 rounded-lg px-1.5 text-[12px] font-medium transition', active ? 'bg-surface-3 text-fg' : ai ? 'text-accent hover:bg-accent-soft' : 'text-fg-2 hover:bg-surface-2 hover:text-fg')}>
      {children}
    </button>
  )
}

/** Convert plain/markdown-ish text from the AI into editor content. */
function textToContent(text: string): object[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  const out: object[] = []
  let list: { type: string; items: object[] } | null = null
  const flush = () => { if (list) { out.push({ type: list.type, content: list.items }); list = null } }
  for (const l of lines) {
    const task = l.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/)
    const bullet = l.match(/^\s*[-*•]\s+(.*)$/)
    if (task) {
      if (!list || list.type !== 'taskList') { flush(); list = { type: 'taskList', items: [] } }
      list.items.push({ type: 'taskItem', attrs: { checked: task[1] !== ' ' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: task[2] }] }] })
    } else if (bullet) {
      if (!list || list.type !== 'bulletList') { flush(); list = { type: 'bulletList', items: [] } }
      list.items.push({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: bullet[1] }] }] })
    } else {
      flush()
      out.push({ type: 'paragraph', content: [{ type: 'text', text: l.trim() }] })
    }
  }
  flush()
  return out
}
