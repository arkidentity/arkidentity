import { listCampusStudents, listStudies, CURRENT_SEMESTER } from '@/lib/bibleStudies';
import { CampusStudents } from '@/components/iowa/CampusStudents';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ARK Iowa — students' };

// The campus view of the contacts table: the same people as /admin/contacts,
// filtered to ARK Iowa and shown with the facts that only matter here — year,
// life-cycle status, and which study they're sitting in.
export default async function CampusStudentsPage() {
  const [students, studies] = await Promise.all([listCampusStudents(), listStudies()]);
  return (
    <CampusStudents
      initial={students}
      studies={studies.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        location: s.location,
        activeCount: s.activeCount,
        capacity: s.capacity,
      }))}
      semester={CURRENT_SEMESTER}
    />
  );
}
