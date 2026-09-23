// Pure helpers for ARK Iowa campus tasks + events. No server imports — safe in
// client components. Dates are 'YYYY-MM-DD' strings in America/Chicago local
// time throughout; arithmetic is done on UTC-midnight Dates so DST never shifts
// a day. See docs/IOWA-CAMPUS-TASKS.md.

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type DropReason = 'unresponsive' | 'schedule_changed' | 'not_interested' | 'left_school' | 'other';

export const PRIORITIES: { key: TaskPriority; label: string; hint: string; color: string; bg: string }[] = [
  { key: 'urgent', label: 'Urgent', hint: 'now', color: '#b91c1c', bg: '#fee2e2' },
  { key: 'high', label: 'High', hint: 'this week', color: '#b45309', bg: '#fef3c7' },
  { key: 'normal', label: 'Normal', hint: '', color: '#1d4ed8', bg: '#dbeafe' },
  { key: 'low', label: 'Low', hint: 'whenever', color: '#6b7280', bg: '#f3f4f6' },
];
export const PRIORITY: Record<TaskPriority, (typeof PRIORITIES)[number]> = Object.fromEntries(
  PRIORITIES.map((p) => [p.key, p])
) as Record<TaskPriority, (typeof PRIORITIES)[number]>;
const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
];

export const DROP_REASONS: { key: DropReason; label: string }[] = [
  { key: 'unresponsive', label: 'Unresponsive' },
  { key: 'schedule_changed', label: 'Schedule changed' },
  { key: 'not_interested', label: 'Not interested' },
  { key: 'left_school', label: 'Graduated / left school' },
  { key: 'other', label: 'Other' },
];

// How a staff member hears about task activity (migration 026): an email per
// event, one 6 PM digest (the default), or nothing but the 8 AM checklist.
export type NotifyMode = 'instant' | 'digest' | 'off';
export const NOTIFY_MODES: { key: NotifyMode; label: string; hint: string }[] = [
  { key: 'digest', label: 'One email at 6 PM', hint: 'Everything from today in one email' },
  { key: 'instant', label: 'Email me right away', hint: 'One email per thing, as it happens' },
  { key: 'off', label: 'No emails', hint: 'Only the 8 AM checklist' },
];

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function chicagoToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function toUtc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUtc(dt);
}

export function dayOfWeek(date: string): number {
  return toUtc(date).getUTCDay(); // 0 = Sun
}

// Monday of the week containing `date`.
export function weekStart(date: string): string {
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUtc(s).getTime());
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(toUtc(date));
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function isOverdue(t: { due_date: string | null; status: TaskStatus }, today = chicagoToday()): boolean {
  return t.status !== 'done' && !!t.due_date && t.due_date < today;
}

// Overdue first, then priority, then soonest due (no date last), then oldest.
export function compareTasks(
  a: { due_date: string | null; status: TaskStatus; priority: TaskPriority; created_at: string },
  b: { due_date: string | null; status: TaskStatus; priority: TaskPriority; created_at: string },
  today = chicagoToday()
): number {
  const od = Number(isOverdue(b, today)) - Number(isOverdue(a, today));
  if (od) return od;
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr) return pr;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return a.created_at < b.created_at ? -1 : 1;
}

// The automation's one-task-per-student kinds, collapsed into one line on the
// task list and the calendar ("Reconnect with 6 students"). Follow-ups are the
// same job as a check-in on the report; logging one there closes them.
export const FOLLOW_UP_TITLES: Record<string, (n: number) => string> = {
  missed: (n) => `Follow up with ${n} students who missed their first study`,
  reconnect: (n) => `Reconnect with ${n} students`,
  place: (n) => `Help ${n} students find a Bible study`,
  reinvite: (n) => `Re-invite ${n} students`,
};

// Group key for a task, or null if it stands alone. Welcome texts group per study.
export function taskGroupKey(t: { auto_kind: string | null; study_id: string | null }): string | null {
  if (t.auto_kind && FOLLOW_UP_TITLES[t.auto_kind]) return t.auto_kind;
  if (t.auto_kind === 'welcome') return `welcome:${t.study_id ?? ''}`;
  return null;
}

