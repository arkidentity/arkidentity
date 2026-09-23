import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { createPeriod, type PeriodInput } from '@/lib/schoolCalendar';
import { queueAllStudiesSync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/school-periods — add a break / finals / holiday.
// Pausing periods change which weeks studies meet, so Google is re-synced.
export async function POST(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as PeriodInput;
  try {
    await createPeriod(body);
    queueAllStudiesSync();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
