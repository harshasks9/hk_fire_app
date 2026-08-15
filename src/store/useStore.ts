import { useSyncExternalStore } from 'react'
import { getStore, subscribeStore } from './store'
import type { StoreData } from './types'

/** Subscribe a component to the canonical store. Re-renders on every mutation. */
export function useStore(): StoreData {
  return useSyncExternalStore(subscribeStore, getStore, getStore)
}
