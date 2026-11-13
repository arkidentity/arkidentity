import { NextResponse } from 'next/server';
import { addToStudyTeam, removeFromStudyTeam } from '@/lib/studyTeam';
import { currentStaff } from '@/lib/iowaStaff';
import { requirePermission } from '@/lib/iowaPerms';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/study-team — { study_id, staff_id, role: shadow|assist|lead, occurrence? }
// occurrence = one date; omit for every week. The person is invited (accept / decline).
export async function POST(req: Request) {
  const guard = await requirePermission('viewAllStudies');
  if (guard instanceof NextResponse) return guard;
  const body = (await req.json().catch(() => ({}))) as Parameters<typeof addToStudyTeam>[0];
  try {
    await addToStudyTeam(body, await currentStaff());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/iowa/admin/study-team?id=
export async function DELETE(req: Request) {
  const guard = await requirePermission('viewAllStudies');
  if (guard instanceof NextResponse) return guard;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Which one?' }, { status: 400 });
  try {
    await removeFromStudyTeam(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
