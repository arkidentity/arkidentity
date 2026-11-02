import { NextResponse } from 'next/server';
import { sendPrayedEmail } from '@/lib/email';
import { getPrayerRequest, updatePrayerRequest } from '@/lib/prayer';

export const dynamic = 'force-dynamic';

const FOLLOW_UP_DAYS = 21;

// POST /api/admin/prayer/:id — { action: 'prayed' | 'answered' | 'archive' | 'reopen', note? }
// 'prayed' with a note emails it to them (when they asked to hear back) and sets a follow-up date.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; note?: string };
  const r = await getPrayerRequest(id);
  if (!r) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  try {
    if (b.action === 'prayed') {
      const note = typeof b.note === 'string' ? b.note.trim().slice(0, 2000) : '';
      let emailed = false;
      if (note && r.wants_update && r.email) {
        await sendPrayedEmail(r.email, r.name, note);
        emailed = true;
      }
      const followUp = new Date(Date.now() + FOLLOW_UP_DAYS * 86400000).toISOString().slice(0, 10);
      await updatePrayerRequest(id, { status: 'prayed', prayed_at: new Date().toISOString(), prayed_note: note || null, follow_up_on: followUp });
      return NextResponse.json({ ok: true, emailed });
    }
    if (b.action === 'answered') await updatePrayerRequest(id, { status: 'answered' });
    else if (b.action === 'archive') await updatePrayerRequest(id, { status: 'archived' });
    else if (b.action === 'reopen') await updatePrayerRequest(id, { status: 'open' });
    else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin prayer]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed.' }, { status: 500 });
  }
}
