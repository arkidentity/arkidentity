import { NextResponse } from 'next/server';
import { updateContact, archiveContact, setContactTags, type Contact } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/contacts/:id — edit fields, and optionally replace the whole
// tag set in the same call (the edit form saves both at once).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<Contact> & { tagIds?: string[] };

  try {
    if (body.tagIds) await setContactTags(id, body.tagIds);
    const contact = await updateContact(id, body);
    return NextResponse.json({ contact });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/admin/contacts/:id — archives. Contacts are never hard-deleted:
// invite history and Bible study roster rows point at them.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await archiveContact(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
