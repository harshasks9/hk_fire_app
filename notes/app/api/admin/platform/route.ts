import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from '@/lib/platform'
import { logAdminEvent } from '@/lib/notebooks'
import { emailConfigured } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    return NextResponse.json({ settings: await getPlatformSettings(), email: emailConfigured() })
  } catch (e) {
    return apiError(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const s = await requireAdmin()
    const b = (await req.json().catch(() => ({}))) as Partial<PlatformSettings>
    const next = await updatePlatformSettings(b)
    await logAdminEvent({ id: s.userId, name: s.user.name }, 'platform.settings', undefined, { keys: Object.keys(b) })
    return NextResponse.json({ ok: true, settings: next })
  } catch (e) {
    return apiError(e)
  }
}
