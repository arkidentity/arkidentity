import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import type { Metadata } from 'next';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import IowaStaffAdmin from '@/components/iowa/IowaStaffAdmin';
import Schedules from '@/components/iowa/campus/Schedules';
import { listBusy, listScheduleLinks } from '@/lib/availability';
import { currentSemesterName } from '@/lib/semesters';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — staff' };

export default async function IowaStaffPage() {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'manageStaff')) redirect('/iowa/admin');
  const [staff, me, semester] = await Promise.all([listStaff(), currentStaff(), currentSemesterName()]);
  const [links, blocks] = await Promise.all([listScheduleLinks(semester), listBusy(semester)]);
  return (
    <>
      <IowaStaffAdmin initial={staff} meId={me?.id ?? null} />
      <div style={{ background: '#FAF8F5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Schedules
            staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
            semester={semester}
            links={links}
            blocks={blocks}
          />
        </div>
      </div>
    </>
  );
}
