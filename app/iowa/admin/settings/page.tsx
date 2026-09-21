import type { Metadata } from 'next';
import { listTypes } from '@/lib/campusTasks';
import TypeSettings from '@/components/iowa/campus/TypeSettings';
import { listPeriods } from '@/lib/schoolCalendar';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — settings' };

export default async function IowaSettingsPage() {
  const [types, periods] = await Promise.all([listTypes(), listPeriods()]);
  return <TypeSettings types={types} periods={periods} />;
}
