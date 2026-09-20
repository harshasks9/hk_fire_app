'use client'
/*
  Offline state + outbox replay. A tiny external store (online, pending, syncing)
  that any component can subscribe to with useOffline(), and flushOutbox(),
  which replays queued work in order and stops at the first network failure.
*/
import { useSyncExternalStore } from 'react'
import { outboxAll, outboxDelete, outboxPut, outboxCount, outboxGet, localId, type OutboxItem, type CaptureItem, type NoteCreateItem, type NotePatchItem } from './db'

export interface OfflineState { online: boolean; pending: number; failed: number; syncing: boolean; lastSyncAt: number | null }

let state: OfflineState = { online: true, pending: 0, failed: 0, syncing: false, lastSyncAt: null }
const listeners = new Set<() => void>()
const serverSnapshot = state
function emit(patch: Partial<OfflineState>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

export function useOffline(): OfflineState {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => state, () => serverSnapshot)
}

export function setOnline(online: boolean) {
  if (state.online !== online) emit({ online })
}

let currentContextId: string | undefined
export function setActiveContextId(id: string | undefined) {
  currentContextId = id
}

export function isNetworkError(e: unknown): boolean {
  if (!e) return false
  if ((e as { offline?: boolean }).offline) return true
  if (e instanceof TypeError) return true
  const m = String((e as Error).message ?? e)
  return /failed to fetch|networkerror|load failed|network request failed|offline/i.test(m)
}

export async function refreshPending() {
  try {
    const items = await outboxAll()
    emit({ pending: items.length, failed: items.filter((i) => i.attempts >= 3 && i.error).length })
  } catch {
    /* no IndexedDB */
  }
}

/* ------------------------------ enqueue helpers ----------------------------- */

export async function enqueueCapture(input: { text: string; files?: File[] }): Promise<string> {
  const item: CaptureItem = { id: localId('cap'), kind: 'capture', createdAt: Date.now(), updatedAt: Date.now(), attempts: 0, contextId: currentContextId, text: input.text, files: input.files ?? [] }
  await outboxPut(item)
  await refreshPending()
  requestBackgroundSync()
  return item.id
}

export async function createDraft(input: { title?: string; markdown?: string } = {}): Promise<NoteCreateItem> {
  const item: NoteCreateItem = { id: localId('draft'), kind: 'note-create', createdAt: Date.now(), updatedAt: Date.now(), attempts: 0, contextId: currentContextId, title: input.title ?? '', markdown: input.markdown ?? '' }
  await outboxPut(item)
  await refreshPending()
  return item
}

export async function saveDraft(id: string, patch: { title?: string; markdown?: string }): Promise<NoteCreateItem | null> {
  const cur = await outboxGet(id)
  if (!cur || cur.kind !== 'note-create') return null
  const next: NoteCreateItem = { ...cur, ...patch, updatedAt: Date.now(), error: undefined, attempts: 0 }
  await outboxPut(next)
  requestBackgroundSync()
  return next
}

/** Queue an edit to an existing note. One entry per note: the latest content wins. */
export async function savePatchOffline(input: { noteId: string; title: string; contentJson: unknown }): Promise<void> {
  const id = `patch_${input.noteId}`
  const cur = await outboxGet(id)
  const item: NotePatchItem = { id, kind: 'note-patch', createdAt: cur?.createdAt ?? Date.now(), updatedAt: Date.now(), attempts: 0, noteId: input.noteId, title: input.title, contentJson: input.contentJson }
  await outboxPut(item)
  await refreshPending()
  requestBackgroundSync()
}

export async function pendingPatchFor(noteId: string): Promise<NotePatchItem | null> {
  const cur = await outboxGet(`patch_${noteId}`)
  return cur && cur.kind === 'note-patch' ? cur : null
}

export async function removeOutboxItem(id: string) {
  await outboxDelete(id)
  await refreshPending()
}

export async function retryOutboxItem(id: string) {
  const cur = await outboxGet(id)
  if (cur) await outboxPut({ ...cur, attempts: 0, error: undefined })
  await flushOutbox()
}

