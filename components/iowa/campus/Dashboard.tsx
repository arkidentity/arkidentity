'use client';

import { useState, type ComponentProps } from 'react';
import { chicagoToday, formatDate, isOverdue, weekDays } from '@/lib/campusFormat';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import TaskList, { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { PageShell, Section } from '@/components/iowa/campus/ui';
import PendingInvites from '@/components/iowa/campus/PendingInvites';
import type { PendingInvite } from '@/lib/eventInvites';

// The one working screen: counts that show trouble early, the week calendar
// (events, studies, tasks due; + New event), and the full task list (filters,
// + New task). Replaces the separate Calendar and Tasks tabs.
export default function Dashboard({
  calendar,
  tasks: taskProps,
  thisWeekStart,
  pending = [],
}: {
  pending?: PendingInvite[];
  calendar: ComponentProps<typeof CampusCalendar>;
  tasks: TaskListProps;
  thisWeekStart: string;
}) {
  const { tasks, staff, meId } = taskProps;
  const [taskPopup, setTaskPopup] = useState<string[] | null>(null);
  const today = chicagoToday();
  const me = staff.find((s) => s.id === meId);
  const endOfWeek = weekDays(thisWeekStart)[6];

  const open = tasks.filter((t) => t.status !== 'done');
  const mine = open.filter((t) => t.owner_id === meId);
  const stats = [
    { label: 'Mine overdue', value: mine.filter((t) => isOverdue(t, today)).length, alert: true },
    { label: 'Mine this week', value: mine.filter((t) => t.due_date && t.due_date >= today && t.due_date <= endOfWeek).length },
    { label: 'Unowned', value: open.filter((t) => !t.owner_id).length, alert: true },
    { label: 'All overdue', value: open.filter((t) => isOverdue(t, today)).length, alert: true },
  ];
  const workload = staff
    .filter((s) => s.active)
    .map((s) => ({
      s,
      open: open.filter((t) => t.owner_id === s.id).length,
      overdue: open.filter((t) => t.owner_id === s.id && isOverdue(t, today)).length,
      studies: calendar.studies.filter(
        (x) => x.point_staff_id === s.id && ['forming', 'full', 'activated'].includes(x.status)
      ).length,
    }));

  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
        {me ? `Hey ${me.name.split(' ')[0]}` : 'Dashboard'}
      </h1>
      <p className="text-sm text-[#8a8378] mb-6">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      {/* Four across even on a phone: the numbers are short, and two rows of
          two pushed the calendar below the fold. */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
        {stats.map((st) => {
          const hot = st.alert && st.value > 0;
          return (
            <a
              key={st.label}
              href="#tasks"
              className="rounded-lg border bg-white px-2 py-2 sm:px-4 sm:py-3 hover:shadow-sm transition"
              style={{ borderColor: hot ? '#fca5a5' : '#e5e7eb' }}
            >
              <span className="block text-xl sm:text-2xl font-bold" style={{ color: hot ? '#b91c1c' : 'var(--navy)' }}>
                {st.value}
              </span>
              <span className="block text-[11px] leading-tight sm:text-xs text-[#8a8378]">{st.label}</span>
            </a>
          );
        })}
      </div>

      <PendingInvites invites={pending} />

      <CampusCalendar {...calendar} activity={taskProps.activity} onTaskClick={setTaskPopup} />
      {taskPopup && <TaskPopup {...taskProps} taskIds={taskPopup} onClose={() => setTaskPopup(null)} />}

      <div id="tasks" className="grid lg:grid-cols-3 gap-8 scroll-mt-4">
        <div className="lg:col-span-2">
          <section className="mb-10">
            <TaskList {...taskProps} title="Tasks" />
          </section>
        </div>
        <div>
          <Section title="Who's carrying what">
            <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {workload.map(({ s, open, overdue, studies }) => (
                <li key={s.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: 'var(--navy)' }}>
                    {s.name}
                  </span>
                  <span className="text-[#8a8378] text-right">
                    {open} task{open === 1 ? '' : 's'}
                    {overdue > 0 && <span className="text-red-700 font-semibold"> · {overdue} overdue</span>}
                    <span className="block text-xs">
                      {studies} stud{studies === 1 ? 'y' : 'ies'} on point
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
