import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Not here</h1>
      <p className="mt-2 text-[14px] text-fg-2">That page or note doesn’t exist in this context.</p>
      <Link href="/" className="mt-6 inline-block text-[14px] font-medium text-accent">Back home →</Link>
    </div>
  )
}
