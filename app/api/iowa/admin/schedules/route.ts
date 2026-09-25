import { NextResponse, after } from 'next/server';
import { ensureScheduleLink, markSent, scheduleUrl } from '@/lib/availability';
import { sendScheduleLink } from '@/lib/email';
import { getStaff } from '@/lib/iowaStaff';
import { requirePermission } from '@/lib/iowaPerms';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/schedules
//   { staffId, semester }         — make (or fetch) their link, return it
//   { staffId, semester, send }   — and email it to them
export async function POST(req: Request) {
  const me = await requirePermission('manageStaff');
  if (me instanceof NextResponse) return me;

  const { staffId, semester, send } = (await req.json().catch(() => ({}))) as {
    staffId?: string;
    semester?: string;
    send?: boolean;
  };
  if (!staffId || !semester) return NextResponse.json({ error: 'Who, and which semester?' }, { status: 400 });

  try {
    const link = await ensureScheduleLink(staffId, semester);
    const url = scheduleUrl(link.token);
    if (send) {
      const person = await getStaff(staffId);
      if (!person?.active) return NextResponse.json({ error: 'That person’s login is off.' }, { status: 400 });
      await markSent(staffId, semester);
      // After the response: a slow mail provider shouldn't hold up the click.
      after(async () => {
        try {
          await sendScheduleLink({ to: person.email, name: person.name, semester, url });
        } catch (e) {
          console.error('[iowa schedules] email failed', e);
        }
      });
    }
    return NextResponse.json({ url, sent: !!send });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
