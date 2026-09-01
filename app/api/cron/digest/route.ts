import { NextRequest, NextResponse } from 'next/server'
import { sendDigest } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const res = await sendDigest()
  return NextResponse.json(res)
}
