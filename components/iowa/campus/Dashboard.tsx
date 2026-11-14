'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, chicagoToday, formatDate } from '@/lib/campusFormat';
import type { CampusTask } from '@/lib/campusTasks';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { OpenItemProvider, type OpenItem, CanProvider } from '@/components/iowa/campus/ui';
import PendingInvites from '@/components/iowa/campus/PendingInvites';
import type { PendingInvite } from '@/lib/eventInvites';
import type { Permission } from '@/lib/iowaPerms';

// Today (11/13, from the /iowa/lab/today mock Travis approved): what's on you
// first, one tap to finish or push a task, then what's on campus today. The
// full task list (filters, search, done) lives on /iowa/admin/tasks, the week
// on /iowa/admin/calendar.

const INK = '#1a2b3c', MUTED = '#7d766b', LINE = '#e7e2d9', LATE = '#b42318', GOLD = '#E8B562';

const DAY = 86400000;
function daysFrom(today: string, d: string) {
  return Math.round((Date.parse(d) - Date.parse(today)) / DAY);
}
function dueLabel(today: string, d: string | null) {
  if (!d) return '';
  const n = daysFrom(today, d);
  if (n < -1) return `${-n} days late`;
  if (n === -1) return 'Yesterday';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return formatDate(d, { weekday: 'short' });
}
const RANK = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

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
      window.location.href = `/iowa/admin/calendar${o.date ? `?week=${o.date}` : ''}`;
      return;
    }
    setOpenRequest({ ...o, n: Date.now() });
  };
  const [rowOpen, setRowOpen] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);
  const [note, setNote] = useState('');
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
  const now = mine.filter(isNow);
  const later = mine.filter((t) => !isNow(t) && t.due_date && t.due_date <= addDays(today, 7));
  const unowned = open.filter((t) => !t.owner_id).sort((a, b) => (a.due_date ?? '9') .localeCompare(b.due_date ?? '9'));

  async function patch(t: CampusTask, body: Record<string, unknown>, msg: string) {
    setBusy(t.id);
    const res = await fetch(`/api/iowa/admin/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(j.error ?? 'That didn’t save. Try again.');
      return;
    }
    setRowOpen(null);
    setFinishing(null);
    setNote('');
    if (body.status === 'done' || body.due_date) setGone((g) => [...g, t.id]);
    setToast(msg);
    router.refresh();
  }

  const sub = (t: CampusTask) => {
    const linked = t.study_id
      ? taskProps.studies.find((s) => s.id === t.study_id)?.label
      : t.event_id
        ? taskProps.events.find((e) => e.id === t.event_id)?.label
        : null;
    const helpers = t.helper_ids.filter((h) => h !== meId).map(nameOf).filter(Boolean);
    return [
      t.contact_name,
      linked && `for ${linked}`,
      t.owner_id && t.owner_id !== meId && `${nameOf(t.owner_id)}’s`,
      helpers.length > 0 && `with ${helpers.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  const list = (items: CampusTask[]) => (
    <ul className="rounded-xl overflow-hidden bg-white" style={{ border: `1px solid ${LINE}` }}>
      {items.map((t, i) => {
        const isOpen = rowOpen === t.id;
        const late = !!t.due_date && t.due_date < today;
        const s = sub(t);
        return (
          <li key={t.id} style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
            <button
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
              onClick={() => setRowOpen(isOpen ? null : t.id)}
              aria-expanded={isOpen}
            >
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">
                  {(t.priority === 'urgent' || t.priority === 'high') && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: t.priority === 'urgent' ? LATE : GOLD }}
                      aria-label={t.priority === 'urgent' ? 'Urgent' : 'High priority'}
                    />
                  )}
                  {t.title}
                </span>
                {s && <span className="block text-sm mt-0.5" style={{ color: MUTED }}>{s}</span>}
              </span>
              <span className="text-sm font-semibold shrink-0 text-right" style={{ color: late ? LATE : MUTED }}>
                {dueLabel(today, t.due_date)}
              </span>
            </button>
            {isOpen && finishing === t.id && (
              <div className="px-4 pb-3">
                <label className="block text-sm font-semibold mb-1" htmlFor={`note-${t.id}`}>
                  What happened? <span className="font-normal" style={{ color: MUTED }}>(optional{t.contact_id ? ', goes on their history' : ''})</span>
                </label>
                <textarea
                  id={`note-${t.id}`}
                  rows={2}
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[15px]"
                  style={{ border: '1px solid #d6cfc2' }}
                />
                <div className="flex justify-end gap-1 mt-2">
                  <Btn kind="quiet" onClick={() => { setFinishing(null); setNote(''); }}>Cancel</Btn>
                  <Btn
                    kind="solid"
                    disabled={busy === t.id}
                    onClick={() => patch(t, note.trim() ? { status: 'done', comment: note.trim() } : { status: 'done' }, 'Done. Nice.')}
                  >
                    {note.trim() ? 'Done + save note' : 'Mark done'}
                  </Btn>
                </div>
              </div>
            )}
            {isOpen && finishing !== t.id && (
              <div className="px-4 pb-3 flex items-center justify-end gap-1 flex-wrap">
                <Btn kind="quiet" onClick={() => { setRowOpen(null); setPopup([t.id]); }}>Open</Btn>
                <Btn
                  disabled={busy === t.id}
                  onClick={() => patch(t, { due_date: addDays(t.due_date && t.due_date > today ? t.due_date : today, 7) }, 'Moved to next week')}
                >
                  Next week
                </Btn>
                <Btn kind="solid" onClick={() => { setFinishing(t.id); setNote(''); }}>
                  Done
                </Btn>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <CanProvider allowed={allowed}>
    <OpenItemProvider value={openItem}>
      <div style={{ background: '#f8f6f2', color: INK, minHeight: '100dvh' }}>
        <main className="max-w-xl mx-auto px-4 pb-32">
          <header className="pt-7 pb-5">
            <p className="text-sm" style={{ color: MUTED }}>
              {formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-[32px] leading-tight font-bold mt-1">{me ? `Hey ${me.name.split(' ')[0]}` : 'Today'}</h1>
            <p className="text-base mt-1" style={{ color: MUTED }}>
              {now.length === 0 ? 'Nothing waiting on you.' : `${now.length} thing${now.length === 1 ? '' : 's'} to do now.`}
            </p>
          </header>

          <PendingInvites invites={pending} />

          <h2 className="text-lg font-bold mb-2">Do now</h2>
          {now.length === 0 ? (
            <p className="rounded-xl px-4 py-5 text-center bg-white" style={{ border: `1px solid ${LINE}`, color: MUTED }}>
              All clear. Go love on some students.
            </p>
          ) : (
            list(now)
          )}

          <h2 className="text-lg font-bold mt-7 mb-1">On campus today</h2>
          <CampusCalendar {...calendar} weekStart={today} todayOnly openRequest={openRequest} activity={taskProps.activity} onTaskClick={setPopup} />

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
            <section className="mt-7 rounded-xl p-4 bg-white" style={{ border: '1px dashed #cfc7b8' }}>
              <h2 className="font-bold">Nobody has these yet ({unowned.length})</h2>
              <ul className="mt-1">
                {unowned.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                    <button className="text-left min-w-0" onClick={() => setPopup([t.id])}>
                      <span className="block font-semibold">{t.title}</span>
                      <span className="text-sm" style={{ color: t.due_date && t.due_date < today ? LATE : MUTED }}>
                        {[dueLabel(today, t.due_date), sub(t)].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                    <Btn disabled={busy === t.id} onClick={() => patch(t, { owner_id: meId }, 'It’s yours')}>Take it</Btn>
                  </li>
                ))}
              </ul>
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

function Btn({
  children,
  onClick,
  kind = 'line',
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  kind?: 'line' | 'solid' | 'quiet';
  disabled?: boolean;
}) {
  const s = kind === 'solid' ? { background: INK, color: '#fff' } : kind === 'quiet' ? { color: MUTED } : { border: `1px solid ${INK}` };
  return (
    <button disabled={disabled} className="shrink-0 px-4 min-h-11 rounded-lg text-sm font-semibold disabled:opacity-50" style={s} onClick={onClick}>
      {children}
    </button>
  );
}
