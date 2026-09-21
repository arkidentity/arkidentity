import { randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createStudy,
  getStudyWithMembers,
  formatSlot,
  formatTime,
  type StudyWithMembers,
} from '@/lib/bibleStudies';
import { listStaff, type IowaStaff } from '@/lib/iowaStaff';
import { semesterContext, studyCalendarDates, type SemesterContext } from '@/lib/semesters';
import { DAY_NAMES } from '@/lib/bibleStudyFormat';
import { chicagoToday, formatDate, type Semester } from '@/lib/campusFormat';
import { googleCalendarUrl } from '@/lib/ics';
import { sendNextSemesterSeat, sendPlanLink, siteUrl } from '@/lib/email';
import { syncStudies } from '@/lib/calendarSync';

// Semester turnover (migration 018). Near the end of a semester a group plans
// the next one: continue as one group at a (maybe new) time, or multiply into
// two or three, choosing which members go where. Staff do it in the admin; the
// student leader does it through a private emailed link. Members placed are
// seated right away and emailed; anyone left out gets a re-invite task and can
// still sign up publicly. See docs/IOWA-CAMPUS-TASKS.md → Semester turnover.

const LIVE = ['forming', 'full', 'activated'];
const MAX_GROUPS = 3;

export interface PlanGroup {
  day_of_week: number;
  start_time: string; // 'HH:MM'
  location: string;
  online?: boolean;
  point_staff_id?: string | null; // staff only; the leader link keeps the current one
  leader_name?: string;
  leader_phone?: string;
  leader_email?: string;
  member_ids: string[]; // seat ids from the source study
}

export interface PlanInput {
  semester: string;
  notContinuing?: boolean;
  groups: PlanGroup[];
}

export interface PlanView {
  study: {
    id: string;
    slot: string;
    location: string | null;
    semester: string;
    online: boolean;
    leader_name: string | null;
    leader_phone: string | null;
    leader_email: string | null;
    point_staff_id: string | null;
    planned_at: string | null;
    plan_note: string | null;
  };
  members: { id: string; name: string }[];
  semesters: { name: string; starts_on: string }[]; // upcoming semesters open for planning
}

function toView(s: StudyWithMembers, open: Semester[]): PlanView {
  return {
    study: {
      id: s.id,
      slot: formatSlot(s),
      location: s.location,
      semester: s.semester,
      online: s.online,
      leader_name: s.leader_name,
      leader_phone: s.leader_phone,
      leader_email: s.leader_email,
      point_staff_id: s.point_staff_id,
      planned_at: s.planned_at ?? null,
      plan_note: s.plan_note ?? null,
    },
    members: s.members.filter((m) => m.status === 'active').map((m) => ({ id: m.id, name: m.name })),
    semesters: open.filter((x) => x.name !== s.semester).map((x) => ({ name: x.name, starts_on: x.starts_on })),
  };
}

export async function planViewForStudy(id: string): Promise<PlanView | null> {
  const [s, ctx] = await Promise.all([getStudyWithMembers(id), semesterContext()]);
  return s ? toView(s, ctx.open) : null;
}

export async function planViewForToken(token: string): Promise<PlanView | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const { data } = await getSupabaseAdmin().from('bible_studies').select('id').eq('plan_token', token).maybeSingle();
  return data ? planViewForStudy(data.id as string) : null;
}

export async function studyIdForToken(token: string): Promise<string | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const { data } = await getSupabaseAdmin().from('bible_studies').select('id').eq('plan_token', token).maybeSingle();
  return (data?.id as string) ?? null;
}

// ---------------------------------------------------------------------------
// Submitting a plan
// ---------------------------------------------------------------------------

