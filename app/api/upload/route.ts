import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { addAttachment } from '@/lib/notes'
export const maxDuration = 30
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const noteId = String(form.get('noteId') ?? '')
  const file = form.get('file')
  if (!noteId || !(file instanceof File)) return NextResponse.json({ error: 'noteId and file required' }, { status: 400 })
  const denied = await guardOwned('note', noteId)
  if (denied) return denied
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 6 MB in this deployment)' }, { status: 413 })
  const id = await addAttachment(noteId, { name: file.name, mime: file.type || 'application/octet-stream', bytes: Buffer.from(await file.arrayBuffer()) })
  return NextResponse.json({ id, url: `/api/attachments/${id}`, name: file.name, mime: file.type, size: file.size })
}
