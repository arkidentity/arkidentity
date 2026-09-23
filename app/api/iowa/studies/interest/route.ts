import { NextResponse } from 'next/server';
import { recordInterest } from '@/lib/campusAutomation';

export const dynamic = 'force-dynamic';

// POST /api/iowa/studies/interest — the third door on the public page: not
// joining a study, not starting one, just "I'm in, call me". Lands as an ARK
// Iowa student plus a follow-up task due today.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    year?: string;
    metBy?: string;
    note?: string;
    hpField?: string; // honeypot — real users leave it empty
  };

  if (body.hpField) {
    console.warn('[iowa interest] honeypot tripped');
    return NextResponse.json({ ok: true }); // pretend success, do nothing
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  if (!name) return bad('Please tell us your name.');
  if (!phone || phone.replace(/\D/g, '').length < 10) return bad('Please enter a phone number we can text.');
  // Contacts are keyed by email (findOrCreateContact), same as join and start.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Please enter an email we can reach you at.');

  try {
    await recordInterest({
      name,
      phone,
      email,
      year: body.year || null,
      metBy: body.metBy || null,
      note: body.note?.trim().slice(0, 500) || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[iowa interest]', e);
    return bad('Something went wrong — text us and we’ll sort it out.');
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
