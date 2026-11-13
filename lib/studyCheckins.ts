import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { StudyWithMembers } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import { formatDate } from '@/lib/campusFormat';
import { createTask, updateTask } from '@/lib/campusTasks';
import { notifyTaskAssigned } from '@/lib/taskNotify';

// "How'd it go?" (migration 060): the student leader's weekly check-in from Daily DNA.
// Didn't meet, or a note → a task for the staff member on point (one per meeting).

export type CheckinMet = 'yes' | 'no' | 'cancelled';
export interface StudyCheckin {
  study_id: string;
  occurrence: string;
  met: CheckinMet;
  headcount: number | null;
  note: string | null;
}

export async function listCheckins(studyIds: string[]): Promise<StudyCheckin[]> {
  if (studyIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_study_checkins')
    .select('study_id, occurrence, met, headcount, note')
    .in('study_id', studyIds)
    .order('occurrence', { ascending: false });
  if (error) {
    console.error('[iowa checkins] read failed (migration 060 run?)', error);
    return [];
  }
  return (data ?? []) as StudyCheckin[];
}

export async function saveCheckin(
  s: StudyWithMembers,
  occurrence: string,
  input: { met: CheckinMet; headcount: number | null; note: string | null }
): Promise<void> {
  const db = getSupabaseAdmin();
  const { data: before } = await db
    .from('iowa_study_checkins')
    .select('met, note, task_id')
    .eq('study_id', s.id)
    .eq('occurrence', occurrence)
    .maybeSingle();
  const row = {
    study_id: s.id,
    occurrence,
    met: input.met,
    headcount: input.met === 'yes' ? input.headcount : null,
    note: input.note?.trim() ? input.note.trim().slice(0, 1000) : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from('iowa_study_checkins').upsert(row, { onConflict: 'study_id,occurrence' });
  if (error) throw error;

  // Staff only hear about what needs them: a study that didn't meet, or a note.
  const needsStaff = row.met !== 'yes' || !!row.note;
  const changed = !before || before.met !== row.met || (before.note ?? null) !== row.note;
  if (!needsStaff || !changed || !s.point_staff_id) return;

  const when = formatDate(occurrence, { month: 'short', day: 'numeric' });
  const study = `${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} study`;
  const who = s.leader_name?.split(' ')[0] ?? 'The leader';
  const title =
    row.met === 'yes' ? `${study}: note from ${who} (${when})` : `${study} didn't meet ${when}${row.met === 'cancelled' ? ' (cancelled)' : ''}`;
  const description = [
    `${who} checked in from Daily DNA.`,
    row.met === 'yes' ? `Met · about ${row.headcount ?? '?'} came.` : row.met === 'cancelled' ? 'Cancelled.' : 'Didn’t meet.',
    row.note ? `“${row.note}”` : null,
  ]
    .filter(Boolean)
    .join('\n');

  if (before?.task_id) {
    // Same meeting re-saved: update the task already on their list, reopened.
    await updateTask(before.task_id, { title, description, status: 'open' }, null).catch(() => {});
    return;
  }
  const task = await createTask(
    { title, description, owner_id: s.point_staff_id, study_id: s.id, due_date: null, priority: row.met === 'yes' ? 'normal' : 'high' },
    null
  );
  await db.from('iowa_study_checkins').update({ task_id: task.id }).eq('study_id', s.id).eq('occurrence', occurrence);
  await notifyTaskAssigned(task.id, null);
}
