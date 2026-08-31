import { NextResponse } from 'next/server';
import { runSegment, type SegmentFilters } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// POST /api/admin/contacts/segment — run a filter set and return the people.
// A POST rather than a GET because the filters are a structured object (tag id
// arrays, an excluded event) and none of it belongs in a URL.
export async function POST(req: Request) {
  const filters = (await req.json().catch(() => ({}))) as SegmentFilters;
  try {
    const contacts = await runSegment(filters);
    return NextResponse.json({ contacts, count: contacts.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
