import { NextResponse } from 'next/server';
import { updateContact, archiveContact, setContactTags, type Contact } from '@/lib/contacts';
import { pushContactToGoogle } from '@/lib/googleContacts';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/contacts/:id — edit fields, and optionally replace the whole
// tag set in the same call (the edit form saves both at once).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Partial<Contact> & { tagIds?: string[] };

  try {
    if (body.tagIds) await setContactTags(id, body.tagIds);
    const contact = await updateContact(id, body);
    // Name/email/phone edits go to Google now, or the next sync (where Google
    // wins) would put the old value back. The ARK save stands either way.
    let googleError: string | undefined;
    if (['name', 'email', 'phone', 'other_emails', 'other_phones'].some((k) => k in body)) {
      try {
        await pushContactToGoogle(contact);
      } catch (e) {
        googleError = `Saved in ARK, but Google wasn't updated: ${(e as Error).message}`;
      }
    }
    return NextResponse.json({ contact, googleError });
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
