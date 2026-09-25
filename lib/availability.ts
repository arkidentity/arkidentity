import { randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { siteUrl } from '@/lib/email';

// A person's weekly busy blocks for one semester (migration 030). Used to
// answer "who could take a Tuesday 8 PM study?" without guessing.

export interface BusyBlock {
  id: string;
  staff_id: string;
  semester: string;
  day_of_week: number;
  starts_at: string | null; // 'HH:MM:SS', null = all day
  ends_at: string | null;
  label: string | null;
}

const COLS = 'id, staff_id, semester, day_of_week, starts_at, ends_at, label';

export async function listBusy(semester: string, staffId?: string): Promise<BusyBlock[]> {
  let q = getSupabaseAdmin()
    .from('iowa_availability')
    .select(COLS)
    .eq('semester', semester)
    .order('day_of_week')
    .order('starts_at');
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as BusyBlock[];
}

const hhmm = (t: string) => (t.length === 5 ? `${t}:00` : t);

export async function addBusy(input: {
  staffId: string;
  semester: string;
  dayOfWeek: number;
  startsAt?: string | null;
  endsAt?: string | null;
  label?: string | null;
}): Promise<BusyBlock> {
  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) throw new Error('Pick a day.');
  const starts = input.startsAt ? hhmm(input.startsAt) : null;
  const ends = input.endsAt ? hhmm(input.endsAt) : null;
  if (starts && ends && ends <= starts) throw new Error('The end time has to be after the start.');
  if (!starts !== !ends) throw new Error('Give both times, or neither for all day.');

  const { data, error } = await getSupabaseAdmin()
    .from('iowa_availability')
    .insert({
      staff_id: input.staffId,
      semester: input.semester,
      day_of_week: input.dayOfWeek,
      starts_at: starts,
      ends_at: ends,
      label: input.label?.trim().slice(0, 80) || null,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return data as BusyBlock;
}

export async function removeBusy(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_availability').delete().eq('id', id);
  if (error) throw error;
}

// Last semester's schedule, brought forward — most of it repeats, and editing
// beats retyping.
export async function copyBusy(staffId: string, from: string, to: string): Promise<number> {
  const blocks = await listBusy(from, staffId);
  if (blocks.length === 0) throw new Error(`Nothing saved for ${from}.`);
  const { error } = await getSupabaseAdmin().from('iowa_availability').insert(
    blocks.map((b) => ({
      staff_id: staffId,
      semester: to,
      day_of_week: b.day_of_week,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      label: b.label,
    }))
  );
  if (error) throw error;
  return blocks.length;
}

// Does this person have something at that day and time? A study is an hour, so
// a block that merely touches the hour counts as a clash.
export function clashAt(
  blocks: BusyBlock[],
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  minutes = 60
): BusyBlock | null {
  const start = hhmm(startTime);
  const end = addMinutes(start, minutes);
  return (
    blocks.find(
      (b) =>
        b.staff_id === staffId &&
        b.day_of_week === dayOfWeek &&
        // All day beats any overlap check.
        (!b.starts_at || !b.ends_at || (b.starts_at < end && b.ends_at > start))
    ) ?? null
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

// ---------------------------------------------------------------------------
// The link each person fills in themselves (no login), renewed every semester.
// ---------------------------------------------------------------------------

export interface ScheduleLink {
  staff_id: string;
  semester: string;
  token: string;
  sent_at: string | null;
  submitted_at: string | null;
}

const LINK_COLS = 'staff_id, semester, token, sent_at, submitted_at';

export const scheduleUrl = (token: string) => `${siteUrl()}/iowa/schedule/${token}`;

// One per person per semester; calling again returns the same link.
export async function ensureScheduleLink(staffId: string, semester: string): Promise<ScheduleLink> {
  const db = getSupabaseAdmin();
  const { data: existing } = await db
    .from('iowa_availability_links')
    .select(LINK_COLS)
    .eq('staff_id', staffId)
    .eq('semester', semester)
    .maybeSingle();
  if (existing) return existing as ScheduleLink;

  const { data, error } = await db
    .from('iowa_availability_links')
    .insert({ staff_id: staffId, semester, token: randomBytes(24).toString('hex') })
    .select(LINK_COLS)
    .single();
  if (error) throw error;
  return data as ScheduleLink;
}

export async function listScheduleLinks(semester: string): Promise<ScheduleLink[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_availability_links')
    .select(LINK_COLS)
    .eq('semester', semester);
  if (error) throw error;
  return (data ?? []) as ScheduleLink[];
}

export async function scheduleByToken(
  token: string
): Promise<{ link: ScheduleLink; name: string; blocks: BusyBlock[] } | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('iowa_availability_links')
    .select(`${LINK_COLS}, iowa_staff(name, active)`)
    .eq('token', token)
    .maybeSingle();
  const row = data as (ScheduleLink & { iowa_staff: { name: string; active: boolean } | null }) | null;
  if (!row?.iowa_staff?.active) return null;
  return {
    link: { staff_id: row.staff_id, semester: row.semester, token: row.token, sent_at: row.sent_at, submitted_at: row.submitted_at },
    name: row.iowa_staff.name,
    blocks: await listBusy(row.semester, row.staff_id),
  };
}

export async function markSubmitted(token: string): Promise<void> {
  await getSupabaseAdmin()
    .from('iowa_availability_links')
    .update({ submitted_at: new Date().toISOString() })
    .eq('token', token);
}

export async function markSent(staffId: string, semester: string): Promise<void> {
  await getSupabaseAdmin()
    .from('iowa_availability_links')
    .update({ sent_at: new Date().toISOString() })
    .eq('staff_id', staffId)
    .eq('semester', semester);
}
