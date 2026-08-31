import { NextResponse } from 'next/server';
import { updateEvent, type ContactEvent } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/contacts/events/:id — edit details, paste the Calendar link,
// or move the status along (planning → invites sent → complete).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<ContactEvent>;
  try {
    const event = await updateEvent(id, body);
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
