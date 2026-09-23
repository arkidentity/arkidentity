import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { deleteStudy, updateStudy } from '@/lib/bibleStudies';
import { currentStaff } from '@/lib/iowaStaff';
import { notifyAssignment } from '@/lib/studyAssignment';
import { queueEventDelete, queueStudySync } from '@/lib/calendarSync';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/studies/:id — edit any study field: location, status,
// accepting_signups, capacity, leader_*, notes, break_plan, day/time,
// point_staff_id. Changing the staff on point emails the newly assigned person.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const { data: before } = await getSupabaseAdmin()
      .from('bible_studies')
      .select('point_staff_id')
      .eq('id', id)
      .maybeSingle();
    const study = await updateStudy(id, patch);
    if (study.point_staff_id && study.point_staff_id !== before?.point_staff_id) {
      notifyAssignment(study.id, study.point_staff_id, await currentStaff());
    }
    queueStudySync(study.id);
    revalidatePath('/iowa'); // the public page is cached (revalidate = 60)
    return NextResponse.json({ study });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/iowa/admin/studies/:id — remove a study that's ended or been
// paused. Refused while students are still seated (see deleteStudy).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { google_event_id } = await deleteStudy(id);
    queueEventDelete(google_event_id);
    revalidatePath('/iowa');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
