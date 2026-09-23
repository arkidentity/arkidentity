import type { Metadata } from 'next';
import { listTypes } from '@/lib/campusTasks';
import TypeSettings from '@/components/iowa/campus/TypeSettings';
import { listPeriods } from '@/lib/schoolCalendar';
import { listSemesters } from '@/lib/semesters';
import { listTemplates } from '@/lib/eventChecklists';
import { listStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — settings' };

export default async function IowaSettingsPage() {
  const [types, periods, semesters, templates, staff] = await Promise.all([
    listTypes(),
    listPeriods(),
    listSemesters(),
    listTemplates(),
    listStaff(),
  ]);
  return (
    <TypeSettings
      vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? null}
      types={types}
      periods={periods}
      semesters={semesters}
      templates={templates}
      staff={staff.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
