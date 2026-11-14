import { loadCampusContext } from '@/lib/campusAdminData';
import { currentStaff } from '@/lib/iowaStaff';
import { allowedFor, can, filterStudies } from '@/lib/iowaPerms';
import { listEvents } from '@/lib/campusTasks';
import { SPAN_DAYS, addDays, chicagoToday, isValidDate, type CalendarSpan } from '@/lib/campusFormat';
import { listHeld, syncStatus } from '@/lib/calendarSync';
import { semesterContext } from '@/lib/semesters';
import { listTemplates } from '@/lib/eventChecklists';
import { listRsvps, pendingInvitesFor } from '@/lib/eventInvites';
import { listSongs } from '@/lib/eventSongs';
import { listTaskFiles } from '@/lib/taskFiles';
import { listStudyTeam, pendingStudyInvitesFor } from '@/lib/studyTeam';

// Everything the Today, Calendar and Tasks screens need (they share the task
// popup, the study card and the event screen, so they share the data too).
// Moved out of /iowa/admin/page.tsx on 11/13 when the dashboard split into tabs.
export async function loadAdminScreen(sp: Record<string, string | undefined>) {
  // A rolling window from today: on a Wednesday the grid starts Wednesday.
  const thisWeek = chicagoToday();
  const start = isValidDate(sp.week) ? sp.week : thisWeek;
  const span: CalendarSpan = sp.span === 'week' ? 'week' : 'short';
  const days = SPAN_DAYS[span];
  // Everything starts at once; the few things that need an earlier answer
  // chain off just that answer instead of waiting for the whole first batch.
  const ctxP = loadCampusContext();
  const eventsP = listEvents(start, addDays(start, days - 1));
  const [ctx, events, held, sync, sem, templates, ahead, rsvps, songs, taskFiles, pendingEvents, pendingStudies, team] = await Promise.all([
    ctxP,
    eventsP,
    listHeld(),
    syncStatus(),
    semesterContext(),
    listTemplates(),
    // The month picker: one-off events for the next six months.
    listEvents(thisWeek, addDays(thisWeek, 183)),
    eventsP.then((ev) => listRsvps(ev.map((e) => e.id))),
    eventsP.then((ev) => listSongs(ev.map((e) => e.id))),
    listTaskFiles(),
    ctxP.then((c) => (c.meId ? pendingInvitesFor(c.meId) : [])),
    ctxP.then((c) => (c.meId ? pendingStudyInvitesFor(c.meId) : [])),
    ctxP.then((c) => listStudyTeam(c.studiesFull.map((s) => s.id))),
  ]);
  const pending = [...pendingStudies, ...pendingEvents];

  // A student leader sees their own table and their own tasks, not every
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

  return {
    allowed: allowedFor(me),
    pending,
    thisWeekStart: thisWeek,
    calendar: {
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
      upcoming: ahead
        .filter((e) => !e.repeat_weekly && e.event_date >= thisWeek)
        .map((e) => ({
          id: e.id,
          title: e.title,
          date: e.event_date,
          start_time: e.start_time,
          openTasks: ctx.tasks.filter((t) => t.event_id === e.id && t.status !== 'done').length,
        })),
    },
    tasks: {
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
    },
  };
}
