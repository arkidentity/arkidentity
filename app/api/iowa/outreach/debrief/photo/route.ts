import { NextResponse } from 'next/server';
import { signDebriefPhoto } from '@/lib/outreach';

export const dynamic = 'force-dynamic';

// POST /api/iowa/outreach/debrief/photo — a signed upload slot for one debrief photo.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { filename?: unknown };
  if (typeof b.filename !== 'string' || !b.filename) return NextResponse.json({ error: 'No file.' }, { status: 400 });
  try {
    return NextResponse.json(await signDebriefPhoto(b.filename));
  } catch (e) {
    console.error('[outreach debrief photo]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not upload that photo.' }, { status: 400 });
  }
}
