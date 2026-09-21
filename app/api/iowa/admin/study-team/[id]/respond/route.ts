import { NextResponse } from 'next/server';
import { respondStudyInvite } from '@/lib/studyTeam';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/study-team/:id/respond — { response: accepted|declined, note? }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { response, note } = (await req.json().catch(() => ({}))) as { response?: string; note?: string };
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (response !== 'accepted' && response !== 'declined') return NextResponse.json({ error: 'Accept or decline?' }, { status: 400 });
  try {
    await respondStudyInvite(id, me, response, note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
