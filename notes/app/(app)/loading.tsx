import { Skeleton } from '@/components/ui'
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-5 py-8 sm:px-8">
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-96" />
      <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    </div>
  )
}
