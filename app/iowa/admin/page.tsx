import type { Metadata } from 'next';
import { loadCampusContext } from '@/lib/campusAdminData';
import { listEvents } from '@/lib/campusTasks';
import { addDays, chicagoToday, isValidDate, weekStart } from '@/lib/campusFormat';
import { listHeld, pullIfStale, syncStatus } from '@/lib/calendarSync';
import { semesterContext } from '@/lib/semesters';
import { listTemplates } from '@/lib/eventChecklists';
import { listRsvps, pendingInvitesFor } from '@/lib/eventInvites';
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
  await pullIfStale(); // fresh Google events, at most every 2 minutes
  const sp = await searchParams;
  const thisWeek = weekStart(chicagoToday());
  const start = isValidDate(sp.week) ? weekStart(sp.week) : thisWeek;
  const [ctx, events, held, sync, sem, templates] = await Promise.all([
    loadCampusContext(),
    listEvents(start, addDays(start, 6)),
    listHeld(),
    syncStatus(),
    semesterContext(),
    listTemplates(),
  ]);

  const [rsvps, pending] = await Promise.all([
    listRsvps(events.map((e) => e.id)),
    ctx.meId ? pendingInvitesFor(ctx.meId) : Promise.resolve([]),
  ]);

  return (
    <Dashboard
      pending={pending}
      key={start}
      thisWeekStart={thisWeek}
      calendar={{
        weekStart: start,
        studies: ctx.studiesFull,
        events,
        tasks: ctx.tasks,
        staff: ctx.staff,
        types: ctx.types,
        meId: ctx.meId,
        held: held.filter((h) => !h.decision),
        sync,
        periods: sem.periods,
        semesters: sem.semesters,
        templates: templates.map((t) => ({ id: t.id, name: t.name, itemCount: t.items.length })),
        rsvps,
        students: ctx.students,
      }}
      tasks={{
        tasks: ctx.tasks,
        activity: ctx.activity,
        staff: ctx.staff,
        types: ctx.types,
        studies: ctx.studies,
        events: ctx.events,
        students: ctx.students,
        meId: ctx.meId,
        openTaskId: sp.task ?? null,
        prefill: sp.new ? { study: sp.study, event: sp.event, student: sp.student } : null,
      }}
    />
  );
}
