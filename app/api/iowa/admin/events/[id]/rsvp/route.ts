import { NextResponse } from 'next/server';
import { invitePerson, removeRsvp, rsvpUrl, setRsvpOpen } from '@/lib/eventInvites';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/rsvp
//   { open: true | false }                                    public RSVP link on/off
//   { invite: { contact_id? | name, phone?, email?, occurrence? } }   personal link for one person
//   { remove: rsvpId }                                        take someone off the list
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    open?: boolean;
    invite?: { contact_id?: string; name?: string; phone?: string; email?: string; occurrence?: string };
    remove?: string;
  };
  try {
    if (typeof body.open === 'boolean') {
      const t = await setRsvpOpen(id, body.open);
      return NextResponse.json({ url: t ? rsvpUrl(t) : null });
    }
    if (body.invite) return NextResponse.json(await invitePerson(id, body.invite, await currentStaff()));
    if (body.remove) {
      await removeRsvp(body.remove);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Nothing to do.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
