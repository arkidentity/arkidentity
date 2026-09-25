import { after } from 'next/server';
import type { Metadata } from 'next';
import { loadCampusContext } from '@/lib/campusAdminData';
import { currentStaff } from '@/lib/iowaStaff';
import { can, filterStudies } from '@/lib/iowaPerms';
import { listEvents } from '@/lib/campusTasks';
import { SPAN_DAYS, addDays, chicagoToday, isValidDate, type CalendarSpan } from '@/lib/campusFormat';
import { listHeld, pullIfStale, syncStatus } from '@/lib/calendarSync';
import { semesterContext } from '@/lib/semesters';
import { listTemplates } from '@/lib/eventChecklists';
import { listRsvps, pendingInvitesFor } from '@/lib/eventInvites';
import { listSongs } from '@/lib/eventSongs';
import { listTaskFiles } from '@/lib/taskFiles';
import { listStudyTeam, pendingStudyInvitesFor } from '@/lib/studyTeam';
import Dashboard from '@/components/iowa/campus/Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — dashboard' };

// The one working screen (calendar + tasks). Query:
//   ?week=YYYY-MM-DD            which week the calendar shows (default: this week)
//   ?task=<id>                  open that task
//   ?new=1&study=|event=|student=   start a new task pre-linked
export default async function IowaDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Fresh Google events, at most every 2 minutes — after the response, never
  // in front of it: the page renders from the database, the pull lands for the
  // next load. Blocking here put a Google round trip on every save's refresh.
  after(pullIfStale);
  const sp = await searchParams;
  // A rolling seven days from today, not Sunday–Saturday: on a Wednesday the
  // grid starts Wednesday and runs a week ahead, so the days you still have to
  // work with are the ones on screen (`weekDays` counts from any date).
  const thisWeek = chicagoToday();
  const start = isValidDate(sp.week) ? sp.week : thisWeek;
  // 5 days by default; ?span=week opens it out.
  const span: CalendarSpan = sp.span === 'week' ? 'week' : 'short';
  const days = SPAN_DAYS[span];
  const [ctx, events, held, sync, sem, templates] = await Promise.all([
    loadCampusContext(),
    listEvents(start, addDays(start, days - 1)),
    listHeld(),
    syncStatus(),
    semesterContext(),
    listTemplates(),
  ]);

  const [rsvps, songs, taskFiles, pendingEvents, pendingStudies, team] = await Promise.all([
    listRsvps(events.map((e) => e.id)),
    listSongs(events.map((e) => e.id)),
    listTaskFiles(),
    ctx.meId ? pendingInvitesFor(ctx.meId) : Promise.resolve([]),
    ctx.meId ? pendingStudyInvitesFor(ctx.meId) : Promise.resolve([]),
    listStudyTeam(ctx.studiesFull.map((s) => s.id)),
  ]);
  const pending = [...pendingStudies, ...pendingEvents];

  // A student leader sees their own table and their own tasks — not every
  // group's roster (study cards carry phone numbers) or everyone's work.
  const me = await currentStaff();
  const mineOnly = !can(me, 'viewAllStudies');
  const studies = mineOnly
    ? filterStudies(me, ctx.studiesFull, team.filter((t) => t.staff_id === ctx.meId).map((t) => t.study_id))
    : ctx.studiesFull;
  const tasks = mineOnly
    ? ctx.tasks.filter((t) => t.owner_id === ctx.meId || t.helper_ids.includes(ctx.meId ?? ''))
    : ctx.tasks;
  const students = can(me, 'viewStudents') ? ctx.students : [];

  return (
    <Dashboard
      pending={pending}
      key={start}
      thisWeekStart={thisWeek}
      calendar={{
        weekStart: start,
        span,
        studies,
        events,
        tasks,
        staff: ctx.staff,
        types: ctx.types,
        meId: ctx.meId,
        held: held.filter((h) => !h.decision),
        sync,
        periods: sem.periods,
        semesters: sem.semesters,
        templates: templates.map((t) => ({ id: t.id, name: t.name, itemCount: t.items.length })),
        rsvps,
        songs,
        students,
        team,
      }}
      tasks={{
        tasks,
        files: taskFiles,
        activity: ctx.activity,
        staff: ctx.staff,
        types: ctx.types,
        studies: mineOnly ? ctx.studies.filter((o) => studies.some((x) => x.id === o.id)) : ctx.studies,
        events: ctx.events,
        students,
        meId: ctx.meId,
        openTaskId: sp.task ?? null,
        prefill: sp.new ? { study: sp.study, event: sp.event, student: sp.student } : null,
      }}
    />
  );
}
