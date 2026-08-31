import { NextResponse } from 'next/server';
import { createContact, findPossibleDuplicates, type ContactChannel, type ContactFrequency } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts — add a person. Used by both Quick Add and the
// contacts list. Duplicates are reported back, never blocking: in a lobby the
// save has to go through, and a duplicate is cheaper to merge than a lost name.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    region?: string;
    church?: string;
    relationship_notes?: string;
    source?: string;
    channel?: ContactChannel;
    frequency?: ContactFrequency;
    subscribed?: boolean;
    tagIds?: string[];
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!body.email?.trim() && !body.phone?.trim()) {
    return NextResponse.json({ error: 'Add an email or a phone number.' }, { status: 400 });
  }

  try {
    const duplicates = await findPossibleDuplicates({ email: body.email, phone: body.phone });
    const contact = await createContact({
      name: body.name,
      email: body.email,
      phone: body.phone,
      city: body.city,
      state: body.state,
      region: body.region,
      church: body.church,
      relationship_notes: body.relationship_notes,
      source: body.source,
      channel: body.channel,
      frequency: body.frequency,
      subscribed: body.subscribed,
      tagIds: body.tagIds,
    });
    return NextResponse.json(
      { contact, duplicates: duplicates.map((d) => ({ id: d.id, name: d.name, email: d.email, phone: d.phone })) },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
