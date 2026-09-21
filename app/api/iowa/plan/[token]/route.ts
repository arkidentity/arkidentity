import { NextResponse } from 'next/server';
import { studyIdForToken, submitPlan, type PlanInput } from '@/lib/semesterPlan';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/iowa/plan/:token — a student leader submits their group's plan
// through the private link. Public route; the token is the only key, and it
// can't touch staff on point or plan twice.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = await studyIdForToken(token);
  if (!id) return NextResponse.json({ error: 'That link doesn’t work anymore.' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as PlanInput;
  for (const g of body.groups ?? []) delete g.point_staff_id; // staff decide that
  try {
    return NextResponse.json(await submitPlan(id, body, { staff: null, viaLeaderLink: true }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
