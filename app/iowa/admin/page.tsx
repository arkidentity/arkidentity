import type { Metadata } from 'next';
import { listStudies, CURRENT_SEMESTER } from '@/lib/bibleStudies';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import IowaAdmin from '@/components/iowa/IowaAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Bible study admin' };

export default async function IowaAdminPage() {
  const [studies, staff, me] = await Promise.all([listStudies(), listStaff(), currentStaff()]);
  return (
    <IowaAdmin
      initial={studies}
      semester={CURRENT_SEMESTER}
      staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
      meId={me?.id ?? null}
    />
  );
}
