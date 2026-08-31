import { NextResponse } from 'next/server';
import { ensureTag, listTags } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

// GET /api/admin/contacts/tags
export async function GET() {
  try {
    return NextResponse.json({ tags: await listTags() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/admin/contacts/tags — create, or return the existing tag with the
// same slug. Idempotent so the inline "add tag" in Quick Add can't sprawl.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; category?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Give the tag a name.' }, { status: 400 });
  }
  try {
    const tag = await ensureTag(body.name, body.category);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
