import type { Metadata } from 'next';
import { listStudies } from '@/lib/bibleStudies';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { listEvents, listTasks, listTypes } from '@/lib/campusTasks';
import { addDays, chicagoToday, isValidDate, weekStart } from '@/lib/campusFormat';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { listHeld, pullIfStale, syncStatus } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — calendar' };

// ?week=YYYY-MM-DD (any day in the week) — defaults to this week.
export default async function IowaCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const start = weekStart(isValidDate(week) ? week : chicagoToday());
  await pullIfStale();
  const [studies, events, tasks, staff, types, me, held, sync] = await Promise.all([
    listStudies(),
    listEvents(start, addDays(start, 6)),
    listTasks(),
    listStaff(),
    listTypes(),
    currentStaff(),
    listHeld(),
    syncStatus(),
  ]);
  return (
    <CampusCalendar
      key={start}
      weekStart={start}
      studies={studies}
      events={events}
      tasks={tasks}
      staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
      types={types}
      meId={me?.id ?? null}
      held={held.filter((h) => !h.decision)}
      sync={sync}
    />
  );
}
