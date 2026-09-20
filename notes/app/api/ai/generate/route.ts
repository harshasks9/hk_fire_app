import { NextRequest, NextResponse } from 'next/server'
import { generateOutput, type GenerateTarget } from '@/lib/generate'
import type { OutputType } from '@/lib/ai/types'
export const maxDuration = 60
export async function POST(req: NextRequest) {
  const { type, target } = (await req.json()) as { type: OutputType; target: GenerateTarget }
  return NextResponse.json(await generateOutput(type, target))
}
