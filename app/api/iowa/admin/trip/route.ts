import { NextResponse } from 'next/server';
import { currentStaff } from '@/lib/iowaStaff';
import { getContact } from '@/lib/contacts';
import { TRIPS, upsertRegistration, updateRegistration, type TripKey } from '@/lib/trips';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/trip — staff only (Admin → Events → a trip)
//   { action: 'move', trip, contact_id }                 Interested → Going
//   { action: 'update', id, checks?, raised?, status? }  tick a check, set amount raised, withdraw
export async function POST(req: Request) {
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    action?: string; trip?: string; contact_id?: string; id?: string; checks?: Record<string, boolean>; raised?: number; status?: string;
  };
  try {
    if (b.action === 'move') {
      if (!b.trip || !(b.trip in TRIPS) || !b.contact_id) return NextResponse.json({ error: 'Which person?' }, { status: 400 });
      const c = await getContact(b.contact_id);
      if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await upsertRegistration({ trip: b.trip as TripKey, contact_id: c.id, name: c.name, email: c.email, phone: c.phone });
      return NextResponse.json({ ok: true });
    }
    if (b.action === 'update' && b.id) {
      const patch: { checks?: Record<string, boolean>; raised?: number; status?: string } = {};
      if (b.checks) patch.checks = b.checks;
      if (typeof b.raised === 'number' && b.raised >= 0) patch.raised = Math.round(b.raised * 100) / 100;
      if (b.status === 'going' || b.status === 'withdrawn') patch.status = b.status;
      await updateRegistration(b.id, patch);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
