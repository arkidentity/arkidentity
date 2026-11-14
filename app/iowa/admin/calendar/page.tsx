import { after } from 'next/server';
import type { Metadata } from 'next';
import { pullIfStale } from '@/lib/calendarSync';
import { loadAdminScreen } from '@/lib/iowaAdminScreen';
import CalendarScreen from '@/components/iowa/campus/CalendarScreen';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — calendar' };

// The week: studies, events, tasks due. ?week= / ?span=week pick the window,
// ?new=event opens the New event form (the + button).
export default async function IowaCalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  after(pullIfStale);
  const sp = await searchParams;
  const data = await loadAdminScreen(sp);
  return <CalendarScreen {...data} startNew={sp.new === 'event'} key={`${sp.week ?? ''}${sp.span ?? ''}`} />;
}
