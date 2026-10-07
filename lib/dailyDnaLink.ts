import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStudyWithMembers, type StudyWithMembers } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';
import { addDays, chicagoToday, eventDatesInRange, nextMeetingOnOrAfter, studyMeetsOn } from '@/lib/campusFormat';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';

// ARK Iowa → Daily DNA (docs/IOWA-DAILY-DNA-LINK.md, Daily DNA Mig 255).
// The admin is the only source of truth. For every study, Daily DNA gets the study and the
// Daily DNA accounts of its linked students; Daily DNA makes it a "Bible study" table (with
// chat) and puts the weekly meetings on those students' calendars. One way only: nothing a
// student does in Daily DNA changes a roster.
// Needs DAILY_DNA_URL (default https://arkiowa.dailydna.app — not the bare dailydna.app, which redirects to www and the redirect drops the Authorization header) and PARTNER_SYNC_SECRET (same value in both apps).

const CHURCH = 'arkiowa';
const LIVE = ['forming', 'full', 'activated', 'paused'];
const WEEKS_AHEAD = 10;
const TZ = 'America/Chicago';

export const dailyDnaConfigured = () => !!process.env.PARTNER_SYNC_SECRET;
const base = () => (process.env.DAILY_DNA_URL || 'https://arkiowa.dailydna.app').replace(/\/$/, '');
const headers = () => ({ Authorization: `Bearer ${process.env.PARTNER_SYNC_SECRET}`, 'Content-Type': 'application/json' });

/** 'YYYY-MM-DD' + 'HH:MM[:SS]' in Chicago → ISO (handles daylight saving) */
function chicagoToIso(date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asChicago = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(guess + (guess - asChicago)).toISOString();
}

const isUrl = (s: string | null) => !!s && /^https?:\/\//i.test(s.trim());

async function studyPayload(s: StudyWithMembers) {
  const db = getSupabaseAdmin();
  const contactIds = s.members.filter((m) => m.status === 'active').map((m) => m.contact_id);
  const { data: linked } = contactIds.length
    ? await db.from('campus_students').select('daily_dna_account_id').in('contact_id', contactIds).not('daily_dna_account_id', 'is', null)
    : { data: [] as { daily_dna_account_id: string }[] };
  const members = (linked ?? []).map((r) => r.daily_dna_account_id as string);

  // Upcoming meetings this semester (skips breaks the same way the calendar does)
  const { semesters, periods } = await semesterContext();
  const starts: string[] = [];
  let d = nextMeetingOnOrAfter(s, chicagoToday(), periods, semesters);
  const stop = addDays(chicagoToday(), WEEKS_AHEAD * 7);
  for (let i = 0; d && d <= stop && i < 30; i++) {
    if (studyMeetsOn(s, d, periods, semesters)) starts.push(chicagoToIso(d, s.start_time));
    d = addDays(d, 7);
  }

  const where = s.online ? 'Online' : s.location ?? '';
  return {
    key: s.id,
    name: `${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} Bible study`,
    label: 'Bible study',
    meets: `${DAY_NAMES[s.day_of_week]}s ${formatTime(s.start_time)}${where ? ` · ${where}` : ''}`,
    churchSubdomain: CHURCH,
    live: LIVE.includes(s.status),
    location: isUrl(s.location) ? null : s.location,
    meetingUrl: isUrl(s.location) ? s.location!.trim() : null,
    starts,
    minutes: 60,
    members,
  };
}

