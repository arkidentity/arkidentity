import type { Metadata } from 'next';
import { loadAdminScreen } from '@/lib/iowaAdminScreen';
import TasksScreen from '@/components/iowa/campus/TasksScreen';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — tasks' };

// Every task with filters and search, plus who's carrying what.
// ?task=<id> opens one (emails link here), ?new=1&study=|event=|student= starts one,
// ?view=unowned|overdue|mine|done picks the filter.
export default async function IowaTasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const data = await loadAdminScreen(sp);
  const view = ['mine', 'all', 'unowned', 'overdue', 'done'].includes(sp.view ?? '') ? (sp.view as 'mine') : undefined;
  return <TasksScreen {...data} initialView={view} />;
}
