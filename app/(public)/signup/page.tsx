import { SignupForm } from '@/components/public/SignupForm'
import { getPlatformSettings } from '@/lib/platform'
import { authEnabled } from '@/lib/auth'
import Link from 'next/link'
export const metadata = { title: 'Create your notebook' }

export default async function SignupPage() {
  const settings = await getPlatformSettings()
  if (!authEnabled()) return <Closed title="Open mode" text="This deployment runs without accounts. Everyone shares the owner's notebook." link={{ href: '/', label: 'Open the notebook →' }} />
  if (settings.signupMode === 'closed') return <Closed title="Registration is closed" text={`New accounts are not being created on this deployment right now.${settings.supportEmail ? ` Contact ${settings.supportEmail} for access.` : ''}`} link={{ href: '/login', label: 'Sign in →' }} />
  if (settings.signupMode === 'invite') return <Closed title="Invitation only" text="Accounts on this deployment are created from invitation links. Ask the administrator, or the owner of the notebook you should join, to send you one." link={{ href: '/login', label: 'Already have an account? Sign in →' }} />
  return (
    <div className="flex items-center justify-center px-5 py-12">
      <SignupForm productName={settings.productName} allowSampleData={settings.allowSampleData} />
    </div>
  )
}

function Closed({ title, text, link }: { title: string; text: string; link: { href: string; label: string } }) {
  return (
    <div className="mx-auto max-w-[420px] px-5 py-20 text-center">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 text-[14px] text-fg-2">{text}</p>
      <Link href={link.href} className="mt-6 inline-block text-[14px] font-medium text-accent">{link.label}</Link>
    </div>
  )
}
