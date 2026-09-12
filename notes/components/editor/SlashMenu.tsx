'use client'
import * as React from 'react'
import { Extension, type Editor, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Table, Image as ImageIcon, Paperclip, Quote, Code, Info, GitBranch, AtSign, CalendarDays, Minus, Sparkles, Wand2, ListChecks, LayoutTemplate } from 'lucide-react'
import { cx } from '@/lib/util'

export interface SlashItem { id: string; title: string; hint: string; icon: React.ComponentType<{ className?: string }>; keywords?: string; ai?: boolean; run: (editor: Editor, range: Range) => void }

export function slashItems(handlers: { upload: (kind: 'image' | 'file') => void; ai: (kind: 'summary' | 'rewrite' | 'actions', range: Range) => void; template?: (range: Range) => void }): SlashItem[] {
  const del = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range)
  return [
    { id: 'h1', title: 'Heading 1', hint: 'Large section heading', icon: Heading1, keywords: 'title', run: (e, r) => del(e, r).setNode('heading', { level: 1 }).run() },
    { id: 'h2', title: 'Heading 2', hint: 'Medium section heading', icon: Heading2, run: (e, r) => del(e, r).setNode('heading', { level: 2 }).run() },
    { id: 'h3', title: 'Heading 3', hint: 'Small section heading', icon: Heading3, run: (e, r) => del(e, r).setNode('heading', { level: 3 }).run() },
    { id: 'task', title: 'Task', hint: 'Checkbox item, extracted as an action', icon: CheckSquare, keywords: 'todo checkbox action', run: (e, r) => del(e, r).toggleTaskList().run() },
    { id: 'bullets', title: 'Bullet list', hint: 'Simple list', icon: List, run: (e, r) => del(e, r).toggleBulletList().run() },
    { id: 'numbered', title: 'Numbered list', hint: 'Ordered list', icon: ListOrdered, run: (e, r) => del(e, r).toggleOrderedList().run() },
    { id: 'table', title: 'Table', hint: '3 × 3 table', icon: Table, run: (e, r) => del(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: 'image', title: 'Image', hint: 'Upload or paste an image', icon: ImageIcon, keywords: 'picture screenshot photo', run: (e, r) => { del(e, r).run(); handlers.upload('image') } },
    { id: 'file', title: 'File', hint: 'Attach a document', icon: Paperclip, keywords: 'attachment pdf upload', run: (e, r) => { del(e, r).run(); handlers.upload('file') } },
    { id: 'quote', title: 'Quote', hint: 'Blockquote', icon: Quote, run: (e, r) => del(e, r).toggleBlockquote().run() },
    { id: 'code', title: 'Code', hint: 'Code block', icon: Code, run: (e, r) => del(e, r).toggleCodeBlock().run() },
    { id: 'callout', title: 'Callout', hint: 'Highlighted note', icon: Info, run: (e, r) => del(e, r).insertContent({ type: 'callout', attrs: { kind: 'info' }, content: [{ type: 'paragraph' }] }).run() },
    { id: 'decision', title: 'Decision', hint: 'Record a decision (tracked with history)', icon: GitBranch, keywords: 'decide agreed', run: (e, r) => del(e, r).insertContent({ type: 'callout', attrs: { kind: 'decision' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Decision: ' }] }] }).run() },
    { id: 'person', title: 'Person', hint: 'Mention someone with @', icon: AtSign, keywords: 'mention people', run: (e, r) => del(e, r).insertContent('@').run() },
    { id: 'meeting', title: 'Meeting', hint: 'Meeting note template', icon: CalendarDays, keywords: 'agenda attendees', run: (e, r) => del(e, r).insertContent([
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Discussion' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Decisions' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Actions' }] },
      { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }] },
    ]).run() },
    { id: 'template', title: 'Template', hint: 'Insert one of your templates here', icon: LayoutTemplate, keywords: 'template insert structure', run: (e, r) => { del(e, r).run(); handlers.template?.(r) } },
    { id: 'divider', title: 'Divider', hint: 'Horizontal rule', icon: Minus, run: (e, r) => del(e, r).setHorizontalRule().run() },
    { id: 'ai-summary', title: 'AI summary', hint: 'Summarize this note inline', icon: Sparkles, ai: true, keywords: 'summarize', run: (e, r) => { del(e, r).run(); handlers.ai('summary', r) } },
    { id: 'ai-rewrite', title: 'AI rewrite', hint: 'Clean up the whole note', icon: Wand2, ai: true, run: (e, r) => { del(e, r).run(); handlers.ai('rewrite', r) } },
    { id: 'ai-actions', title: 'AI extract actions', hint: 'Pull every action item into a task list', icon: ListChecks, ai: true, keywords: 'tasks extract', run: (e, r) => { del(e, r).run(); handlers.ai('actions', r) } },
  ]
}

const SlashList = React.forwardRef<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }, SuggestionProps<SlashItem>>(function SlashList({ items, command }, ref) {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => setIndex(0), [items])
  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') { setIndex((i) => (i + items.length - 1) % items.length); return true }
      if (event.key === 'ArrowDown') { setIndex((i) => (i + 1) % items.length); return true }
      if (event.key === 'Enter') { const it = items[index]; if (it) command(it); return true }
      return false
    },
  }))
  if (!items.length) return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-fg-3 shadow-pop">No matching command</div>
  return (
    <div className="max-h-[320px] w-[300px] overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-pop">
      {items.map((it, i) => (
        <button key={it.id} onClick={() => command(it)} onMouseEnter={() => setIndex(i)} className={cx('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left', i === index && 'bg-surface-2')}>
          <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface', it.ai && 'text-accent')}><it.icon className="h-4 w-4" /></span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-medium">{it.title}</span>
            <span className="block truncate text-[11.5px] text-fg-3">{it.hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
})

export function SlashCommand(items: () => SlashItem[]) {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: '/',
          startOfLine: false,
          allowSpaces: false,
          items: ({ query }) => items().filter((it) => (it.title + ' ' + (it.keywords ?? '')).toLowerCase().includes(query.toLowerCase())).slice(0, 12),
          command: ({ editor, range, props }) => props.run(editor, range),
          render: () => {
            let component: ReactRenderer<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }> | null = null
            let popup: Instance[] | null = null
            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashList, { props, editor: props.editor })
                if (!props.clientRect) return
                popup = tippy('body', { getReferenceClientRect: props.clientRect as () => DOMRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start', arrow: false, offset: [0, 6] })
              },
              onUpdate: (props) => {
                component?.updateProps(props)
                if (props.clientRect) popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true }
                return component?.ref?.onKeyDown(props) ?? false
              },
              onExit: () => { popup?.[0]?.destroy(); component?.destroy() },
            }
          },
        }),
      ]
    },
  })
}

