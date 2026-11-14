'use client';

import { useState, type ComponentProps } from 'react';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { CanProvider, PageShell } from '@/components/iowa/campus/ui';
import type { Permission } from '@/lib/iowaPerms';

// The Calendar tab: the week grid with its tools (month, sync, + New event).
export default function CalendarScreen({
  calendar,
  tasks,
  allowed,
  startNew = false,
}: {
  allowed: Permission[];
  calendar: ComponentProps<typeof CampusCalendar>;
  tasks: TaskListProps;
  startNew?: boolean;
}) {
  const [popup, setPopup] = useState<string[] | null>(null);
  return (
    <CanProvider allowed={allowed}>
      <PageShell>
        <h1 className="text-[28px] font-bold mb-4" style={{ color: 'var(--navy)' }}>Calendar</h1>
        <CampusCalendar {...calendar} startNew={startNew} activity={tasks.activity} onTaskClick={setPopup} />
        {popup && <TaskPopup {...tasks} taskIds={popup} onClose={() => setPopup(null)} />}
        <div className="h-24" />
      </PageShell>
    </CanProvider>
  );
}
