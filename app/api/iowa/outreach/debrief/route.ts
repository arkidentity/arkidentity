import { NextResponse } from 'next/server';
import { addOutreachDebrief } from '@/lib/outreach';
import { OUTREACH_SLOTS, TRICK_OR_TRUTH } from '@/lib/outreachFormat';

export const dynamic = 'force-dynamic';

// POST /api/iowa/outreach/debrief — a volunteer's end-of-night debrief.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.hpField) return NextResponse.json({ ok: true });

  const str = (v: unknown, max = 2000) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const num = (v: unknown) => {
    const n = Math.floor(Number(v));
    return v === '' || v == null || !Number.isFinite(n) ? null : Math.max(0, Math.min(500, n));
  };

  const name = str(b.name, 120);
  if (!name) return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  const slot = typeof b.slot === 'string' && OUTREACH_SLOTS.some((s) => s.key === b.slot) ? b.slot : null;
  const again = b.again === 'yes' || b.again === 'maybe' || b.again === 'no' ? b.again : null;

  try {
    await addOutreachDebrief({
      outreach: TRICK_OR_TRUTH,
      name,
      slot,
      location: str(b.location, 120),
      conversations: num(b.conversations),
      read_verse: num(b.readVerse),
      signed_up: num(b.signedUp),
      prayed: num(b.prayed),
      story: str(b.story),
      learned: str(b.learned),
      again,
      ok_to_share: !!b.okToShare,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[outreach debrief]', e);
    return NextResponse.json({ error: 'Something went wrong. Text (319) 359-7117.' }, { status: 400 });
  }
}
