import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStudyWithMembers, listStudies, type StudyWithMembers } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';
import { listStaff } from '@/lib/iowaStaff';
import { formatSlot, formatTime, DAY_NAMES } from '@/lib/bibleStudyFormat';
import { addDays, dayOfWeek, nextMeetingOnOrAfter, studyPausedBy, type SchoolPeriod, type Semester } from '@/lib/campusFormat';
import { siteUrl } from '@/lib/email';
import {
  calendarConfigured,
  deleteCalendarEvent,
  insertCalendarEvent,
  listCalendarEvents,
  patchCalendarEvent,
  type GEvent,
} from '@/lib/googleCalendar';

// Two-way sync between the Iowa admin and the shared ARK Campus Google
// calendar (migration 014). Ownership rules — the whole duplicate story:
//   studies        admin -> Google, only once at least one student is in
//   admin events   admin -> Google
//   Google events  Google -> admin, read-only here
// App-written Google events carry extendedProperties.private.arkSource and the
// importer skips them. Every function is a no-op when Google isn't configured.

const TZ = 'America/Chicago';
const LIVE = ['forming', 'full', 'activated'];
const PULL_EVERY_MS = 2 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chicagoParts(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}:00` };
}

// 'HH:MM[:SS]' one hour later, clamped to the same day.
function plusHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return h >= 23 ? '23:59:00' : `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

const hhmm = (t: string) => t.slice(0, 5);
const compact = (date: string) => date.replace(/-/g, '');

async function logError(where: string, e: unknown) {
  const msg = `${where}: ${(e as Error).message}`.slice(0, 1000);
  console.error('[iowa calendar]', msg);
  await getSupabaseAdmin().from('iowa_calendar_sync').update({ last_error: msg }).eq('id', 1);
}

// ---------------------------------------------------------------------------
// Studies -> Google
// ---------------------------------------------------------------------------

function studyEligible(s: StudyWithMembers): boolean {
  return LIVE.includes(s.status) && s.activeCount > 0 && !!s.location;
}

export function studyEvent(
  s: StudyWithMembers,
  onPoint: string | null,
  staffNames: Map<string, string> = new Map(),
  periods: SchoolPeriod[] = [],
  semesters: Semester[] = []
): GEvent {
  const metBy = (m: StudyWithMembers['members'][number]) =>
    m.met_by_staff_id && staffNames.get(m.met_by_staff_id)
      ? `met ${staffNames.get(m.met_by_staff_id)!.split(' ')[0]}`
      : m.met_by_other === 'friend'
        ? 'friend invited'
        : null;
  // Anchor the weekly series at the first meeting on/after the study was made
  // (or its semester started), so past weeks stay put when the roster changes,
  // and end it with the semester.
  const created = chicagoParts(new Date(s.created_at)).date;
  const sem = semesters.find((x) => x.name === s.semester);
  const first =
    nextMeetingOnOrAfter({ ...s, online: true }, created, [], semesters) ??
    addDays(created, (s.day_of_week - dayOfWeek(created) + 7) % 7);
  const until = sem ? `;UNTIL=${compact(addDays(sem.ends_on, 1))}T055959Z` : '';
  const start = s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time;

  const active = s.members.filter((m) => m.status === 'active');
  const lines = [
    `Students (${active.length}/${s.capacity}):`,
    ...active.map((m) => `• ${[m.name, m.phone, m.email, m.year, metBy(m)].filter(Boolean).join(' — ')}`),
  ];
  if (s.leader_name) lines.push('', `Student leader: ${[s.leader_name, s.leader_phone].filter(Boolean).join(' — ')}`);
  lines.push('', `On point: ${onPoint ?? 'nobody (student-led)'}`);
  if (s.online) lines.push('Online: keeps meeting through breaks and summer.');
  if (s.notes) lines.push('', `Notes: ${s.notes}`);
  lines.push('', `Managed in the ARK Iowa admin, so edits made here get overwritten: ${siteUrl()}/iowa/admin/studies`);

  return {
    summary: `Bible study · ${formatSlot(s)}${onPoint ? ` · ${onPoint.split(' ')[0]}` : ''}`,
    location: s.location ?? undefined,
    description: lines.join('\n'),
    start: { dateTime: `${first}T${start}`, timeZone: TZ },
    end: { dateTime: `${first}T${plusHour(start)}`, timeZone: TZ },
    recurrence: [`RRULE:FREQ=WEEKLY${until}`, ...breakExdates(s, first, start, periods)],
    extendedProperties: { private: { arkSource: 'study', arkId: s.id } },
  };
}

