import { NextRequest, NextResponse } from 'next/server'
import { rewrite } from '@/lib/rewrite'
import type { RewriteMode } from '@/lib/ai/types'
export const maxDuration = 60
export async function POST(req: NextRequest) {
  const { mode, text, question, noteTitle, context } = (await req.json()) as { mode: RewriteMode; text: string; question?: string; noteTitle?: string; context?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Nothing selected' }, { status: 400 })
  return NextResponse.json(await rewrite(mode, text, { question, noteTitle, context, userName: process.env.USER_NAME || 'Harsha' }))
}
