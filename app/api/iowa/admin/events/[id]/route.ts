import { NextResponse } from 'next/server';
import { deleteEvent, updateEvent, type EventInput } from '@/lib/campusTasks';
import { queueEventDelete, queueEventSync } from '@/lib/calendarSync';
import { realignEvent } from '@/lib/eventChecklists';
import { queueInviteEmails } from '@/lib/eventInvites';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/events/:id — edit; staff_ids replaces who's invited
// (existing answers kept; new people get an invite email).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as EventInput;
  try {
    const me = await currentStaff();
    const { event, invited } = await updateEvent(id, body, me);
    queueEventSync(event.id);
    queueInviteEmails(event.id, invited, me);
    await realignEvent(event.id); // moved / skipped weeks → checklist due dates follow
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE — removes the whole event (every repeat). Linked tasks stay, unlinked.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    queueEventDelete(await deleteEvent(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
