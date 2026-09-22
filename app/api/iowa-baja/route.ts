import { NextResponse } from 'next/server';
import { sendBajaInterestEmail } from '@/lib/email';
import { ensureTag, findOrCreateContact } from '@/lib/contacts';
import { ensureCampusStudent } from '@/lib/bibleStudies';

// PUBLIC. A student on /iowa/baja saying they're interested in the 2027 trip.
// Creates (or tags) a campus student record, then emails the campus inbox.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    email?: string;
    hasPassport?: string;
    year?: string;
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
  // Required: contacts are matched on email, so without one we'd make duplicates.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address looks off.' }, { status: 400 });
  }

  try {
    // Every hand raised becomes a campus student tagged "Baja 2027", so staff
    // can invite them to the interest meeting from the admin. Not subscribed:
    // they asked about a trip, not the newsletter.
    const [iowaTag, bajaTag] = await Promise.all([ensureTag('ARK Iowa', 'role'), ensureTag('Baja 2027')]);
    const contact = await findOrCreateContact({
      name,
      email,
      phone,
      source: 'ARK Iowa Baja 2027',
      subscribed: false,
      tagIds: [iowaTag.id, bajaTag.id],
    });
    await ensureCampusStudent(contact.id, body.year);

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
