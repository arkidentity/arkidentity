import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTaskAssignedNow as notifyTaskAssignedNow } from '@/lib/taskNotify';
import { getStudyWithMembers, listStudies, type StudyMember, type StudyWithMembers } from '@/lib/bibleStudies';
import { semesterContext } from '@/lib/semesters';
import { endPastSemesterStudies, sendDuePlanLinks, unplannedStudies } from '@/lib/semesterPlan';
import { generateAllChecklists } from '@/lib/eventChecklists';
import { listStaff, type IowaStaff } from '@/lib/iowaStaff';
import { DAY_NAMES, formatSlot, formatTime } from '@/lib/bibleStudyFormat';
import {
  addDays,
  chicagoToday,
  compareTasks,
  dayOfWeek,
  eventDatesInRange,
  formatDate,
  isOverdue,
  nextMeetingOnOrAfter,
  studyMeetsOn,
  type SchoolPeriod,
  type Semester,
} from '@/lib/campusFormat';
import { listEvents, listTasks, type CampusTask } from '@/lib/campusTasks';
import { schedulesFor, scheduleHtml, taskLine, type ScheduleLine } from '@/lib/taskDigest';
import { escapeEmailHtml as esc, sendEmailBatch, siteUrl } from '@/lib/email';

// Follow-up automation for ARK Iowa (Phase 2, migration 015). Travis's rhythm:
//   1. Welcome text right at signup (whoever met them).
//   2. Weekly confirm two mornings before each study, for as long as staff is
//      on point and there's no student leader yet — email + a task per study.
//   3. "Did they make it?" the morning after a student's first study.
//   4. Stale students: dropped-unresponsive 30+ days, met-but-never-placed 14+
//      days, dormant, and schedule-changed re-invites next semester.
// Every task carries an auto_key, so running twice never doubles anything.
// See docs/IOWA-CAMPUS-TASKS.md.