export async function syncStudiesToDailyDna(ids: string[]) {
  if (!dailyDnaConfigured() || !ids.length) return;
  try {
    const studies = (await Promise.all(ids.map((id) => getStudyWithMembers(id)))).filter((s): s is StudyWithMembers => !!s);
    const payload = await Promise.all(studies.map(studyPayload));
    if (!payload.length) return;
    const res = await fetch(`${base()}/api/partner/study`, { method: 'POST', headers: headers(), body: JSON.stringify({ studies: payload }) });
    if (!res.ok) console.error('[DailyDNA] sync failed', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.error('[DailyDNA] sync error', e);
  }
}

/** Fire-and-forget after the response (same pattern as queueStudySync) */
export function queueDailyDnaSync(...studyIds: (string | null | undefined)[]) {
  const ids = studyIds.filter((x): x is string => !!x);
  if (dailyDnaConfigured() && ids.length) after(() => syncStudiesToDailyDna(ids));
}

/** Every study a student is actively in — resync after linking/unlinking them */
export async function studyIdsForStudent(contactId: string): Promise<string[]> {
  const { data } = await getSupabaseAdmin().from('bible_study_members').select('study_id').eq('contact_id', contactId).eq('status', 'active');
  return [...new Set((data ?? []).map((r) => r.study_id as string))];
}

export type DailyDnaAccount = { id: string; name: string; email: string; lastSeen: string | null };

export async function searchDailyDnaAccounts(q: string): Promise<DailyDnaAccount[]> {
  if (!dailyDnaConfigured() || q.trim().length < 2) return [];
  const res = await fetch(`${base()}/api/partner/accounts?church=${CHURCH}&q=${encodeURIComponent(q.trim())}`, { headers: headers(), cache: 'no-store' });
  if (!res.ok) return [];
  return ((await res.json()) as { accounts: DailyDnaAccount[] }).accounts;
}

export async function linkDailyDna(contactId: string, account: { id: string; name: string } | null) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('campus_students').update(
    account
      ? { daily_dna_account_id: account.id, daily_dna_name: account.name, daily_dna_linked_at: new Date().toISOString() }
      : { daily_dna_account_id: null, daily_dna_name: null, daily_dna_linked_at: null }
  ).eq('contact_id', contactId);
  if (error) throw new Error(error.code === '23505' ? 'That Daily DNA account is already linked to another student.' : error.message);
  queueDailyDnaSync(...(await studyIdsForStudent(contactId)));
}

// ---------------------------------------------------------------------------
// Campus events → Daily DNA church events (migration 041, "Show in Daily DNA")
// ---------------------------------------------------------------------------

type EventLike = {
  id: string; title: string; event_date: string; start_time: string | null; end_time: string | null;
  location: string | null; meeting_link: string | null; repeat_weekly: boolean; repeat_until: string | null;
  skip_dates?: string[] | null; show_in_daily_dna?: boolean; created_by?: string | null;
};

/** Who sees a guest-list event in Daily DNA, as Daily DNA accounts. null = no guest list (everyone at
 *  ARK Iowa sees it). Otherwise: guests (not "no") + the event's team (not declined) + whoever made it.
 *  [] = a guest list but nobody linked yet (nobody sees it). Duplicates (a student who is also staff) removed. */
async function eventAccounts(e: EventLike): Promise<string[] | null> {
  const db = getSupabaseAdmin();
  const { data: guests } = await db.from('iowa_event_reminder_people').select('contact_id').eq('event_id', e.id).neq('response', 'no');
  const ids = (guests ?? []).map((g) => g.contact_id as string);
  if (!ids.length) return null;
  const { data: linked } = await db.from('campus_students').select('daily_dna_account_id').in('contact_id', ids).not('daily_dna_account_id', 'is', null);
  const out = new Set((linked ?? []).map((r) => r.daily_dna_account_id as string));
  // The team. Before migration 042 runs the column is missing: just skip staff.
  const { data: team } = await db.from('iowa_event_staff').select('staff_id, response').eq('event_id', e.id);
  const staffIds = new Set((team ?? []).filter((t) => t.response !== 'declined').map((t) => t.staff_id as string));
  if (e.created_by) staffIds.add(e.created_by);
  if (staffIds.size) {
    const { data: staff, error } = await db.from('iowa_staff').select('daily_dna_account_id').in('id', [...staffIds]).not('daily_dna_account_id', 'is', null);
    if (!error) (staff ?? []).forEach((r) => out.add(r.daily_dna_account_id as string));
  }
  return [...out];
}

async function eventPayload(e: EventLike) {
  const invitees = await eventAccounts(e);
  const today = chicagoToday();
  const dates = eventDatesInRange(e, today, addDays(today, WEEKS_AHEAD * 7));
  const start = e.start_time ?? '00:00:00';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = (e.end_time ?? '').split(':').map(Number);
  const minutes = e.start_time && e.end_time && !Number.isNaN(eh) ? Math.max(15, eh * 60 + em - (sh * 60 + sm)) : e.start_time ? 60 : 24 * 60 - 1;
  return {
    key: e.id,
    churchSubdomain: CHURCH,
    title: e.title,
    live: !!e.show_in_daily_dna,
    weekly: e.repeat_weekly,
    starts: dates.map((d) => chicagoToIso(d, start)),
    minutes,
    location: isUrl(e.location) ? null : e.location,
    meetingUrl: e.meeting_link || (isUrl(e.location) ? e.location!.trim() : null),
    ...(invitees && { invitees }),
  };
}

