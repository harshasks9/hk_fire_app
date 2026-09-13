/*
  Local outbox (IndexedDB). Everything written while offline, or while the
  network is failing, lands here and is replayed by lib/offline/sync.ts.
  Three kinds of work:
    capture      — a quick capture (text + optional files)
    note-create  — a note written in the offline notepad (title + markdown)
    note-patch   — an edit to an existing note (title + editor JSON), one per note
*/
export interface OutboxBase { id: string; createdAt: number; updatedAt: number; attempts: number; error?: string; contextId?: string }
export interface CaptureItem extends OutboxBase { kind: 'capture'; text: string; files: File[] }
export interface NoteCreateItem extends OutboxBase { kind: 'note-create'; title: string; markdown: string }
export interface NotePatchItem extends OutboxBase { kind: 'note-patch'; noteId: string; title: string; contentJson: unknown }
export type OutboxItem = CaptureItem | NoteCreateItem | NotePatchItem

const DB = 'hkn-offline'
const STORE = 'outbox'

export function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

let opening: Promise<IDBDatabase> | null = null
function open(): Promise<IDBDatabase> {
  if (opening) return opening
  opening = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => { opening = null; reject(req.error) }
  })
  return opening
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export async function outboxAll(): Promise<OutboxItem[]> {
  if (!hasIndexedDb()) return []
  const items = await tx<OutboxItem[]>('readonly', (s) => s.getAll())
  return items.sort((a, b) => a.createdAt - b.createdAt)
}

export async function outboxGet(id: string): Promise<OutboxItem | undefined> {
  if (!hasIndexedDb()) return undefined
  return tx<OutboxItem | undefined>('readonly', (s) => s.get(id))
}

export async function outboxPut(item: OutboxItem): Promise<void> {
  if (!hasIndexedDb()) throw new Error('Offline storage is not available in this browser')
  await tx('readwrite', (s) => s.put(item))
}

export async function outboxDelete(id: string): Promise<void> {
  if (!hasIndexedDb()) return
  await tx('readwrite', (s) => s.delete(id))
}

export async function outboxCount(): Promise<number> {
  if (!hasIndexedDb()) return 0
  return tx<number>('readonly', (s) => s.count())
}

export function localId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
