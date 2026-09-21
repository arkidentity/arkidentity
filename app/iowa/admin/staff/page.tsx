import type { Metadata } from 'next';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import IowaStaffAdmin from '@/components/iowa/IowaStaffAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — staff' };

export default async function IowaStaffPage() {
  const [staff, me] = await Promise.all([listStaff(), currentStaff()]);
  return <IowaStaffAdmin initial={staff} meId={me?.id ?? null} />;
}
