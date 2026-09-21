import type { Metadata } from 'next';
import { loadCampusContext } from '@/lib/campusAdminData';
import TaskList from '@/components/iowa/campus/TaskList';
import { PageShell } from '@/components/iowa/campus/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — tasks' };

// ?task=<id> opens a task; ?new=1&study=|event=|student= starts one pre-linked.
export default async function IowaTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [sp, ctx] = await Promise.all([searchParams, loadCampusContext()]);
  const prefill = sp.new ? { study: sp.study, event: sp.event, student: sp.student } : null;
  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        Tasks
      </h1>
      <TaskList {...ctx} openTaskId={sp.task ?? null} prefill={prefill} />
    </PageShell>
  );
}
