import { NextResponse } from 'next/server';
import { submitPublicRsvp } from '@/lib/eventInvites';

export const dynamic = 'force-dynamic';

// POST /api/iowa/rsvp/:token — public RSVP (Taco Night link).
// { occurrence?, name, phone?, email?, response: 'yes' | 'no', guests?, note?, hp_field }
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, string | number | undefined> & { hp_field?: string };
  if (body.hp_field) return NextResponse.json({ ok: true }); // honeypot — pretend, do nothing
  try {
    await submitPublicRsvp(token, body as Parameters<typeof submitPublicRsvp>[1]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
