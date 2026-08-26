import { NextResponse } from 'next/server';
import { startStudy, formatSlot } from '@/lib/bibleStudies';
import { sendStudyAdminAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/iowa/studies/start — no open study at a time that works, so the
// student starts one and is its first member. Lands as `pending_setup`; Travis
// sets the location and flips it live from the admin.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    dayOfWeek?: number;
    startTime?: string; // 'HH:MM'
    name?: string;
    phone?: string;
    email?: string;
    year?: string;
    company?: string; // honeypot
  };

  if (body.company) return NextResponse.json({ ok: true });

  const day = Number(body.dayOfWeek);
  const startTime = body.startTime?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();

  if (!Number.isInteger(day) || day < 0 || day > 6) return bad('Pick a day.');
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return bad('Pick a time.');
  if (!name) return bad('Please tell us your name.');
  if (!phone || phone.replace(/\D/g, '').length < 10) return bad('Please enter a phone number we can text.');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Please enter an email we can reach you at.');

  try {
    const { study, member } = await startStudy({
      day_of_week: day,
      start_time: startTime,
      name,
      phone,
      email,
      year: body.year,
    });
    const slot = formatSlot(study);
    void sendStudyAdminAlert({
      kind: 'start',
      study: { id: study.id, slot, location: null },
      member: { name: member.name, phone: member.phone, email: member.email, year: member.year },
    });
    return NextResponse.json({ ok: true, slot });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
