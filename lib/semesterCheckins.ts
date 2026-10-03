import { randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { saveFreeSlots, formatSlot, type StudyWithMembers } from '@/lib/bibleStudies';
import { addDays, chicagoToday } from '@/lib/campusFormat';
import { cleanFreeSlots } from '@/lib/bibleStudyFormat';
import { dismissedAutoKeys } from '@/lib/campusTasks';
import { sendSemesterCheckin, siteUrl } from '@/lib/email';
import type { SemesterContext } from '@/lib/semesters';

// Semester check-in (migration 038). When next semester's signup opens, each
// active student in a current group gets a personal link: in / not / not sure,
// plus the times they're free next semester (saved as free_slots for it). The
// group planner reads the answers; non-answerers get one reminder a week later.
// See docs/IOWA-CAMPUS-TASKS.md → "Semester check-in".

const LIVE = ['forming', 'full', 'activated'];
const REMIND_AFTER_DAYS = 7;

export type CheckinResponse = 'yes' | 'no' | 'unsure';

export interface Checkin {
  id: string;
  token: string;
  contact_id: string;
  semester: string;
  response: CheckinResponse | null;
  note: string | null;
  sent_at: string | null;
  reminded_at: string | null;
  answered_at: string | null;
}

export const checkinUrl = (token: string) => `${siteUrl()}/iowa/checkin/${token}`;
const newToken = () => randomBytes(24).toString('hex');

// Make (or fetch) a student's check-in for a semester.
export async function ensureCheckin(contactId: string, semester: string): Promise<Checkin> {
  const db = getSupabaseAdmin();
  const { data: found } = await db.from('iowa_semester_checkins').select('*').eq('contact_id', contactId).eq('semester', semester).maybeSingle();
  if (found) return found as Checkin;
  const { data, error } = await db
    .from('iowa_semester_checkins')
    .insert({ contact_id: contactId, semester, token: newToken() })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') return ensureCheckin(contactId, semester);
    throw error;
  }
  return data as Checkin;
}

export async function listCheckins(semester: string): Promise<Checkin[]> {
  const { data, error } = await getSupabaseAdmin().from('iowa_semester_checkins').select('*').eq('semester', semester);
  if (error) {
    console.error('[iowa checkin] read failed (migration 038 run?)', error);
    return [];
  }
  return (data ?? []) as Checkin[];
}

// The public page.
export async function checkinByToken(token: string): Promise<(Checkin & { name: string; free_slots: string[] }) | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const db = getSupabaseAdmin();
  const { data } = await db.from('iowa_semester_checkins').select('*').eq('token', token).maybeSingle();
  if (!data) return null;
  const c = data as Checkin;
  const [{ data: person }, { data: campus }] = await Promise.all([
    db.from('contacts').select('name').eq('id', c.contact_id).maybeSingle(),
    db.from('campus_students').select('free_slots, free_slots_semester').eq('contact_id', c.contact_id).maybeSingle(),
  ]);
  return {
    ...c,
    name: (person?.name as string) ?? '',
    free_slots: campus?.free_slots_semester === c.semester ? ((campus?.free_slots as string[]) ?? []) : [],
  };
}

export async function answerCheckin(token: string, input: { response?: string; slots?: unknown; note?: string }): Promise<void> {
  const c = await checkinByToken(token);
  if (!c) throw new Error('That link doesn’t work anymore.');
  const response = input.response as CheckinResponse;
  if (!['yes', 'no', 'unsure'].includes(response)) throw new Error('Pick one: in, not this time, or not sure.');
  const slots = cleanFreeSlots(input.slots);
  if (response !== 'no' && slots.length === 0) throw new Error('Tap at least one time you’re free.');
  const { error } = await getSupabaseAdmin()
    .from('iowa_semester_checkins')
    .update({ response, note: input.note?.trim().slice(0, 500) || null, answered_at: new Date().toISOString() })
    .eq('id', c.id);
  if (error) throw error;
  if (slots.length) await saveFreeSlots(c.contact_id, slots, c.semester);
}

