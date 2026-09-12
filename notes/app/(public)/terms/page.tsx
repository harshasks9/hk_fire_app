import { getPlatformSettings } from '@/lib/platform'
export const metadata = { title: 'Terms of service' }
export default async function TermsPage() {
  const s = await getPlatformSettings()
  return (
    <article className="mx-auto w-full max-w-[720px] px-5 py-14 text-[15px] leading-relaxed text-fg-2 sm:px-8">
      <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-fg">Terms of service</h1>
      <p className="mt-1 text-[13px] text-fg-3">Last updated 12 September 2026</p>
      <h2 className="mt-8 text-[18px] font-semibold text-fg">1. The service</h2>
      <p>{s.productName} is a note-taking and personal intelligence service. You get a private notebook; we host it, keep it available and apply AI models to the content you put in it, on your behalf.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">2. Your account</h2>
      <p>You need an account with a working email address. Keep your password to yourself; you are responsible for what happens under your account. One person per account; a notebook can have several members on plans that allow it.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">3. Your content</h2>
      <p>Everything you put in your notebook stays yours. We only process it to run the service: storing it, indexing it, sending it to the AI provider configured for your notebook to extract structure and answer your questions, and showing it back to you and to people you share it with. We never sell it or use it to train models.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">4. Plans and payment</h2>
      <p>The free plan has the quotas shown on the pricing page. Paid plans are billed monthly in advance and can be cancelled at any time; the plan stays active until the end of the paid period. Quotas are enforced by the service, and AI actions fall back to local analysis when the month's budget is spent.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">5. Acceptable use</h2>
      <p>Do not use the service to store unlawful content, to attack it or other people's notebooks, or to exceed quotas by automated means. We may suspend accounts that do.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">6. Leaving</h2>
      <p>You can export your notebook as JSON at any time and delete your account from Settings. Deleting removes the notebook and everything derived from it within minutes; backups age out within 30 days.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">7. Warranty and liability</h2>
      <p>The service is provided as is. AI output can be wrong; verify anything that matters. To the extent the law allows, our liability is limited to the fees you paid in the previous twelve months.</p>
      <h2 className="mt-6 text-[18px] font-semibold text-fg">8. Changes and contact</h2>
      <p>We may update these terms; material changes are announced in the app. {s.supportEmail ? `Questions go to ${s.supportEmail}.` : 'Questions go to the administrator of this deployment.'}</p>
    </article>
  )
}