export async function submitPlan(
  sourceId: string,
  plan: PlanInput,
  by: { staff: IowaStaff | null; viaLeaderLink: boolean }
): Promise<{ created: string[] }> {
  const db = getSupabaseAdmin();
  const [source, ctx] = await Promise.all([getStudyWithMembers(sourceId), semesterContext()]);
  if (!source) throw new Error('That study no longer exists.');
  if (by.viaLeaderLink && source.planned_at) {
    throw new Error('Your group’s plan is already in. Text us if something needs to change.');
  }
  if (!ctx.open.some((x) => x.name === plan.semester) || plan.semester === source.semester) {
    throw new Error('That semester isn’t open for planning.');
  }

  const active = source.members.filter((m) => m.status === 'active');
  const unplaced = new Set(active.map((m) => m.id));
  const created: string[] = [];

  if (!plan.notContinuing) {
    const groups = (plan.groups ?? []).slice(0, MAX_GROUPS);
    if (groups.length === 0) throw new Error('Add at least one group, or choose not continuing.');
    const seen = new Set<string>();
    for (const [i, g] of groups.entries()) {
      const n = groups.length > 1 ? `Group ${i + 1}: ` : '';
      if (!Number.isInteger(g.day_of_week) || g.day_of_week < 0 || g.day_of_week > 6) throw new Error(`${n}pick a day.`);
      if (!/^\d{2}:\d{2}$/.test(g.start_time ?? '')) throw new Error(`${n}pick a time.`);
      if (!g.location?.trim()) throw new Error(`${n}add a location (or "Google Meet").`);
      for (const id of g.member_ids ?? []) {
        if (!unplaced.has(id) && !seen.has(id)) throw new Error('Someone in the list isn’t in this group.');
        if (seen.has(id)) throw new Error('Each person can only go in one group.');
        seen.add(id);
      }
    }

    const staff = await listStaff();
    for (const [i, g] of groups.entries()) {
      // The first group keeps the current student leader unless changed.
      const leader = {
        name: g.leader_name?.trim() || (i === 0 ? source.leader_name ?? '' : ''),
        phone: g.leader_phone?.trim() || (i === 0 ? source.leader_phone ?? '' : ''),
        email: g.leader_email?.trim() || (i === 0 ? source.leader_email ?? '' : ''),
      };
      const pointStaff =
        by.viaLeaderLink || g.point_staff_id === undefined
          ? source.point_staff_id
          : g.point_staff_id && staff.some((s) => s.id === g.point_staff_id)
            ? g.point_staff_id
            : null;
      const study = await createStudy({
        day_of_week: g.day_of_week,
        start_time: g.start_time,
        location: g.location,
        semester: plan.semester,
        capacity: source.capacity,
        online: g.online ?? source.online,
        point_staff_id: pointStaff,
        parent_study_id: source.id,
        leader_name: leader.name,
        leader_phone: leader.phone,
        leader_email: leader.email,
        notes: `Continued from ${formatSlot(source)} (${source.semester}).`,
      });
      created.push(study.id);

      for (const seatId of g.member_ids ?? []) {
        const m = active.find((x) => x.id === seatId)!;
        const { error } = await db.from('bible_study_members').insert({ study_id: study.id, contact_id: m.contact_id });
        if (error && error.code !== '23505') throw error;
        unplaced.delete(seatId);
      }
    }
  }

  await db
    .from('bible_studies')
    .update({
      planned_at: new Date().toISOString(),
      plan_note: plan.notContinuing
        ? 'Not continuing'
        : `${created.length === 1 ? 'Continued' : `Multiplied into ${created.length}`} for ${plan.semester}`,
    })
    .eq('id', source.id);

  // Tell placed members, put the new studies on Google, and make sure nobody
  // left out falls through the cracks. Failures here never undo the plan.
  const leftOut = active.filter((m) => unplaced.has(m.id));
  await Promise.allSettled([
    notifySeated(created, plan.semester),
    syncStudies(created),
    reinviteTasks(source, leftOut, plan.semester),
  ]);
  return { created };
}

async function notifySeated(studyIds: string[], semester: string) {
  for (const id of studyIds) {
    const s = await getStudyWithMembers(id);
    if (!s) continue;
    const dates = await studyCalendarDates(s);
    const event = { id: s.id, dayOfWeek: s.day_of_week, startTime: s.start_time, location: s.location, ...dates };
    for (const m of s.members.filter((x) => x.status === 'active' && x.email)) {
      try {
        await sendNextSemesterSeat({
          to: m.email,
          name: m.name.split(' ')[0],
          semester,
          slot: `${DAY_NAMES[s.day_of_week]}s at ${formatTime(s.start_time)}`,
          location: s.location,
          firstDate: dates.firstDate ? formatDate(dates.firstDate, { weekday: 'long', month: 'long', day: 'numeric' }) : null,
          googleUrl: googleCalendarUrl(event),
          icsUrl: `${siteUrl()}/api/iowa/studies/${s.id}/ics`,
        });
      } catch (e) {
        console.error('[iowa plan] seat email failed', e);
      }
    }
  }
}

