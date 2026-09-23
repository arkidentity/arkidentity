import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { createEvent, type EventInput } from '@/lib/campusTasks';
import { currentStaff } from '@/lib/iowaStaff';
import { queueEventSync } from '@/lib/calendarSync';
import { autoApplyForType } from '@/lib/eventChecklists';
import { queueInviteEmails } from '@/lib/eventInvites';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events — create a campus event. Who's going defaults to
// the creator when staff_ids isn't sent; anyone else is invited (accept/decline).
export async function POST(req: Request) {
  const me = await requirePermission('manageEvents');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as EventInput;
  try {
    const me = await currentStaff();
    const { event, invited } = await createEvent(body, me);
    queueEventSync(event.id);
    queueInviteEmails(event.id, invited, me);
    await autoApplyForType(event.id, event.type_id); // e.g. every new Taco Night gets its checklist
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
