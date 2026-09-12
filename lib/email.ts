/*
  Outbound email: verification, password reset, invitations, welcome.
  Sends through Resend's REST API when RESEND_API_KEY is set; otherwise the
  message is logged and the caller gets the link back so the UI can show it
  (local development, or a deployment that has not configured email yet).
*/
export interface EmailMessage { to: string; subject: string; text: string; html?: string }
export interface EmailResult { sent: boolean; provider: 'resend' | 'log'; id?: string; error?: string }

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function emailFrom(productName = 'Notes'): string {
  return process.env.EMAIL_FROM || `${productName} <onboarding@resend.dev>`
}

export async function sendEmail(msg: EmailMessage, opts: { productName?: string } = {}): Promise<EmailResult> {
  if (!emailConfigured()) {
    console.log(`[email:log] to=${msg.to} subject=${JSON.stringify(msg.subject)}\n${msg.text}`)
    return { sent: false, provider: 'log' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: emailFrom(opts.productName), to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html ?? textToHtml(msg.text) }),
    })
    if (!res.ok) {
      const err = (await res.text()).slice(0, 300)
      console.error('[email] resend failed', res.status, err)
      return { sent: false, provider: 'resend', error: `HTTP ${res.status}: ${err}` }
    }
    const j = (await res.json().catch(() => ({}))) as { id?: string }
    return { sent: true, provider: 'resend', id: j.id }
  } catch (e) {
    console.error('[email] resend error', e)
    return { sent: false, provider: 'resend', error: String((e as Error).message ?? e) }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Plain text → simple HTML: paragraphs, and bare links become anchors. */
export function textToHtml(text: string): string {
  const paras = text.trim().split(/\n{2,}/).map((p) => escapeHtml(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'))
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1e;max-width:560px">${paras.map((p) => `<p style="margin:0 0 14px">${p}</p>`).join('')}</div>`
}

/* ------------------------------- templates ------------------------------- */

export function verifyEmailMessage(input: { to: string; name: string; link: string; productName: string }): EmailMessage {
  return {
    to: input.to,
    subject: `Confirm your email for ${input.productName}`,
    text: `Hi ${input.name},\n\nWelcome to ${input.productName}. Confirm this email address to finish setting up your account:\n\n${input.link}\n\nThe link is valid for 24 hours. If you did not create an account, you can ignore this message.`,
  }
}

export function resetPasswordMessage(input: { to: string; name: string; link: string; productName: string }): EmailMessage {
  return {
    to: input.to,
    subject: `Reset your ${input.productName} password`,
    text: `Hi ${input.name},\n\nSomeone asked to reset the password for this address. If that was you, choose a new password here:\n\n${input.link}\n\nThe link is valid for one hour and can be used once. If you did not ask for this, nothing changes and you can ignore this message.`,
  }
}

export function inviteMessage(input: { to: string; inviter: string; notebook: string; link: string; productName: string; role: string }): EmailMessage {
  return {
    to: input.to,
    subject: `${input.inviter} invited you to “${input.notebook}” on ${input.productName}`,
    text: `${input.inviter} invited you to join the notebook “${input.notebook}” as ${input.role === 'owner' ? 'an owner' : 'a member'}.\n\nAccept the invitation and choose a password:\n\n${input.link}\n\nThe link is valid for 7 days and can be used once.`,
  }
}

export function welcomeMessage(input: { to: string; name: string; link: string; productName: string }): EmailMessage {
  return {
    to: input.to,
    subject: `Welcome to ${input.productName}`,
    text: `Hi ${input.name},\n\nYour notebook is ready: ${input.link}\n\nCapture anything, organize nothing, find everything. Start with a note, a meeting recording or an import, and the app does the filing.`,
  }
}
