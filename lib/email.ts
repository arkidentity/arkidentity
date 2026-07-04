import { Resend } from 'resend';

// Server-only email sending via Resend. Uses a dedicated sending identity
// (ideally a subdomain like updates.arkidentity.com) so ministry-feed volume
// doesn't affect other ARK sending reputation.

let client: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY.');
  client ??= new Resend(apiKey);
  return client;
}

function fromAddress(): string {
  // e.g. "ARK Identity <updates@updates.arkidentity.com>"
  return process.env.EMAIL_FROM || 'ARK Identity <onboarding@resend.dev>';
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arkidentity.com').replace(/\/$/, '');
}

const wrap = (inner: string) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2c2c2a; line-height: 1.6;">
    ${inner}
  </div>`;

export async function sendConfirmationEmail(to: string, name: string, confirmUrl: string) {
  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">Confirm your subscription</h1>
    <p>Hi ${escapeHtml(name || 'friend')},</p>
    <p>Tap the button below to confirm you'd like ministry updates from ARK Identity.</p>
    <p style="margin:28px 0;">
      <a href="${confirmUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">Confirm subscription</a>
    </p>
    <p style="color:#8a8378; font-size:14px;">If you didn't request this, you can ignore this email and nothing will happen.</p>
  `);

  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject: 'Confirm your ARK Identity subscription',
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
