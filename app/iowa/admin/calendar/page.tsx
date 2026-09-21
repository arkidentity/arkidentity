import { redirect } from 'next/navigation';

// The calendar moved onto the dashboard. Old links keep working (?week= carries over).
export default async function CalendarRedirect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/iowa/admin${qs ? `?${qs}` : ''}#week`);
}
