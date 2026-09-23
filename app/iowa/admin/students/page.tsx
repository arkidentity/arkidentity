import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import { listCampusStudents, listStudies } from '@/lib/bibleStudies';
import { currentSemesterName } from '@/lib/semesters';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { checkinReport, invitableEvents } from '@/lib/campusCheckins';
import { findStudentDupes } from '@/lib/studentDupes';
import { CampusStudents } from '@/components/iowa/CampusStudents';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ARK Iowa — students' };

// The campus view of the contacts table: the same people as /admin/contacts,
// filtered to ARK Iowa and shown with the facts that only matter here — year,
// life-cycle status, and which study they're sitting in.
export default async function CampusStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'viewStudents')) redirect('/iowa/admin');
  const sp = await searchParams;
  const [students, studies, staff, me, semester] = await Promise.all([
    listCampusStudents(),
    listStudies(),
    listStaff(),
    currentStaff(),
    currentSemesterName(),
  ]);
  // Reaching the page at all means the report is allowed (same permission).
  const canReport = can(me, 'viewStudents');
  const [report, events] = canReport ? await Promise.all([checkinReport(students), invitableEvents()]) : [null, []];
  return (
    <CampusStudents
      report={report}
      dupes={findStudentDupes(students)}
      openReport={sp.report === '1'}
      events={events}
      staff={staff.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name }))}
      initial={students}
      studies={studies.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        location: s.location,
        activeCount: s.activeCount,
        capacity: s.capacity,
      }))}
      semester={semester}
    />
  );
}
