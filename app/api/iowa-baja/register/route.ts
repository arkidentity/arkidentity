import { NextResponse } from 'next/server';
import { sendBajaInterestEmail } from '@/lib/email';
import { ensureTag, findOrCreateContact } from '@/lib/contacts';
import { ensureCampusStudent } from '@/lib/bibleStudies';
import { upsertRegistration } from '@/lib/trips';

// PUBLIC. "I'm in" on /iowa/baja (Mig 047): a student committing to the 2027 trip. Tags them like the interest form,
// adds them to Going (Admin → Events → Baja 2027), and emails the campus inbox.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string | undefined>;
  if (b.company) return NextResponse.json({ ok: true }); // honeypot
  const t = (k: string, max = 200) => (b[k]?.trim() || '').slice(0, max) || null;
  const name = t('name'), email = t('email'), phone = t('phone');
  if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
  if (!phone || phone.replace(/\D/g, '').length < 10) return NextResponse.json({ error: 'Please enter a phone number we can text.' }, { status: 400 });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'That email address looks off.' }, { status: 400 });
  if (!t('emergency_name') || !t('emergency_phone')) return NextResponse.json({ error: 'Please add an emergency contact.' }, { status: 400 });
  if (b.commit !== 'on' && b.commit !== 'true') return NextResponse.json({ error: 'Please check the box that you’re committing to go.' }, { status: 400 });
  const date = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(b[k] ?? '') ? b[k]! : null);

  try {
    const [iowaTag, bajaTag] = await Promise.all([ensureTag('ARK Iowa', 'role'), ensureTag('Baja 2027')]);
    const contact = await findOrCreateContact({ name, email, phone, source: 'ARK Iowa Baja 2027', subscribed: false, tagIds: [iowaTag.id, bajaTag.id] });
    await ensureCampusStudent(contact.id, b.year);
    // Before Mig 047 runs the Going list can't save; the email below still carries everything
    const saved = await upsertRegistration({
      trip: 'baja-2027', contact_id: contact.id, name, email, phone,
      school: t('school'), year: t('year', 40), birthday: date('birthday'),
      passport: ['have', 'applied', 'need'].includes(b.passport ?? '') ? b.passport! : null, passport_expires: date('passport_expires'),
      emergency_name: t('emergency_name'), emergency_phone: t('emergency_phone'),
      medical: t('medical', 1000), shirt: t('shirt', 10), note: t('note', 1000),
    }).then(() => true, () => false);
    const details = [
      `School: ${t('school') ?? '—'} · Year: ${t('year', 40) ?? '—'} · Birthday: ${date('birthday') ?? '—'}`,
      `Passport: ${b.passport ?? '—'}${date('passport_expires') ? ` (exp ${date('passport_expires')})` : ''}`,
      `Emergency: ${t('emergency_name')} ${t('emergency_phone')}`,
      t('medical', 1000) ? `Medical/diet: ${t('medical', 1000)}` : null,
      t('shirt', 10) ? `Shirt: ${t('shirt', 10)}` : null,
      t('note', 1000) ? `Note: ${t('note', 1000)}` : null,
      saved ? null : '(Not on the Going list yet: run migration 047, then Move to Going.)',
    ].filter(Boolean).join(' | ');
    await sendBajaInterestEmail({
      name, phone, email,
      hasPassport: ({ have: 'Yes', applied: 'Applied', need: 'Needs one' } as Record<string, string>)[b.passport ?? ''] ?? 'Not sure',
      message: `REGISTERED: committing to go. ${details}`,
    }).catch(() => null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
