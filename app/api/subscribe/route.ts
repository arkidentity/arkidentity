import { NextResponse } from 'next/server';
import { subscribePublic, type ContactFrequency } from '@/lib/contacts';

// PUBLIC (not behind the /admin proxy). New subscribers from the feed.
//
// No double opt-in: the address goes straight onto the list (see 007_contacts
// .sql). That makes the honeypot below the only thing keeping bots off the
// list, so don't remove it. An address we already know — a student, someone met
// at an event, an existing partner — has its subscription switched on rather
// than being added a second time.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    frequency?: ContactFrequency;
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
  const frequency: ContactFrequency = body.frequency === 'weekly' ? 'weekly' : 'monthly';

  try {
    await subscribePublic({ name: body.name?.trim() || '', email, frequency });
    // Always the same response — don't reveal whether the address already exists.
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
