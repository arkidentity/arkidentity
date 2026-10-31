import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { currentStaff } from '@/lib/iowaStaff';
import { can } from '@/lib/iowaPerms';
import { listInterested, listRegistrations, TRIPS } from '@/lib/trips';
import TripBoard from './TripBoard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Baja 2027' };

// Admin → Events → Baja 2027 (Mig 047): who's going (with their checks) and who's interested.
// Plan: ark-workspace/projects/ark-identity/baja-2027/PLAN.md
export default async function BajaAdminPage() {
  const me = await currentStaff();
  if (!me) redirect('/iowa/admin/login');
  // Passports, medical and contact details: staff and interns only (Travis 10/31)
  if (!can(me, 'viewStudents')) redirect('/iowa/admin/events');
  const [interested, going] = await Promise.all([
    listInterested('baja-2027').catch(() => []),
    listRegistrations('baja-2027').catch(() => null), // null = Mig 047 not run yet
  ]);
  return <TripBoard trip="baja-2027" title={TRIPS['baja-2027'].title} page={TRIPS['baja-2027'].page}
    deposit={TRIPS['baja-2027'].deposit} goal={TRIPS['baja-2027'].goal} interested={interested} going={going} migrationMissing={going === null} />;
}
