'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyWithMembers, StudyMember, StudyStatus } from '@/lib/bibleStudies';
import { DAY_NAMES, PICKER_DAYS, formatTime } from '@/lib/bibleStudyFormat';
import { DROP_REASONS, formatDate, isOverdue, type TaskPriority, type TaskStatus } from '@/lib/campusFormat';
import { OverdueTag, PriorityBadge, StatusPill } from '@/components/iowa/campus/ui';

// Open campus tasks linked to a study, shown inside that study's editor.
export interface StudyTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  owner_name: string | null;
}
const StudyTasks = createContext<Record<string, StudyTask[]>>({});

const STATUSES: StudyStatus[] = ['pending_setup', 'forming', 'full', 'activated', 'paused', 'ended'];

const STATUS_COLOR: Record<StudyStatus, string> = {
  pending_setup: '#9d855a',
  forming: '#2563eb',
  full: '#143348',
  activated: '#15803d',
  paused: '#8a8378',
  ended: '#b91c1c',
};

export interface StaffOption {
  id: string;
  name: string;
  active: boolean;
}

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;

// A study is built to land on four; capacity (default 5) leaves a seat for a
// flake. So a full/activated study is only "down" once it drops below four.
const TARGET_SIZE = 4;

function needsAttention(s: StudyWithMembers): string | null {
  const settled = Math.min(TARGET_SIZE, s.capacity);
  if ((s.status === 'full' || s.status === 'activated') && s.activeCount < settled) {
    return `Down to ${s.activeCount}/${settled}`;
  }
  if (s.status === 'forming' && Date.now() - new Date(s.created_at).getTime() > THREE_WEEKS) {
    return 'Forming 3+ weeks, still not full';
  }
  if (s.pulse_status === 'red') return 'Last check-in: needs help';
  return null;
}

