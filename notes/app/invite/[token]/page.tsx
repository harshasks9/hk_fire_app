import { InviteForm } from '@/components/account/InviteForm'
import { inviteByToken } from '@/lib/notebooks'
import { ensureReady } from '@/lib/bootstrap'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'You are invited' }

/** Public: accept an invitation, set a password, land in the notebook. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const { token } = await params
  const found = await inviteByToken(token)
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      {!found ? (
        <Invalid reason="This invitation link does not exist." />
      ) : !found.valid ? (
        <Invalid reason={found.invite.acceptedAt ? 'This invitation has already been used. Sign in instead.' : 'This invitation has expired. Ask the administrator for a new link.'} />
      ) : (
        <InviteForm token={token} notebook={found.notebook.name} email={found.invite.email} role={found.invite.role} />
      )}
    </main>
  )
}

function Invalid({ reason }: { reason: string }) {
  return (
    <div className="w-full max-w-[380px] text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[16px] font-bold text-accent-fg">N</div>
      <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Invitation not available</h1>
      <p className="mt-2 text-[14px] text-fg-2">{reason}</p>
      <a href="/login" className="mt-6 inline-block text-[14px] font-medium text-accent">Go to sign in →</a>
    </div>
  )
}
