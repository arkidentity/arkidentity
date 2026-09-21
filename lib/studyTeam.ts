import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStaff, listStaff, type IowaStaff } from '@/lib/iowaStaff';
import { formatSlot, formatTime, DAY_NAMES } from '@/lib/bibleStudyFormat';
import { chicagoToday, formatDate, isValidDate, roleVerb, type StudyRole, type StudyTeamRow } from '@/lib/campusFormat';
import { sendEventInvite, sendInviteAnswer, siteUrl } from '@/lib/email';
import type { PendingInvite } from '@/lib/eventInvites';

// A Bible study's team beyond the staff member on point (migration 021):
// Shadowing / Assisting / Leading, for one date or every week. Joining is an
// invite (accept / decline), like event invites. Internal only.
// See docs/IOWA-CAMPUS-TASKS.md → Study team.

const COLS = 'id, study_id, staff_id, role, occurrence, response, note';
const ROLES: StudyRole[] = ['shadow', 'assist', 'lead'];

export async function listStudyTeam(studyIds?: string[]): Promise<StudyTeamRow[]> {
  let q = getSupabaseAdmin().from('iowa_study_staff').select(COLS);
  if (studyIds) {
    if (studyIds.length === 0) return [];
    q = q.in('study_id', studyIds);
  }
  // Past one-date rows don't matter anymore.
  const { data, error } = await q.or(`occurrence.is.null,occurrence.gte.${chicagoToday()}`);
  if (error) throw error;
  return (data ?? []) as StudyTeamRow[];
}

interface StudyLite {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  point_staff_id: string | null;
}

async function loadStudy(id: string): Promise<StudyLite | null> {
  const { data } = await getSupabaseAdmin()
    .from('bible_studies')
    .select('id, day_of_week, start_time, location, point_staff_id')
    .eq('id', id)
    .maybeSingle();
  return data as StudyLite | null;
}

const whenFor = (s: StudyLite, occurrence: string | null) =>
  occurrence ? `${formatDate(occurrence)} at ${formatTime(s.start_time)}` : `${DAY_NAMES[s.day_of_week]}s at ${formatTime(s.start_time)}, every week`;
const titleFor = (s: StudyLite, role: StudyRole) => `${formatSlot(s)} Bible study (${roleVerb(role)})`;

export async function addToStudyTeam(
  input: { study_id?: string; staff_id?: string; role?: string; occurrence?: string | null },
  actor: IowaStaff | null
): Promise<void> {
  const s = input.study_id ? await loadStudy(input.study_id) : null;
  if (!s) throw new Error('Study not found.');
  if (!input.staff_id) throw new Error('Pick who.');
  if (!ROLES.includes(input.role as StudyRole)) throw new Error('Pick shadowing, assisting or leading.');
  if (input.occurrence && !isValidDate(input.occurrence)) throw new Error('Pick a date.');
  const occurrence = input.occurrence || null;
  const self = input.staff_id === actor?.id;
  const db = getSupabaseAdmin();

  let q = db.from('iowa_study_staff').select('id').eq('study_id', s.id).eq('staff_id', input.staff_id);
  q = occurrence ? q.eq('occurrence', occurrence) : q.is('occurrence', null);
  const { data: existing } = await q.maybeSingle();
  const row = {
    role: input.role,
    response: self ? 'accepted' : 'pending',
    note: null,
    invited_by: actor?.id ?? null,
    invited_at: new Date().toISOString(),
    responded_at: self ? new Date().toISOString() : null,
  };
  const { data, error } = existing
    ? await db.from('iowa_study_staff').update(row).eq('id', existing.id).select('id').single()
    : await db.from('iowa_study_staff').insert({ ...row, study_id: s.id, staff_id: input.staff_id, occurrence }).select('id').single();
  if (error) throw error;
  if (self) return;

  const rowId = data.id as string;
  const staffId = input.staff_id;
  const role = input.role as StudyRole;
  after(async () => {
    try {
      const p = await getStaff(staffId);
      if (!p?.active) return;
      const page = `${siteUrl()}/iowa/admin/study-invite/${rowId}`;
      await sendEventInvite({
        to: p.email,
        name: p.name.split(' ')[0],
        by: actor?.name ?? null,
        title: titleFor(s, role),
        when: whenFor(s, occurrence),
        where: s.location,
        acceptUrl: `${page}?r=accept`,
        declineUrl: `${page}?r=decline`,
      });
    } catch (e) {
      console.error('[iowa study team] invite email failed', e);
    }
  });
}

export async function removeFromStudyTeam(rowId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_study_staff').delete().eq('id', rowId);
  if (error) throw error;
}

export async function respondStudyInvite(
  rowId: string,
  staff: IowaStaff,
  response: 'accepted' | 'declined',
  note?: string | null
): Promise<{ title: string; when: string }> {
  const db = getSupabaseAdmin();
  const { data: row } = await db
    .from('iowa_study_staff')
    .select('id, study_id, staff_id, role, occurrence, invited_by')
    .eq('id', rowId)
    .maybeSingle();
  if (!row || row.staff_id !== staff.id) throw new Error('That invite isn’t yours.');
  const s = await loadStudy(row.study_id as string);
  if (!s) throw new Error('That study no longer exists.');
  const { error } = await db
    .from('iowa_study_staff')
    .update({ response, note: note?.trim() || null, responded_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) throw error;

  const title = titleFor(s, row.role as StudyRole);
  const when = whenFor(s, row.occurrence as string | null);
  const notify = (row.invited_by as string | null) ?? s.point_staff_id;
  if (notify && notify !== staff.id) {
    after(async () => {
      try {
        const c = await getStaff(notify);
        if (c?.active) {
          await sendInviteAnswer({
            to: c.email,
            who: staff.name,
            title,
            what: response === 'accepted' ? 'is in for' : 'can’t do',
            when,
            note: note?.trim() || null,
          });
        }
      } catch (e) {
        console.error('[iowa study team] answer email failed', e);
      }
    });
  }
  return { title, when };
}

export async function pendingStudyInvitesFor(staffId: string): Promise<PendingInvite[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_study_staff')
    .select('id, role, occurrence, invited_by, study:bible_studies(id, day_of_week, start_time, location, point_staff_id, status)')
    .eq('staff_id', staffId)
    .eq('response', 'pending')
    .or(`occurrence.is.null,occurrence.gte.${chicagoToday()}`);
  if (error) throw error;
  const staff = await listStaff();
  return ((data ?? []) as unknown as {
    id: string;
    role: StudyRole;
    occurrence: string | null;
    invited_by: string | null;
    study: (StudyLite & { status: string }) | null;
  }[])
    .filter((r) => r.study && r.study.status !== 'ended')
    .map((r) => ({
      key: `study:${r.id}`,
      title: titleFor(r.study!, r.role),
      when: whenFor(r.study!, r.occurrence),
      where: r.study!.location,
      invited_by: staff.find((p) => p.id === r.invited_by)?.name ?? null,
      respond_api: `/api/iowa/admin/study-team/${r.id}/respond`,
      page: `/iowa/admin/study-invite/${r.id}`,
    }));
}
