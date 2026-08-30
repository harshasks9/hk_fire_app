import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ ok: true, app: 'five-delta', at: new Date().toISOString() })
}
