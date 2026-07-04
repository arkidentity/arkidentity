import { NextResponse } from 'next/server';
import { createPendingSubscriber, type PartnerFrequency } from '@/lib/partners';
import { sendConfirmationEmail, siteUrl } from '@/lib/email';

// PUBLIC (not behind the /admin proxy). New subscribers from the feed.
// Double opt-in: create a pending partner and email a confirmation link.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    frequency?: PartnerFrequency;
    company?: string; // honeypot — real users leave it empty
  };

  if (body.company) {
    // Bot filled the hidden field — pretend success, do nothing.
    return NextResponse.json({ ok: true });
  }

  const email = body.email?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  const frequency: PartnerFrequency = body.frequency === 'weekly' ? 'weekly' : 'monthly';

  try {
    const { token, alreadyConfirmed } = await createPendingSubscriber({
      name: body.name?.trim() || '',
      email,
      frequency,
    });

    if (!alreadyConfirmed && token) {
      const confirmUrl = `${siteUrl()}/feed/subscribe/confirm?token=${token}`;
      await sendConfirmationEmail(email, body.name?.trim() || '', confirmUrl);
    }

    // Always the same response — don't reveal whether the address already exists.
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