export function taskGroupTitle(key: string, n: number): string {
  return FOLLOW_UP_TITLES[key]?.(n) ?? `Welcome texts to ${n} new students`;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

// Every date in [from, to] (inclusive) that an event falls on. A weekly event
// repeats on the same weekday from event_date until repeat_until (or forever),
// minus any skip_dates (a week off, finals week).
export function eventDatesInRange(
  e: { event_date: string; repeat_weekly: boolean; repeat_until: string | null; skip_dates?: string[] | null },
  from: string,
  to: string
): string[] {
  if (!e.repeat_weekly) return e.event_date >= from && e.event_date <= to ? [e.event_date] : [];
  const out: string[] = [];
  const last = e.repeat_until && e.repeat_until < to ? e.repeat_until : to;
  let d = e.event_date;
  if (d < from) {
    const weeks = Math.floor((toUtc(from).getTime() - toUtc(d).getTime()) / (7 * 86_400_000));
    d = addDays(d, weeks * 7);
    if (d < from) d = addDays(d, 7);
  }
  for (; d <= last; d = addDays(d, 7)) out.push(d);
  const skip = new Set(e.skip_dates ?? []);
  return skip.size ? out.filter((x) => !skip.has(x)) : out;
}

// ---------------------------------------------------------------------------
// School calendar (migration 017) — breaks, finals, summer
// ---------------------------------------------------------------------------

export interface SchoolPeriod {
  id: string;
  name: string;
  kind: 'break' | 'finals' | 'holiday' | 'between_semesters' | 'other';
  starts_on: string;
  ends_on: string;
  pauses_in_person: boolean;
  note: string | null;
}

export function periodsOn(date: string, periods: SchoolPeriod[]): SchoolPeriod[] {
  return periods.filter((p) => date >= p.starts_on && date <= p.ends_on);
}

// The pausing period an in-person study is off for on `date`, if any. Online
// studies never pause.
export function studyPausedBy(
  study: { online?: boolean | null },
  date: string,
  periods: SchoolPeriod[]
): SchoolPeriod | null {
  if (study.online) return null;
  return periodsOn(date, periods).find((p) => p.pauses_in_person) ?? null;
}

const WARN_AHEAD_DAYS = 7;

// Heads-up lines for scheduling something in person on these dates: inside a
// break / finals / summer, or in the week before one starts ("students are
// about to leave"). Online things get no warnings — they're meant to run then.
export function scheduleWarnings(dates: string[], periods: SchoolPeriod[], online = false): string[] {
  if (online) return [];
  const out = new Map<string, string>();
  for (const d of dates) {
    for (const p of periods) {
      const range = p.starts_on === p.ends_on ? formatDate(p.starts_on) : `${formatDate(p.starts_on)} – ${formatDate(p.ends_on)}`;
      if (d >= p.starts_on && d <= p.ends_on) {
        const gone = p.kind === 'between_semesters' || p.kind === 'break';
        out.set(
          p.id,
          p.kind === 'finals'
            ? `${formatDate(d)} is during ${p.name.toLowerCase()} (${range}). Students are cramming.`
            : gone
              ? `${formatDate(d)} is during ${p.name.toLowerCase()} (${range}). Most students are gone.`
              : `${formatDate(d)} is ${p.name} (${range}).`
        );
      } else if (p.pauses_in_person && d < p.starts_on && d >= addDays(p.starts_on, -WARN_AHEAD_DAYS) && !out.has(p.id)) {
        out.set(p.id, `${formatDate(d)} is the week before ${p.name.toLowerCase()} (starts ${formatDate(p.starts_on)}).`);
      }
    }
  }
  return [...out.values()];
}

// Every date of a weekly series (within the next year) that lands in a pausing
// period — for the "skip the break weeks" button.
export function breakDatesForSeries(
  e: { event_date: string; repeat_weekly: boolean; repeat_until: string | null; skip_dates?: string[] | null },
  periods: SchoolPeriod[],
  from = chicagoToday()
): string[] {
  const to = addDays(from, 366);
  return eventDatesInRange({ ...e, skip_dates: [] }, from, to).filter((d) =>
    periodsOn(d, periods).some((p) => p.pauses_in_person)
  );
}

// ---------------------------------------------------------------------------
// Semesters (migration 018) — which studies meet when
// ---------------------------------------------------------------------------

export interface Semester {
  name: string;
  starts_on: string; // first day of classes
  ends_on: string; // last day of finals
  signup_opens: string; // next-semester planning + public signup open
  note: string | null;
}

// The semester we're in: the latest one that has started (so winter break
// still counts as Fall until Spring's first day).
export function currentSemesterOf(semesters: Semester[], today = chicagoToday()): Semester | null {
  const started = semesters.filter((s) => s.starts_on <= today).sort((a, b) => b.starts_on.localeCompare(a.starts_on));
  return started[0] ?? semesters.slice().sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0] ?? null;
}

