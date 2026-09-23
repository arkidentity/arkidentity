'use client';

import type { StudyWithMembers } from '@/lib/bibleStudies';
import type { CampusEvent, CampusTask } from '@/lib/campusTasks';
import { formatSlot, formatTime } from '@/lib/bibleStudyFormat';
import {
  chicagoToday,
  compareTasks,
  dayOfWeek,
  eventDatesInRange,
  formatDate,
  isOverdue,
  periodsOn,
  studyPausedBy,
  taskGroupKey,
  taskGroupTitle,
  roleVerb,
  teamOn,
  type SchoolPeriod,
  type Semester,
  type StudyTeamRow,
  type TaskPriority,
} from '@/lib/campusFormat';
import { PriorityDot, type StaffOption, type TypeOption } from '@/components/iowa/campus/ui';

export interface WeekItem {
  key: string;
  date: string;
  time: string | null; // 'HH:MM:SS' for sorting; null = all day / task
  kind: 'study' | 'event' | 'task';
  title: string;
  sub: string | null;
  href?: string;
  eventId?: string;
  studyId?: string;
  priority?: TaskPriority;
  overdue?: boolean;
  paused?: boolean; // in-person study on a break week
  taskIds?: string[]; // a task (or a grouped line) — opens in a popup, no reload
}

const KIND_STYLE: Record<WeekItem['kind'], { bar: string; bg: string }> = {
  study: { bar: '#15803d', bg: '#f0fdf4' },
  event: { bar: '#7c3aed', bg: '#f5f3ff' },
  task: { bar: '#d1d5db', bg: '#ffffff' },
};

const LIVE_STUDY = ['forming', 'full', 'activated'];

