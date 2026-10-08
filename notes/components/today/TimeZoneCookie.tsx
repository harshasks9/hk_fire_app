'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Tells the server which time zone the reader is in, so "today" and day boundaries follow the person, not the server. */
export function TimeZoneCookie({ current }: { current: string }) {
  const router = useRouter()
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && tz !== current) {
        document.cookie = `hkn_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
        router.refresh()
      }
    } catch { /* ignore */ }
  }, [current, router])
  return null
}
