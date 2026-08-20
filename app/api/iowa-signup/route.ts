import { NextResponse } from 'next/server';
import { sendTableSignupEmail } from '@/lib/email';

// PUBLIC. A student on /iowa picking a day and time for a table.
// Email only — no list, no storage. The follow-up text is the actual product.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    availability?: string[];
    bringing?: string;
    message?: string;
    company?: string; // honeypot — real users leave it empty
  };

  if (body.company) {
    // Bot filled the hidden field — pretend success, do nothing.
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const availability = Array.isArray(body.availability)
    ? body.availability.map((a) => String(a).trim()).filter(Boolean)
    : [];
  const email = body.email?.trim();

  if (!name) {
    return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
  }
  // Loose on purpose — students write numbers a dozen different ways and a
  // rejected form costs more than a badly formatted number.
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please enter a phone number we can text.' }, { status: 400 });
  }
  if (availability.length === 0) {
    return NextResponse.json({ error: 'Tap at least one time that works for you.' }, { status: 400 });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address looks off.' }, { status: 400 });
  }

  try {
    await sendTableSignupEmail({
      name,
      phone,
      email,
      availability,
      bringing: body.bringing?.trim(),
      message: body.message?.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