// Upcoming semesters whose signup/planning window is open.
export function openSemestersOf(semesters: Semester[], today = chicagoToday()): Semester[] {
  return semesters
    .filter((s) => s.starts_on > today && s.signup_opens <= today)
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
}

// The one rule for "does this study meet on this date?": right weekday, inside
// its semester, and — if in person — not on a school break.
export function studyMeetsOn(
  study: { day_of_week: number; semester?: string; online?: boolean | null },
  date: string,
  periods: SchoolPeriod[],
  semesters: Semester[]
): boolean {
  if (dayOfWeek(date) !== study.day_of_week) return false;
  const sem = semesters.find((s) => s.name === study.semester);
  if (sem && (date < sem.starts_on || date > sem.ends_on)) return false;
  return !studyPausedBy(study, date, periods);
}

// The first date on/after `from` the study meets (null if its semester is over).
export function nextMeetingOnOrAfter(
  study: { day_of_week: number; semester?: string; online?: boolean | null },
  from: string,
  periods: SchoolPeriod[],
  semesters: Semester[]
): string | null {
  const sem = semesters.find((s) => s.name === study.semester);
  let d = sem && from < sem.starts_on ? sem.starts_on : from;
  d = addDays(d, (study.day_of_week - dayOfWeek(d) + 7) % 7);
  for (let i = 0; i < 60; i++, d = addDays(d, 7)) {
    if (sem && d > sem.ends_on) return null;
    if (studyMeetsOn(study, d, periods, semesters)) return d;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Study team (migration 021)
// ---------------------------------------------------------------------------

export type StudyRole = 'shadow' | 'assist' | 'lead';
export const STUDY_ROLES: { key: StudyRole; label: string; verb: string }[] = [
  { key: 'shadow', label: 'Shadowing', verb: 'shadowing' },
  { key: 'assist', label: 'Assisting', verb: 'assisting' },
  { key: 'lead', label: 'Leading', verb: 'leading' },
];
export const roleVerb = (r: StudyRole) => STUDY_ROLES.find((x) => x.key === r)!.verb;

export interface StudyTeamRow {
  id: string;
  study_id: string;
  staff_id: string;
  role: StudyRole;
  occurrence: string | null; // null = every week
  response: 'pending' | 'accepted' | 'declined';
  note: string | null;
}

// Who's on a study's team on a given date: every-week rows plus that date's,
// with a date-specific row winning for the same person (e.g. usually
// shadowing, leading this week).
export function teamOn(studyId: string, date: string, team: StudyTeamRow[]): StudyTeamRow[] {
  const rows = team.filter((t) => t.study_id === studyId && (t.occurrence === null || t.occurrence === date));
  const byStaff = new Map<string, StudyTeamRow>();
  for (const r of rows.sort((a, b) => (a.occurrence ? 1 : 0) - (b.occurrence ? 1 : 0))) byStaff.set(r.staff_id, r);
  return [...byStaff.values()];
}
