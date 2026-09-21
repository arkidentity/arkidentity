import type { Metadata } from 'next';
import { loadCampusContext } from '@/lib/campusAdminData';
import { listEvents } from '@/lib/campusTasks';
import { pullIfStale } from '@/lib/calendarSync';
import { listPeriods } from '@/lib/schoolCalendar';
import { addDays, chicagoToday, weekStart } from '@/lib/campusFormat';
import Dashboard from '@/components/iowa/campus/Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — dashboard' };

export default async function IowaDashboardPage() {
  await pullIfStale(); // fresh Google events, at most every 2 minutes
  const start = weekStart(chicagoToday());
  const [ctx, weekEvents, periods] = await Promise.all([
    loadCampusContext(),
    listEvents(start, addDays(start, 6)),
    listPeriods(),
  ]);
  return <Dashboard {...ctx} weekStart={start} weekEvents={weekEvents} periods={periods} />;
}
