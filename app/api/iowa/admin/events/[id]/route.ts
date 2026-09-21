import { NextResponse } from 'next/server';
import { deleteEvent, updateEvent, type EventInput } from '@/lib/campusTasks';
import { queueEventDelete, queueEventSync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/events/:id — edit; staff_ids replaces who's going.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as EventInput;
  try {
    const event = await updateEvent(id, body);
    queueEventSync(event.id);
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
