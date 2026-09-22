import { listCampusStudents, listStudies } from '@/lib/bibleStudies';
import { currentSemesterName } from '@/lib/semesters';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { checkinReport, invitableEvents } from '@/lib/campusCheckins';
import { CampusStudents } from '@/components/iowa/CampusStudents';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ARK Iowa — students' };

// The campus view of the contacts table: the same people as /admin/contacts,
// filtered to ARK Iowa and shown with the facts that only matter here — year,
// life-cycle status, and which study they're sitting in.
export default async function CampusStudentsPage() {
  const [students, studies, staff, me] = await Promise.all([listCampusStudents(), listStudies(), listStaff(), currentStaff()]);
  // The check-in report is staff + interns only, not student leaders.
  const canReport = !!me && me.role !== 'leader';
  const [report, events] = canReport ? await Promise.all([checkinReport(), invitableEvents()]) : [null, []];
  return (
    <CampusStudents
      report={report}
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
      semester={await currentSemesterName()}
    />
  );
}
