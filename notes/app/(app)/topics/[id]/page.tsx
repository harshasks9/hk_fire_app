import { notFound } from 'next/navigation'
import { getEntity } from '@/lib/queries'
import { EntityPage } from '@/components/entities/EntityPage'
export const dynamic = 'force-dynamic'
export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getEntity(id)
  if (!d) notFound()
  return <EntityPage d={d} />
}
