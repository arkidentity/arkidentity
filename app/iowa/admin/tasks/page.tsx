import { redirect } from 'next/navigation';

// Tasks moved onto the dashboard. Old links (and emails already sent) keep
// working: ?task= / ?new= carry over.
export default async function TasksRedirect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/iowa/admin${qs ? `?${qs}` : ''}#tasks`);
}
