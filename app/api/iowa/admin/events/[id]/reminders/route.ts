import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { currentStaff } from '@/lib/iowaStaff';
import { listReminderPeople, removeReminderPerson, setReminderDays, setReminderPerson } from '@/lib/eventReminders';

export const dynamic = 'force-dynamic';

// Reminder list on an event (migration 036). Anyone signed in can read it (the
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
  };
  try {
    if (body.days !== undefined) await setReminderDays(id, Number(body.days));
    if (body.contactId) {
      if (body.remove) await removeReminderPerson(id, body.contactId);
      else await setReminderPerson(id, body.contactId, { response: body.response, note: body.note }, me);
    }
    return NextResponse.json({ people: await listReminderPeople(id) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