export default function IowaAdmin({
  initial: all,
  semester,
  staff,
  meId,
  tasksByStudy = {},
}: {
  initial: StudyWithMembers[];
  semester: string;
  staff: StaffOption[];
  meId: string | null;
  tasksByStudy?: Record<string, StudyTask[]>;
}) {
  const router = useRouter();
  const [mineOnly, setMineOnly] = useState(false);
  const initial = useMemo(
    () => (mineOnly ? all.filter((s) => s.point_staff_id === meId) : all),
    [all, mineOnly, meId]
  );
  const staffById = useMemo(() => new Map(staff.map((p) => [p.id, p])), [staff]);
  const myCount = all.filter((s) => s.point_staff_id === meId).length;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return false;
      }
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of initial) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [initial]);

  const pending = initial.filter((s) => s.status === 'pending_setup');
  const attention = initial
    .map((s) => ({ s, why: needsAttention(s) }))
    .filter((x) => x.why) as { s: StudyWithMembers; why: string }[];

  const byDay = useMemo(() => {
    const map = new Map<number, StudyWithMembers[]>();
    for (const s of initial) {
      const arr = map.get(s.day_of_week) ?? [];
      arr.push(s);
      map.set(s.day_of_week, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [initial]);

  return (
    <StudyTasks.Provider value={tasksByStudy}>
    <div style={{ background: '#FAF8F5', minHeight: '100vh', color: '#1f2937' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            Bible studies
          </h1>
          <span className="flex items-center gap-4">
            <span className="text-sm text-[#8a8378]">{semester}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm font-semibold">
            {[
              { v: false, label: 'All studies' },
              { v: true, label: `Mine (${myCount})` },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => setMineOnly(o.v)}
                className="px-3 py-1.5"
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
        </div>
        <p className="text-sm text-[#8a8378] mb-8">
          {initial.length} total · {counts.forming ?? 0} forming · {counts.full ?? 0} full ·{' '}
          {counts.activated ?? 0} activated · {counts.paused ?? 0} paused
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* New study */}
        <div className="mb-8">
          <button
            onClick={() => setShowNew((v) => !v)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            {showNew ? 'Close' : '+ New study'}
          </button>
          {showNew && <NewStudyForm staff={staff} meId={meId} busy={busy} onCreate={(b) => call('/api/iowa/admin/studies', 'POST', b)} />}
        </div>

        {pending.length > 0 && (
          <Section title="Pending setup" hint="Student started it — add a location and set it to forming.">
            {pending.map((s) => (
              <StudyRow
                key={s.id}
                s={s}
                all={all}
                staff={staffById}
                expanded={expanded === s.id}
                onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                busy={busy}
                call={call}
              />
            ))}
          </Section>
        )}

        {attention.length > 0 && (
          <Section title="Needs attention">
            {attention.map(({ s, why }) => (
              <StudyRow
                key={s.id}
                s={s}
                flag={why}
                all={all}
                staff={staffById}
                expanded={expanded === s.id}
                onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                busy={busy}
                call={call}
              />
            ))}
          </Section>
        )}

        <Section title="All studies">
          {initial.length === 0 && (
            <p className="text-[#8a8378] text-sm">
              {mineOnly ? 'Nothing is assigned to you right now.' : 'No studies yet. Add one above.'}
            </p>
          )}
          {byDay.map(([day, list]) => (
            <div key={day} className="mb-5">
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--maroon)' }}
              >
                {DAY_NAMES[day]}
              </h3>
              <div className="space-y-2">
                {list
                  .slice()
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s) => (
                    <StudyRow
                      key={s.id}
                      s={s}
                      all={all}
                staff={staffById}
                      expanded={expanded === s.id}
                      onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                      busy={busy}
                      call={call}
                    />
                  ))}
              </div>
            </div>
          ))}
        </Section>
      </div>
    </div>
    </StudyTasks.Provider>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>
        {title}
      </h2>
      {hint && <p className="text-sm text-[#8a8378] mb-3">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

type CallFn = (url: string, method: string, body?: unknown) => Promise<boolean>;

function StudyRow({
  s,
  all,
  expanded,
  onToggle,
  busy,
  call,
  flag,
  staff,
}: {
  s: StudyWithMembers;
  all: StudyWithMembers[];
  staff: Map<string, StaffOption>;
  expanded: boolean;
  onToggle: () => void;
  busy: boolean;
  call: CallFn;
  flag?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="font-semibold shrink-0" style={{ color: 'var(--navy)' }}>
            {DAY_NAMES[s.day_of_week].slice(0, 3)} {formatTime(s.start_time)}
          </span>
          <span className="text-sm text-[#8a8378] truncate">{s.location || '— no location'}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {s.point_staff_id && staff.get(s.point_staff_id) && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#e8eef3', color: '#143348' }}
              title="Staff on point"
            >
              {staff.get(s.point_staff_id)!.name.split(' ')[0]}
            </span>
          )}
          {flag && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {flag}
            </span>
          )}
          <span className="text-xs text-[#8a8378]">
            {s.activeCount}/{s.capacity}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: STATUS_COLOR[s.status] }}
          >
            {s.status.replace('_', ' ')}
          </span>
        </span>
      </button>
      {expanded && <StudyEditor s={s} all={all} staff={staff} busy={busy} call={call} />}
    </div>
  );
}

function StudyEditor({
  s,
  all,
  staff,
  busy,
  call,
}: {
  s: StudyWithMembers;
  all: StudyWithMembers[];
  staff: Map<string, StaffOption>;
  busy: boolean;
  call: CallFn;
}) {
  const [draft, setDraft] = useState({
    day_of_week: s.day_of_week,
    start_time: (s.start_time ?? '').slice(0, 5),
    location: s.location ?? '',
    status: s.status,
    accepting_signups: s.accepting_signups,
    capacity: s.capacity,
    leader_name: s.leader_name ?? '',
    leader_phone: s.leader_phone ?? '',
    leader_email: s.leader_email ?? '',
    notes: s.notes ?? '',
    break_plan: s.break_plan ?? '',
    point_staff_id: s.point_staff_id ?? '',
  });

  function studyPatch() {
    return {
      ...draft,
      day_of_week: Number(draft.day_of_week),
      start_time: draft.start_time,
      location: draft.location.trim() || null,
      capacity: Number(draft.capacity),
      point_staff_id: draft.point_staff_id || null,
    };
  }

  async function save() {
    return call(`/api/iowa/admin/studies/${s.id}`, 'PATCH', studyPatch());
  }

  const digits = (p: string) => p.replace(/\D/g, '');
  const leaderComplete =
    !!draft.leader_name.trim() && !!draft.leader_phone.trim() && !!draft.leader_email.trim();
  const leaderIsMember = s.members.some(
    (m) => m.status === 'active' && digits(m.phone) === digits(draft.leader_phone)
  );

  async function addLeaderToRoster() {
    const ok = await save();
    if (ok === false) return;
    await call('/api/iowa/admin/members', 'POST', {
      studyId: s.id,
      name: draft.leader_name,
      phone: draft.leader_phone,
      email: draft.leader_email,
    });
  }

  return (
    <div className="border-t border-gray-100 px-4 py-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Day">
          <select
            className={input}
            value={String(draft.day_of_week)}
            onChange={(e) => setDraft({ ...draft, day_of_week: Number(e.target.value) })}
          >
            {PICKER_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time">
          <input
            type="time"
            className={input}
            value={draft.start_time}
            onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
          />
        </Field>
        <Field label="Location">
          <input
            className={input}
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            className={input}
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as StudyStatus })}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            min={1}
            max={12}
            className={input}
            value={draft.capacity}
            onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
          />
        </Field>
        <Field label="Accepting signups">
          <label className="flex items-center gap-2 text-sm py-2 text-gray-700">
            <input
              type="checkbox"
              checked={draft.accepting_signups}
              onChange={(e) => setDraft({ ...draft, accepting_signups: e.target.checked })}
            />
            Listed to students when a seat is open
          </label>
        </Field>
        <Field label="Staff on point">
          <StaffSelect
            staff={[...staff.values()]}
            value={draft.point_staff_id}
            onChange={(v) => setDraft({ ...draft, point_staff_id: v })}
          />
        </Field>
        <Field label="Leader name">
          <input
            className={input}
            value={draft.leader_name}
            onChange={(e) => setDraft({ ...draft, leader_name: e.target.value })}
          />
        </Field>
        <Field label="Leader phone">
          <input
            className={input}
            value={draft.leader_phone}
            onChange={(e) => setDraft({ ...draft, leader_phone: e.target.value })}
          />
        </Field>
        <Field label="Leader email">
          <input
            className={input}
            value={draft.leader_email}
            onChange={(e) => setDraft({ ...draft, leader_email: e.target.value })}
          />
        </Field>
      </div>

      {leaderComplete && !leaderIsMember && (
        <div className="rounded-md bg-[#FAF8F5] border border-gray-200 px-3 py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-700">
            Leading this study and one of the four? Seat them on the roster too.
          </span>
          <button
            onClick={addLeaderToRoster}
            disabled={busy}
            className="shrink-0 px-3 py-1.5 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Save + add leader to roster
          </button>
        </div>
      )}

      <Field label="Notes">
        <textarea
          rows={2}
          className={input}
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </Field>
      {draft.status === 'paused' && (
        <Field label="Break plan">
          <input
            className={input}
            placeholder="weekly on Meet / monthly / off until spring"
            value={draft.break_plan}
            onChange={(e) => setDraft({ ...draft, break_plan: e.target.value })}
          />
        </Field>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)' }}
      >
        Save study
      </button>

      <LinkedTasks studyId={s.id} />

      {/* Roster */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--navy)' }}>
          Roster
        </p>
        {s.members.length === 0 && <p className="text-sm text-[#8a8378]">No students yet.</p>}
        <ul className="space-y-1.5">
          {s.members.map((m) => (
            <MemberRow key={m.id} m={m} studyId={s.id} others={all} staff={staff} busy={busy} call={call} />
          ))}
        </ul>
        <AddMemberForm studyId={s.id} staff={staff} busy={busy} call={call} />
      </div>
    </div>
  );
}

