import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { currentStaff } from '@/lib/iowaStaff';
import { listReminderPeople, removeReminderPerson, setGuestList, setReminderDays, setReminderPerson } from '@/lib/eventReminders';
import { resyncEventIfShown } from '@/lib/dailyDnaLink';

export const dynamic = 'force-dynamic';

// Guest list on an event (the reminder list, migration 036). When the event shows in Daily DNA, only
// the guests see it there, so every change re-sends the event. Anyone signed in can read it (the
// "text them" task can land on a student volunteer); changing it is staff and
// interns.

// GET → { people, days }
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json({ people: await listReminderPeople(id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// POST { contactId, response?, note? } — add or update someone
// POST { contactId, remove: true }     — take them off
// POST { days }                        — days before each date the task appears
// POST { set: contactIds[] }            — the Guest list pop-up: make the list exactly these
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageEvents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    contactId?: string;
    response?: string;
    note?: string | null;
    remove?: boolean;
    days?: number;
    set?: string[];
  };
  try {
    if (body.days !== undefined) await setReminderDays(id, Number(body.days));
    let changed = false;
    if (Array.isArray(body.set)) { await setGuestList(id, body.set.filter((x) => typeof x === 'string'), me); changed = true; }
    if (body.contactId) {
      if (body.remove) await removeReminderPerson(id, body.contactId);
      else await setReminderPerson(id, body.contactId, { response: body.response, note: body.note }, me);
      changed = true;
    }
    if (changed) await resyncEventIfShown(id);
    return NextResponse.json({ people: await listReminderPeople(id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
