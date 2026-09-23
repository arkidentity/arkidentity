import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateStudy } from '@/lib/bibleStudies';
import { currentStaff } from '@/lib/iowaStaff';
import { notifyAssignment } from '@/lib/studyAssignment';
import { queueStudySync } from '@/lib/calendarSync';
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