async function reinviteTasks(source: StudyWithMembers, leftOut: StudyWithMembers['members'], semester: string) {
  if (leftOut.length === 0) return;
  const db = getSupabaseAdmin();
  const staff = await listStaff();
  const activeId = (id: string | null) => (id && staff.some((s) => s.id === id && s.active) ? id : null);
  for (const m of leftOut) {
    const { data, error } = await db
      .from('iowa_tasks')
      .insert({
        title: `Invite ${m.name} into a ${semester} study`,
        description: `${m.name} · ${m.phone}\nWas in the ${formatSlot(source)} study (${source.semester}) but wasn't placed in a ${semester} group. Find out their new schedule and help them pick a time.`,
        priority: 'normal',
        due_date: chicagoToday(),
        owner_id: activeId(m.met_by_staff_id) ?? activeId(source.point_staff_id),
        contact_id: m.contact_id,
        study_id: source.id,
        auto_kind: 'reinvite',
        auto_key: `reinvite:${m.contact_id}:${semester}`,
      })
      .select('id')
      .single();
    if (error) {
      if (error.code !== '23505') console.error('[iowa plan] reinvite task failed', error);
      continue;
    }
    await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: null, action: 'auto-created this task' });
  }
}

// ---------------------------------------------------------------------------
// Leader links + the turnover jobs (morning cron)
// ---------------------------------------------------------------------------

export async function ensurePlanToken(studyId: string): Promise<string> {
  const db = getSupabaseAdmin();
  const { data } = await db.from('bible_studies').select('plan_token').eq('id', studyId).maybeSingle();
  if (data?.plan_token) return data.plan_token as string;
  const token = randomBytes(24).toString('hex');
  const { error } = await db.from('bible_studies').update({ plan_token: token }).eq('id', studyId);
  if (error) throw error;
  return token;
}

export const planUrl = (token: string) => `${siteUrl()}/iowa/plan/${token}`;

export async function sendPlanLinkFor(s: StudyWithMembers, semester: string): Promise<boolean> {
  if (!s.leader_email) return false;
  const token = await ensurePlanToken(s.id);
  await sendPlanLink({
    to: s.leader_email,
    name: (s.leader_name ?? '').split(' ')[0] || 'Hey',
    slot: formatSlot(s),
    semester,
    url: planUrl(token),
    members: s.members.filter((m) => m.status === 'active').map((m) => m.name.split(' ')[0]),
  });
  await getSupabaseAdmin().from('bible_studies').update({ plan_sent_at: new Date().toISOString() }).eq('id', s.id);
  return true;
}

// Current-semester live studies that haven't planned the next one yet.
export function unplannedStudies(studies: StudyWithMembers[], ctx: SemesterContext): StudyWithMembers[] {
  if (!ctx.current || ctx.open.length === 0) return [];
  return studies.filter(
    (s) => s.semester === ctx.current!.name && LIVE.includes(s.status) && s.activeCount > 0 && !s.planned_at
  );
}

// Once next semester's signup opens: email each unplanned study's student
// leader their plan link, once.
export async function sendDuePlanLinks(ctx: SemesterContext, studies: StudyWithMembers[]): Promise<number> {
  const next = ctx.next;
  if (!next) return 0;
  let sent = 0;
  for (const s of unplannedStudies(studies, ctx).filter((x) => x.leader_email && !x.plan_sent_at)) {
    try {
      if (await sendPlanLinkFor(s, next.name)) sent++;
    } catch (e) {
      console.error('[iowa plan] link email failed', e);
    }
  }
  return sent;
}

// Studies whose semester is over (past the last day of finals) → ended. They
// come off Google via the normal sync, and out of every active list.
export async function endPastSemesterStudies(ctx: SemesterContext): Promise<number> {
  const today = chicagoToday();
  const over = ctx.semesters.filter((x) => x.ends_on < today).map((x) => x.name);
  if (over.length === 0) return 0;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('bible_studies')
    .update({ status: 'ended' })
    .in('semester', over)
    .neq('status', 'ended')
    .select('id');
  if (error) throw error;
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length) await syncStudies(ids);
  return ids.length;
}

