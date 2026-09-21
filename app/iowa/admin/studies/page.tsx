import type { Metadata } from 'next';
import { listStudies, CURRENT_SEMESTER } from '@/lib/bibleStudies';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { listTasks } from '@/lib/campusTasks';
import IowaAdmin, { type StudyTask } from '@/components/iowa/IowaAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Bible studies' };

export default async function IowaStudiesPage() {
  const [studies, staff, me, tasks] = await Promise.all([listStudies(), listStaff(), currentStaff(), listTasks()]);
  const nameOf = new Map(staff.map((s) => [s.id, s.name]));
  const tasksByStudy: Record<string, StudyTask[]> = {};
  for (const t of tasks) {
    if (!t.study_id || t.status === 'done') continue;
    (tasksByStudy[t.study_id] ??= []).push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      owner_name: t.owner_id ? nameOf.get(t.owner_id) ?? null : null,
    });
  }
  return (
    <IowaAdmin
      initial={studies}
      semester={CURRENT_SEMESTER}
      staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
      meId={me?.id ?? null}
      tasksByStudy={tasksByStudy}
    />
  );
}
