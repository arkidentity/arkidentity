import { NextResponse } from 'next/server';
import { getContact, mergeContacts } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/merge — { keepId, loseId }. Returns the merged
// keeper (with tags) so the list can update in place.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { keepId?: string; loseId?: string };
  if (!body.keepId || !body.loseId) {
    return NextResponse.json({ error: 'Pick two people.' }, { status: 400 });
  }
  try {
    await mergeContacts(body.keepId, body.loseId);
    const contact = await getContact(body.keepId);
    return NextResponse.json({ contact });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