// In-person studies don't meet during pausing school periods (breaks, finals,
// summer): take those weeks off the Google series.
function breakExdates(s: StudyWithMembers, first: string, start: string, periods: SchoolPeriod[]): string[] {
  if (s.online) return [];
  const out: string[] = [];
  for (const p of periods.filter((x) => x.pauses_in_person && x.ends_on >= first)) {
    for (let d = p.starts_on < first ? first : p.starts_on; d <= p.ends_on; d = addDays(d, 1)) {
      if (dayOfWeek(d) === s.day_of_week && studyPausedBy(s, d, [p])) {
        out.push(`EXDATE;TZID=${TZ}:${compact(d)}T${start.replace(/:/g, '')}`);
      }
    }
  }
  return out;
}

async function pushStudy(
  s: StudyWithMembers,
  staffNames: Map<string, string>,
  periods: SchoolPeriod[],
  semesters: Semester[]
): Promise<void> {
  const db = getSupabaseAdmin();
  if (!studyEligible(s)) {
    if (s.google_event_id) {
      await deleteCalendarEvent(s.google_event_id);
      await db.from('bible_studies').update({ google_event_id: null }).eq('id', s.id);
    }
    return;
  }
  const event = studyEvent(s, s.point_staff_id ? staffNames.get(s.point_staff_id) ?? null : null, staffNames, periods, semesters);
  // Deleted by hand in Google? patch returns null — put it back.
  const saved = (s.google_event_id && (await patchCalendarEvent(s.google_event_id, event))) || (await insertCalendarEvent(event));
  if (saved.id !== s.google_event_id) {
    await db.from('bible_studies').update({ google_event_id: saved.id }).eq('id', s.id);
  }
}

async function staffNameMap(): Promise<Map<string, string>> {
  return new Map((await listStaff()).map((p) => [p.id, p.name]));
}

export async function syncStudies(studyIds: string[]): Promise<void> {
  if (!calendarConfigured()) return;
  const [names, ctx] = await Promise.all([staffNameMap(), semesterContext()]);
  for (const id of [...new Set(studyIds.filter(Boolean))]) {
    try {
      const s = await getStudyWithMembers(id);
      if (s) await pushStudy(s, names, ctx.periods, ctx.semesters);
    } catch (e) {
      await logError(`study ${id}`, e);
    }
  }
}

export async function syncAllStudies(): Promise<void> {
  if (!calendarConfigured()) return;
  const [names, ctx] = await Promise.all([staffNameMap(), semesterContext()]);
  for (const s of await listStudies(ctx.active)) {
    try {
      await pushStudy(s, names, ctx.periods, ctx.semesters);
    } catch (e) {
      await logError(`study ${s.id}`, e);
    }
  }
}

// School calendar changed → every study's break weeks may have moved.
export function queueAllStudiesSync() {
  if (calendarConfigured()) after(() => syncAllStudies());
}

// Fire-and-forget from route handlers (after the response is sent).
export function queueStudySync(...studyIds: (string | null | undefined)[]) {
  if (!calendarConfigured()) return;
  const ids = studyIds.filter((x): x is string => !!x);
  if (ids.length) after(() => syncStudies(ids));
}

// ---------------------------------------------------------------------------
// Admin events -> Google
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  title: string;
  source: 'app' | 'google';
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  repeat_weekly: boolean;
  repeat_until: string | null;
  skip_dates: string[] | null;
  google_event_id: string | null;
  type: { name: string } | null;
  staff: { staff_id: string }[] | null;
}