const TZ = 'America/Chicago';
const LIVE = ['forming', 'full', 'activated'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chicagoDateTime(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

// The first meeting a student could make: the study's next real meeting
// on/after the day they joined (the next day, if they joined after it started
// that day) — inside its semester and past any break weeks.
export function firstMeetingDate(
  joinedAt: string,
  study: { day_of_week: number; start_time: string; semester?: string; online?: boolean | null },
  periods: SchoolPeriod[] = [],
  semesters: Semester[] = []
): string {
  const { date, time } = chicagoDateTime(joinedAt);
  const from = dayOfWeek(date) === study.day_of_week && time >= study.start_time.slice(0, 5) ? addDays(date, 1) : date;
  return nextMeetingOnOrAfter(study, from, periods, semesters) ?? from;
}

function smsHref(phone: string, body: string): string {
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  // `?&body=` works on both iOS and Android.
  return `sms:${e164}?&body=${encodeURIComponent(body)}`;
}

const first = (name: string) => name.trim().split(/\s+/)[0];

function metLabel(m: { met_by_staff_id: string | null; met_by_other: string | null }, staff: IowaStaff[]): string | null {
  if (m.met_by_staff_id) {
    const s = staff.find((x) => x.id === m.met_by_staff_id);
    return s ? `met ${first(s.name)}` : null;
  }
  return { friend: 'a friend invited them', self: 'found it on their own', other: null }[m.met_by_other ?? 'other'] ?? null;
}

async function typeId(name: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from('iowa_item_types')
    .select('id')
    .eq('kind', 'task')
    .ilike('name', name)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

interface AutoTask {
  key: string;
  kind: 'welcome' | 'confirm' | 'missed' | 'reconnect' | 'place' | 'reinvite';
  title: string;
  description: string;
  owner_id: string | null;
  due_date: string | null;
  study_id?: string | null;
  contact_id?: string | null;
  typeName: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
}

// Insert once per auto_key. Returns the new task id, or null if it already existed.
async function createAutoTask(t: AutoTask): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_tasks')
    .insert({
      title: t.title,
      description: t.description,
      type_id: await typeId(t.typeName),
      priority: t.priority ?? 'high',
      due_date: t.due_date,
      owner_id: t.owner_id,
      study_id: t.study_id ?? null,
      contact_id: t.contact_id ?? null,
      auto_kind: t.kind,
      auto_key: t.key,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') return null; // already made
    throw error;
  }
  await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: null, action: 'auto-created this task' });
  return data.id as string;
}

async function closeTasks(ids: string[], why: string) {
  if (ids.length === 0) return;
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  await db.from('iowa_tasks').update({ status: 'done', completed_at: now, updated_at: now }).in('id', ids);
  await db.from('iowa_task_activity').insert(ids.map((task_id) => ({ task_id, staff_id: null, action: why })));
}

// Someone who drifted from a Bible study may still say yes to Taco Night, an
// outing, or a call from another student. Every reconnect-style task carries
// this menu: the next few campus events, and a prayer call from a student
// leader (theirs if their old study had one).
async function reconnectIdeas(today: string): Promise<(leader?: { name: string; phone: string | null } | null) => string> {
  const events = await listEvents(today, addDays(today, 21)).catch(() => []);
  const upcoming = events
    .flatMap((e) => eventDatesInRange(e, today, addDays(today, 21)).map((date) => ({ date, e })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
    .map(({ date, e }) => `  – ${e.title}, ${formatDate(date)}${e.start_time ? ` at ${formatTime(e.start_time)}` : ''}`);
  return (leader) =>
    [
      'Ways to reconnect (not just another Bible study invite):',
      upcoming.length ? '• Invite them to something low-key:' : '• Invite them to the next Taco Night or outing',
      ...upcoming,
      `• A prayer call from a student: ${
        leader ? `ask ${leader.name}${leader.phone ? ` (${leader.phone})` : ''}` : 'ask a student leader'
      } to call and say "Just checking in. You signed up for a Bible study; how can I pray for you?"`,
      '• A simple text: no ask, just "thinking of you."',
    ].join('\n');
}

// Owner: whoever met them (if still active) → staff on point → unowned.
function ownerFor(m: { met_by_staff_id: string | null }, study: { point_staff_id: string | null } | null, staff: IowaStaff[]): string | null {
  const active = (id: string | null) => (id && staff.some((s) => s.id === id && s.active) ? id : null);
  return active(m.met_by_staff_id) ?? active(study?.point_staff_id ?? null);
}

// ---------------------------------------------------------------------------
// 1. Welcome — at signup
// ---------------------------------------------------------------------------

// Call after a student is seated (join, start, or admin add). Only their FIRST
// seat ever gets a welcome; a returning student moving studies doesn't.
// Returns the new task id (so the caller can email the owner), or null.
export async function onStudentSeated(memberId: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data: seat } = await db.from('bible_study_members').select('id, study_id, contact_id').eq('id', memberId).maybeSingle();
  if (!seat) return null;
  const { count } = await db
    .from('bible_study_members')
    .select('id', { count: 'exact', head: true })
    .eq('contact_id', seat.contact_id);
  if ((count ?? 0) > 1) return null;

  const [study, staff, ctx] = await Promise.all([getStudyWithMembers(seat.study_id), listStaff(), semesterContext()]);
  const m = study?.members.find((x) => x.id === memberId);
  if (!study || !m) return null;

  const owner = ownerFor(m, study, staff);
  const ownerName = staff.find((s) => s.id === owner)?.name;
  const meet = firstMeetingDate(m.joined_at, study, ctx.periods, ctx.semesters);
  const where = study.location ? ` at ${study.location}` : '';
  const text = `Hey ${first(m.name)}, it's ${ownerName ? first(ownerName) : '___'} from ARK Iowa. So glad you signed up! Looking forward to seeing you at your first Bible study ${DAY_NAMES[study.day_of_week]} at ${formatTime(study.start_time)}${where}.`;

  return createAutoTask({
    key: `welcome:${m.id}`,
    kind: 'welcome',
    title: `Welcome text to ${m.name}`,
    description: [
      `${m.name} · ${m.phone}${m.year ? ` · ${m.year}` : ''}`,
      metLabel(m, staff) ? `How they came: ${metLabel(m, staff)}` : null,
      `Study: ${formatSlot(study)}${where}${study.location ? '' : ' (location not set yet)'} · first one ${formatDate(meet)}`,
      '',
      `Suggested text:\n${text}`,
    ].filter((x) => x !== null).join('\n'),
    owner_id: owner,
    due_date: chicagoToday(),
    study_id: study.id,
    contact_id: m.contact_id,
    typeName: 'Follow-up',
    priority: 'urgent',
  });
}

// A student dropped: their open welcome / missed-first-study tasks are moot.
export async function onStudentDropped(contactId: string): Promise<void> {
  const { data } = await getSupabaseAdmin()
    .from('iowa_tasks')
    .select('id')
    .eq('contact_id', contactId)
    .in('auto_kind', ['welcome', 'missed'])
    .neq('status', 'done');
  await closeTasks((data ?? []).map((r) => r.id as string), 'auto-closed: student dropped');
}

// ---------------------------------------------------------------------------
// 2–4. The morning run
// ---------------------------------------------------------------------------

interface ConfirmItem {
  study: StudyWithMembers;
  meetDate: string;
  members: (StudyMember & { isNew: boolean })[];
}
interface ShowItem {
  study: StudyWithMembers;
  member: StudyMember;
}

export async function runMorning(): Promise<Record<string, number | string>> {
  const db = getSupabaseAdmin();
  const today = chicagoToday();
  const dow = dayOfWeek(today);
  // Monday–Saturday only. Saturday covers Monday AND Tuesday studies so the
  // skipped Sunday never leaves a study unconfirmed.
  if (dow === 0) return { skipped: 'Sunday' };
  const targets = dow === 6 ? [addDays(today, 2), addDays(today, 3)] : [addDays(today, 2)];
  const ctx = await semesterContext(today);
  const { periods, semesters } = ctx;
  const semester = ctx.current?.name ?? '';
  const [studies, staff] = await Promise.all([listStudies(ctx.active), listStaff()]);
  const activeStaff = staff.filter((s) => s.active);
  const summary: Record<string, number | string> = {};
  const bump = (k: string) => (summary[k] = ((summary[k] as number) ?? 0) + 1);

  // Confirm tasks whose study already met: close them so missed weeks don't pile up.
  const { data: openConfirms } = await db
    .from('iowa_tasks')
    .select('id, auto_key')
    .eq('auto_kind', 'confirm')
    .neq('status', 'done');
  const stale = (openConfirms ?? []).filter((t) => (t.auto_key as string).split(':')[2] < today).map((t) => t.id as string);
  await closeTasks(stale, 'auto-closed: the study already met');
  summary.confirmsClosed = stale.length;

  // --- 2. Weekly confirm, two mornings out -------------------------------
  const confirmByStaff = new Map<string, ConfirmItem[]>();
  for (const target of targets) {
    for (const s of studies) {
      if (!LIVE.includes(s.status)) continue;
      // Meets that day? (right weekday, inside its semester, not a break week)
      if (!studyMeetsOn(s, target, periods, semesters)) continue;
      if (!s.point_staff_id || s.leader_name?.trim() || !s.location) continue; // student leader has it
      if (!activeStaff.some((p) => p.id === s.point_staff_id)) continue;
      const members = s.members
        .filter((m) => m.status === 'active')
        .map((m) => ({ ...m, isNew: firstMeetingDate(m.joined_at, s, periods, semesters) === target }));
      if (members.length === 0) continue;

      // Due the day before — or Saturday, when the day before is the Sunday off.
      let due = addDays(target, -1);
      if (dayOfWeek(due) === 0) due = addDays(due, -1);
      if (
        await createAutoTask({
          key: `confirm:${s.id}:${target}`,
          kind: 'confirm',
          title: `Confirm ${formatSlot(s)} study (${formatDate(target)})`,
          description: [
            `Reach out before ${formatDate(target)} to confirm time and place (${s.location}).`,
            '',
            ...members.map((m) => `• ${m.name}${m.isNew ? ' (NEW, first study)' : ''} · ${m.phone}`),
          ].join('\n'),
          owner_id: s.point_staff_id,
          due_date: due,
          study_id: s.id,
          typeName: 'Bible study',
        })
      ) bump('confirmTasks');

      const list = confirmByStaff.get(s.point_staff_id) ?? [];
      list.push({ study: s, meetDate: target, members });
      confirmByStaff.set(s.point_staff_id, list);
    }
  }

  // --- 3. Did they make it to their first study? --------------------------
  // Any first study in the last 3 days not asked yet — so Saturday's and
  // Sunday's first-timers get asked on Monday.
  const showByStaff = new Map<string, ShowItem[]>();
  for (const s of studies) {
    if (!LIVE.includes(s.status)) continue;
    for (const m of s.members) {
      if (m.status !== 'active' || m.first_showed !== null || m.first_show_asked_on) continue;
      const firstDate = firstMeetingDate(m.joined_at, s, periods, semesters);
      if (firstDate >= today || firstDate < addDays(today, -3)) continue;
      const ask = [s.point_staff_id, m.met_by_staff_id].find((id) => id && activeStaff.some((p) => p.id === id));
      if (!ask) continue;
      await db.from('bible_study_members').update({ first_show_asked_on: today }).eq('id', m.id);
      const list = showByStaff.get(ask) ?? [];
      list.push({ study: s, member: m });
      showByStaff.set(ask, list);
      bump('showAsked');
    }
  }

  // --- Semester turnover -----------------------------------------------------
  // Past-semester studies end; once next semester opens, leaders get their
  // plan link (once), and staff see which of their groups haven't planned.
  summary.studiesEnded = await endPastSemesterStudies(ctx);
  summary.planLinksSent = await sendDuePlanLinks(ctx, studies);
  const unplannedByStaff = new Map<string, StudyWithMembers[]>();
  for (const s of unplannedStudies(studies, ctx)) {
    if (s.point_staff_id) unplannedByStaff.set(s.point_staff_id, [...(unplannedByStaff.get(s.point_staff_id) ?? []), s]);
  }

  // Repeating events: make the next occurrence's checklist tasks as they come due.
  summary.checklistTasks = await generateAllChecklists();

  // --- 4. Stale students ---------------------------------------------------
  // Re-invites aim at the semester students can sign up for next: the open
  // upcoming one (from ~Nov 30 for spring), else the current one.
  Object.assign(summary, await staleStudents(staff, today, semester, ctx.next?.name ?? semester));

  // --- The email: one per person, only if there's something in it ----------
  // Monday is the week view (whole week, studies + events, every open task).
  // Other days: events in the next two days + what's due today or overdue —
  // studies aren't listed there, the confirm section already covers them, and
  // listing them would send an email nearly every day for no reason.
  const monday = dow === 1;
  const ids = activeStaff.map((p) => p.id);
  const schedules = await schedulesFor(today, addDays(today, monday ? 6 : 2), ids, { studies: monday });
  // Read after the confirm tasks above were made.
  const openTasks = (await listTasks()).filter((t) => t.status !== 'done');

  const emails = activeStaff
    .map((p) => {
      const mine = openTasks
        .filter((t) => t.owner_id === p.id || t.helper_ids.includes(p.id))
        .filter((t) => t.auto_kind !== 'confirm') // shown in the confirm section already
        .filter((t) => monday || (t.due_date !== null && t.due_date <= today))
        .sort((a, b) => compareTasks(a, b, today));
      return morningEmail({
        p,
        today,
        monday,
        confirms: confirmByStaff.get(p.id) ?? [],
        shows: showByStaff.get(p.id) ?? [],
        tasks: mine,
        schedule: schedules.get(p.id) ?? [],
        unplanned: unplannedByStaff.get(p.id) ?? [],
        nextSemester: ctx.next?.name ?? null,
      });
    })
    .filter((e): e is NonNullable<typeof e> => !!e);
  const { sent, failed } = await sendEmailBatch(emails);
  return { ...summary, emailsSent: sent, emailsFailed: failed };
}

async function staleStudents(
  staff: IowaStaff[],
  today: string,
  semester: string,
  reinviteSemester: string
): Promise<Record<string, number>> {
  const db = getSupabaseAdmin();
  const counts = { reconnect: 0, place: 0, reinvite: 0 };

  const [{ data: campus }, { data: seats }] = await Promise.all([
    db.from('campus_students').select('contact_id, status, met_by_staff_id, created_at, contacts(name, phone)'),
    db.from('bible_study_members').select('contact_id, status, drop_reason, drop_note, left_at, bible_studies(semester, leader_name, leader_phone)'),
  ]);
  const ideas = await reconnectIdeas(today);
  type Seat = {
    contact_id: string;
    status: string;
    drop_reason: string | null;
    drop_note: string | null;
    left_at: string | null;
    bible_studies: { semester: string; leader_name: string | null; leader_phone: string | null } | null;
  };
  const seatsBy = new Map<string, Seat[]>();
  for (const s of (seats ?? []) as unknown as Seat[]) {
    seatsBy.set(s.contact_id, [...(seatsBy.get(s.contact_id) ?? []), s]);
  }

  for (const c of (campus ?? []) as unknown as {
    contact_id: string;
    status: string;
    met_by_staff_id: string | null;
    created_at: string;
    contacts: { name: string; phone: string | null } | null;
  }[]) {
    if (!c.contacts) continue;
    const mine = seatsBy.get(c.contact_id) ?? [];
    if (mine.some((s) => s.status === 'active')) continue; // they're in a study
    const owner = ownerFor(c, null, staff);
    const who = `${c.contacts.name}${c.contacts.phone ? ` · ${c.contacts.phone}` : ''}`;
    const met = metLabel({ met_by_staff_id: c.met_by_staff_id, met_by_other: null }, staff);
    const base = { owner_id: owner, due_date: addDays(today, 3), contact_id: c.contact_id, typeName: 'Follow-up', priority: 'normal' as const };

    if (c.status === 'dormant') {
      if (await createAutoTask({ ...base, key: `reconnect:${c.contact_id}:${semester}`, kind: 'reconnect', title: `Reconnect with ${c.contacts.name}`, description: [who, met, 'Marked dormant on the Students page.', '', ideas(null)].filter((x) => x !== null).join('\n') })) counts.reconnect++;
      continue;
    }
    if (c.status !== 'active') continue; // graduated, transferred, left school

    const dropped = mine.filter((s) => s.status === 'dropped').sort((a, b) => (b.left_at ?? '').localeCompare(a.left_at ?? ''));
    const last = dropped[0];
    const leader = last?.bible_studies?.leader_name ? { name: last.bible_studies.leader_name, phone: last.bible_studies.leader_phone } : null;

    if (!last) {
      // Met, never placed.
      if (chicagoDateTime(c.created_at).date <= addDays(today, -14)) {
        if (await createAutoTask({ ...base, key: `place:${c.contact_id}:${semester}`, kind: 'place', title: `Help ${c.contacts.name} find a Bible study`, description: [who, met, 'Met 2+ weeks ago and still not in a study.', '', ideas(null)].filter((x) => x !== null).join('\n') })) counts.place++;
      }
      continue;
    }

    const why = last.drop_note ? ` (${last.drop_note})` : '';
    if (last.drop_reason === 'schedule_changed' && last.bible_studies?.semester !== reinviteSemester) {
      if (await createAutoTask({ ...base, key: `reinvite:${c.contact_id}:${reinviteSemester}`, kind: 'reinvite', title: `Re-invite ${c.contacts.name} for ${reinviteSemester}`, description: [who, met, `Dropped in ${last.bible_studies?.semester} because their schedule changed${why}. ${reinviteSemester} signup is open, so invite them to a study that fits their new schedule.`, '', ideas(leader)].filter((x) => x !== null).join('\n') })) counts.reinvite++;
    } else if (last.drop_reason === 'unresponsive' && last.left_at && chicagoDateTime(last.left_at).date <= addDays(today, -30)) {
      if (await createAutoTask({ ...base, key: `reconnect:${c.contact_id}:${semester}`, kind: 'reconnect', title: `Reconnect with ${c.contacts.name}`, description: [who, met, `Dropped for being unresponsive${why} 30+ days ago. Worth one more try, maybe a different kind of touch.`, '', ideas(leader)].filter((x) => x !== null).join('\n') })) counts.reconnect++;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// The morning email
// ---------------------------------------------------------------------------

function morningEmail(o: {
  p: IowaStaff;
  today: string;
  monday: boolean;
  confirms: ConfirmItem[];
  shows: ShowItem[];
  tasks: CampusTask[];
  schedule: ScheduleLine[];
  unplanned: StudyWithMembers[];
  nextSemester: string | null;
}) {
  const { p, today, monday, confirms, shows, tasks, schedule, unplanned, nextSemester } = o;
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  // Nothing in any section → no email that day.
  // The unplanned-groups nudge rides along; it never sends an email on its own
  // except on Mondays, so it doesn't nag daily.
  const nudge = unplanned.length > 0 && nextSemester && (monday || confirms.length || shows.length || tasks.length || schedule.length);
  if (!confirms.length && !shows.length && !tasks.length && !schedule.length && !nudge) return null;
  const me = first(p.name);
  const section = (title: string, sub?: string) =>
    `<h2 style="color:#143348; font-size:17px; margin:24px 0 4px;">${title}</h2>${
      sub ? `<p style="margin:0 0 10px; color:#8a8378;">${sub}</p>` : ''
    }`;
  const parts: string[] = [
    `<h1 style="color:#143348; font-size:22px;">${monday ? 'Your week' : 'Morning'}, ${esc(me)}</h1>`,
  ];

  if (confirms.length) {
    const days = [...new Set(confirms.map((c) => DAY_NAMES[c.study.day_of_week]))];
    parts.push(section(`Confirm your ${days.join(' + ')} studies`, 'Reach out the day before. Tap a name to open a text.'));
    for (const c of confirms) {
      const s = c.study;
      const day = DAY_NAMES[s.day_of_week];
      const rows = c.members
        .map((m) => {
          const body = `Hey ${first(m.name)}, it's ${me} from ARK Iowa! ${m.isNew ? 'Excited for your first Bible study' : 'See you'} ${day} at ${formatTime(s.start_time)} at ${s.location}. Still good?`;
          return `<li style="margin:0 0 6px;"><a href="${smsHref(m.phone, body)}" style="color:#143348; font-weight:600;">${esc(m.name)}</a>${
            m.isNew ? ' <span style="background:#fef3c7; color:#92400e; font-size:12px; font-weight:700; padding:1px 6px; border-radius:9px;">NEW</span>' : ''
          } <span style="color:#8a8378;">· ${esc(m.phone)}</span></li>`;
        })
        .join('');
      parts.push(
        `<p style="margin:14px 0 4px; font-weight:600;">${esc(formatSlot(s))} · ${esc(s.location ?? '')} <span style="color:#8a8378; font-weight:400;">(${formatDate(c.meetDate)})</span></p><ul style="padding-left:18px; margin:0;">${rows}</ul>`
      );
    }
  }

  if (shows.length) {
    parts.push(section('Did they make it?', 'Their first Bible study was in the last few days.'));
    for (const { study, member } of shows) {
      const link = (v: 'yes' | 'no') => `${siteUrl()}/iowa/admin/showed/${member.id}?v=${v}`;
      parts.push(
        `<p style="margin:0 0 10px;"><strong>${esc(member.name)}</strong> <span style="color:#8a8378;">· ${esc(formatSlot(study))}</span><br/>
          <a href="${link('yes')}" style="display:inline-block; margin-top:6px; background:#15803d; color:#fff; text-decoration:none; padding:6px 14px; border-radius:6px; font-weight:600;">Yes, they came</a>
          <a href="${link('no')}" style="display:inline-block; margin:6px 0 0 6px; background:#b91c1c; color:#fff; text-decoration:none; padding:6px 14px; border-radius:6px; font-weight:600;">No-show</a></p>`
      );
    }
  }

  if (tasks.length) {
    parts.push(section(monday ? `Your open tasks (${tasks.length})` : 'Tasks due today', overdue ? `<span style="color:#b91c1c;">${overdue} overdue</span>` : undefined));
    parts.push(`<ul style="padding-left:18px; margin:0;">${tasks.map((t) => taskLine(t, today)).join('')}</ul>`);
  }

  if (nudge) {
    parts.push(
      section(
        `${unplanned.length} group${unplanned.length === 1 ? '' : 's'} haven’t planned ${nextSemester}`,
        'Plan it with them in the admin, or nudge the student leader to use their link.'
      )
    );
    parts.push(
      `<ul style="padding-left:18px; margin:0;">${unplanned
        .map((s) => `<li style="margin:0 0 6px;">${esc(formatSlot(s))}${s.leader_name ? ` · leader ${esc(s.leader_name)}${s.plan_sent_at ? ' (link sent)' : ''}` : ' · no student leader'}</li>`)
        .join('')}</ul><p style="margin:6px 0 0;"><a href="${siteUrl()}/iowa/admin/studies" style="color:#143348;">Open studies →</a></p>`
    );
  }

  if (schedule.length) {
    parts.push(section(monday ? 'This week' : 'Coming up'));
    parts.push(scheduleHtml(schedule));
  }

  parts.push(`<p style="margin-top:24px;"><a href="${siteUrl()}/iowa/admin" style="color:#143348;">Open the dashboard →</a></p>`);
  const subject = [
    monday ? 'Your week' : null,
    confirms.length ? `Confirm ${confirms.length} stud${confirms.length === 1 ? 'y' : 'ies'}` : null,
    shows.length ? `${shows.length} first-timer${shows.length === 1 ? '' : 's'} to check` : null,
    !monday && tasks.length ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} due` : null,
    overdue ? `${overdue} overdue` : null,
  ].filter(Boolean).join(' · ') || 'Coming up';
  return { to: p.email, subject, html: parts.join('\n') };
}

// ---------------------------------------------------------------------------
// "Did they make it?" answers (from the email links)
// ---------------------------------------------------------------------------

export async function recordFirstShow(
  memberId: string,
  showed: boolean,
  by: IowaStaff | null
): Promise<{ name: string; slot: string } | null> {
  const db = getSupabaseAdmin();
  const { data: seat } = await db.from('bible_study_members').select('study_id').eq('id', memberId).maybeSingle();
  if (!seat) return null;
  const study = await getStudyWithMembers(seat.study_id);
  const m = study?.members.find((x) => x.id === memberId);
  if (!study || !m) return null;

  await db.from('bible_study_members').update({ first_showed: showed }).eq('id', memberId);
  if (!showed) {
    await createAutoTask({
      key: `missed:${m.id}`,
      kind: 'missed',
      title: `Follow up: ${m.name} missed their first study`,
      description: [
        `${m.name} · ${m.phone}`,
        `Missed ${formatSlot(study)}${study.location ? ` at ${study.location}` : ''}. Check in, see if the time still works, or help them find another study.`,
        '',
        (await reconnectIdeas(chicagoToday()))(study.leader_name ? { name: study.leader_name, phone: study.leader_phone } : null),
      ].join('\n'),
      owner_id: by?.id ?? study.point_staff_id,
      due_date: chicagoToday(),
      study_id: study.id,
      contact_id: m.contact_id,
      typeName: 'Follow-up',
      priority: 'urgent',
    });
  }
  return { name: m.name, slot: formatSlot(study) };
}

// Route-handler hook: after a seat is created, make the welcome task and email
// its owner. Runs after the response via after().
export function queueSeated(memberId: string) {
  after(async () => {
    try {
      const taskId = await onStudentSeated(memberId);
      if (taskId) notifyTaskAssignedNow(taskId);
    } catch (e) {
      console.error('[iowa automation] welcome failed', e);
    }
  });
}

export function queueDropped(contactId: string) {
  after(async () => {
    try {
      await onStudentDropped(contactId);
    } catch (e) {
      console.error('[iowa automation] drop cleanup failed', e);
    }
  });
}