// Who gets one: active students holding a seat in a live current-semester group.
function returningStudents(studies: StudyWithMembers[], ctx: SemesterContext) {
  const out = new Map<string, { contact_id: string; name: string; email: string; group: string; point_staff_id: string | null }>();
  for (const s of studies) {
    if (s.semester !== ctx.current?.name || !LIVE.includes(s.status)) continue;
    for (const m of s.members) {
      if (m.status !== 'active' || m.student_status !== 'active' || out.has(m.contact_id)) continue;
      out.set(m.contact_id, { contact_id: m.contact_id, name: m.name, email: m.email, group: formatSlot(s), point_staff_id: s.point_staff_id });
    }
  }
  return [...out.values()];
}

// Morning run: from next semester's signup_opens, make + email check-ins (once),
// remind non-answerers once a week later, and give each staff member on point a
// "Text check-in links" task. Never fatal to the rest of the run.
export async function runSemesterCheckins(ctx: SemesterContext, studies: StudyWithMembers[], today = chicagoToday()): Promise<Record<string, number>> {
  const next = ctx.next;
  const out = { checkinsSent: 0, checkinReminders: 0, checkinTasks: 0 };
  if (!next || today < next.signup_opens || today >= next.starts_on) return out;
  const db = getSupabaseAdmin();
  const people = returningStudents(studies, ctx);

  for (const p of people) {
    try {
      const c = await ensureCheckin(p.contact_id, next.name);
      const first = p.name.split(' ')[0];
      if (!c.sent_at && p.email) {
        await sendSemesterCheckin({ to: p.email, name: first, semester: next.name, group: p.group, url: checkinUrl(c.token) });
        await db.from('iowa_semester_checkins').update({ sent_at: new Date().toISOString() }).eq('id', c.id);
        out.checkinsSent++;
      } else if (
        c.sent_at && !c.response && !c.reminded_at && p.email &&
        today >= addDays(next.signup_opens, REMIND_AFTER_DAYS)
      ) {
        await sendSemesterCheckin({ to: p.email, name: first, semester: next.name, group: p.group, url: checkinUrl(c.token), reminder: true });
        await db.from('iowa_semester_checkins').update({ reminded_at: new Date().toISOString() }).eq('id', c.id);
        out.checkinReminders++;
      }
    } catch (e) {
      console.error('[iowa checkin] failed for', p.contact_id, e);
    }
  }

  // One "text the links" task per staff member on point, once per semester.
  const owners = [...new Set(people.map((p) => p.point_staff_id).filter((x): x is string => !!x))];
  const keys = owners.map((o) => `checkin-links:${o}:${next.name}`);
  const dismissed = await dismissedAutoKeys(keys);
  for (const owner of owners) {
    const key = `checkin-links:${owner}:${next.name}`;
    if (dismissed.has(key)) continue;
    const n = people.filter((p) => p.point_staff_id === owner).length;
    const { data, error } = await db
      .from('iowa_tasks')
      .insert({
        title: `Text ${next.name} check-in links`,
        description: `${next.name} signup is open. ${n} student${n === 1 ? '' : 's'} in your groups got an email asking if they're in and when they're free. A text gets answered faster: open this task for a Text button per person (the message and their link are filled in). Aim to have groups planned the Friday before finals.`,
        priority: 'normal',
        due_date: today,
        owner_id: owner,
        auto_kind: 'checkin_links',
        auto_key: key,
      })
      .select('id')
      .single();
    if (error) {
      if (error.code !== '23505') console.error('[iowa checkin] task failed', error);
      continue;
    }
    await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: null, action: 'auto-created for the semester check-in' });
    out.checkinTasks++;
  }
  return out;
}

// For the "Text check-in links" task and the Studies page summary: each
// returning student's check-in, optionally just one staff member's groups.
export async function checkinRoster(
  ctx: SemesterContext,
  studies: StudyWithMembers[],
  ownerId?: string | null
): Promise<{ semester: string; people: { contact_id: string; name: string; phone: string | null; group: string; url: string; response: CheckinResponse | null }[] }> {
  const next = ctx.next;
  if (!next) return { semester: '', people: [] };
  const phones = new Map<string, string | null>();
  for (const s of studies) for (const m of s.members) phones.set(m.contact_id, m.phone || null);
  const list = returningStudents(studies, ctx).filter((p) => !ownerId || p.point_staff_id === ownerId);
  const people = [];
  for (const p of list) {
    const c = await ensureCheckin(p.contact_id, next.name);
    people.push({ contact_id: p.contact_id, name: p.name, phone: phones.get(p.contact_id) ?? null, group: p.group, url: checkinUrl(c.token), response: c.response });
  }
  return { semester: next.name, people };
}
