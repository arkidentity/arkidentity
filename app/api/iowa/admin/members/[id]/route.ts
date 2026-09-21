import { NextResponse } from 'next/server';
import { setMemberStatus, moveMember } from '@/lib/bibleStudies';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { queueStudySync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/members/:id
//   { status, dropReason?, dropNote? } — mark a member `dropped` (frees a seat,
//                  keeps history, records why) or `active`
//   { studyId }  — move them to another study, keeping the same roster row
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    studyId?: string;
    dropReason?: string;
    dropNote?: string;
  };

  try {
    // Moving touches two rosters; note where they were before.
    const { data: before } = await getSupabaseAdmin()
      .from('bible_study_members')
      .select('study_id')
      .eq('id', id)
      .maybeSingle();
    if (body.studyId) {
      const member = await moveMember(id, body.studyId);
      queueStudySync(before?.study_id, member.study_id);
      return NextResponse.json({ member });
    }
    if (body.status !== 'active' && body.status !== 'dropped') {
      return NextResponse.json({ error: 'Send a status or a studyId.' }, { status: 400 });
    }
    const member = await setMemberStatus(id, body.status, {
      reason: body.dropReason,
      note: body.dropNote,
    });
    queueStudySync(member.study_id);
    return NextResponse.json({ member });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
