import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listPeriods } from '@/lib/schoolCalendar';
import {
  addDays,
  chicagoToday,
  studyPausedBy,
  currentSemesterOf,
  nextMeetingOnOrAfter,
  openSemestersOf,
  type SchoolPeriod,
  type Semester,
} from '@/lib/campusFormat';

// Semesters (migration 018). Server-only. The pure rules live in campusFormat.

export async function listSemesters(): Promise<Semester[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_semesters')
    .select('name, starts_on, ends_on, signup_opens, note')
    .order('starts_on', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Semester[];
}

export interface SemesterContext {
  semesters: Semester[];
  periods: SchoolPeriod[];
  current: Semester | null;
  open: Semester[]; // upcoming semesters open for planning + signup, target first
  next: Semester | null; // the turnover target: next fall/spring, not summer, when both are open
  active: string[]; // current + open — the studies the app works with
}

export async function semesterContext(today = chicagoToday()): Promise<SemesterContext> {
  const [semesters, periods] = await Promise.all([listSemesters(), listPeriods()]);
  const current = currentSemesterOf(semesters, today);
  const upcoming = openSemestersOf(semesters, today);
  // In late April Summer and Fall open together; groups plan Fall (summer is
  // mostly online and optional), so Fall is the target and listed first.
  const next = upcoming.find((s) => !/summer/i.test(s.name)) ?? upcoming[0] ?? null;
  const open = next ? [next, ...upcoming.filter((s) => s !== next)] : [];
  const active = [...new Set([...(current ? [current.name] : []), ...open.map((s) => s.name)])];
  return { semesters, periods, current, open, next, active };
}

export async function currentSemesterName(): Promise<string> {
  return (await semesterContext()).current?.name ?? process.env.IOWA_SEMESTER ?? 'Fall 2026';
}

// Dates for a student's calendar invite: first real meeting from today, the
// semester's last day, and (in person) the break weeks in between.
export async function studyCalendarDates(study: {
  day_of_week: number;
  semester?: string;
  online?: boolean | null;
}): Promise<{ firstDate: string | null; until: string | null; skipDates: string[] }> {
  const { semesters, periods } = await semesterContext();
  const firstDate = nextMeetingOnOrAfter(study, chicagoToday(), periods, semesters);
  const sem = semesters.find((x) => x.name === study.semester);
  const skipDates: string[] = [];
  if (firstDate && sem && !study.online) {
    for (let d = firstDate; d <= sem.ends_on; d = addDays(d, 7)) {
      if (studyPausedBy(study, d, periods)) skipDates.push(d);
    }
  }
  return { firstDate, until: sem?.ends_on ?? null, skipDates };
}

// A study's first real meeting from today — used for calendar invites.
export async function studyFirstMeeting(study: { day_of_week: number; semester?: string; online?: boolean | null }): Promise<string | null> {
  const { semesters, periods } = await semesterContext();
  return nextMeetingOnOrAfter(study, chicagoToday(), periods, semesters);
}

export async function updateSemester(
  name: string,
  patch: { starts_on?: string; ends_on?: string; signup_opens?: string; note?: string | null }
): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_semesters').update(patch).eq('name', name);
  if (error) throw error;
}

export async function createSemester(s: Omit<Semester, 'note'> & { note?: string | null }): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_semesters').insert(s);
  if (error) throw error;
}

