'use client';

import { useMemo, useState } from 'react';
import type { CampusTask, TaskActivity } from '@/lib/campusTasks';
import {
  PRIORITIES,
  TASK_STATUSES,
  chicagoToday,
  compareTasks,
  formatDate,
  isOverdue,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/campusFormat';
import {
  ErrorBox,
  Field,
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
  const [view, setView] = useState<View>(openTaskId ? 'all' : 'mine');
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
    </div>
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
          <span className="block text-xs text-[#8a8378] mt-0.5">
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
            <span className="text-xs" style={{ color: overdue ? '#b91c1c' : '#8a8378' }}>
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
  const url = `/api/iowa/admin/tasks/${t.id}`;
  const mineOwned = t.owner_id === meId;
  const helping = !!meId && t.helper_ids.includes(meId);
  // Activity with no person is the automation (welcome, confirm, reconnect…).
  const nameOf = (id: string | null) => (id ? staff.find((s) => s.id === id)?.name ?? 'Someone' : 'Auto:');
  const log = activity.filter((a) => a.task_id === t.id);
  const owner = staff.find((s) => s.id === t.owner_id);
  const link = linkLabel(t, props);
  const toggle = 'text-xs font-semibold px-2 py-1 rounded border border-gray-300 hover:bg-gray-50';

  return (
    <div className="border-t border-gray-100 px-4 py-3 space-y-3">
      {t.description && <p className="text-sm text-[#4a4540] whitespace-pre-wrap">{t.description}</p>}
      <p className="text-xs text-[#8a8378]">
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
          <button disabled={busy} onClick={() => call(url, 'PATCH', { status: 'done' })} className={btnPrimary} style={{ backgroundColor: '#15803d' }}>
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
          {log.length > 0 && (
            <button onClick={() => setHistory((v) => !v)} className={toggle} style={{ color: '#8a8378' }}>
              History ({log.length}) {history ? '▴' : '▾'}
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

      {history && (
        <ul className="text-xs text-[#8a8378] space-y-0.5">
          {log.map((a) => (
            <li key={a.id}>
              {nameOf(a.staff_id)} {a.action} ·{' '}
              {new Date(a.created_at).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
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