function appEvent(e: EventRow, names: Map<string, string>): GEvent {
  const going = (e.staff ?? []).map((x) => names.get(x.staff_id)).filter(Boolean);
  const lines = [
    e.type?.name ? `Type: ${e.type.name}` : null,
    going.length ? `Going: ${going.join(', ')}` : null,
    e.meeting_link ? `Join: ${e.meeting_link}` : null,
    e.notes ? `\n${e.notes}` : null,
    `\nManaged in the ARK Iowa admin, so edits made here get overwritten: ${siteUrl()}/iowa/admin/calendar`,
  ].filter(Boolean);

  const timed = !!e.start_time;
  const start = timed
    ? { dateTime: `${e.event_date}T${e.start_time}`, timeZone: TZ }
    : { date: e.event_date };
  const end = timed
    ? { dateTime: `${e.event_date}T${e.end_time && e.end_time > e.start_time! ? e.end_time : plusHour(e.start_time!)}`, timeZone: TZ }
    : { date: addDays(e.event_date, 1) };
  // UNTIL is inclusive; ~1 AM CT the next day covers any start time that day.
  const until = e.repeat_until ? `;UNTIL=${compact(addDays(e.repeat_until, 1))}T055959Z` : '';

  return {
    summary: e.title,
    location: e.location ?? undefined,
    description: lines.join('\n'),
    start,
    end,
    recurrence: e.repeat_weekly
      ? [
          `RRULE:FREQ=WEEKLY${until}`,
          // Skipped weeks (finals, a break).
          ...(e.skip_dates ?? []).map((d) =>
            timed ? `EXDATE;TZID=${TZ}:${compact(d)}T${e.start_time!.replace(/:/g, '').padEnd(6, '0')}` : `EXDATE;VALUE=DATE:${compact(d)}`
          ),
        ]
      : [],
    extendedProperties: { private: { arkSource: 'event', arkId: e.id } },
  };
}

export async function syncAppEvent(eventId: string): Promise<void> {
  if (!calendarConfigured()) return;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('iowa_events')
      .select('*, type:iowa_item_types(name), staff:iowa_event_staff(staff_id)')
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw error;
    const e = data as EventRow | null;
    if (!e || e.source !== 'app') return;
    const event = appEvent(e, await staffNameMap());
    const saved = (e.google_event_id && (await patchCalendarEvent(e.google_event_id, event))) || (await insertCalendarEvent(event));
    if (saved.id !== e.google_event_id) {
      await db.from('iowa_events').update({ google_event_id: saved.id }).eq('id', e.id);
    }
  } catch (e) {
    await logError(`event ${eventId}`, e);
  }
}

export function queueEventSync(eventId: string) {
  if (calendarConfigured()) after(() => syncAppEvent(eventId));
}

export function queueEventDelete(googleEventId: string | null) {
  if (!calendarConfigured() || !googleEventId) return;
  after(async () => {
    try {
      await deleteCalendarEvent(googleEventId);
    } catch (e) {
      await logError(`delete ${googleEventId}`, e);
    }
  });
}

async function syncAllAppEvents(): Promise<void> {
  const { data, error } = await getSupabaseAdmin().from('iowa_events').select('id').eq('source', 'app');
  if (error) throw error;
  for (const row of data ?? []) await syncAppEvent(row.id);
}

// ---------------------------------------------------------------------------
// Google -> admin
// ---------------------------------------------------------------------------

interface Parsed {
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  repeat_weekly: boolean;
  repeat_until: string | null;
  skip_dates: string[];
  google_html_link: string | null;
}

