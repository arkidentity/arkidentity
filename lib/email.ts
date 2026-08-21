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

export interface DigestPost {
  id: string;
  headline: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: string | null;
}

export async function sendDigestEmail(
  to: string,
  name: string,
  posts: DigestPost[],
  unsubscribeUrl: string
) {
  const feedUrl = `${siteUrl()}/feed`;

  const items = posts
    .map((p) => {
      const postUrl = `${siteUrl()}/feed/${p.id}`;
      return `
    <div style="margin:0 0 28px; padding:0 0 24px; border-bottom:1px solid #eee;">
      ${
        p.imageUrl
          ? `<a href="${postUrl}"><img src="${p.imageUrl}" alt="" width="100%" style="border-radius:10px; margin-bottom:12px; max-height:260px; object-fit:cover;" /></a>`
          : ''
      }
      ${p.headline ? `<h2 style="margin:0 0 8px; font-size:20px; line-height:1.3; color:#143348;">${escapeHtml(p.headline)}</h2>` : ''}
      <p style="margin:0 0 8px; font-size:16px; line-height:1.5; color:#4a4540;">${escapeHtml(p.excerpt)}</p>
      <a href="${postUrl}" style="color:#143348; font-weight:600; text-decoration:none;">Read the full update →</a>
    </div>`;
    })
    .join('');

  const html = wrap(`
    <p style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#9d855a; margin:0 0 4px;">From the field</p>
    <h1 style="color:#143348; font-size:24px; margin:0 0 24px;">ARK Identity ministry update</h1>
    ${items}
    <p style="margin:24px 0 8px;">
      <a href="${feedUrl}" style="background:#143348; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">See everything on the feed</a>
    </p>
    <div style="margin:20px 0; padding:20px; background:#faf6ee; border-radius:10px; text-align:center;">
      <p style="margin:0 0 12px; color:#4a4540; font-size:15px;">Your partnership empowers us to make more disciples.</p>
      <a href="${siteUrl()}/giving" style="background:#e8b562; color:#143348; text-decoration:none; padding:11px 22px; border-radius:8px; font-weight:700; display:inline-block;">Support the mission</a>
    </div>
    <p style="color:#8a8378; font-size:13px; margin-top:32px;">
      You're receiving this because you partner with ARK Identity.
      <a href="${unsubscribeUrl}" style="color:#8a8378;">Unsubscribe</a>.
    </p>
  `);

  // Lead the subject with the first update's headline when there's just one.
  const subject =
    posts.length === 1 && posts[0].headline
      ? posts[0].headline
      : `ARK Identity update${posts.length > 1 ? ` (${posts.length} new)` : ''}`;

  return getResend().emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });
}

export interface TableSignup {
  name: string;
  phone: string;
  email?: string;
  availability: string[];
  bringing?: string;
  message?: string;
}

// A student picking a table time on /iowa. Goes to the campus inbox, not to a list.
export async function sendTableSignupEmail(signup: TableSignup) {
  const row = (label: string, value: string) =>
    `<p style="margin:0 0 6px;"><strong style="color:#143348;">${label}:</strong> ${escapeHtml(value)}</p>`;

  const html = wrap(`
    <h1 style="color:#143348; font-size:22px;">New table signup — ARK Iowa</h1>
    ${row('Name', signup.name)}
    ${row('Phone', signup.phone)}
    ${signup.email ? row('Email', signup.email) : ''}
    ${row('Free', signup.availability.join(', '))}
    ${signup.bringing ? row('Bringing', signup.bringing) : ''}
    ${signup.message ? row('Message', signup.message) : ''}
    <p style="margin:20px 0 0; color:#8a8378; font-size:14px;">
      Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT.
      Text them within 24 hours.
    </p>
  `);

  return getResend().emails.send({
    from: fromAddress(),
    to: process.env.IOWA_INBOX || 'travis@arkidentity.com',
    replyTo: signup.email || undefined,
    subject: `Table signup — ${signup.name}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}
