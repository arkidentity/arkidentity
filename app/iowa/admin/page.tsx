import type { Metadata } from 'next';
import { loadCampusContext } from '@/lib/campusAdminData';
import { listEvents } from '@/lib/campusTasks';
import { addDays, chicagoToday, weekStart } from '@/lib/campusFormat';
import Dashboard from '@/components/iowa/campus/Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — dashboard' };

export default async function IowaDashboardPage() {
  const start = weekStart(chicagoToday());
  const [ctx, weekEvents] = await Promise.all([loadCampusContext(), listEvents(start, addDays(start, 6))]);
  return <Dashboard {...ctx} weekStart={start} weekEvents={weekEvents} />;
}
