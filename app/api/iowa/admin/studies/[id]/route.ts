import { NextResponse } from 'next/server';
import { updateStudy } from '@/lib/bibleStudies';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/studies/:id — edit any study field: location, status,
// accepting_signups, capacity, leader_*, notes, break_plan, day/time.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const study = await updateStudy(id, patch);
    return NextResponse.json({ study });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
