import { getPlatformSettings } from '@/lib/platform'
export const metadata = { title: 'Privacy policy' }
export default async function PrivacyPage() {
  const s = await getPlatformSettings()
  return (
    <article className="mx-auto w-full max-w-[720px] px-5 py-14 text-[15px] leading-relaxed text-fg-2 sm:px-8">
      <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-fg">Privacy policy</h1>
      <p className="mt-1 text-[13px] text-fg-3">Last updated 12 September 2026</p>
      <h2 className="mt-8 text-[18px] font-semibold text-fg">What we store</h2>
      <p>Your name, email address and a salted hash of your password; the notes, recordings, attachments and everything the app derives from them; usage records (which features you used and when, and each AI call with its purpose and size, never its content); and the administrative audit log.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">Where it goes</h2>
      <p>Data lives in the service's database. To analyze notes, transcribe recordings and answer questions, text and audio are sent to the AI provider configured for your notebook (the deployment's shared provider, or the keys you bring yourself). Nothing is sent when the notebook runs in local-only mode. Emails (verification, password reset, invitations) go through the configured email provider.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">Who can see it</h2>
      <p>You and the members of your notebook. Read-only share links show one note to whoever holds the link until you revoke it. The platform administrator can enter a notebook for support; every such action is recorded in the audit log and shown to them with a banner.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">Cookies</h2>
      <p>One signed session cookie keeps you signed in for 30 days, and one small cookie remembers your active context. No advertising or third-party tracking.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">Your rights</h2>
      <p>Export everything from Settings, correct your details there, and delete the account whenever you like. {s.supportEmail ? `For anything else, write to ${s.supportEmail}.` : 'For anything else, contact the administrator of this deployment.'}</p>
    </article>
  )
}
