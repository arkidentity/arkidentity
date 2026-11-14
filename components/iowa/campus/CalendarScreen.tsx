'use client';

import { useState, type ComponentProps } from 'react';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { OpenItemProvider, type OpenItem, CanProvider, PageShell } from '@/components/iowa/campus/ui';
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
  const [openRequest, setOpenRequest] = useState<(OpenItem & { n: number }) | null>(null);
  const openItem = (o: OpenItem) => {
    setPopup(null);
    if (o.kind === 'event' && !calendar.events.some((e) => e.id === o.id)) {
      window.location.href = `/iowa/admin/calendar${o.date ? `?week=${o.date}` : ''}`;
      return;
    }
    setOpenRequest({ ...o, n: Date.now() });
  };
  return (
    <CanProvider allowed={allowed}>
    <OpenItemProvider value={openItem}>
      <PageShell>
        <h1 className="text-[28px] font-bold mb-4" style={{ color: 'var(--navy)' }}>Calendar</h1>
        <CampusCalendar {...calendar} startNew={startNew} openRequest={openRequest} activity={tasks.activity} onTaskClick={setPopup} />
        {popup && <TaskPopup {...tasks} taskIds={popup} onClose={() => setPopup(null)} />}
        <div className="h-24" />
      </PageShell>
    </OpenItemProvider>
    </CanProvider>
  );
}
