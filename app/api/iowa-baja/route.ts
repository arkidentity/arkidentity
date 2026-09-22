import { NextResponse } from 'next/server';
import { sendBajaInterestEmail } from '@/lib/email';

// PUBLIC. A student on /iowa/baja saying they're interested in the 2027 trip.
// Email only — no list, no storage. Same pattern as /api/iowa-signup.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    hasPassport?: string;
    message?: string;
    company?: string; // honeypot
  };

  if (body.company) return NextResponse.json({ ok: true });

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();

  if (!name) {
    return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please enter a phone number we can text.' }, { status: 400 });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address looks off.' }, { status: 400 });
  }

  try {
    await sendBajaInterestEmail({
      name,
      phone,
      email,
      hasPassport: body.hasPassport?.trim() || 'Not sure',
      message: body.message?.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
