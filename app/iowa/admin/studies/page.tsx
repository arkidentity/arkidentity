import { redirect } from 'next/navigation';
import { can } from '@/lib/iowaPerms';
import type { Metadata } from 'next';
import Link from 'next/link';
import { listStudentOptions, listStudies } from '@/lib/bibleStudies';
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
  const [studies, staff, me, tasks, students] = await Promise.all([
    listStudies(semester),
    listStaff(),
    currentStaff(),
    listTasks(),
    listStudentOptions(),
  ]);
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
    />
    </>
  );
}
