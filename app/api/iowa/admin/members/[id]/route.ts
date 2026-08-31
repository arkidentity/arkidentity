import { NextResponse } from 'next/server';
import { setMemberStatus, moveMember } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/members/:id
//   { status }   — mark a member `dropped` (frees a seat, keeps history) or `active`
//   { studyId }  — move them to another study, keeping the same roster row
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; studyId?: string };

  try {
    if (body.studyId) {
      const member = await moveMember(id, body.studyId);
      return NextResponse.json({ member });
    }
    if (body.status !== 'active' && body.status !== 'dropped') {
      return NextResponse.json({ error: 'Send a status or a studyId.' }, { status: 400 });
    }
    const member = await setMemberStatus(id, body.status);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
