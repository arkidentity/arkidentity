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
  const me = await currentStaff();
  if (!me) redirect('/iowa/admin/login');
  // Staff see and manage everyone. Anyone else sees only themselves: their
  // details, password and semester schedule — no adding people, no roles.
  const admin = can(me, 'manageStaff');
  const [all, semester] = await Promise.all([listStaff(), currentSemesterName()]);
  const staff = admin ? all : all.filter((s) => s.id === me.id);
  const [allLinks, allBlocks] = await Promise.all([listScheduleLinks(semester), listBusy(semester)]);
  const links = admin ? allLinks : allLinks.filter((l) => l.staff_id === me.id);
  const blocks = admin ? allBlocks : allBlocks.filter((b) => b.staff_id === me.id);
  return (
    <>
      <IowaStaffAdmin initial={staff} meId={me.id} selfOnly={!admin} />
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
