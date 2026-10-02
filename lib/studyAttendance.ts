import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { IowaStaff } from '@/lib/iowaStaff';
import { studyHealth, type AttendanceRow, type StudyHealth } from '@/lib/studyHealthFormat';

// Launch attendance (migration 037). See lib/studyHealthFormat.ts for the rating.

export async function listAttendance(studyIds: string[]): Promise<(AttendanceRow & { study_id: string })[]> {
  if (studyIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_study_attendance')
    .select('study_id, occurrence, contact_id, present')
    .in('study_id', studyIds);
  if (error) {
    console.error('[iowa attendance] read failed (migration 037 run?)', error);
    return [];
  }
  return (data ?? []) as (AttendanceRow & { study_id: string })[];
}

export async function healthByStudy(studyIds: string[]): Promise<Record<string, StudyHealth>> {
  const rows = await listAttendance(studyIds);
  const out: Record<string, StudyHealth> = {};
  for (const id of studyIds) out[id] = studyHealth(rows.filter((r) => r.study_id === id));
  return out;
}

// One meeting's attendance: everyone listed, present or not. Replaces what was
// recorded for that date (so a fix is a re-save).
export async function saveAttendance(
  studyId: string,
  occurrence: string,
  marks: { contact_id: string; present: boolean }[],
  actor: IowaStaff | null
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error: dErr } = await db.from('iowa_study_attendance').delete().eq('study_id', studyId).eq('occurrence', occurrence);
  if (dErr) throw dErr;
  if (marks.length === 0) return;
  const { error } = await db.from('iowa_study_attendance').insert(
    marks.map((m) => ({
      study_id: studyId,
      occurrence,
      contact_id: m.contact_id,
      present: m.present,
      recorded_by: actor?.id ?? null,
    }))
  );
  if (error) throw error;
}
