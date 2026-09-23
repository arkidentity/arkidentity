import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import { currentStaff } from '@/lib/iowaStaff';
import type { Metadata } from 'next';
import { listTypes } from '@/lib/campusTasks';
import TypeSettings from '@/components/iowa/campus/TypeSettings';
import { listPeriods } from '@/lib/schoolCalendar';
import { listSemesters } from '@/lib/semesters';
import { listTemplates } from '@/lib/eventChecklists';
import { listStaff } from '@/lib/iowaStaff';
import { busyStaffId } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — settings' };

export default async function IowaSettingsPage() {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'manageSettings')) redirect('/iowa/admin');
  const [types, periods, semesters, templates, staff, busyStaff] = await Promise.all([
    listTypes(),
    listPeriods(),
    listSemesters(),
    listTemplates(),
    listStaff(),
    busyStaffId(),
  ]);
  return (
    <TypeSettings
      vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? null}
      busyStaff={busyStaff}
      allStaff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
      types={types}
      periods={periods}
      semesters={semesters}
      templates={templates}
      staff={staff.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
    />
  );
}