function requestBackgroundSync() {
  try {
    navigator.serviceWorker?.ready.then((reg) => (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync?.register('hkn-outbox')).catch(() => undefined)
  } catch {
    /* unsupported */
  }
}

/* --------------------------------- replay ---------------------------------- */

async function send(item: OutboxItem): Promise<{ noteId?: string }> {
  if (item.kind === 'capture') {
    const fd = new FormData()
    fd.set('text', item.text)
    for (const f of item.files) fd.append('files', f, f.name)
    fd.set('capturedAt', new Date(item.createdAt).toISOString())
    if (item.contextId) fd.set('contextId', item.contextId)
    const res = await fetch('/api/capture', { method: 'POST', body: fd })
    if (!res.ok) throw Object.assign(new Error(`Capture failed (HTTP ${res.status})`), { status: res.status })
    const j = (await res.json()) as { id: string }
    return { noteId: j.id }
  }
  if (item.kind === 'note-create') {
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, markdown: item.markdown, process: true, createdAt: new Date(item.createdAt).toISOString(), contextId: item.contextId, source: 'offline' }) })
    if (!res.ok) throw Object.assign(new Error(`Could not create note (HTTP ${res.status})`), { status: res.status })
    const j = (await res.json()) as { id: string }
    return { noteId: j.id }
  }
  const res = await fetch(`/api/notes/${item.noteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, contentJson: item.contentJson, process: true }) })
  if (res.status === 404) return {} // the note was deleted elsewhere: drop the edit
  if (!res.ok) throw Object.assign(new Error(`Could not save note (HTTP ${res.status})`), { status: res.status })
  return { noteId: item.noteId }
}

let flushing: Promise<void> | null = null

/** Replay the outbox in order. Stops at the first network failure; server rejections are recorded and skipped. */
export function flushOutbox(): Promise<void> {
  if (flushing) return flushing
  flushing = (async () => {
    let items: OutboxItem[] = []
    try {
      items = await outboxAll()
    } catch {
      return
    }
    if (!items.length) { emit({ pending: 0, failed: 0 }); return }
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setOnline(false); return }
    emit({ syncing: true })
    let synced = 0
    try {
      for (const item of items) {
        if (item.kind === 'note-create' && !item.title.trim() && !item.markdown.trim()) { await outboxDelete(item.id); continue }
        if (item.kind === 'capture' && !item.text.trim() && !item.files.length) { await outboxDelete(item.id); continue }
        try {
          const r = await send(item)
          await outboxDelete(item.id)
          synced++
          window.dispatchEvent(new CustomEvent('hkn:synced-item', { detail: { id: item.id, kind: item.kind, noteId: r.noteId } }))
        } catch (e) {
          if (isNetworkError(e)) { setOnline(false); break }
          await outboxPut({ ...item, attempts: item.attempts + 1, error: String((e as Error).message ?? e) })
        }
      }
    } finally {
      emit({ syncing: false, lastSyncAt: synced ? Date.now() : state.lastSyncAt })
      await refreshPending()
      if (synced) window.dispatchEvent(new CustomEvent('hkn:synced', { detail: { count: synced } }))
    }
  })().finally(() => { flushing = null })
  return flushing
}

export async function outboxItems(): Promise<OutboxItem[]> {
  return outboxAll()
}

export async function outboxSize(): Promise<number> {
  return outboxCount()
}

/* ------------------------------ recent pages ------------------------------- */

export interface RecentPage { href: string; title: string; at: number }
const RECENT_KEY = 'hkn-recent-pages'

export function recordRecentPage(href: string, title: string) {
  try {
    const list = recentPages().filter((p) => p.href !== href)
    list.unshift({ href, title: title.replace(/ · Notes$/, ''), at: Date.now() })
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 40)))
  } catch {
    /* ignore */
  }
}

export function recentPages(): RecentPage[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as RecentPage[]
  } catch {
    return []
  }
}