/* ---------------------------------------------------------------- mentions */
export interface MentionItem { id: string; name: string; type: string; attributes?: { role?: string; company?: string } }
const MentionList = React.forwardRef<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }, SuggestionProps<MentionItem>>(function MentionList({ items, command, query }, ref) {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => setIndex(0), [items])
  const all = [...items, ...(query.trim() && !items.some((i) => i.name.toLowerCase() === query.trim().toLowerCase()) ? [{ id: `new:${query.trim()}`, name: query.trim(), type: 'person' }] : [])]
  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') { setIndex((i) => (i + all.length - 1) % Math.max(all.length, 1)); return true }
      if (event.key === 'ArrowDown') { setIndex((i) => (i + 1) % Math.max(all.length, 1)); return true }
      if (event.key === 'Enter') { const it = all[index]; if (it) command(it); return true }
      return false
    },
  }))
  if (!all.length) return null
  return (
    <div className="w-[260px] rounded-xl border border-border bg-surface p-1 shadow-pop">
      {all.map((it, i) => (
        <button key={it.id} onClick={() => command(it)} onMouseEnter={() => setIndex(i)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left', i === index && 'bg-surface-2')}>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">{it.id.startsWith('new:') ? `Add “${it.name}”` : it.name}</span>
            <span className="block truncate text-[11.5px] text-fg-3">{it.id.startsWith('new:') ? 'New person' : [it.type, it.attributes?.role, it.attributes?.company].filter(Boolean).join(' · ')}</span>
          </span>
        </button>
      ))}
    </div>
  )
})

export const mentionSuggestion = {
  char: '@',
  items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
    try {
      const res = await fetch(`/api/entities?q=${encodeURIComponent(query)}`)
      return (await res.json()) as MentionItem[]
    } catch {
      return []
    }
  },
  render: () => {
    let component: ReactRenderer<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }> | null = null
    let popup: Instance[] | null = null
    return {
      onStart: (props: SuggestionProps<MentionItem>) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor })
        if (!props.clientRect) return
        popup = tippy('body', { getReferenceClientRect: props.clientRect as () => DOMRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start', arrow: false, offset: [0, 6] })
      },
      onUpdate: (props: SuggestionProps<MentionItem>) => {
        component?.updateProps(props)
        if (props.clientRect) popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => { popup?.[0]?.destroy(); component?.destroy() },
    }
  },
}
