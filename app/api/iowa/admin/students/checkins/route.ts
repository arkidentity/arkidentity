import { NextResponse } from 'next/server';
import { logCheckin } from '@/lib/campusCheckins';
import { CHECKIN_OUTCOMES, type CheckinOutcome } from '@/lib/checkinFormat';
import { requirePermission } from '@/lib/iowaPerms';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/students/checkins   { contactId, outcome, note? }
// Staff and interns only — student leaders don't see the check-in report.
export async function POST(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as { contactId?: string; outcome?: CheckinOutcome; note?: string };
  if (!body.contactId) return NextResponse.json({ error: 'Who did you check in with?' }, { status: 400 });
  if (!CHECKIN_OUTCOMES.some((o) => o.key === body.outcome)) {
    return NextResponse.json({ error: 'How did it go?' }, { status: 400 });
  }
  try {
    return NextResponse.json({ checkin: await logCheckin(body.contactId, body.outcome!, body.note ?? null, me) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
