'use client';

import TaskList, { type TaskListProps } from '@/components/iowa/campus/TaskList';
import { CanProvider, PageShell, Section } from '@/components/iowa/campus/ui';
import { chicagoToday, isOverdue } from '@/lib/campusFormat';
import type { Permission } from '@/lib/iowaPerms';
import type { StudyWithMembers } from '@/lib/bibleStudies';

// The Tasks screen: every task with filters and search, then who's carrying what.
export default function TasksScreen({
  tasks,
  calendar,
  allowed,
  initialView,
}: {
  allowed: Permission[];
  tasks: TaskListProps;
  calendar: { studies: StudyWithMembers[] };
  initialView?: TaskListProps['initialView'];
}) {
  const today = chicagoToday();
  const open = tasks.tasks.filter((t) => t.status !== 'done');
  const team = allowed.includes('manageTasks');
  const workload = tasks.staff
    .filter((s) => s.active)
    .map((s) => ({
      s,
      open: open.filter((t) => t.owner_id === s.id).length,
      overdue: open.filter((t) => t.owner_id === s.id && isOverdue(t, today)).length,
      studies: calendar.studies.filter((x) => x.point_staff_id === s.id && ['forming', 'full', 'activated'].includes(x.status)).length,
    }));
  return (
    <CanProvider allowed={allowed}>
      <PageShell>
        <section className="mb-10">
          <TaskList {...tasks} initialView={initialView} title="Tasks" />
        </section>
        {team && (
          <Section title="Who's carrying what">
            <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {workload.map(({ s, open, overdue, studies }) => (
                <li key={s.id} className="px-4 py-3 text-sm flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</span>
                  <span className="text-[#8a8378] text-right">
                    {open} task{open === 1 ? '' : 's'}
                    {overdue > 0 && <span className="text-red-700 font-semibold">, {overdue} late</span>}
                    <span className="block text-xs">{studies} stud{studies === 1 ? 'y' : 'ies'} on point</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <div className="h-24" />
      </PageShell>
    </CanProvider>
  );
}
