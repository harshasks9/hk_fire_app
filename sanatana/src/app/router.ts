/**
 * A tiny hash router: #/path/segments?key=value. Hash routing keeps every deep link
 * working on any static host and under any sub-path, with no server rewrites.
 */
import { useEffect, useState } from 'react'

export interface Route {
  path: string[]
  query: URLSearchParams
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [p, q] = raw.split('?')
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q ?? '') }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function href(path: string, query?: Record<string, string | number | undefined | null>): string {
  const q = query ? Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '') : []
  const qs = q.length ? '?' + q.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&') : ''
  return `#/${path.replace(/^\//, '')}${qs}`
}

export function navigate(path: string, query?: Record<string, string | number | undefined | null>, replace = false) {
  const h = href(path, query)
  if (replace) history.replaceState(null, '', h)
  else window.location.hash = h
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export const entityHref = (id: string) => href(`entity/${encodeURIComponent(id)}`)
