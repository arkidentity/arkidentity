import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import type { Metadata } from 'next';
import Link from 'next/link';
import { blockOf, formatSlot, listCampusStudents, listStudentOptions, listStudies } from '@/lib/bibleStudies';
import { healthByStudy } from '@/lib/studyAttendance';
import WaitingBySlot, { type WaitingSlot } from '@/components/iowa/campus/WaitingBySlot';
import { listBusy } from '@/lib/availability';
import { semesterContext } from '@/lib/semesters';
import { currentStaff, listStaff } from '@/lib/iowaStaff';
import { listTasks } from '@/lib/campusTasks';
import IowaAdmin, { type StudyTask } from '@/components/iowa/IowaAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Bible studies' };

// ?semester=Spring 2027 — tabs for the current semester and any upcoming one
// open for planning (from ~Nov 30 for spring). Default: current.
export default async function IowaStudiesPage({ searchParams }: { searchParams: Promise<{ semester?: string }> }) {
  // The nav hides this tab, but a bookmark shouldn't get past it either.
  if (!can(await currentStaff(), 'viewAllStudies')) redirect('/iowa/admin');
  const [{ semester: asked }, ctx] = await Promise.all([searchParams, semesterContext()]);
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
  // Who's waiting (migration 034): active, not in a study, grouped by free slot.
  const unplaced = everyone.filter((p) => p.status === 'active' && p.studies.length === 0);
  const bySlot = new Map<string, WaitingSlot>();
  for (const p of unplaced) {
    if (p.free_slots_semester !== semester) continue; // last semester's answers don't count
    for (const slot of p.free_slots) {
      const w = bySlot.get(slot) ?? { slot, open: [], students: [] };
      w.students.push({ contact_id: p.contact_id, name: p.name, phone: p.phone, email: p.email });
      bySlot.set(slot, w);
    }
  }
  for (const w of bySlot.values()) {
    const [day, block] = w.slot.split('-');
    w.open = studies
      .filter((st) => ['forming', 'activated'].includes(st.status) && st.day_of_week === Number(day) && blockOf(st.start_time) === block)
      .filter((st) => st.activeCount < st.capacity)
      .map((st) => ({ id: st.id, label: formatSlot(st), spotsLeft: st.capacity - st.activeCount }));
  }
  const waiting = [...bySlot.values()].sort((a, b) => b.students.length - a.students.length);
  const unplacedNoTimes = unplaced.filter((p) => p.free_slots_semester !== semester).length;
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
      {tabs.length > 1 && (
        <div style={{ background: '#FAF8F5' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex gap-2">
            {tabs.map((t) => (
              <Link
                key={t}
                href={`/iowa/admin/studies?semester=${encodeURIComponent(t)}`}
                className="px-3 py-1.5 rounded-md text-sm font-semibold border"
                style={
                  t === semester
                    ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' }
                    : { backgroundColor: 'white', color: 'var(--navy)', borderColor: '#d1d5db' }
                }
              >
                {t}
                {t !== ctx.current?.name ? ' (next)' : ''}
              </Link>
            ))}
          </div>
        </div>
      )}
      <IowaAdmin
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
    />
      <div style={{ background: '#FAF8F5' }}>
        <WaitingBySlot slots={waiting} unplacedNoTimes={unplacedNoTimes} semester={semester} />
      </div>
    </>
  );
}
