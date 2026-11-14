import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import type { Metadata } from 'next';
import { blockOf, formatSlot, listCampusStudents, listStudentOptions, listStudies } from '@/lib/bibleStudies';
import { healthByStudy } from '@/lib/studyAttendance';
import { CheckinLinks } from '@/components/iowa/campus/CheckinLinks';
import WaitingList, { type OpenStudy, type WaitingStudent } from '@/components/iowa/campus/WaitingList';
import { listBusy } from '@/lib/availability';
import { semesterContext } from '@/lib/semesters';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { listTasks } from '@/lib/campusTasks';
import IowaAdmin, { type StudyTask } from '@/components/iowa/IowaAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Bible studies' };

// ?semester=Spring 2027 — tabs for the current semester and any upcoming one
// open for planning (from ~Nov 30 for spring). Default: current.
export default async function IowaStudiesPage({ searchParams }: { searchParams: Promise<{ semester?: string; new?: string }> }) {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'viewAllStudies')) redirect('/iowa/admin');
  const [{ semester: asked, new: startNew }, ctx] = await Promise.all([searchParams, semesterContext()]);
  const tabs = ctx.active;
  const semester = asked && tabs.includes(asked) ? asked : ctx.current?.name ?? tabs[0] ?? '';
  const [studies, staff, me, tasks, students, everyone] = await Promise.all([
    listStudies(semester),
    listStaff(),
    currentStaff(),
    listTasks(),
    listStudentOptions(),
    listCampusStudents(),
  ]);
  // Who's waiting (migration 034): needs a study (057; 'active' before it ran), grouped by free slot.
  const unplaced = everyone.filter((p) => (p.status === 'unplaced' || p.status === 'active') && p.studies.length === 0);
  const waiting: WaitingStudent[] = unplaced.map((p) => ({
    contact_id: p.contact_id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    year: p.year,
    gender: p.gender,
    free: p.free_slots_semester === semester ? p.free_slots : [], // last semester's answers don't count
    added_at: p.added_at,
  }));
  waiting.sort((a, b) => (a.added_at ?? '').localeCompare(b.added_at ?? ''));
  const openStudies: OpenStudy[] = studies
    .filter((st) => ['forming', 'activated', 'full'].includes(st.status) && st.activeCount < st.capacity)
    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
    .map((st) => ({
      id: st.id,
      label: formatSlot(st),
      slot: `${st.day_of_week}-${blockOf(st.start_time)}`,
      where: st.location ?? '',
      group_type: st.group_type ?? 'coed',
      spotsLeft: st.capacity - st.activeCount,
    }));
  // This semester's busy blocks, so the point-person picker can flag a clash.
  const [busyBlocks, health] = await Promise.all([listBusy(semester), healthByStudy(studies.map((st) => st.id))]);
  const nameOf = new Map(staff.map((s) => [s.id, s.name]));
  const tasksByStudy: Record<string, StudyTask[]> = {};
  for (const t of tasks) {
    if (!t.study_id || t.status === 'done') continue;
    (tasksByStudy[t.study_id] ??= []).push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      owner_name: t.owner_id ? nameOf.get(t.owner_id) ?? null : null,
    });
  }
  return (
    <>
      <IowaAdmin
      semesters={tabs.length > 1 ? tabs.map((t) => ({ name: t, next: t !== ctx.current?.name })) : []}
      startNew={startNew === '1'}
      initial={studies}
      semester={semester}
      planning={
        semester === ctx.current?.name
          ? ctx.open.map((x) => ({ name: x.name, starts_on: x.starts_on }))
          : []
      }
      staff={staff.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
      meId={me?.id ?? null}
      tasksByStudy={tasksByStudy}
      students={students}
      busyBlocks={busyBlocks}
      health={health}
      waiting={waiting}
      top={<WaitingList students={waiting} studies={openStudies} />}
    />
      {ctx.next && (
        <div style={{ background: '#FAF8F5' }}>
          {/* Returning students' answers (migration 038), once next semester opens. */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>
              {ctx.next.name} check-ins
            </h2>
            <CheckinLinks ownerId={null} />
          </section>
        </div>
      )}
    </>
  );
}
