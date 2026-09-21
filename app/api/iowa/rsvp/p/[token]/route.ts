import { NextResponse } from 'next/server';
import { answerPersonal } from '@/lib/eventInvites';

export const dynamic = 'force-dynamic';

// POST /api/iowa/rsvp/p/:token — a personal invite's answer. { response, guests?, note? }
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as { response?: string; guests?: number; note?: string };
  try {
    await answerPersonal(token, body.response ?? '', body.guests, body.note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
