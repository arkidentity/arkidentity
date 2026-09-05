import { NextResponse } from 'next/server';
import { addTagToContacts, removeTagFromContacts } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/tags/:id/contacts — put a tag on (or take it off) a
// batch of people at once. The first pass over an imported list is the whole
// reason this exists: tagging forty people one at a time is how a tag never
// gets used, and an unused tag is a segment that never fires.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { contactIds, action } = (await req.json().catch(() => ({}))) as {
    contactIds?: string[];
    action?: 'add' | 'remove';
  };

  if (!contactIds?.length) {
    return NextResponse.json({ error: 'Pick at least one contact.' }, { status: 400 });
  }

  try {
    if (action === 'remove') await removeTagFromContacts(id, contactIds);
    else await addTagToContacts(id, contactIds);
    return NextResponse.json({ ok: true, count: contactIds.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