// Studies (on-point), campus events (who's going), and open tasks due, laid out
// on the given week. `mineOnly` narrows each to the signed-in person.
export function buildWeekItems(opts: {
  days: string[];
  studies: StudyWithMembers[];
  events: CampusEvent[];
  tasks: CampusTask[];
  staff: StaffOption[];
  types: TypeOption[];
  meId: string | null;
  mineOnly: boolean;
  periods?: SchoolPeriod[];
  semesters?: Semester[];
  going?: Record<string, number>; // `${eventId}:${date}` → RSVP head count
  team?: StudyTeamRow[]; // study team (shadowing / assisting / leading)
}): WeekItem[] {
  const { days, studies, events, tasks, staff, types, meId, mineOnly, periods = [], semesters = [], going = {}, team = [] } = opts;
  const from = days[0];
  const to = days[6];
  const nameOf = (id: string | null) => staff.find((s) => s.id === id)?.name.split(' ')[0] ?? null;
  const items: WeekItem[] = [];

  for (const s of studies) {
    if (!LIVE_STUDY.includes(s.status)) continue;
    const date = days.find((d) => dayOfWeek(d) === s.day_of_week)!;
    // Outside its semester (a spring study in December) → not on the grid.
    const sem = semesters.find((x) => x.name === s.semester);
    if (sem && (date < sem.starts_on || date > sem.ends_on)) continue;
    // That week's team (shadowing / assisting / leading), minus declines.
    const crew = teamOn(s.id, date, team).filter((t) => t.response !== 'declined');
    const mineHere = s.point_staff_id === meId || crew.some((t) => t.staff_id === meId);
    if (mineOnly && !mineHere) continue;
    const pause = studyPausedBy(s, date, periods);
    const crewText = crew.map((t) => `${nameOf(t.staff_id)} ${roleVerb(t.role)}${t.response === 'pending' ? '?' : ''}`).join(', ');
    items.push({
      key: `s-${s.id}`,
      date,
      time: s.start_time,
      kind: 'study',
      title: `${formatSlot(s)} study${s.online ? ' (online)' : ''}`,
      sub: pause
        ? `paused · ${pause.name}`
        : [s.location, `${s.activeCount}/${s.capacity}`, s.point_staff_id ? nameOf(s.point_staff_id) : 'no staff', crewText || null]
            .filter(Boolean)
            .join(' · '),
      href: '/iowa/admin/studies',
      studyId: s.id,
      paused: !!pause,
    });
  }

  for (const e of events) {
    // Google-owned events don't know who's going — they're everyone's.
    if (mineOnly && e.source !== 'google' && !e.staff_ids.includes(meId ?? '')) continue;
    const type = types.find((t) => t.id === e.type_id)?.name;
    for (const date of eventDatesInRange(e, from, to)) {
      items.push({
        key: `e-${e.id}-${date}`,
        date,
        time: e.start_time,
        kind: 'event',
        title: e.title,
        sub: [
          e.start_time ? formatTime(e.start_time) : 'All day',
          e.location,
          e.meeting_link ? 'Online' : null,
          going[`${e.id}:${date}`] ? `${going[`${e.id}:${date}`]} going` : null,
          type,
        ].filter(Boolean).join(' · '),
        eventId: e.id,
      });
    }
  }

  // Same-kind automation tasks (six "Reconnect with…" on one Friday) collapse
  // into one line per day per owner, names listed. Unowned ones stay separate.
  const today = chicagoToday();
  const grouped = new Map<string, { date: string; key: string; owner: string | null; tasks: CampusTask[]; overdue: boolean }>();
  for (const t of tasks) {
    if (t.status === 'done' || !t.due_date) continue;
    if (mineOnly && t.owner_id !== meId && !t.helper_ids.includes(meId ?? '')) continue;
    // Overdue tasks pile onto today so they can't hide in last week.
    const overdue = isOverdue(t, today);
    const date = overdue && today >= from && today <= to ? today : t.due_date;
    if (date < from || date > to) continue;
    const gk = taskGroupKey(t);
    if (gk) {
      const k = `${date}|${gk}|${t.owner_id ?? ''}`;
      const g = grouped.get(k) ?? { date, key: gk, owner: t.owner_id, tasks: [], overdue: false };
      g.tasks.push(t);
      g.overdue ||= overdue;
      grouped.set(k, g);
      continue;
    }
    items.push({
      key: `t-${t.id}`,
      date,
      time: null,
      kind: 'task',
      title: t.title,
      sub: [overdue ? `overdue · was ${formatDate(t.due_date)}` : 'due', t.owner_id ? nameOf(t.owner_id) : 'unowned'].join(' · '),
      href: `/iowa/admin?task=${t.id}#tasks`,
      taskIds: [t.id],
      priority: t.priority,
      overdue,
    });
  }
  for (const [k, g] of grouped) {
    const [t] = [...g.tasks].sort((a, b) => compareTasks(a, b, today));
    if (g.tasks.length === 1) {
      items.push({
        key: `t-${t.id}`,
        date: g.date,
        time: null,
        kind: 'task',
        title: t.title,
        sub: [g.overdue ? `overdue · was ${formatDate(t.due_date!)}` : 'due', g.owner ? nameOf(g.owner) : 'unowned'].join(' · '),
        href: `/iowa/admin?task=${t.id}#tasks`,
        taskIds: [t.id],
        priority: t.priority,
        overdue: g.overdue,
      });
      continue;
    }
    const names = g.tasks.map((x) => x.contact_name ?? '?').join(', ');
    items.push({
      key: `g-${k}`,
      date: g.date,
      time: null,
      kind: 'task',
      title: taskGroupTitle(g.key, g.tasks.length),
      sub: [g.overdue ? 'overdue' : null, g.owner ? nameOf(g.owner) : 'unowned', names].filter(Boolean).join(' · '),
      // Opens the dashboard with this group expanded.
      href: `/iowa/admin?task=${t.id}#tasks`,
      taskIds: g.tasks.map((x) => x.id),
      priority: t.priority,
      overdue: g.overdue,
    });
  }

  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    // Timed things first in time order, then tasks.
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.time ? -1 : b.time ? 1 : 0;
  });
}

