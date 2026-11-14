'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDays, chicagoToday, formatDate, taskGroupKey, taskGroupTitle } from '@/lib/campusFormat';
import type { CampusTask } from '@/lib/campusTasks';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { buildWeekItems, type WeekItem } from '@/components/iowa/campus/WeekView';
import { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { OpenItemProvider, type OpenItem, CanProvider, ScreenHeader, NAVY, ON_NAVY_MUTED } from '@/components/iowa/campus/ui';
import { TaskCard, TaskGroupCard } from '@/components/iowa/campus/TaskCard';
import PendingInvites from '@/components/iowa/campus/PendingInvites';
import type { PendingInvite } from '@/lib/eventInvites';
import type { Permission } from '@/lib/iowaPerms';

// Today (11/13, from the /iowa/lab/today mock Travis approved): what's on you
// first, one tap to finish or push a task, then what's on campus today. The
// full task list (filters, search, done) lives on /iowa/admin/tasks, the week
// on /iowa/admin/calendar.

const INK = '#1a2b3c', MUTED = '#7d766b', LINE = '#e7e2d9', GOLD = '#E8B562';

const DAY = 86400000;
function daysFrom(today: string, d: string) {
  return Math.round((Date.parse(d) - Date.parse(today)) / DAY);
}
const RANK = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

const FIRST = 5; // tasks shown in Do now before "Show more"

export default function Dashboard({
  calendar,
  tasks: taskProps,
  pending = [],
  allowed,
}: {
  allowed: Permission[];
  pending?: PendingInvite[];
  calendar: ComponentProps<typeof CampusCalendar>;
  tasks: TaskListProps;
  thisWeekStart?: string;
}) {
  const router = useRouter();
  const { tasks, staff, meId } = taskProps;
  const [popup, setPopup] = useState<string[] | null>(taskProps.openTaskId ? [taskProps.openTaskId] : null);
  const [openRequest, setOpenRequest] = useState<(OpenItem & { n: number }) | null>(null);
  // A task's "For …" opens that study/event here; an event outside today's
  // window lives on the Calendar tab.
  const openItem = (o: OpenItem) => {
    setPopup(null);
    if (o.kind === 'event' && !calendar.events.some((e) => e.id === o.id)) {
      router.push(`/iowa/admin/calendar${o.date ? `?week=${o.date}` : ''}`);
      return;
    }
    setOpenRequest((prev) => ({ ...o, n: (prev?.n ?? 0) + 1 }));
  };
  const [showLater, setShowLater] = useState(false);
  const [showAllNow, setShowAllNow] = useState(false);
  const [showStale, setShowStale] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gone, setGone] = useState<string[]>([]); // finished here, before the refresh lands
  const today = chicagoToday();
  const me = staff.find((s) => s.id === meId);
  const team = allowed.includes('manageTasks');
  const nameOf = (id: string | null) => staff.find((s) => s.id === id)?.name.split(' ')[0] ?? '';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const open = tasks.filter((t) => t.status !== 'done' && !gone.includes(t.id));
  const mine = open
    .filter((t) => t.owner_id === meId || (!!meId && t.helper_ids.includes(meId)))
    .sort(
      (a, b) =>
        RANK[a.priority] - RANK[b.priority] ||
        // Freshest first: a 47-day-old task shouldn't bury yesterday's urgent one.
        Math.abs(daysFrom(today, a.due_date ?? today)) - Math.abs(daysFrom(today, b.due_date ?? today))
    );
  const isNow = (t: CampusTask) => (t.due_date ? t.due_date <= today : t.priority === 'urgent');
  // Do now stays short: today, this past week and anything urgent. Older than two
  // weeks goes under "Old" (closed) so a pile of stale tasks can't bury today's.
  const STALE = addDays(today, -14);
  const isStale = (t: CampusTask) => !!t.due_date && t.due_date < STALE && t.priority !== 'urgent';
  const now = mine.filter((t) => isNow(t) && !isStale(t));
  const stale = mine.filter(isStale);
  // Rows Do now shows once same-kind tasks fold together (for "Show N more").
  const nowRows = now.filter((t) => !(t.auto_kind === 'welcome' ? 'welcome' : taskGroupKey(t))).length +
    new Set(now.map((t) => (t.auto_kind === 'welcome' ? 'welcome' : taskGroupKey(t))).filter(Boolean)).size;
  const later = mine.filter((t) => !isNow(t) && t.due_date && t.due_date <= addDays(today, 7));
  const lateCount = now.filter((t) => !!t.due_date && t.due_date < today).length + stale.length;
  // What's on campus today (studies + events, no tasks), and the next one still to come.
  const todayItems = buildWeekItems({
    days: [today],
    studies: calendar.studies,
    events: calendar.events,
    tasks: [],
    staff: calendar.staff,
    types: calendar.types,
    meId: calendar.meId,
    mineOnly: false,
    periods: calendar.periods,
    semesters: calendar.semesters,
    team: calendar.team,
  }).filter((i) => i.kind !== 'task' && !i.paused);
  const nowHm = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });
  const nextUp = todayItems.filter((i) => i.time && i.time.slice(0, 5) >= nowHm).sort((a, b) => a.time!.localeCompare(b.time!))[0] ?? null;
  const unowned = open.filter((t) => !t.owner_id).sort((a, b) => (a.due_date ?? '9') .localeCompare(b.due_date ?? '9'));



  const ctx = { staff, meId, studies: taskProps.studies, events: taskProps.events };
  // A card that saved: done / pushed / given away leaves Today right away.
  const changed = (t: CampusTask, body: Record<string, unknown>) => {
    if (body.status === 'done' || body.due_date || (body.owner_id && body.owner_id !== meId)) setGone((g) => [...g, t.id]);
    setToast(body.status === 'done' ? 'Done. Nice.' : body.due_date ? 'Moved to next week' : body.owner_id ? (body.owner_id === meId ? 'It’s yours' : `Given to ${nameOf(body.owner_id as string)}`) : 'Saved');
  };
  const openTask = (id: string) => setPopup([id]);

  // Same-kind auto tasks (welcome texts, reconnects, placements…) fold into one
  // card, so five welcome texts don't take five rows. Same cards as the Tasks page.
  const list = (items: CampusTask[], limit = Infinity) => {
    type Row = { t: CampusTask } | { key: string; tasks: CampusTask[] };
    const rows: Row[] = [];
    const byKey = new Map<string, CampusTask[]>();
    for (const t of items) {
      const k = t.auto_kind === 'welcome' ? 'welcome' : taskGroupKey(t);
      if (!k) { rows.push({ t }); continue; }
      const g = byKey.get(k);
      if (g) g.push(t);
      else { const arr = [t]; byKey.set(k, arr); rows.push({ key: k, tasks: arr }); }
    }
    return (
      <ul className="space-y-2">
        {rows.slice(0, limit).map((r) =>
          'tasks' in r && r.tasks.length > 1 ? (
            <TaskGroupCard key={r.key} title={taskGroupTitle(r.key, r.tasks.length)} tasks={r.tasks} ctx={ctx} onOpen={openTask} onChanged={changed} />
          ) : (
            <TaskCard key={'t' in r ? r.t.id : r.tasks[0].id} t={'t' in r ? r.t : r.tasks[0]} ctx={ctx} onOpen={openTask} onChanged={changed} />
          )
        )}
      </ul>
    );
  };

  return (
    <CanProvider allowed={allowed}>
    <OpenItemProvider value={openItem}>
      <div style={{ background: '#f8f6f2', color: INK, minHeight: '100dvh' }}>
        <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-8 pb-32">
          <ScreenHeader
            kicker={formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}
            title={me ? `Hey ${me.name.split(' ')[0]}` : 'Today'}
            numbers={[
              { n: now.length, label: 'to do' },
              ...(lateCount ? [{ n: lateCount, label: 'late', warn: true }] : []),
              { n: todayItems.length, label: 'today' },
            ]}
          />

          {nextUp && <NextUp item={nextUp} onOpen={() => nextUp.studyId ? openItem({ kind: 'study', id: nextUp.studyId, date: today }) : nextUp.eventId && openItem({ kind: 'event', id: nextUp.eventId, date: today })} />}

          <PendingInvites invites={pending} />

          <h2 className="text-lg font-bold mb-2">Do now</h2>
          {now.length === 0 ? (
            <p className="rounded-xl px-4 py-5 text-center bg-white" style={{ border: `1px solid ${LINE}`, color: MUTED }}>
              All clear. Go love on some students.
            </p>
          ) : (
            <>
              {list(now, showAllNow ? Infinity : FIRST)}
              {nowRows > FIRST && (
                <button className="w-full py-3 text-sm font-semibold" style={{ color: MUTED }} onClick={() => setShowAllNow((v) => !v)}>
                  {showAllNow ? 'Show fewer' : `Show ${nowRows - FIRST} more`}
                </button>
              )}
            </>
          )}

          {stale.length > 0 && (
            <>
              <button className="w-full flex items-center justify-between pt-4 pb-2 text-left" onClick={() => setShowStale((v) => !v)}>
                <span className="font-bold">Old, over 2 weeks</span>
                <span className="text-sm font-semibold" style={{ color: MUTED }}>{showStale ? 'Hide' : `${stale.length} to sort out`}</span>
              </button>
              {showStale && (
                <>
                  <p className="text-sm mb-2" style={{ color: MUTED }}>Do it, push it to next week, or mark it done if it’s not happening.</p>
                  {list(stale)}
                </>
              )}
            </>
          )}


          <section className="mt-7 mb-2 pt-5 pb-6" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-lg font-bold">On campus today</h2>
              <Link href="/iowa/admin/calendar" className="text-sm font-semibold" style={{ color: NAVY }}>Calendar ›</Link>
            </div>
            <CampusCalendar {...calendar} weekStart={today} todayOnly openRequest={openRequest} activity={taskProps.activity} onTaskClick={setPopup} />
          </section>

          {later.length > 0 && (
            <>
              <button className="w-full flex items-center justify-between py-3 text-left" onClick={() => setShowLater((v) => !v)}>
                <span className="text-lg font-bold">Coming up</span>
                <span className="text-sm font-semibold" style={{ color: MUTED }}>
                  {showLater ? 'Hide' : `${later.length} this week`}
                </span>
              </button>
              {showLater && list(later)}
            </>
          )}

          {team && unowned.length > 0 && (
            <section className="mt-7 rounded-xl p-3" style={{ border: '1px dashed #cfc7b8' }}>
              <h2 className="font-bold">Nobody has these yet ({unowned.length})</h2>
              <div className="mt-2">{list(unowned, 5)}</div>
              {unowned.length > 5 && (
                <a href="/iowa/admin/tasks?view=unowned" className="inline-block mt-2 text-sm font-semibold underline">
                  See all {unowned.length}
                </a>
              )}
            </section>
          )}

          <p className="mt-8 text-center">
            <a href="/iowa/admin/tasks" className="font-semibold underline underline-offset-2">All tasks</a>
          </p>
        </main>

        {popup && <TaskPopup {...taskProps} taskIds={popup} onClose={() => setPopup(null)} />}

        {toast && (
          <div
            className="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-semibold text-white z-[70]"
            style={{ bottom: 'calc(150px + env(safe-area-inset-bottom))', background: INK }}
          >
            {toast}
          </div>
        )}
      </div>
    </OpenItemProvider>
    </CanProvider>
  );
}


// The next thing on campus today, in navy right under the header: the one piece
// of Today that's about time, not a list. Gone once the day's last item starts.
function NextUp({ item, onOpen }: { item: WeekItem; onOpen: () => void }) {
  const [h, m] = item.time!.slice(0, 5).split(':').map(Number);
  const nowParts = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
  const mins = h * 60 + m - (nowParts[0] * 60 + nowParts[1]);
  const when = mins <= 0 ? 'Starting now' : mins < 60 ? `In ${mins} min` : `At ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl px-4 py-3.5 mb-6 flex items-center justify-between gap-3"
      style={{ background: NAVY, color: '#fff', boxShadow: '0 1px 3px rgba(20,51,72,0.25)' }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold" style={{ color: GOLD }}>Next up · {when}</span>
        <span className="block font-bold text-[17px] leading-snug truncate">{item.title}</span>
        {item.sub && <span className="block text-sm truncate" style={{ color: ON_NAVY_MUTED }}>{item.sub}</span>}
      </span>
      <span className="text-2xl shrink-0" style={{ color: ON_NAVY_MUTED }} aria-hidden>›</span>
    </button>
  );
}
