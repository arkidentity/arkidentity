import { NextResponse, after } from 'next/server';
import { joinStudy, formatSlot } from '@/lib/bibleStudies';
import { sendStudyConfirmation, sendStudyRosterAlerts, sendStudyAdminAlert } from '@/lib/email';
import { googleCalendarUrl } from '@/lib/ics';
import { siteUrl } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/iowa/studies/join — a student takes an open seat. Instant, no
// approval. Honeypot + loose validation, same as the old /api/iowa-signup.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    studyId?: string;
    name?: string;
    phone?: string;
    email?: string;
    year?: string;
    hpField?: string; // honeypot — real users leave it empty
  };

  if (body.hpField) {
    console.warn('[iowa join] honeypot tripped', { studyId: body.studyId });
    return NextResponse.json({ ok: true }); // pretend success, do nothing
  }

  const studyId = body.studyId?.trim();
  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();

  if (!studyId) return bad('Something went wrong — reload and try again.');
  if (!name) return bad('Please tell us your name.');
  if (!phone || phone.replace(/\D/g, '').length < 10) return bad('Please enter a phone number we can text.');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad('Please enter an email we can reach you at.');

  try {
    const { study, member, roster, alsoInOtherStudies } = await joinStudy({
      studyId,
      name,
      phone,
      email,
      year: body.year,
    });

    const slot = formatSlot(study);
    const info = { id: study.id, slot, location: study.location };
    const icsUrl = `${siteUrl()}/api/iowa/studies/${study.id}/ics`;
    const googleUrl = googleCalendarUrl({
      id: study.id,
      dayOfWeek: study.day_of_week,
      startTime: study.start_time,
      location: study.location,
    });

    // Emails run after the response is sent. `after()` keeps the function alive
    // on Vercel until they finish (a bare `void` promise gets frozen out). A
    // send failure is logged, never fatal — the student already joined.
    const existing = study.members
      .filter((m) => m.status === 'active' && m.id !== member.id)
      .map((m) => ({ email: m.email }));
    after(async () => {
      const results = await Promise.allSettled([
        sendStudyConfirmation({ to: email, name, study: info, roster, googleUrl, icsUrl }),
        sendStudyRosterAlerts({
          study: info,
          newMemberName: name,
          newMemberPhone: phone,
          existing,
          leaderEmail: study.leader_email,
        }),
        sendStudyAdminAlert({
          kind: 'join',
          study: info,
          member: { name, phone, email, year: body.year || null },
          spotsLeft: Math.max(0, study.capacity - study.activeCount),
          alsoInStudies: alsoInOtherStudies.map((s) => formatSlot(s)),
        }),
      ]);
      for (const r of results) {
        if (r.status === 'rejected') console.error('[iowa join email]', r.reason);
      }
    });

    return NextResponse.json({ ok: true, roster, calendar: { icsUrl, googleUrl } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

function bad(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
