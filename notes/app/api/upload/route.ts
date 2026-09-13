import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { addAttachment } from '@/lib/notes'
export const maxDuration = 30
/** Upload a file against a note (`noteId`) or a task (`taskId`). Images, audio, video and documents alike. */
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const noteId = String(form.get('noteId') ?? '')
  const taskId = String(form.get('taskId') ?? '')
  const file = form.get('file')
  if ((!noteId && !taskId) || !(file instanceof File)) return NextResponse.json({ error: 'noteId or taskId, and file, are required' }, { status: 400 })
  const denied = taskId ? await guardOwned('task', taskId) : await guardOwned('note', noteId)
  if (denied) return denied
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 6 MB in this deployment)' }, { status: 413 })
  const id = await addAttachment(taskId ? { taskId } : noteId, { name: file.name, mime: file.type || 'application/octet-stream', bytes: Buffer.from(await file.arrayBuffer()) })
  return NextResponse.json({ id, url: `/api/attachments/${id}`, name: file.name, mime: file.type, size: file.size })
}
