'use client';

import { useMemo, useState } from 'react';
import type { CampusTask, TaskActivity } from '@/lib/campusTasks';
import type { TaskFile } from '@/lib/taskFiles';
import { supabase } from '@/lib/supabase';
import {
  PRIORITIES,
  TASK_STATUSES,
  FOLLOW_UP_TITLES,
  addDays,
  chicagoToday,
  compareTasks,
  formatDate,
  isOverdue,
  taskGroupKey,
  taskGroupTitle,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/campusFormat';
import {
  ErrorBox,
  Field,
  Modal,
  OverdueTag,
  PriorityBadge,
  StatusPill,
  btnPrimary,
  btnSmall,
  input,
  useCall,
  type CallFn,
  type Option,
  type StaffOption,
  type TypeOption,
} from '@/components/iowa/campus/ui';

export interface TaskListProps {
  tasks: CampusTask[];
  activity: TaskActivity[];
  staff: StaffOption[];
  types: TypeOption[];
  studies: Option[];
  events: Option[];
  students: Option[];
  meId: string | null;
  // Tasks page: open this task / start a new one pre-linked.
  openTaskId?: string | null;
  prefill?: { study?: string; event?: string; student?: string } | null;
  files?: TaskFile[];
  // Dashboard: just my open tasks, no filters.
  compact?: boolean;
  // Render a heading with + New task on the same line (saves a row on phones).
  title?: string;
}

type View = 'mine' | 'all' | 'unowned' | 'overdue' | 'done';

export default function TaskList(props: TaskListProps) {
  const { tasks, staff, types, meId, compact, openTaskId, prefill } = props;
  const { call, busy, error } = useCall();
  const today = chicagoToday();
  // Everyone's open tasks by default (Travis); Mine is one tap away.
  const [view, setView] = useState<View>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(openTaskId ?? null);
  const [showNew, setShowNew] = useState(!!prefill);

  const isMine = (t: CampusTask) => t.owner_id === meId || (!!meId && t.helper_ids.includes(meId));

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done');
    return {
      mine: open.filter(isMine).length,
      all: open.length,
      unowned: open.filter((t) => !t.owner_id).length,
      overdue: open.filter((t) => isOverdue(t, today)).length,
      done: tasks.length - open.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, meId, today]);

  const shown = useMemo(() => {
    let list = tasks;
    const v: View = compact ? 'mine' : view;
    if (v === 'done') list = list.filter((t) => t.status === 'done');
    else {
      list = list.filter((t) => t.status !== 'done');
      if (v === 'mine') list = list.filter(isMine);
      if (v === 'unowned') list = list.filter((t) => !t.owner_id);
      if (v === 'overdue') list = list.filter((t) => isOverdue(t, today));
    }
    if (openTaskId && !compact) {
      // A deep-linked task is always visible, whatever the filter.
      const linked = tasks.find((t) => t.id === openTaskId);
      if (linked && !list.includes(linked) && view === 'all') list = [linked, ...list];
    }
    if (typeFilter) list = list.filter((t) => t.type_id === typeFilter);
    if (personFilter) list = list.filter((t) => t.owner_id === personFilter || t.helper_ids.includes(personFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) =>
      v === 'done' ? (b.completed_at ?? '').localeCompare(a.completed_at ?? '') : compareTasks(a, b, today)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, view, typeFilter, personFilter, search, compact, meId, today, openTaskId]);

  const taskTypes = types.filter((t) => t.kind === 'task');

  return (
    <div>
      <ErrorBox error={error} />

      {!compact && (
        <>
          {props.title && (
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                {props.title}
              </h2>
              <button onClick={() => setShowNew((v) => !v)} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
                {showNew ? 'Close' : '+ New task'}
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex flex-wrap rounded-lg border border-gray-300 overflow-hidden text-sm font-semibold">
              {(
                [
                  ['mine', `Mine (${counts.mine})`],
                  ['all', `All open (${counts.all})`],
                  ['unowned', `Unowned (${counts.unowned})`],
                  ['overdue', `Overdue (${counts.overdue})`],
                  ['done', 'Done'],
                ] as [View, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5"
                  style={
                    view === v
                      ? { backgroundColor: 'var(--navy)', color: 'white' }
                      : { backgroundColor: 'white', color: v === 'overdue' && counts.overdue ? '#b91c1c' : 'var(--navy)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {!props.title && (
              <button onClick={() => setShowNew((v) => !v)} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
                {showNew ? 'Close' : '+ New task'}
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mb-5">
            <input className={input} placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={input} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Any type</option>
              {taskTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select className={input} value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
              <option value="">Anyone</option>
              {staff
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          {showNew && (
            <div className="mb-6">
              <TaskForm {...props} busy={busy} call={call} onDone={() => setShowNew(false)} />
            </div>
          )}
        </>
      )}

      {shown.length === 0 && (
        <p className="text-sm text-[#8a8378]">
          {compact || view === 'mine' ? 'Nothing on your plate. 🎉' : 'No tasks here.'}
        </p>
      )}
      {view === 'done' && !compact ? (
        <ul className="space-y-2">
          {shown.map((t) => (
            <TaskRow
              key={t.id}
              t={t}
              {...props}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              busy={busy}
              call={call}
            />
          ))}
        </ul>
      ) : (
        bucketize(groupTasks(shown), today).map((b) => (
          <Bucket key={b.key} bucket={b} forceOpen={!!openTaskId && b.items.some((i) => hasTask(i, openTaskId))}>
            <ul className="space-y-2">
              {b.items.map((item) =>
                item.kind === 'task' ? (
                  <TaskRow
                    key={item.t.id}
                    t={item.t}
                    {...props}
                    expanded={expanded === item.t.id}
                    onToggle={() => setExpanded(expanded === item.t.id ? null : item.t.id)}
                    busy={busy}
                    call={call}
                  />
                ) : (
                  <GroupRow key={item.key} group={item} startOpen={!!openTaskId && hasTask(item, openTaskId)}>
                    {item.tasks.map((t) => (
                      <TaskRow
                        key={t.id}
                        t={t}
                        {...props}
                        expanded={expanded === t.id}
                        onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                        busy={busy}
                        call={call}
                      />
                    ))}
                  </GroupRow>
                )
              )}
            </ul>
          </Bucket>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouping + time buckets (2026-09-22, Travis): 30 tasks on one day was too
// many. When it's due comes first, priority second, and the automation's
// one-task-per-student follow-ups collapse into one card per kind.
// ---------------------------------------------------------------------------

type Group = { kind: 'group'; key: string; title: string; sub: string | null; followUp: boolean; tasks: CampusTask[] };
type Item = { kind: 'task'; t: CampusTask } | Group;

const FOLLOW_UP = FOLLOW_UP_TITLES;

const hasTask = (i: Item, id: string) => (i.kind === 'task' ? i.t.id === id : i.tasks.some((t) => t.id === id));
const firstOf = (i: Item) => (i.kind === 'task' ? i.t : i.tasks[0]);

// Input is already sorted; a group sits where its most pressing task would.
function groupTasks(sorted: CampusTask[]): Item[] {
  const groups = new Map<string, Group>();
  const items: Item[] = [];
  for (const t of sorted) {
    const key = taskGroupKey(t);
    if (!key) { items.push({ kind: 'task', t }); continue; }
    let g = groups.get(key);
    if (!g) {
      g = { kind: 'group', key, title: '', sub: null, followUp: !!FOLLOW_UP[key], tasks: [] };
      groups.set(key, g);
      items.push(g);
    }
    g.tasks.push(t);
  }
  return items.map((i) => {
    if (i.kind === 'task' || i.tasks.length > 1) {
      if (i.kind === 'group') {
        const names = i.tasks.map((t) => (t.contact_name ?? '').split(' ')[0]).filter(Boolean);
        i.title = taskGroupTitle(i.key, i.tasks.length);
        i.sub = names.slice(0, 4).join(', ') + (names.length > 4 ? ` +${names.length - 4}` : '');
      }
      return i;
    }
    return { kind: 'task', t: i.tasks[0] }; // a group of one is just a task
  });
}

type BucketKey = 'overdue' | 'week' | 'soon' | 'later' | 'nodate';
const BUCKETS: { key: BucketKey; label: string; collapsed: boolean }[] = [
  { key: 'overdue', label: 'Overdue', collapsed: false },
  { key: 'week', label: 'This week', collapsed: false },
  { key: 'soon', label: 'Next 2 weeks', collapsed: false },
  { key: 'later', label: 'Later', collapsed: true },
  { key: 'nodate', label: 'No due date', collapsed: true },
];
type BucketData = (typeof BUCKETS)[number] & { items: Item[]; count: number };

function bucketOf(t: CampusTask, today: string): BucketKey {
  if (isOverdue(t, today)) return 'overdue';
  // Urgent with no date means "now", not "someday".
  if (!t.due_date) return t.priority === 'urgent' ? 'week' : 'nodate';
  if (t.due_date <= addDays(today, 6)) return 'week';
  if (t.due_date <= addDays(today, 20)) return 'soon';
  return 'later';
}

function bucketize(items: Item[], today: string): BucketData[] {
  const by = new Map<BucketKey, Item[]>();
  for (const i of items) {
    const k = bucketOf(firstOf(i), today);
    by.set(k, [...(by.get(k) ?? []), i]);
  }
  return BUCKETS.filter((b) => by.has(b.key)).map((b) => {
    const list = by.get(b.key)!;
    return { ...b, items: list, count: list.reduce((n, i) => n + (i.kind === 'task' ? 1 : i.tasks.length), 0) };
  });
}

function Bucket({ bucket, forceOpen, children }: { bucket: BucketData; forceOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!bucket.collapsed || forceOpen);
  const red = bucket.key === 'overdue';
  return (
    <section className="mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left mb-2 text-sm font-bold uppercase tracking-wide"
        style={{ color: red ? '#b91c1c' : '#8a8378' }}
      >
        <span>{bucket.label} ({bucket.count})</span>
        <span className="text-xs font-semibold normal-case">{open ? 'Hide ▴' : 'Show ▾'}</span>
      </button>
      {open && children}
    </section>
  );
}

function GroupRow({ group, startOpen, children }: { group: Group; startOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(startOpen);
  const top = [...group.tasks].sort((a, b) => compareTasks(a, b))[0];
  const overdue = group.tasks.some((t) => isOverdue(t));
  const due = group.tasks.map((t) => t.due_date).filter(Boolean).sort()[0] as string | undefined;
  return (
    <li className="rounded-lg border bg-white" style={{ borderColor: overdue ? '#fca5a5' : '#e5e7eb' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 text-left flex items-start gap-3">
        <span className="mt-0.5"><PriorityBadge priority={top.priority} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold" style={{ color: 'var(--navy)' }}>{group.title}</span>
          <span className="block text-sm md:text-xs text-[#8a8378] mt-0.5">{group.sub}</span>
        </span>
        <span className="flex flex-col items-end gap-1 shrink-0">
          {overdue && <OverdueTag />}
          {due && <span className="text-sm md:text-xs" style={{ color: overdue ? '#b91c1c' : '#8a8378' }}>{formatDate(due)}</span>}
          <span className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>{open ? '▴' : `${group.tasks.length} ▾`}</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 py-3">
          {group.followUp && (
            <a
              href="/iowa/admin/students?report=1"
              className="inline-block mb-3 px-3 py-2 rounded-md text-sm font-semibold"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Open check-in report →
            </a>
          )}
          {group.followUp && (
            <p className="text-xs text-[#8a8378] mb-3">Logging a check-in on the report marks that student&apos;s task done here.</p>
          )}
          <ul className="space-y-2">{children}</ul>
        </div>
      )}
    </li>
  );
}

function linkLabel(t: CampusTask, p: TaskListProps): string | null {
  if (t.study_id) return p.studies.find((s) => s.id === t.study_id)?.label ?? 'a study';
  if (t.event_id) return p.events.find((e) => e.id === t.event_id)?.label ?? 'an event';
  if (t.contact_id) return t.contact_name ?? 'a student';
  return null;
}

function TaskRow(
  props: TaskListProps & { t: CampusTask; expanded: boolean; onToggle: () => void; busy: boolean; call: CallFn }
) {
  const { t, staff, types, expanded, onToggle } = props;
  const owner = staff.find((s) => s.id === t.owner_id);
  const type = types.find((x) => x.id === t.type_id);
  const link = linkLabel(t, props);
  const overdue = isOverdue(t);
  const done = t.status === 'done';

  return (
    <li className="rounded-lg border bg-white" style={{ borderColor: overdue ? '#fca5a5' : '#e5e7eb' }}>
      <button onClick={onToggle} className="w-full px-4 py-3 text-left flex items-start gap-3">
        <span className="mt-0.5">
          <PriorityBadge priority={t.priority} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-semibold ${done ? 'line-through text-[#8a8378]' : ''}`}
            style={done ? undefined : { color: 'var(--navy)' }}
          >
            {t.title}
          </span>
          <span className="block text-sm md:text-xs text-[#8a8378] mt-0.5">
            {[
              owner ? owner.name : 'Unowned',
              t.helper_ids.length
                ? `with ${t.helper_ids.map((id) => staff.find((s) => s.id === id)?.name.split(' ')[0] ?? '?').join(', ')}`
                : null,
              type?.name,
              link ? `→ ${link}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1 shrink-0">
          {overdue ? <OverdueTag /> : t.status !== 'open' && <StatusPill status={t.status} />}
          {t.due_date && (
            <span className="text-sm md:text-xs" style={{ color: overdue ? '#b91c1c' : '#8a8378' }}>
              {formatDate(t.due_date)}
            </span>
          )}
        </span>
      </button>
      {expanded && <TaskDetail {...props} />}
    </li>
  );
}

// Opening a task shows a short summary + quick actions. The full edit form and
// the history each open only when asked, so a list of tasks stays scannable.
function TaskDetail(props: TaskListProps & { t: CampusTask; busy: boolean; call: CallFn }) {
  const { t, meId, staff, activity, busy, call } = props;
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const url = `/api/iowa/admin/tasks/${t.id}`;
  const mineOwned = t.owner_id === meId;
  const helping = !!meId && t.helper_ids.includes(meId);
  // Activity with no person is the automation (welcome, confirm, reconnect…).
  const nameOf = (id: string | null) => (id ? staff.find((s) => s.id === id)?.name ?? 'Someone' : 'Auto:');
  const log = activity.filter((a) => a.task_id === t.id);
  const comments = log.filter((a) => a.kind === 'comment');
  const logs = log.filter((a) => a.kind !== 'comment');
  const owner = staff.find((s) => s.id === t.owner_id);
  const link = linkLabel(t, props);
  const toggle = 'text-xs font-semibold px-2 py-1 rounded border border-gray-300 hover:bg-gray-50';

  return (
    <div className="border-t border-gray-100 px-4 py-3 space-y-3">
      {t.description && <p className="text-[15px] md:text-sm text-[#4a4540] whitespace-pre-wrap">{t.description}</p>}
      <p className="text-sm md:text-xs text-[#8a8378]">
        {[
          t.due_date ? `Due ${formatDate(t.due_date)}` : 'No due date',
          owner ? `Owner: ${owner.name}` : 'Unowned',
          t.helper_ids.length ? `Also on it: ${t.helper_ids.map((id) => nameOf(id)).join(', ')}` : null,
          link ? `For ${link}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {t.status !== 'done' ? (
          <button disabled={busy} onClick={() => setFinishing((v) => !v)} className={btnPrimary} style={{ backgroundColor: '#15803d' }}>
            ✓ Mark done
          </button>
        ) : (
          <button disabled={busy} onClick={() => call(url, 'PATCH', { status: 'open' })} className={btnSmall}>
            Reopen
          </button>
        )}
        {!mineOwned && meId && (
          <button disabled={busy} onClick={() => call(url, 'PATCH', { owner_id: meId })} className={btnSmall}>
            Take this
          </button>
        )}
        {!mineOwned && meId && (
          <button disabled={busy} onClick={() => call(url, 'PATCH', { help: !helping })} className={btnSmall}>
            {helping ? 'Stop helping' : 'I can help'}
          </button>
        )}
        <span className="ml-auto flex gap-2">
          <button onClick={() => { setEditing((v) => !v); setSaved(false); }} className={toggle} style={{ color: 'var(--navy)' }}>
            {editing ? 'Close edit ▴' : 'Edit ▾'}
          </button>
          {logs.length > 0 && (
            <button onClick={() => setHistory((v) => !v)} className={toggle} style={{ color: '#8a8378' }}>
              History ({logs.length}) {history ? '▴' : '▾'}
            </button>
          )}
        </span>
      </div>
      {saved && !editing && <p className="text-xs font-semibold text-green-700">Saved ✓</p>}

      {editing && (
        <div className="rounded-md border border-gray-200 bg-[#FAF8F5] p-3">
          {/* Remount on every save so the form never holds stale values (e.g. after Take this). */}
          <TaskForm
            key={t.updated_at}
            {...props}
            task={t}
            onDone={() => {
              setEditing(false);
              setSaved(true);
            }}
          />
        </div>
      )}

      {finishing && (
        <FinishForm
          busy={busy}
          onDone={(comment) => call(url, 'PATCH', comment ? { status: 'done', comment } : { status: 'done' }).then((ok) => { if (ok) setFinishing(false); })}
          onCancel={() => setFinishing(false)}
        />
      )}

      <Files t={t} files={(props.files ?? []).filter((f) => f.task_id === t.id)} />

      <Comments t={t} comments={comments} nameOf={nameOf} />

      {history && (
        <ul className="text-sm md:text-xs text-[#8a8378] space-y-0.5">
          {logs.map((a) => (
            <li key={a.id}>
              {nameOf(a.staff_id)} {a.action} ·{' '}
              {when(a.created_at)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Create (no `task`) or edit (with `task`).
function TaskForm(
  props: TaskListProps & { task?: CampusTask; busy: boolean; call: CallFn; onDone?: () => void }
) {
  const { task, staff, types, studies, events, students, meId, prefill, onDone } = props;
  // Its own request state, so a failed save shows right here by the button
  // instead of at the top of the list, off-screen.
  const { call, busy, error } = useCall();
  const [helpers, setHelpers] = useState<string[]>(task?.helper_ids ?? []);
  const [f, setF] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: (task?.priority ?? 'normal') as TaskPriority,
    status: (task?.status ?? 'open') as TaskStatus,
    due_date: task?.due_date ?? '',
    owner_id: task ? task.owner_id ?? '' : meId ?? '',
    type_id: task?.type_id ?? '',
    study_id: task?.study_id ?? prefill?.study ?? '',
    event_id: task?.event_id ?? prefill?.event ?? '',
    contact_id: task?.contact_id ?? prefill?.student ?? '',
  });
  const set = (patch: Partial<typeof f>) => setF((cur) => ({ ...cur, ...patch }));
  const taskTypes = types.filter((t) => t.kind === 'task' && (t.active || t.id === f.type_id));

  async function save() {
    const body = { ...f, owner_id: f.owner_id || null, helper_ids: helpers.filter((id) => id !== f.owner_id) };
    if (task) {
      if (await call(`/api/iowa/admin/tasks/${task.id}`, 'PATCH', body)) onDone?.();
    } else if (await call('/api/iowa/admin/tasks', 'POST', body)) {
      setF({ ...f, title: '', description: '', due_date: '' });
      setHelpers([]);
      onDone?.();
    }
  }

  return (
    <div className={task ? 'grid sm:grid-cols-2 gap-3' : 'rounded-lg border border-gray-200 bg-white p-4 grid sm:grid-cols-2 gap-3'}>
      <Field label="Task" className="sm:col-span-2">
        <input className={input} value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="What needs doing?" />
      </Field>
      <Field label="Details" className="sm:col-span-2">
        <textarea rows={2} className={input} value={f.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field label="Priority">
        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => set({ priority: p.key })}
              className="flex-1 px-2 py-2 rounded-md text-xs font-semibold border transition"
              style={
                f.priority === p.key
                  ? { backgroundColor: p.color, color: 'white', borderColor: p.color }
                  : { backgroundColor: p.bg, color: p.color, borderColor: 'transparent' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Due">
        <input type="date" className={input} value={f.due_date} onChange={(e) => set({ due_date: e.target.value })} />
      </Field>
      <Field label="Owner">
        <select className={input} value={f.owner_id} onChange={(e) => set({ owner_id: e.target.value })}>
          <option value="">Unowned — anyone can take it</option>
          {staff
            .filter((p) => p.active || p.id === f.owner_id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.id === meId ? ' (me)' : ''}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Also on it" className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5 py-1">
          {staff
            .filter((p) => (p.active || helpers.includes(p.id)) && p.id !== f.owner_id)
            .map((p) => {
              const on = helpers.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setHelpers(on ? helpers.filter((x) => x !== p.id) : [...helpers, p.id])}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                  style={on ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { color: 'var(--navy)', borderColor: '#d1d5db', backgroundColor: 'white' }}
                >
                  {on ? '✓ ' : '+ '}
                  {p.name.split(' ')[0]}
                </button>
              );
            })}
        </div>
      </Field>
      {task ? (
        <Field label="Status">
          <select className={input} value={f.status} onChange={(e) => set({ status: e.target.value as TaskStatus })}>
            {TASK_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Type">
          <TypeSelect types={taskTypes} value={f.type_id} onChange={(v) => set({ type_id: v })} />
        </Field>
      )}
      {task && (
        <Field label="Type">
          <TypeSelect types={taskTypes} value={f.type_id} onChange={(v) => set({ type_id: v })} />
        </Field>
      )}
      <Field label="Bible study">
        <OptionSelect options={studies} value={f.study_id} onChange={(v) => set({ study_id: v })} none="No study" />
      </Field>
      <Field label="Event">
        <OptionSelect options={events} value={f.event_id} onChange={(v) => set({ event_id: v })} none="No event" />
      </Field>
      <Field label="Student">
        <OptionSelect options={students} value={f.contact_id} onChange={(v) => set({ contact_id: v })} none="No student" />
      </Field>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <button disabled={busy || !f.title.trim()} onClick={save} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
          {busy ? 'Saving…' : task ? 'Save changes' : 'Create task'}
        </button>
        {error && <span className="text-sm text-red-700">Didn’t save: {error}</span>}
        {task && (
          <button
            disabled={busy}
            onClick={() => {
              if (confirm(`Delete "${task.title}"? This can't be undone.`)) call(`/api/iowa/admin/tasks/${task.id}`, 'DELETE');
            }}
            className="px-3 py-2 rounded-md text-sm font-semibold"
            style={{ color: '#b91c1c' }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function TypeSelect({ types, value, onChange }: { types: TypeOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No type</option>
      {types.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

function OptionSelect({
  options,
  value,
  onChange,
  none,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  none: string;
}) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{none}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Tap a task (or a grouped line) on the calendar: it opens here, over the
// calendar, instead of reloading the dashboard and scrolling to the list.
export function TaskPopup(props: TaskListProps & { taskIds: string[]; onClose: () => void }) {
  const { taskIds, onClose, tasks } = props;
  const { call, busy } = useCall();
  const list = taskIds.map((id) => tasks.find((t) => t.id === id)).filter((t): t is CampusTask => !!t);
  const [expanded, setExpanded] = useState<string | null>(list.length === 1 ? list[0].id : null);
  if (list.length === 0) return null;
  const single = list.length === 1;
  const key = taskGroupKey(list[0]);
  const followUp = !single && !!key && !!FOLLOW_UP[key];
  const open = list.filter((t) => t.status !== 'done').length;

  return (
    <Modal
      title={single ? list[0].title : taskGroupTitle(key ?? '', list.length)}
      sub={single ? undefined : `${open} of ${list.length} still open`}
      onClose={onClose}
    >
      {followUp && (
        <div className="mb-4">
          <a
            href="/iowa/admin/students?report=1"
            className="inline-block px-3 py-2 rounded-md text-sm font-semibold"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            Open check-in report →
          </a>
          <p className="text-xs text-[#8a8378] mt-2">Logging a check-in on the report marks that student&apos;s task done.</p>
        </div>
      )}
      {single ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <TaskDetail {...props} t={list[0]} busy={busy} call={call} />
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((t) => (
            <TaskRow
              key={t.id}
              t={t}
              {...props}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              busy={busy}
              call={call}
            />
          ))}
        </ul>
      )}
    </Modal>
  );
}

export function when(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Marking done is the natural moment to say what came of it ("Songs: …"), so
// ask once, optionally, instead of making it a separate step.
function FinishForm({ busy, onDone, onCancel }: { busy: boolean; onDone: (comment: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  return (
    <div className="rounded-md border border-gray-200 bg-[#FAF8F5] p-3">
      <p className="text-xs font-semibold text-[#8a8378] mb-2">Anything to pass along? (optional)</p>
      <textarea
        className={input}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Songs: Great Are You Lord, Goodness of God…"
      />
      <div className="flex gap-2 mt-2">
        <button disabled={busy} onClick={() => onDone(text.trim())} className={btnPrimary} style={{ backgroundColor: '#15803d' }}>
          {text.trim() ? 'Done + send note' : 'Mark done'}
        </button>
        <button onClick={onCancel} className={btnSmall}>Cancel</button>
      </div>
    </div>
  );
}

// What people wrote, oldest first, with a box to add one. Comments email the
// owner and anyone helping, and show on the event this task belongs to.
function Comments({
  t,
  comments,
  nameOf,
}: {
  t: CampusTask;
  comments: TaskActivity[];
  nameOf: (id: string | null) => string;
}) {
  const { call, busy, error } = useCall();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(comments.length === 0);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-[#8a8378] mb-2">
        Notes{comments.length > 0 ? ` (${comments.length})` : ''}
      </p>
      <ul className="space-y-2 mb-2">
        {comments.map((c) => (
          <li key={c.id} className="text-[15px] md:text-sm">
            <span className="font-semibold" style={{ color: 'var(--navy)' }}>{nameOf(c.staff_id)}</span>{' '}
            <span className="text-xs text-[#8a8378]">{when(c.created_at)}</span>
            <p className="text-[#4a4540] whitespace-pre-wrap">{c.action}</p>
          </li>
        ))}
      </ul>
      {open ? (
        <>
          <textarea
            className={input}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened? Everyone on this task gets emailed."
          />
          {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
          <button
            disabled={busy || !text.trim()}
            onClick={async () => {
              if (await call(`/api/iowa/admin/tasks/${t.id}`, 'PATCH', { comment: text })) setText('');
            }}
            className="mt-2 px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Post note
          </button>
        </>
      ) : (
        <button onClick={() => setOpen(true)} className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          + Add a note
        </button>
      )}
    </div>
  );
}

const MAX_FILE_MB = 25;

const fileSize = (bytes: number | null) =>
  bytes === null ? '' : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// A chord chart on the worship task, a permission form on the retreat task.
// The browser uploads straight to Supabase with a signed URL, so a big PDF
// never has to squeeze through the serverless request limit.
function Files({ t, files }: { t: CampusTask; files: TaskFile[] }) {
  const { call, busy } = useCall();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const url = `/api/iowa/admin/tasks/${t.id}/files`;

  async function upload(file: File) {
    setError('');
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`${file.name} is over ${MAX_FILE_MB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const signRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign: { filename: file.name } }),
      });
      const signed = await signRes.json().catch(() => ({}));
      if (!signRes.ok) throw new Error(signed.error || 'Could not start the upload.');

      const { error: upErr } = await supabase.storage
        .from('iowa-task-files')
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || undefined });
      if (upErr) throw new Error(upErr.message);

      const ok = await call(url, 'POST', {
        name: file.name,
        path: signed.path,
        contentType: file.type || null,
        size: file.size,
      });
      if (!ok) throw new Error('Uploaded, but could not attach it.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-[#8a8378] mb-2">Files{files.length > 0 ? ` (${files.length})` : ''}</p>
      {files.length > 0 && (
        <ul className="space-y-1 mb-2 text-sm">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2">
              <a
                href={`${url}/${f.id}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline break-all"
                style={{ color: 'var(--navy)' }}
              >
                {f.name}
              </a>
              <span className="text-xs text-[#8a8378]">{fileSize(f.size_bytes)}</span>
              <button
                disabled={busy}
                onClick={() => call(`${url}/${f.id}`, 'DELETE')}
                className="text-xs text-[#b0a99e] ml-auto"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--navy)' }}>
        {uploading ? 'Uploading…' : '+ Attach a file'}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) upload(file);
          }}
        />
      </label>
      <p className="text-xs text-[#8a8378] mt-1">PDFs, photos, anything up to {MAX_FILE_MB}MB.</p>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