export default function WeekView({
  days,
  items,
  onEventClick,
  onStudyClick,
  onTaskClick,
  periods = [],
}: {
  days: string[];
  items: WeekItem[];
  periods?: SchoolPeriod[];
  onEventClick?: (eventId: string, date: string) => void;
  onStudyClick?: (studyId: string, date: string) => void;
  onTaskClick?: (taskIds: string[]) => void;
}) {
  const today = chicagoToday();
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d) => {
        const dayItems = items.filter((i) => i.date === d);
        const isToday = d === today;
        return (
          <div
            key={d}
            className="rounded-lg border bg-white min-h-[5rem] md:min-h-[9rem]"
            style={{ borderColor: isToday ? 'var(--navy)' : '#e5e7eb', borderWidth: isToday ? 2 : 1 }}
          >
            <div
              className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide border-b border-gray-100 flex justify-between"
              style={{ color: isToday ? 'var(--navy)' : '#8a8378' }}
            >
              <span>{formatDate(d, { weekday: 'short' })}</span>
              <span>{formatDate(d, { month: 'numeric', day: 'numeric' })}</span>
            </div>
            {periodsOn(d, periods).map((p) => (
              <div
                key={p.id}
                className="mx-1.5 mt-1.5 rounded px-1.5 py-0.5 text-xs md:text-[11px] font-semibold"
                style={{ backgroundColor: p.kind === 'finals' ? '#fee2e2' : '#fef3c7', color: p.kind === 'finals' ? '#b91c1c' : '#92400e' }}
                title={p.note ?? undefined}
              >
                {p.name}
              </div>
            ))}
            <ul className="p-1.5 space-y-1">
              {dayItems.length === 0 && <li className="text-xs text-[#c4bdb2] px-1 md:hidden">Nothing</li>}
              {dayItems.map((i) => {
                const style = KIND_STYLE[i.kind];
                const body = (
                  <>
                    <span className="flex items-center gap-1 font-semibold text-[#1f2937] leading-tight">
                      {i.priority && <PriorityDot priority={i.priority} />}
                      <span className={i.overdue ? 'text-red-700' : ''}>{i.title}</span>
                    </span>
                    {i.sub && <span className="block text-sm md:text-[11px] text-[#8a8378] leading-snug md:leading-tight mt-0.5">{i.sub}</span>}
                  </>
                );
                // Phones stack the days full-width, so text can be a size up there.
                const cls = 'block w-full text-left rounded px-2 py-1.5 md:px-1.5 md:py-1 text-[15px] md:text-xs hover:brightness-95';
                const st = {
                  backgroundColor: style.bg,
                  borderLeft: `3px solid ${i.overdue ? '#b91c1c' : style.bar}`,
                  ...(i.paused ? { opacity: 0.45, textDecoration: 'line-through' } : {}),
                };
                return (
                  <li key={i.key}>
                    {i.eventId && onEventClick ? (
                      <button className={cls} style={st} onClick={() => onEventClick(i.eventId!, i.date)}>
                        {body}
                      </button>
                    ) : i.studyId && onStudyClick ? (
                      <button className={cls} style={st} onClick={() => onStudyClick(i.studyId!, i.date)}>
                        {body}
                      </button>
                    ) : i.taskIds && onTaskClick ? (
                      <button className={cls} style={st} onClick={() => onTaskClick(i.taskIds!)}>
                        {body}
                      </button>
                    ) : i.href ? (
                      <a className={cls} style={st} href={i.href}>
                        {body}
                      </a>
                    ) : (
                      <div className={cls} style={st}>
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function WeekLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-[#8a8378]">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: KIND_STYLE.study.bar }} /> Bible study
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: KIND_STYLE.event.bar }} /> Event
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: KIND_STYLE.task.bar }} /> Task due
      </span>
    </div>
  );
}

export function MineToggle({ mineOnly, onChange }: { mineOnly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-xs sm:text-sm font-semibold shrink-0">
      {[
        { v: true, label: 'Mine' },
        { v: false, label: 'Everyone' },
      ].map((o) => (
        <button
          key={o.label}
          onClick={() => onChange(o.v)}
          className="px-2.5 sm:px-3 py-1.5"
          style={
            mineOnly === o.v
              ? { backgroundColor: 'var(--navy)', color: 'white' }
              : { backgroundColor: 'white', color: 'var(--navy)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
