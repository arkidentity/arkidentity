import { NextResponse } from 'next/server';
import { sendShippedEmail } from '@/lib/email';
import { getOrder, updateOrder } from '@/lib/store';

export const dynamic = 'force-dynamic';

// POST /api/admin/orders/:id — { action: 'packed' | 'shipped' | 'unpack' | 'note' | 'approve-message' | 'hide-message', tracking?, note? }
// 'shipped' with a tracking number emails the buyer (Resend).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; tracking?: string; note?: string };
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  try {
    if (b.action === 'packed') await updateOrder(id, { status: 'packed' });
    else if (b.action === 'unpack') await updateOrder(id, { status: 'paid' });
    else if (b.action === 'approve-message') await updateOrder(id, { wall_message_ok: true });
    else if (b.action === 'hide-message') await updateOrder(id, { wall_message_ok: false });
    else if (b.action === 'note') await updateOrder(id, { notes: (b.note ?? '').trim().slice(0, 1000) || null });
    else if (b.action === 'shipped') {
      const tracking = (b.tracking ?? '').replace(/\s+/g, '').slice(0, 60);
      if (!tracking) return NextResponse.json({ error: 'Add the tracking number.' }, { status: 400 });
      await updateOrder(id, { status: 'shipped', tracking_number: tracking, shipped_at: new Date().toISOString() });
      let emailed = false;
      if (o.email) {
        const decks = o.decks + o.bonus_decks;
        const contents = [`${decks} Creed Cards deck${decks === 1 ? '' : 's'}`, o.journals ? `${o.journals} DNA Journal` : null].filter(Boolean).join(' and ');
        await sendShippedEmail({ to: o.email, name: o.name, contents, tracking });
        emailed = true;
      }
      return NextResponse.json({ ok: true, emailed });
    } else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin orders]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed.' }, { status: 500 });
  }
}
