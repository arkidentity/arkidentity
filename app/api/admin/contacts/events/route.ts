import { NextResponse } from 'next/server';
import { createEvent } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/events — create the thing you're inviting people to.
// Thin on purpose: the invite itself and its RSVPs live in Google Calendar.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    event_date?: string;
    location?: string;
    calendar_link?: string;
    notes?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Give the event a name.' }, { status: 400 });
  }

  try {
    const event = await createEvent({
      name: body.name,
      event_date: body.event_date,
      location: body.location,
      calendar_link: body.calendar_link,
      notes: body.notes,
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
