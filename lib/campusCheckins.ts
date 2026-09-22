import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listCampusStudents } from '@/lib/bibleStudies';
import { DAY_NAMES as DAYS, formatTime as fmtTime } from '@/lib/bibleStudyFormat';
import { DROP_REASONS, chicagoToday, formatDate } from '@/lib/campusFormat';
import { whenText } from '@/lib/eventInvites';
import type { IowaStaff } from '@/lib/iowaStaff';
import {
  DORMANT_REASONS,
  type CheckinOutcome,
  type CheckinRow,
  type QuietReason,
  type SocialEventOption,
} from '@/lib/checkinFormat';

// The check-in report (migration 023). Server-only. Who's gone quiet, why,
// since when, and who last reached out. See docs/IOWA-CAMPUS-TASKS.md →
// "Check-in report".
//
// Nothing here is stored as "stale" — it's derived every time from the roster
// (dropped seats, first-study no-shows), the student's status, and the
// check-in log, so it can't drift from what actually happened.

// Past the ministry's reach — not someone to check in on.
const GONE = new Set(['graduated', 'transferred', 'left_school']);

interface SeatRow {
  contact_id: string;
  status: 'active' | 'dropped';
  joined_at: string;
  left_at: string | null;
  drop_reason: string | null;
  drop_note: string | null;
  first_showed: boolean | null;
  first_show_asked_on: string | null;
  bible_studies: { day_of_week: number; start_time: string; location: string | null } | null;
}

const studyLabel = (s: SeatRow['bible_studies']) =>
  s ? `${DAYS[s.day_of_week]} ${fmtTime(s.start_time)}${s.location ? ` · ${s.location}` : ''}` : null;

const labelOf = (list: { key: string; label: string }[], k: string | null) =>
  k ? list.find((x) => x.key === k)?.label ?? k : null;

const joinDetail = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' — ') || null;