function MemberRow({
  m,
  studyId,
  others,
  staff,
  busy,
  call,
}: {
  m: StudyMember;
  studyId: string;
  others: StudyWithMembers[];
  staff: Map<string, StaffOption>;
  busy: boolean;
  call: CallFn;
}) {
  const dropped = m.status === 'dropped';
  const [moving, setMoving] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const reasonLabel = DROP_REASONS.find((r) => r.key === m.drop_reason)?.label;

  return (
    <li className="text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={dropped ? 'text-[#b0a99e] line-through' : 'text-[#4a4540]'}>
          {m.name}
          {/* Phone AND email — you can't text someone their email address. */}
          <span className="text-[#8a8378]">
            {' · '}{[m.phone, m.email].filter(Boolean).join(' · ')}
            {m.year ? ` · ${m.year}` : ''}
            {m.met_by_staff_id && staff.get(m.met_by_staff_id)
              ? ` · met ${staff.get(m.met_by_staff_id)!.name.split(' ')[0]}`
              : m.met_by_other === 'friend'
                ? ' · friend invited'
                : ''}
          </span>
          {!dropped && m.first_showed === true && (
            <span className="ml-1 text-xs font-semibold text-green-700" title="Made it to their first study">✓ came</span>
          )}
          {!dropped && m.first_showed === false && (
            <span className="ml-1 text-xs font-semibold text-red-700" title="Missed their first study">✗ no-show</span>
          )}
          {dropped && reasonLabel && (
            <span className="no-underline inline-block ml-1 text-xs text-[#8a8378]" style={{ textDecoration: 'none' }}>
              ({reasonLabel}
              {m.drop_note ? `: ${m.drop_note}` : ''})
            </span>
          )}
        </span>
        <span className="flex gap-1 shrink-0">
          {!dropped && (
            <button
              onClick={() => setMoving((v) => !v)}
              disabled={busy}
              className="text-xs font-semibold px-2 py-1 rounded border transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#d1d5db', color: '#143348' }}
            >
              {moving ? 'Cancel' : 'Move'}
            </button>
          )}
          <button
            onClick={() =>
              dropped
                ? call(`/api/iowa/admin/members/${m.id}`, 'PATCH', { status: 'active' })
                : setDropping((v) => !v)
            }
            disabled={busy}
            className="text-xs font-semibold px-2 py-1 rounded border transition hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#d1d5db', color: dropped ? '#15803d' : '#b91c1c' }}
          >
            {dropped ? 'Restore' : dropping ? 'Cancel' : 'Drop'}
          </button>
        </span>
      </div>

      {/* Why they're leaving — feeds re-invites next semester. */}
      {dropping && !dropped && (
        <div className="mt-2 rounded-md border border-gray-200 bg-[#FAF8F5] p-2 flex flex-wrap gap-2 items-center">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
          >
            <option value="">Why are they leaving?</option>
            {DROP_REASONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 min-w-[10rem] px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
          />
          <button
            disabled={busy || !reason}
            onClick={async () => {
              const ok = await call(`/api/iowa/admin/members/${m.id}`, 'PATCH', {
                status: 'dropped',
                dropReason: reason,
                dropNote: note,
              });
              if (ok) setDropping(false);
            }}
            className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#b91c1c' }}
          >
            Drop {m.name.split(' ')[0]}
          </button>
        </div>
      )}

      {moving && (
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => {
            if (e.target.value) call(`/api/iowa/admin/members/${m.id}`, 'PATCH', { studyId: e.target.value });
          }}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
        >
          <option value="">Move {m.name} to…</option>
          {others
            .filter((o) => o.id !== studyId)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {DAY_NAMES[o.day_of_week]} {formatTime(o.start_time)}
                {o.location ? ` · ${o.location}` : ''} ({o.activeCount}/{o.capacity})
              </option>
            ))}
        </select>
      )}
    </li>
  );
}

