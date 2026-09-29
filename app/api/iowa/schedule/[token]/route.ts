import { NextResponse } from 'next/server';
import { addBusy, markSubmitted, removeBusy, scheduleByToken, updateBusy } from '@/lib/availability';

export const dynamic = 'force-dynamic';

// POST /api/iowa/schedule/:token — a leader filling in their own semester,
// no login. The token is the authorisation, so every write re-checks it and
// only ever touches that person's own blocks.
//   { days | dayOfWeek, startsAt?, endsAt?, label?, startsOn?, endsOn? }
//                                              add a busy block (one per day)
//   { update: { id, dayOfWeek, ...same } }     move / resize / relabel / re-date
//   { remove: blockId }                        take one off
//   { done: true }                             "that's my semester"
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await scheduleByToken(token);
  if (!found) return NextResponse.json({ error: 'That link has expired.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    dayOfWeek?: number;
    days?: number[];
    startsOn?: string | null;
    endsOn?: string | null;
    update?: { id: string; dayOfWeek: number; startsAt?: string | null; endsAt?: string | null; label?: string | null; startsOn?: string | null; endsOn?: string | null };
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
    if (body.update) {
      if (!found.blocks.some((b) => b.id === body.update!.id)) {
        return NextResponse.json({ error: 'That isn’t on your schedule.' }, { status: 400 });
      }
      return NextResponse.json({ block: await updateBusy(body.update.id, found.link.staff_id, body.update) });
    }
    const days = body.days ?? (typeof body.dayOfWeek === 'number' ? [body.dayOfWeek] : []);
    if (days.length === 0) return NextResponse.json({ error: 'Pick a day.' }, { status: 400 });
    const blocks = [];
    for (const dayOfWeek of [...new Set(days)]) {
      blocks.push(
        await addBusy({
          staffId: found.link.staff_id,
          semester: found.link.semester,
          dayOfWeek,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
          label: body.label,
          startsOn: body.startsOn,
          endsOn: body.endsOn,
        })
      );
    }
    return NextResponse.json({ blocks });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
