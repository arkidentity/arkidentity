import { NextResponse } from 'next/server';
import { addBusy, markSubmitted, removeBusy, scheduleByToken } from '@/lib/availability';

export const dynamic = 'force-dynamic';

// POST /api/iowa/schedule/:token — a leader filling in their own semester,
// no login. The token is the authorisation, so every write re-checks it and
// only ever touches that person's own blocks.
//   { dayOfWeek, startsAt?, endsAt?, label? }  add a busy block
//   { remove: blockId }                        take one off
//   { done: true }                             "that's my semester"
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await scheduleByToken(token);
  if (!found) return NextResponse.json({ error: 'That link has expired.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    dayOfWeek?: number;
    startsAt?: string | null;
    endsAt?: string | null;
    label?: string | null;
    remove?: string;
    done?: boolean;
  };

  try {
    if (body.done) {
      await markSubmitted(token);
      return NextResponse.json({ ok: true });
    }
    if (body.remove) {
      // Only their own — a guessed id from another person's schedule does nothing.
      if (!found.blocks.some((b) => b.id === body.remove)) {
        return NextResponse.json({ error: 'That isn’t on your schedule.' }, { status: 400 });
      }
      await removeBusy(body.remove);
      return NextResponse.json({ ok: true });
    }
    if (typeof body.dayOfWeek !== 'number') return NextResponse.json({ error: 'Pick a day.' }, { status: 400 });
    const block = await addBusy({
      staffId: found.link.staff_id,
      semester: found.link.semester,
      dayOfWeek: body.dayOfWeek,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      label: body.label,
    });
    return NextResponse.json({ block });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
