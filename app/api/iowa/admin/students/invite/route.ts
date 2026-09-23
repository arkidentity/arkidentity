import { NextResponse } from 'next/server';
import { invitePerson } from '@/lib/eventInvites';
import { requirePermission } from '@/lib/iowaPerms';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/students/invite   { eventId, contactIds: [] }
// Personal RSVP links for several students at once, from the check-in report.
// Each gets the same invite as the event screen sends one at a time (emailed if
// they have an email); the links come back so they can be texted too.
export async function POST(req: Request) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as { eventId?: string; contactIds?: string[] };
  const ids = [...new Set(body.contactIds ?? [])];
  if (!body.eventId || ids.length === 0) {
    return NextResponse.json({ error: 'Pick an event and at least one student.' }, { status: 400 });
  }
  const results: { contactId: string; url?: string; emailed?: boolean; error?: string }[] = [];
  for (const contactId of ids) {
    try {
      results.push({ contactId, ...(await invitePerson(body.eventId, { contact_id: contactId }, me)) });
    } catch (e) {
      results.push({ contactId, error: (e as Error).message });
    }
  }
  return NextResponse.json({ results });
}
