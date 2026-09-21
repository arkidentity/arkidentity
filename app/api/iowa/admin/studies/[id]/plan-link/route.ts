import { NextResponse } from 'next/server';
import { getStudyWithMembers } from '@/lib/bibleStudies';
import { ensurePlanToken, planUrl, sendPlanLinkFor } from '@/lib/semesterPlan';
import { semesterContext } from '@/lib/semesters';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/studies/:id/plan-link — { send?: boolean }
// Returns the student leader's private plan link; with send, (re)emails it.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { send } = (await req.json().catch(() => ({}))) as { send?: boolean };
  try {
    const [study, ctx] = await Promise.all([getStudyWithMembers(id), semesterContext()]);
    if (!study) return NextResponse.json({ error: 'Study not found.' }, { status: 404 });
    const url = planUrl(await ensurePlanToken(id));
    let sent = false;
    if (send) {
      if (!ctx.next) return NextResponse.json({ error: 'No next semester is open for planning yet.' }, { status: 400 });
      if (!study.leader_email) return NextResponse.json({ error: 'Add a student leader email first.' }, { status: 400 });
      sent = await sendPlanLinkFor(study, ctx.next.name);
    }
    return NextResponse.json({ url, sent });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
