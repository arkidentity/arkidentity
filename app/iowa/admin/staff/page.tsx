import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import type { Metadata } from 'next';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import IowaStaffAdmin from '@/components/iowa/IowaStaffAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — staff' };

export default async function IowaStaffPage() {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'manageStaff')) redirect('/iowa/admin');
  const [staff, me] = await Promise.all([listStaff(), currentStaff()]);
  return <IowaStaffAdmin initial={staff} meId={me?.id ?? null} />;
}
