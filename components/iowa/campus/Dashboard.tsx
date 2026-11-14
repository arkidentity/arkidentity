'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, chicagoToday, formatDate, taskGroupKey, taskGroupTitle } from '@/lib/campusFormat';
import type { CampusTask } from '@/lib/campusTasks';
import CampusCalendar from '@/components/iowa/campus/CampusCalendar';
import { buildWeekItems, type WeekItem } from '@/components/iowa/campus/WeekView';
import { TaskPopup, type TaskListProps } from '@/components/iowa/campus/TaskList';
import { OpenItemProvider, type OpenItem, CanProvider, ScreenHeader, Modal, NAVY, ON_NAVY_MUTED } from '@/components/iowa/campus/ui';
import StudentPanel from '@/components/iowa/campus/StudentPanel';
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

// Auto tasks carry "Name · phone", "met Keilor" and a reason in their
// description. The row shows who met them + why instead of the name again.
function why(t: CampusTask, reason: boolean) {
  const lines = (t.description ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (t.contact_name && lines[0]?.startsWith(t.contact_name)) lines.shift();
  if (!t.auto_kind) return '';
  const out = lines.map((l) => l.replace(/^met (\S+)$/, '$1 met them')).filter((l, i) => reason || i === 0 && /met them|invited|on their own/.test(l));
  const str = out.join(' · ');
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

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
  const [rowOpen, setRowOpen] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const [showAllNow, setShowAllNow] = useState(false);
  const [showStale, setShowStale] = useState(false);
  const [groupOpen, setGroupOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState<CampusTask | null>(null);
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

  const sub = (t: CampusTask, person = false) => {
    const linked = t.study_id
      ? taskProps.studies.find((s) => s.id === t.study_id)?.label
      : t.event_id
        ? taskProps.events.find((e) => e.id === t.event_id)?.label
        : null;
    const helpers = t.helper_ids.filter((h) => h !== meId).map(nameOf).filter(Boolean);
    const nameInTitle = !!t.contact_name && (person || t.title.includes(t.contact_name));
    return [
      why(t, !person),
      !nameInTitle && t.contact_name,
      linked && `for ${linked}`,
      t.owner_id && t.owner_id !== meId && `${nameOf(t.owner_id)}’s`,
      helpers.length > 0 && `with ${helpers.join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  // Same-kind auto tasks (welcome texts, reconnects, placements…) fold into one
  // line that opens, so five welcome texts don't take five rows.
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
      <ul className="rounded-xl overflow-hidden bg-white" style={{ border: `1px solid ${LINE}` }}>
        {rows.slice(0, limit).map((r, i) => {
          if ('t' in r) return row(r.t, i);
          if (r.tasks.length === 1) return row(r.tasks[0], i);
          const isOpen = groupOpen === r.key;
          const late = r.tasks.some((t) => !!t.due_date && t.due_date < today);
          const names = r.tasks.map((t) => (t.contact_name ?? '').split(' ')[0]).filter(Boolean);
          return (
            <li key={r.key} style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
              <button className="w-full text-left px-4 py-3 flex items-start justify-between gap-3" onClick={() => setGroupOpen(isOpen ? null : r.key)} aria-expanded={isOpen}>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{taskGroupTitle(r.key, r.tasks.length)}</span>
                  <span className="block text-sm mt-0.5" style={{ color: MUTED }}>
                    {names.slice(0, 4).join(', ')}{names.length > 4 ? ` +${names.length - 4}` : ''}
                  </span>
                </span>
                <span className="text-sm font-semibold shrink-0" style={{ color: late ? LATE : MUTED }}>{isOpen ? 'Hide' : r.tasks.length}</span>
              </button>
              {isOpen && (
                <ul className="mx-3 mb-3 rounded-lg overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                  {r.tasks.map((t, j) => row(t, j, true))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // person = a row inside a folded group: the group says what to do, so the
  // row is the student (tap the name for their profile) with a Text button.
  const row = (t: CampusTask, i: number, person = false) => {
        const isOpen = rowOpen === t.id;
        const late = !!t.due_date && t.due_date < today;
        const s = sub(t, person);
        const toggle = () => setRowOpen(isOpen ? null : t.id);
        const phone = t.contact_phone?.replace(/[^\d+]/g, '');
        return (
          <li key={t.id} style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
            <div className="flex items-start gap-2 pr-3">
            <button
              className="flex-1 min-w-0 text-left pl-4 py-3"
              onClick={person && t.contact_id ? () => setProfile(t) : toggle}
              aria-expanded={person ? undefined : isOpen}
            >
              <span className="block min-w-0">
                <span className="block font-semibold leading-snug">
                  {(t.priority === 'urgent' || t.priority === 'high') && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: t.priority === 'urgent' ? LATE : GOLD }}
                      aria-label={t.priority === 'urgent' ? 'Urgent' : 'High priority'}
                    />
                  )}
                  {person ? t.contact_name ?? t.title : t.title}
                </span>
                {s && <span className="block text-sm mt-0.5 line-clamp-2" style={{ color: MUTED }}>{s}</span>}
              </span>
            </button>
            {phone && (
              <a
                href={`sms:${phone}`}
                className="shrink-0 mt-2.5 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ border: `1.5px solid ${NAVY}`, color: NAVY }}
              >
                Text
              </a>
            )}
            <button
              className="shrink-0 py-3 pl-1 text-sm font-semibold text-right"
              style={{ color: late ? LATE : MUTED }}
              onClick={toggle}
              aria-expanded={isOpen}
              aria-label="Task actions"
            >
              {dueLabel(today, t.due_date) || 'More'}
            </button>
            </div>
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
                {!person && t.contact_id && <Btn kind="quiet" onClick={() => setProfile(t)}>Profile</Btn>}
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

          {profile && profile.contact_id && (
            <Modal title={profile.contact_name ?? 'Student'} onClose={() => setProfile(null)}>
              <StudentPanel contactId={profile.contact_id} fallbackName={profile.contact_name ?? undefined} />
            </Modal>
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