export async function checkinReport(): Promise<CheckinRow[]> {
  const students = (await listCampusStudents()).filter((s) => !GONE.has(s.status));
  if (students.length === 0) return [];
  const ids = students.map((s) => s.contact_id);
  const db = getSupabaseAdmin();

  const [campus, seats, checkins] = await Promise.all([
    db.from('campus_students').select('contact_id, dormant_reason, dormant_note, dormant_at, created_at').in('contact_id', ids),
    db
      .from('bible_study_members')
      .select('contact_id, status, joined_at, left_at, drop_reason, drop_note, first_showed, first_show_asked_on, bible_studies(day_of_week, start_time, location)')
      .in('contact_id', ids),
    db
      .from('campus_checkins')
      .select('contact_id, outcome, note, created_at, iowa_staff(name)')
      .in('contact_id', ids)
      .order('created_at', { ascending: false }),
  ]);
  for (const r of [campus, seats, checkins]) if (r.error) throw r.error;

  const campusBy = new Map(
    ((campus.data ?? []) as { contact_id: string; dormant_reason: string | null; dormant_note: string | null; dormant_at: string | null; created_at: string }[])
      .map((c) => [c.contact_id, c])
  );

  const seatsBy = new Map<string, SeatRow[]>();
  for (const s of (seats.data ?? []) as unknown as SeatRow[]) {
    seatsBy.set(s.contact_id, [...(seatsBy.get(s.contact_id) ?? []), s]);
  }

  const checkinsBy = new Map<string, { outcome: CheckinOutcome; note: string | null; created_at: string; iowa_staff: { name: string } | null }[]>();
  for (const c of (checkins.data ?? []) as unknown as { contact_id: string; outcome: CheckinOutcome; note: string | null; created_at: string; iowa_staff: { name: string } | null }[]) {
    checkinsBy.set(c.contact_id, [...(checkinsBy.get(c.contact_id) ?? []), c]);
  }

  const rows: CheckinRow[] = [];
  for (const s of students) {
    const c = campusBy.get(s.contact_id);
    const mine = seatsBy.get(s.contact_id) ?? [];
    const active = mine.filter((m) => m.status === 'active');
    const lastDropped = mine
      .filter((m) => m.status === 'dropped')
      .sort((a, b) => (b.left_at ?? b.joined_at).localeCompare(a.left_at ?? a.joined_at))[0];
    const noShow = mine.find((m) => m.first_showed === false && (m.status === 'active' || m === lastDropped));

    let reason: QuietReason;
    let detail: string | null = null;
    let study: string | null = null;
    let since: string;

    if (noShow) {
      reason = 'never_showed';
      study = studyLabel(noShow.bible_studies);
      since = noShow.first_show_asked_on ?? noShow.joined_at;
      if (noShow.status === 'dropped') {
        detail = joinDetail(labelOf(DROP_REASONS, noShow.drop_reason), noShow.drop_note);
      }
    } else if (s.status === 'dormant') {
      reason = 'dormant';
      detail = joinDetail(labelOf(DORMANT_REASONS, c?.dormant_reason ?? null), c?.dormant_note);
      study = active[0] ? studyLabel(active[0].bible_studies) : studyLabel(lastDropped?.bible_studies ?? null);
      since = c?.dormant_at ?? c?.created_at ?? new Date().toISOString();
    } else if (active.length > 0) {
      continue; // in a study and showing up — not on the report
    } else if (lastDropped) {
      if (lastDropped.drop_reason === 'left_school') continue;
      reason = 'dropped';
      detail = joinDetail(labelOf(DROP_REASONS, lastDropped.drop_reason), lastDropped.drop_note);
      study = studyLabel(lastDropped.bible_studies);
      since = lastDropped.left_at ?? lastDropped.joined_at;
    } else {
      reason = 'never_placed';
      since = c?.created_at ?? new Date().toISOString();
    }

    const log = checkinsBy.get(s.contact_id) ?? [];
    rows.push({
      contact_id: s.contact_id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      year: s.year,
      reason,
      detail,
      study,
      quiet_since: since,
      last_checkin: log[0]
        ? { at: log[0].created_at, by: log[0].iowa_staff?.name ?? null, outcome: log[0].outcome, note: log[0].note }
        : null,
      checkin_count: log.length,
    });
  }

  // Longest-neglected first: never checked on, then oldest check-in.
  return rows.sort((a, b) => {
    const ax = a.last_checkin?.at ?? '';
    const bx = b.last_checkin?.at ?? '';
    return ax === bx ? a.quiet_since.localeCompare(b.quiet_since) : ax.localeCompare(bx);
  });
}

export async function logCheckin(
  contactId: string,
  outcome: CheckinOutcome,
  note: string | null,
  by: IowaStaff | null
): Promise<CheckinRow['last_checkin']> {
  const { data, error } = await getSupabaseAdmin()
    .from('campus_checkins')
    .insert({ contact_id: contactId, outcome, note: note?.trim() || null, staff_id: by?.id ?? null })
    .select('created_at, outcome, note')
    .single();
  if (error) throw error;
  return { at: data.created_at, by: by?.name ?? null, outcome: data.outcome, note: data.note };
}

// Events a student could be invited to: anything still ahead, socials first.
export async function invitableEvents(): Promise<SocialEventOption[]> {
  const today = chicagoToday();
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_events')
    .select('id, title, event_date, start_time, repeat_weekly, repeat_until, iowa_item_types(name)')
    .or(`event_date.gte.${today},and(repeat_weekly.eq.true,or(repeat_until.is.null,repeat_until.gte.${today}))`)
    .order('event_date');
  if (error) throw error;
  return ((data ?? []) as unknown as {
    id: string; title: string; event_date: string; start_time: string | null; repeat_weekly: boolean;
    iowa_item_types: { name: string } | null;
  }[])
    .map((e) => ({
      id: e.id,
      title: e.title,
      when: e.repeat_weekly ? whenText(e) : formatDate(e.event_date) + (e.start_time ? ` at ${fmtTime(e.start_time)}` : ''),
      social: /social|gathering/i.test(e.iowa_item_types?.name ?? ''),
    }))
    .sort((a, b) => Number(b.social) - Number(a.social));
}
