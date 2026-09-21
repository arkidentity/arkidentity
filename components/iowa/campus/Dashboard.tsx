'use client';

import { useMemo, useState } from 'react';
import type { StudyWithMembers } from '@/lib/bibleStudies';
import type { CampusEvent } from '@/lib/campusTasks';
import { addDays, chicagoToday, formatDate, isOverdue, weekDays } from '@/lib/campusFormat';
import WeekView, { MineToggle, WeekLegend, buildWeekItems } from '@/components/iowa/campus/WeekView';
import TaskList, { type TaskListProps } from '@/components/iowa/campus/TaskList';
import { PageShell, Section } from '@/components/iowa/campus/ui';

// The first screen: this week at a glance, my tasks, and the counts that show
// trouble early (overdue, unowned, who's carrying what).
export default function Dashboard(
  props: TaskListProps & { weekStart: string; studiesFull: StudyWithMembers[]; weekEvents: CampusEvent[] }
) {
  const { weekStart, studiesFull, weekEvents, tasks, staff, types, meId } = props;
  const [mineOnly, setMineOnly] = useState(true);
  const days = weekDays(weekStart);
  const today = chicagoToday();
  const me = staff.find((s) => s.id === meId);

  const items = useMemo(
    () => buildWeekItems({ days, studies: studiesFull, events: weekEvents, tasks, staff, types, meId, mineOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart, studiesFull, weekEvents, tasks, staff, types, meId, mineOnly]
  );

  const open = tasks.filter((t) => t.status !== 'done');
  const mine = open.filter((t) => t.owner_id === meId);
  const stats = [
    { label: 'My overdue', value: mine.filter((t) => isOverdue(t, today)).length, alert: true, href: '/iowa/admin/tasks' },
    {
      label: 'Mine due this week',
      value: mine.filter((t) => t.due_date && t.due_date >= today && t.due_date <= days[6]).length,
      href: '/iowa/admin/tasks',
    },
    { label: 'Unowned', value: open.filter((t) => !t.owner_id).length, alert: true, href: '/iowa/admin/tasks' },
    { label: 'Overdue, everyone', value: open.filter((t) => isOverdue(t, today)).length, alert: true, href: '/iowa/admin/tasks' },
  ];
  const workload = staff
    .filter((s) => s.active)
    .map((s) => ({
      s,
      open: open.filter((t) => t.owner_id === s.id).length,
      overdue: open.filter((t) => t.owner_id === s.id && isOverdue(t, today)).length,
      studies: studiesFull.filter((x) => x.point_staff_id === s.id && ['forming', 'full', 'activated'].includes(x.status)).length,
    }));

  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
        {me ? `Hey ${me.name.split(' ')[0]}` : 'Dashboard'}
      </h1>
      <p className="text-sm text-[#8a8378] mb-6">
        Week of {formatDate(days[0], { month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((st) => {
          const hot = st.alert && st.value > 0;
          return (
            <a
              key={st.label}
              href={st.href}
              className="rounded-lg border bg-white px-4 py-3 hover:shadow-sm transition"
              style={{ borderColor: hot ? '#fca5a5' : '#e5e7eb' }}
            >
              <span className="block text-2xl font-bold" style={{ color: hot ? '#b91c1c' : 'var(--navy)' }}>
                {st.value}
              </span>
              <span className="block text-xs text-[#8a8378]">{st.label}</span>
            </a>
          );
        })}
      </div>

      <Section
        title="This week"
        action={
          <span className="flex items-center gap-3">
            <a href={`/iowa/admin/calendar?week=${addDays(weekStart, 7)}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
              Next week →
            </a>
            <MineToggle mineOnly={mineOnly} onChange={setMineOnly} />
          </span>
        }
      >
        <div className="mb-3">
          <WeekLegend />
        </div>
        <WeekView days={days} items={items} />
      </Section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Section
            title="My tasks"
            action={
              <a href="/iowa/admin/tasks?new=1" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
                + New task
              </a>
            }
          >
            <TaskList {...props} compact />
          </Section>
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