export function parseGoogle(g: GEvent): Parsed | null {
  if (!g.start) return null;
  let event_date: string;
  let start_time: string | null = null;
  let end_time: string | null = null;
  if (g.start.dateTime) {
    const s = chicagoParts(new Date(g.start.dateTime));
    event_date = s.date;
    start_time = s.time;
    if (g.end?.dateTime) {
      const e = chicagoParts(new Date(g.end.dateTime));
      end_time = e.date === s.date ? e.time : null;
    }
  } else if (g.start.date) {
    event_date = g.start.date;
  } else {
    return null;
  }

  // Only a plain weekly rule maps onto our weekly repeat. Anything fancier
  // (every 2 weeks, several weekdays, monthly) imports as its first date, with
  // a note to look in Google for the rest.
  let repeat_weekly = false;
  let repeat_until: string | null = null;
  let extraNote: string | null = null;
  const rules = (g.recurrence ?? []).filter((r) => r.startsWith('RRULE:'));
  if (rules.length) {
    const rule = Object.fromEntries(
      rules[0].slice(6).split(';').map((kv) => kv.split('=') as [string, string])
    );
    const simple =
      rules.length === 1 &&
      rule.FREQ === 'WEEKLY' &&
      (!rule.INTERVAL || rule.INTERVAL === '1') &&
      (!rule.BYDAY || !rule.BYDAY.includes(','));
    if (simple) {
      repeat_weekly = true;
      if (rule.UNTIL) {
        const u = rule.UNTIL;
        repeat_until = u.length > 8
          ? chicagoParts(new Date(`${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}T${u.slice(9, 11)}:${u.slice(11, 13)}:${u.slice(13, 15)}Z`)).date
          : `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`;
      } else if (rule.COUNT) {
        repeat_until = addDays(event_date, (Number(rule.COUNT) - 1) * 7);
      }
    } else {
      extraNote = 'Repeats on a schedule the admin can’t show. See Google Calendar for every date.';
    }
  }

  // EXDATE lines on the series → skipped weeks (cancelled single instances are
  // merged in by pullFromGoogle).
  const skip_dates = (g.recurrence ?? [])
    .filter((r) => r.startsWith('EXDATE'))
    .flatMap((r) => r.slice(r.indexOf(':') + 1).split(','))
    .map(googleStampToDate)
    .filter((d): d is string => !!d);

  const video = g.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri;
  const linkInLocation = g.location && /^https?:\/\//i.test(g.location.trim()) ? g.location.trim() : null;
  return {
    title: g.summary?.trim() || '(untitled)',
    event_date,
    start_time,
    end_time,
    location: linkInLocation ? null : g.location?.trim() || null,
    meeting_link: g.hangoutLink || video || linkInLocation || null,
    notes: [g.description?.trim(), extraNote].filter(Boolean).join('\n\n') || null,
    repeat_weekly,
    repeat_until,
    skip_dates,
    google_html_link: g.htmlLink ?? null,
  };
}

