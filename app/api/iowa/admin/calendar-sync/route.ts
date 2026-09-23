import { NextResponse } from 'next/server';
import { decideHeld, fullSync, setBusyStaff } from '@/lib/calendarSync';
import { requirePermission } from '@/lib/iowaPerms';
import { calendarConfigured } from '@/lib/googleCalendar';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/iowa/admin/calendar-sync
//   {}                                   — "Sync now": both directions
//   { heldId, decision: import|ignore }  — settle a held-back possible duplicate
//   { busyStaffId }                      — whose booking slots these events block
//                                          (staff only; '' or null means nobody)
export async function POST(req: Request) {
  if (!calendarConfigured()) {
    return NextResponse.json({ error: 'Google Calendar isn’t connected yet.' }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    heldId?: string;
    decision?: string;
    busyStaffId?: string | null;
  };
  try {
    if ('busyStaffId' in body) {
      const guard = await requirePermission('manageSettings');
      if (guard instanceof NextResponse) return guard;
      await setBusyStaff(body.busyStaffId || null);
      return NextResponse.json({ ok: true });
    }
    if (body.heldId) {
      if (body.decision !== 'import' && body.decision !== 'ignore') {
        return NextResponse.json({ error: 'Decision must be import or ignore.' }, { status: 400 });
      }
      await decideHeld(body.heldId, body.decision);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(await fullSync());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
