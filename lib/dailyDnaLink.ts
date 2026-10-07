import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStudyWithMembers, type StudyWithMembers } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';
import { addDays, chicagoToday, nextMeetingOnOrAfter, studyMeetsOn } from '@/lib/campusFormat';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';

// ARK Iowa → Daily DNA (docs/IOWA-DAILY-DNA-LINK.md, Daily DNA Mig 255).
// The admin is the only source of truth. For every study, Daily DNA gets the study and the
// Daily DNA accounts of its linked students; Daily DNA makes it a "Bible study" table (with
// chat) and puts the weekly meetings on those students' calendars. One way only: nothing a
// student does in Daily DNA changes a roster.
// Needs DAILY_DNA_URL (default https://dailydna.app) and PARTNER_SYNC_SECRET (same value in both apps).

const CHURCH = 'arkiowa';
const LIVE = ['forming', 'full', 'activated', 'paused'];
const WEEKS_AHEAD = 10;
const TZ = 'America/Chicago';

export const dailyDnaConfigured = () => !!process.env.PARTNER_SYNC_SECRET;
const base = () => (process.env.DAILY_DNA_URL || 'https://dailydna.app').replace(/\/$/, '');
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