// An EXDATE/UNTIL-style stamp ('20260930', '20260930T190000', '20260930T000000Z')
// → Chicago local date. Floating times are already local to the event's zone,
// which for this calendar is Chicago.
function googleStampToDate(v: string): string | null {
  const m = v.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  if (m[7]) return chicagoParts(new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`)).date;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// The local date of a cancelled instance's original slot.
function originalDate(g: GEvent): string | null {
  const o = g.originalStartTime;
  if (!o) return null;
  if (o.dateTime) return chicagoParts(new Date(o.dateTime)).date;
  return o.date ?? null;
}

// Same weekday + start time as a study the admin owns, and it looks like a
// study (weekly, or "bible"/"study" in the title) → probably one of Travis's
// hand-made entries from before the sync.
function matchStudy(p: Parsed, studies: StudyWithMembers[]): StudyWithMembers | null {
  if (!p.start_time) return null;
  if (!p.repeat_weekly && !/bible|study/i.test(p.title)) return null;
  const dow = dayOfWeek(p.event_date);
  return studies.find((s) => s.day_of_week === dow && hhmm(s.start_time) === hhmm(p.start_time!)) ?? null;
}

export async function pullFromGoogle(): Promise<{ imported: number; held: number; removed: number }> {
  if (!calendarConfigured()) return { imported: 0, held: 0, removed: 0 };
  const db = getSupabaseAdmin();
  const timeMin = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [google, studies, existingRes, heldRes] = await Promise.all([
    listCalendarEvents(timeMin),
    listStudies(),
    db.from('iowa_events').select('id, google_event_id').eq('source', 'google'),
    db.from('iowa_calendar_held').select('google_event_id, decision'),
  ]);
  if (existingRes.error) throw existingRes.error;
  if (heldRes.error) throw heldRes.error;
  const existing = new Map((existingRes.data ?? []).map((r) => [r.google_event_id as string, r.id as string]));
  const decisions = new Map((heldRes.data ?? []).map((r) => [r.google_event_id as string, r.decision as string | null]));
  const liveStudies = studies.filter((s) => s.status !== 'ended');

  // Weeks cancelled out of a series in Google arrive as cancelled exceptions
  // pointing at their master.
  const cancelledWeeks = new Map<string, string[]>();
  for (const g of google) {
    if (g.status === 'cancelled' && g.recurringEventId) {
      const d = originalDate(g);
      if (d) cancelledWeeks.set(g.recurringEventId, [...(cancelledWeeks.get(g.recurringEventId) ?? []), d]);
    }
  }

  const seen = new Set<string>();
  let imported = 0;
  let held = 0;
  for (const g of google) {
    // Skip: cancelled, one moved instance of a series (the master carries the
    // series), and anything the app itself wrote.
    if (!g.id || g.status === 'cancelled' || g.recurringEventId || g.extendedProperties?.private?.arkSource) continue;
    const p = parseGoogle(g);
    if (!p) continue;
    seen.add(g.id);

    const decision = decisions.get(g.id);
    const study = decision === 'import' ? null : matchStudy(p, liveStudies);
    if (decision === 'ignore' || study) {
      if (decision === undefined && study) {
        await db.from('iowa_calendar_held').insert({
          google_event_id: g.id,
          summary: p.title,
          starts_label: `${DAY_NAMES[dayOfWeek(p.event_date)].slice(0, 3)} ${formatTime(p.start_time!)}${p.repeat_weekly ? ', weekly' : ''}`,
          matched_study_id: study.id,
        });
        decisions.set(g.id, null);
      }
      if (existing.has(g.id)) await db.from('iowa_events').delete().eq('id', existing.get(g.id)!);
      held++;
      continue;
    }

    if (decisions.has(g.id) && decision !== 'import') {
      // Was held, but its study moved or ended — no longer a duplicate.
      await db.from('iowa_calendar_held').delete().eq('google_event_id', g.id);
      decisions.delete(g.id);
    }
    const skips = [...new Set([...p.skip_dates, ...(cancelledWeeks.get(g.id) ?? [])])].sort();
    const row = { ...p, skip_dates: skips, source: 'google', google_event_id: g.id };
    const id = existing.get(g.id);
    const { error } = id
      ? await db.from('iowa_events').update(row).eq('id', id)
      : await db.from('iowa_events').insert(row);
    if (error) throw error;
    imported++;
  }

  // Gone from Google (deleted, or older than the window) → gone here too.
  let removed = 0;
  for (const [gid, id] of existing) {
    if (!seen.has(gid)) {
      await db.from('iowa_events').delete().eq('id', id);
      removed++;
    }
  }
  const staleHeld = [...decisions.keys()].filter((gid) => !seen.has(gid));
  if (staleHeld.length) await db.from('iowa_calendar_held').delete().in('google_event_id', staleHeld);

  await db.from('iowa_calendar_sync').update({ last_pulled_at: new Date().toISOString(), last_error: null }).eq('id', 1);
  return { imported, held, removed };
}

// Called when the dashboard or calendar opens: pull at most every 2 minutes.
// Never throws — a Google hiccup must not break the page.
export async function pullIfStale(): Promise<void> {
  if (!calendarConfigured()) return;
  try {
    const { data } = await getSupabaseAdmin().from('iowa_calendar_sync').select('last_pulled_at').eq('id', 1).maybeSingle();
    const last = data?.last_pulled_at ? new Date(data.last_pulled_at).getTime() : 0;
    if (Date.now() - last < PULL_EVERY_MS) return;
    await pullFromGoogle();
  } catch (e) {
    await logError('pull', e);
  }
}

// Everything, both directions. Daily cron + the "Sync now" button.
export async function fullSync(): Promise<{ imported: number; held: number; removed: number }> {
  if (!calendarConfigured()) return { imported: 0, held: 0, removed: 0 };
  await syncAllStudies();
  await syncAllAppEvents();
  return pullFromGoogle();
}

// ---------------------------------------------------------------------------
// Held-back duplicates
// ---------------------------------------------------------------------------

export interface HeldEvent {
  google_event_id: string;
  summary: string | null;
  starts_label: string | null;
  matched_study_id: string | null;
  decision: 'import' | 'ignore' | null;
}

export async function listHeld(): Promise<HeldEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_calendar_held')
    .select('google_event_id, summary, starts_label, matched_study_id, decision')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HeldEvent[];
}

export async function decideHeld(googleEventId: string, decision: 'import' | 'ignore'): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('iowa_calendar_held')
    .update({ decision })
    .eq('google_event_id', googleEventId);
  if (error) throw error;
  if (decision === 'import') await pullFromGoogle();
}

export async function syncStatus(): Promise<{ configured: boolean; lastPulledAt: string | null; lastError: string | null }> {
  if (!calendarConfigured()) return { configured: false, lastPulledAt: null, lastError: null };
  const { data } = await getSupabaseAdmin().from('iowa_calendar_sync').select('last_pulled_at, last_error').eq('id', 1).maybeSingle();
  return { configured: true, lastPulledAt: data?.last_pulled_at ?? null, lastError: data?.last_error ?? null };
}