/** Send one event now (awaited, so a "3 weekly church events" refusal can reach the person saving). */
export async function syncEventToDailyDna(e: EventLike): Promise<{ ok: boolean; reason?: string }> {
  if (!dailyDnaConfigured()) return { ok: true };
  try {
    const res = await fetch(`${base()}/api/partner/event`, { method: 'POST', headers: headers(), body: JSON.stringify({ events: [await eventPayload(e)] }), signal: AbortSignal.timeout(8000) });
    const body = (await res.json().catch(() => ({}))) as { results?: { ok: boolean; reason?: string }[] };
    return body.results?.[0] ?? { ok: res.ok };
  } catch (err) {
    console.error('[DailyDNA] event sync error', err);
    return { ok: false, reason: 'unreachable' };
  }
}

/** Guest list changed: re-send the event if it's shown in Daily DNA (who sees it follows the list) */
export async function resyncEventIfShown(eventId: string) {
  if (!dailyDnaConfigured()) return;
  const { data } = await getSupabaseAdmin().from('iowa_events').select('*').eq('id', eventId).maybeSingle();
  if (data?.show_in_daily_dna) await syncEventToDailyDna(data as EventLike);
}

/** Take an event off Daily DNA (deleted, or unchecked) */
export async function removeEventFromDailyDna(id: string) {
  if (!dailyDnaConfigured()) return;
  await fetch(`${base()}/api/partner/event`, { method: 'POST', headers: headers(), body: JSON.stringify({ events: [{ key: id, churchSubdomain: CHURCH, live: false, starts: [] }] }), signal: AbortSignal.timeout(8000) }).catch(() => {});
}

/** Re-send every shown event (keeps the 10-week window rolling; picks up Google edits) */
export async function syncShownEventsToDailyDna() {
  if (!dailyDnaConfigured()) return;
  const { data } = await getSupabaseAdmin().from('iowa_events').select('*').eq('show_in_daily_dna', true);
  for (const e of (data ?? []) as EventLike[]) await syncEventToDailyDna(e);
}

// ---------------------------------------------------------------------------
// Staff ↔ Daily DNA (migration 042): so the team sees guest-list events too
// ---------------------------------------------------------------------------

export type StaffDailyDna = { linked: { id: string; name: string | null } | null; suggestion: { id: string; name: string } | null };

/** Their link, and (when not linked) the Daily DNA account of a student record that looks like the same
 *  person — same email first, then same name — so a student who became an intern is one tap. */
export async function staffDailyDna(staffId: string): Promise<StaffDailyDna> {
  const db = getSupabaseAdmin();
  const { data: st, error } = await db.from('iowa_staff').select('name, email, daily_dna_account_id, daily_dna_name').eq('id', staffId).maybeSingle();
  if (error) throw new Error(/daily_dna/.test(error.message) ? 'Run migration 042 first.' : error.message);
  if (!st) throw new Error('No such staff member.');
  if (st.daily_dna_account_id) return { linked: { id: st.daily_dna_account_id, name: st.daily_dna_name }, suggestion: null };
  const find = async (col: 'email' | 'name', val: string | null) => {
    if (!val?.trim()) return null;
    const { data: contacts } = await db.from('contacts').select('id').ilike(col, val.trim()).limit(5);
    const ids = (contacts ?? []).map((c) => c.id as string);
    if (!ids.length) return null;
    const { data: linked } = await db.from('campus_students').select('daily_dna_account_id, daily_dna_name').in('contact_id', ids).not('daily_dna_account_id', 'is', null).limit(2);
    // Two different students by that name: don't guess
    return linked?.length === 1 ? { id: linked[0].daily_dna_account_id as string, name: (linked[0].daily_dna_name as string) || st.name } : null;
  };
  return { linked: null, suggestion: (await find('email', st.email)) ?? (await find('name', st.name)) };
}

export async function linkStaffDailyDna(staffId: string, account: { id: string; name: string } | null) {
  const { error } = await getSupabaseAdmin().from('iowa_staff').update(
    account
      ? { daily_dna_account_id: account.id, daily_dna_name: account.name, daily_dna_linked_at: new Date().toISOString() }
      : { daily_dna_account_id: null, daily_dna_name: null, daily_dna_linked_at: null }
  ).eq('id', staffId);
  if (error) throw new Error(/daily_dna/.test(error.message) ? 'Run migration 042 first.' : error.message);
  // Guest-list events they're on the team for: re-send so they appear (or disappear) for them
  after(() => syncShownEventsToDailyDna());
}
