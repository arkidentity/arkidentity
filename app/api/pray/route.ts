import { NextResponse } from 'next/server';
import { addPrayerRequest, contactForToken } from '@/lib/prayer';

export const dynamic = 'force-dynamic';

// POST /api/pray — a partner's prayer request from /pray.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.hpField) return NextResponse.json({ ok: true });

  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const request = str(b.request, 4000);
  if (!request) return NextResponse.json({ error: 'Tell us how we can pray.' }, { status: 400 });

  const contact = typeof b.token === 'string' ? await contactForToken(b.token).catch(() => null) : null;
  const name = contact?.name ?? str(b.name, 120);
  if (!name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  const email = contact?.email ?? str(b.email, 200);

  try {
    await addPrayerRequest({
      contact_id: contact?.id ?? null,
      name,
      email,
      request,
      ok_to_share: !!b.okToShare,
      wants_update: !!b.wantsUpdate && !!email,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[pray]', e);
    return NextResponse.json({ error: 'Something went wrong. Reply to any update email instead.' }, { status: 500 });
  }
}
