import { NextRequest, NextResponse } from 'next/server'
import { runDailyJob } from '@/lib/jobs'

export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const report = await runDailyJob()
  return NextResponse.json(report)
}
