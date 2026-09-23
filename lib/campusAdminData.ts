import { listStudies, listStudentOptions, formatSlot } from '@/lib/bibleStudies';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { listEventOptions, listTaskActivity, listTasks, listTypes } from '@/lib/campusTasks';
import { formatDate } from '@/lib/campusFormat';

// Everything the tasks / dashboard / calendar screens share: who's signed in,
// staff, type lists, tasks + history, and the options for linking a task to a
// study, event or student. Server-only.
export async function loadCampusContext() {
  const [me, staff, types, tasks, activity, studies, events, students] = await Promise.all([
    currentStaff(),
    listStaff(),
    listTypes(),
    listTasks(),
    listTaskActivity(),
    listStudies(),
    listEventOptions(),
    listStudentOptions(),
  ]);
  return {
    meId: me?.id ?? null,
    staff: staff.map((s) => ({ id: s.id, name: s.name, active: s.active })),
    types,
    tasks,
    activity,
    studiesFull: studies,
    studies: studies
      .filter((s) => s.status !== 'ended')
      .map((s) => ({ id: s.id, label: `${formatSlot(s)}${s.location ? ` · ${s.location}` : ''}` })),
    events: events.map((e) => ({
      id: e.id,
      label: `${e.title} · ${e.repeat_weekly ? `weekly from ${formatDate(e.event_date)}` : formatDate(e.event_date)}`,
    })),
    eventsFull: events,
    students,
  };
}
