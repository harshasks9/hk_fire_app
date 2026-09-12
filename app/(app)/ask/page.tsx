import { Suspense } from 'react'
import { getActiveContext } from '@/lib/context'
import { aiStatus } from '@/lib/ai/provider'
import { AskClient } from '@/components/ask/AskClient'
export const dynamic = 'force-dynamic'
const EXAMPLES: Record<string, string[]> = {
  work: ['What are the biggest recurring issues across my customer conversations?', 'Where are we consistently losing to Anthropic?', 'What have I learned about marketplace economics?', 'Which customer commitments haven’t been followed up?'],
  research: ['What is the working conclusion on Irish ETFs?', 'What numbers drive the buy vs rent decision?', 'What is still unresolved on India tax?', 'How much does volatility decay cost per year?'],
  default: ['What did I decide recently?', 'What is still waiting on someone else?', 'What changed this month?', 'What have I written about most?'],
}
export default async function AskPage() {
  const ctx = await getActiveContext()
  const ai = aiStatus()
  return (
    <Suspense>
      <AskClient contextName={ctx.name} isLLM={ai.isLLM} examples={EXAMPLES[ctx.kind] ?? EXAMPLES.default!} />
    </Suspense>
  )
}
