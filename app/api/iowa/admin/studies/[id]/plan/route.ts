import { NextResponse } from 'next/server';
import { planViewForStudy, submitPlan, type PlanInput } from '@/lib/semesterPlan';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET → { answers } — members' check-in answers for the planner (migration 038).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentStaff())) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { id } = await params;
  const view = await planViewForStudy(id);
  return NextResponse.json({ answers: view?.answers ?? {} });
}

// POST /api/iowa/admin/studies/:id/plan — staff plan a group's next semester:
// { semester, notContinuing?, groups: [{ day_of_week, start_time, location,
//   online?, point_staff_id?, leader_*?, member_ids }] }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PlanInput;
  try {
    return NextResponse.json(await submitPlan(id, body, { staff: await currentStaff(), viaLeaderLink: false }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
