import { NextResponse } from 'next/server';
import { createEvent, type EventInput } from '@/lib/campusTasks';
import { currentStaff } from '@/lib/iowaStaff';
import { queueEventSync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events — create a campus event. Who's going defaults to
// the creator when staff_ids isn't sent.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as EventInput;
  try {
    const event = await createEvent(body, await currentStaff());
    queueEventSync(event.id);
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
