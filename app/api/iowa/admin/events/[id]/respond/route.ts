import { NextResponse } from 'next/server';
import { respondToInvite, setAbsence } from '@/lib/eventInvites';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/respond — the signed-in person answers:
//   { response: 'accepted' | 'declined', note? }        the whole series
//   { occurrence: 'YYYY-MM-DD', away: boolean, note? }  one date ("can't make this one")
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    response?: string;
    note?: string;
    occurrence?: string;
    away?: boolean;
  };
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  try {
    if (body.occurrence) {
      await setAbsence(id, me, body.occurrence, body.away !== false, body.note);
    } else if (body.response === 'accepted' || body.response === 'declined') {
      await respondToInvite(id, me, body.response, body.note);
    } else {
      return NextResponse.json({ error: 'Accept or decline?' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