function AddMemberForm({
  studyId,
  staff,
  busy,
  call,
}: {
  studyId: string;
  staff: Map<string, StaffOption>;
  busy: boolean;
  call: CallFn;
}) {
  const [f, setF] = useState({ name: '', phone: '', email: '', year: '', source: '', metBy: '' });
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-semibold hover:underline"
        style={{ color: 'var(--navy)' }}
      >
        + Add a student
      </button>
    );
  }

  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-2">
      <input className={input} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input className={input} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={input} placeholder="Year (optional)" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
      <select className={input} value={f.metBy} onChange={(e) => setF({ ...f, metBy: e.target.value })}>
        <option value="">Who met them? (optional)</option>
        {[...staff.values()]
          .filter((p) => p.active)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        <option value="friend">A friend invited them</option>
        <option value="self">Found it on their own</option>
      </select>
      <input
        className={input}
        placeholder="Source — org fair / referred by / cold (optional)"
        value={f.source}
        onChange={(e) => setF({ ...f, source: e.target.value })}
      />
      <div className="sm:col-span-2 flex gap-2">
        <button
          disabled={busy}
          onClick={async () => {
            const ok = await call('/api/iowa/admin/members', 'POST', { ...f, studyId });
            if (ok) {
              setF({ name: '', phone: '', email: '', year: '', source: '', metBy: '' });
              setOpen(false);
            }
          }}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-sm text-[#8a8378]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewStudyForm({
  staff,
  meId,
  busy,
  onCreate,
}: {
  staff: StaffOption[];
  meId: string | null;
  busy: boolean;
  onCreate: (body: unknown) => Promise<boolean>;
}) {
  const [f, setF] = useState({
    dayOfWeek: '',
    startTime: '',
    location: '',
    capacity: 5,
    leaderName: '',
    leaderPhone: '',
    leaderEmail: '',
    notes: '',
    addLeaderAsMember: true,
    pointStaffId: meId ?? '',
  });

  const leaderFilled = !!(f.leaderName.trim() && f.leaderPhone.trim() && f.leaderEmail.trim());

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 grid sm:grid-cols-2 gap-3">
      <Field label="Day">
        <select
          className={input}
          value={f.dayOfWeek}
          onChange={(e) => setF({ ...f, dayOfWeek: e.target.value })}
        >
          <option value="">Pick a day</option>
          {PICKER_DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Time">
        <input
          type="time"
          className={input}
          value={f.startTime}
          onChange={(e) => setF({ ...f, startTime: e.target.value })}
        />
      </Field>
      <Field label="Location">
        <input
          className={input}
          value={f.location}
          onChange={(e) => setF({ ...f, location: e.target.value })}
        />
      </Field>
      <Field label="Capacity">
        <input
          type="number"
          min={1}
          max={12}
          className={input}
          value={f.capacity}
          onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })}
        />
      </Field>
      <Field label="Staff on point">
        <StaffSelect
          staff={staff}
          value={f.pointStaffId}
          onChange={(v) => setF({ ...f, pointStaffId: v })}
        />
      </Field>
      <Field label="Leader name">
        <input
          className={input}
          value={f.leaderName}
          onChange={(e) => setF({ ...f, leaderName: e.target.value })}
        />
      </Field>
      <Field label="Leader phone">
        <input
          className={input}
          value={f.leaderPhone}
          onChange={(e) => setF({ ...f, leaderPhone: e.target.value })}
        />
      </Field>
      <Field label="Leader email">
        <input
          className={input}
          value={f.leaderEmail}
          onChange={(e) => setF({ ...f, leaderEmail: e.target.value })}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes">
          <textarea
            rows={2}
            className={input}
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>
      </div>
      {f.leaderName.trim() && (
        <div className="sm:col-span-2">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5"
              disabled={!leaderFilled}
              checked={leaderFilled && f.addLeaderAsMember}
              onChange={(e) => setF({ ...f, addLeaderAsMember: e.target.checked })}
            />
            <span>
              This leader is one of the four — add them to the roster now.
              <span className="block text-xs text-[#8a8378]">
                {leaderFilled
                  ? 'Leave unchecked if you’re facilitating this one yourself.'
                  : 'Fill in leader phone and email above to seat them on the roster.'}
              </span>
            </span>
          </label>
        </div>
      )}
      <div className="sm:col-span-2">
        <button
          disabled={busy}
          onClick={() =>
            onCreate({
              ...f,
              dayOfWeek: Number(f.dayOfWeek),
              addLeaderAsMember: leaderFilled && f.addLeaderAsMember,
            })
          }
          className="px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Create study
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#8a8378' }}>
        {label}
      </span>
      {children}
    </label>
  );
}

