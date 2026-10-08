'use client'
import { Button } from '@/components/ui'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Something went wrong</h1>
      <p className="mt-2 text-[14px] text-fg-2">{error.message || 'An unexpected error occurred.'}</p>
      <div className="mt-6"><Button variant="primary" onClick={reset}>Try again</Button></div>
    </div>
  )
}
