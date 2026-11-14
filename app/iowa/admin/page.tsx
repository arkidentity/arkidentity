import { after } from 'next/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { pullIfStale } from '@/lib/calendarSync';
import { loadAdminScreen } from '@/lib/iowaAdminScreen';
import Dashboard from '@/components/iowa/campus/Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — today' };

// Today: my tasks first, then what's on campus today. ?task=<id> opens a task.
// Old links that started a new task (?new=1…) or pointed at a week go to the
// Tasks and Calendar tabs, where those live now.
export default async function IowaTodayPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Fresh Google events, at most every 2 minutes, after the response.
  after(pullIfStale);
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1])).toString();
  if (sp.new) redirect(`/iowa/admin/tasks?${qs}`);
  if (sp.week || sp.span) redirect(`/iowa/admin/calendar?${qs}`);
  const data = await loadAdminScreen(sp);
  return <Dashboard {...data} />;
}