// Who on staff has to be in the room. Inactive staff only show if they're
// already the one assigned, so the current value never silently disappears.
function StaffSelect({
  staff,
  value,
  onChange,
}: {
  staff: StaffOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Nobody — a student leader has it</option>
      {staff
        .filter((p) => p.active || p.id === value)
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.active ? '' : ' (inactive)'}
          </option>
        ))}
    </select>
  );
}

function LinkedTasks({ studyId }: { studyId: string }) {
  const tasks = useContext(StudyTasks)[studyId] ?? [];
  return (
    <div className="pt-3 border-t border-gray-100">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
          Tasks
        </p>
        <a
          href={`/iowa/admin/tasks?new=1&study=${studyId}`}
          className="text-sm font-semibold hover:underline"
          style={{ color: 'var(--navy)' }}
        >
          + Add a task
        </a>
      </div>
      {tasks.length === 0 && <p className="text-sm text-[#8a8378]">No open tasks for this study.</p>}
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <li key={t.id} className="text-sm flex flex-wrap items-center gap-2">
            <a href={`/iowa/admin/tasks?task=${t.id}`} className="font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
              {t.title}
            </a>
            <PriorityBadge priority={t.priority} />
            <StatusPill status={t.status} />
            {isOverdue(t) && <OverdueTag />}
            <span className="text-[#8a8378]">
              {[t.owner_name ?? 'Unowned', t.due_date ? `due ${formatDate(t.due_date)}` : null].filter(Boolean).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
