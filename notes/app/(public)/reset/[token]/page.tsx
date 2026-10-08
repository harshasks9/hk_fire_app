import Link from 'next/link'
import { ResetForm } from '@/components/public/ResetForm'
import { peekAuthToken } from '@/lib/auth-tokens'
import { ensureReady } from '@/lib/bootstrap'
export const metadata = { title: 'Choose a new password' }

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const { token } = await params
  const found = await peekAuthToken(token, 'reset')
  if (!found) {
    return (
      <div className="mx-auto max-w-[420px] px-5 py-20 text-center">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">This link is no longer valid</h1>
        <p className="mt-2 text-[14px] text-fg-2">Reset links work once and expire after an hour.</p>
        <Link href="/forgot" className="mt-6 inline-block text-[14px] font-medium text-accent">Request a new one →</Link>
      </div>
    )
  }
  return <div className="flex items-center justify-center px-5 py-12"><ResetForm token={token} email={found.user.email ?? ''} /></div>
}
