import { NextResponse } from 'next/server';
import { markInvited, setInviteStatus, removeInvite, type InviteStatus } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/events/:id/invites — { contactIds } mark people
// invited. Idempotent: re-running a segment and marking it again must not reset
// anyone's status or double-count them.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { contactIds } = (await req.json().catch(() => ({}))) as { contactIds?: string[] };
  if (!contactIds?.length) {
    return NextResponse.json({ error: 'Pick at least one person.' }, { status: 400 });
  }
  try {
    const count = await markInvited(id, contactIds);
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// PATCH — { contactId, status } for the optional confirmed/declined tracking.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    contactId?: string;
    status?: InviteStatus;
  };
  if (!body.contactId || !body.status) {
    return NextResponse.json({ error: 'Missing contact or status.' }, { status: 400 });
  }
  try {
    await setInviteStatus(id, body.contactId, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE — { contactId } undo an invite added by mistake.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { contactId } = (await req.json().catch(() => ({}))) as { contactId?: string };
  if (!contactId) return NextResponse.json({ error: 'Missing contact.' }, { status: 400 });
  try {
    await removeInvite(id, contactId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
