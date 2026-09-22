'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyMember, StudyStatus, StudyWithMembers } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import { formatDate } from '@/lib/campusFormat';
import { DROP_REASONS, STUDY_ROLES, roleVerb, teamOn, type StudyRole, type StudyTeamRow } from '@/lib/campusFormat';
import DeclineForm from '@/components/iowa/DeclineForm';
import { Modal, useCall, type CallFn, type StaffOption } from '@/components/iowa/campus/ui';

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
const sms = (p: string) => `sms:${p.replace(/[^\d+]/g, '')}`;

// Tap a Bible study on the calendar: everything you need at a glance — where,
// who's leading, who's on point, and the roster with one-tap call / text /
// email. Study details (status, leader, on point, time, place) edit right here
// under "Edit details"; the Studies page is for creating studies and the
// all-semesters list.
export default function StudyCard({
  study: s,
  date,
  staff,
  others = [],
  team = [],
  meId = null,
  onClose,
}: {
  study: StudyWithMembers;
  date: string;
  staff: StaffOption[];
  others?: StudyWithMembers[]; // for Move
  team?: StudyTeamRow[];
  meId?: string | null;
  onClose: () => void;
}) {
  const { call, busy, error } = useCall();
  const nameOf = (id: string | null) => (id ? staff.find((p) => p.id === id)?.name ?? null : null);
  const active = s.members.filter((m) => m.status === 'active');
  const dropped = s.members.filter((m) => m.status === 'dropped');
  const onPoint = nameOf(s.point_staff_id);
  const link = 'font-semibold underline';

  return (
    <Modal
      title={`${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)} Bible study`}
      sub={
        <>
          {formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}
          {s.location ? ` · ${s.location}` : ''}
          {s.online ? ' · online' : ''}
        </>
      }
      onClose={onClose}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px] md:text-sm mb-5">
        <dt className="text-[#8a8378]">Students</dt>
        <dd className="text-[#4a4540]">
          {active.length} of {s.capacity} · <span className="capitalize">{s.status.replace('_', ' ')}</span>
        </dd>
        <dt className="text-[#8a8378]">Leader</dt>
        <dd className="text-[#4a4540]">
          {s.leader_name ? (
            <>
              {s.leader_name}
              {s.leader_phone && (
                <>
                  {' · '}
                  <a href={tel(s.leader_phone)} className={link} style={{ color: 'var(--navy)' }}>call</a>
                  {' · '}
                  <a href={sms(s.leader_phone)} className={link} style={{ color: 'var(--navy)' }}>text</a>
                </>
              )}
            </>
          ) : (
            <span className="text-[#8a8378]">No student leader yet</span>
          )}
        </dd>
        <dt className="text-[#8a8378]">On point</dt>
        <dd className="text-[#4a4540]">{onPoint ?? <span className="text-[#8a8378]">Nobody</span>}</dd>
        {s.notes && (
          <>
            <dt className="text-[#8a8378]">Notes</dt>
            <dd className="text-[#4a4540] whitespace-pre-wrap">{s.notes}</dd>
          </>
        )}
      </dl>

      <DetailsEditor s={s} staff={staff} />

      <TeamSection s={s} date={date} staff={staff} team={team} meId={meId} busy={busy} call={call} />

      <p className="text-sm font-bold mb-2" style={{ color: 'var(--navy)' }}>Roster</p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      {active.length === 0 ? (
        <p className="text-sm text-[#8a8378] mb-4">No students yet.</p>
      ) : (
        <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-4">
          {active.map((m) => {
            const met = m.met_by_staff_id ? nameOf(m.met_by_staff_id)?.split(' ')[0] : null;
            return (
              <li key={m.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold text-[#1f2937]">
                    {m.name}
                    {m.first_showed === true && <span className="ml-1.5 text-xs font-semibold text-green-700">✓ came</span>}
                    {m.first_showed === false && <span className="ml-1.5 text-xs font-semibold text-red-700">✗ no-show</span>}
                  </span>
                  <span className="text-sm text-[#8a8378]">
                    {[m.year, met ? `met ${met}` : m.met_by_other === 'friend' ? 'friend invited' : null].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[15px] md:text-sm">
                  {m.phone && (
                    <>
                      <a href={tel(m.phone)} className={link} style={{ color: 'var(--navy)' }}>Call</a>
                      <a href={sms(m.phone)} className={link} style={{ color: 'var(--navy)' }}>Text</a>
                      <span className="text-[#8a8378]">{m.phone}</span>
                    </>
                  )}
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="underline text-[#4a4540] break-all">{m.email}</a>
                  )}
                </div>
                <SeatActions m={m} studyId={s.id} others={others} busy={busy} call={call} />
              </li>
            );
          })}
        </ul>
      )}

      {dropped.length > 0 && (
        <details className="mb-4">
          <summary className="text-sm text-[#8a8378] cursor-pointer">Dropped ({dropped.length})</summary>
          <ul className="mt-2 text-sm text-[#8a8378] space-y-1">
            {dropped.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {m.name}
                  {m.drop_reason ? ` · ${DROP_REASONS.find((r) => r.key === m.drop_reason)?.label ?? m.drop_reason}` : ''}
                  {m.drop_note ? `: ${m.drop_note}` : ''}
                </span>
                <button
                  disabled={busy}
                  onClick={() => call(`/api/iowa/admin/members/${m.id}`, 'PATCH', { status: 'active' })}
                  className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                  style={{ color: '#15803d' }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <a href="/iowa/admin/studies" className="text-sm text-[#8a8378] underline">
        All studies →
      </a>
    </Modal>
  );
}

// Move / Drop for one student, same as the Studies page. Drop asks why (it
// drives re-invites next semester).
function SeatActions({
  m,
  studyId,
  others,
  busy,
  call,
}: {
  m: StudyMember;
  studyId: string;
  others: StudyWithMembers[];
  busy: boolean;
  call: CallFn;
}) {
  const [mode, setMode] = useState<'none' | 'move' | 'drop'>('none');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const btn = 'text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 bg-white disabled:opacity-50';
  const field = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
  const targets = others.filter((o) => o.id !== studyId && ['pending_setup', 'forming', 'full', 'activated'].includes(o.status));

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => setMode(mode === 'move' ? 'none' : 'move')} className={btn} style={{ color: 'var(--navy)' }}>
          {mode === 'move' ? 'Cancel' : 'Move'}
        </button>
        <button disabled={busy} onClick={() => setMode(mode === 'drop' ? 'none' : 'drop')} className={btn} style={{ color: '#b91c1c' }}>
          {mode === 'drop' ? 'Cancel' : 'Drop'}
        </button>
      </div>
      {mode === 'move' && (
        <select
          defaultValue=""
          disabled={busy}
          onChange={async (e) => {
            if (e.target.value && (await call(`/api/iowa/admin/members/${m.id}`, 'PATCH', { studyId: e.target.value }))) setMode('none');
          }}
          className={`${field} mt-2 w-full`}
        >
          <option value="">Move {m.name.split(' ')[0]} to…</option>
          {targets.map((o) => (
            <option key={o.id} value={o.id}>
              {DAY_NAMES[o.day_of_week]} {formatTime(o.start_time)}
              {o.location ? ` · ${o.location}` : ''} ({o.activeCount}/{o.capacity}){o.semester !== others.find((x) => x.id === studyId)?.semester ? ` · ${o.semester}` : ''}
            </option>
          ))}
        </select>
      )}
      {mode === 'drop' && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
            <option value="">Why are they leaving?</option>
            {DROP_REASONS.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={`${field} flex-1 min-w-[9rem]`} />
          <button
            disabled={busy || !reason}
            onClick={async () => {
              if (await call(`/api/iowa/admin/members/${m.id}`, 'PATCH', { status: 'dropped', dropReason: reason, dropNote: note })) setMode('none');
            }}
            className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#b91c1c' }}
          >
            Drop {m.name.split(' ')[0]}
          </button>
        </div>
      )}
    </div>
  );
}

// Who's with the person on point: Shadowing / Assisting / Leading, for this
// date or every week. Adding someone invites them (accept / decline).
function TeamSection({
  s,
  date,
  staff,
  team,
  meId,
  busy,
  call,
}: {
  s: StudyWithMembers;
  date: string;
  staff: StaffOption[];
  team: StudyTeamRow[];
  meId: string | null;
  busy: boolean;
  call: CallFn;
}) {
  const [f, setF] = useState({ staff_id: '', role: 'shadow' as StudyRole, scope: 'once' as 'once' | 'weekly' });
  const [declining, setDeclining] = useState(false);
  const router = useRouter();
  const crew = teamOn(s.id, date, team);
  const nameOf = (id: string) => staff.find((p) => p.id === id)?.name ?? 'Someone';
  const mine = crew.find((t) => t.staff_id === meId && t.response === 'pending');
  const field = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
  const shortDate = formatDate(date, { month: 'short', day: 'numeric' });

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-sm font-bold mb-2" style={{ color: 'var(--navy)' }}>Team · {shortDate}</p>
      <ul className="text-[15px] md:text-sm space-y-1 mb-3">
        <li className="text-[#4a4540]">
          <span className="font-semibold">{s.point_staff_id ? nameOf(s.point_staff_id) : 'Nobody'}</span>
          <span className="text-[#8a8378]"> · on point</span>
        </li>
        {crew.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-x-2">
            <span className="font-bold" style={{ color: t.response === 'accepted' ? '#15803d' : t.response === 'declined' ? '#b91c1c' : '#b45309' }}>
              {t.response === 'accepted' ? '✓' : t.response === 'declined' ? '✗' : '?'}
            </span>
            <span className="text-[#4a4540]">{nameOf(t.staff_id)}</span>
            <span className="text-[#8a8378]">
              · {roleVerb(t.role)} {t.occurrence ? 'this week' : 'every week'}
              {t.response === 'pending' ? ' · hasn’t answered' : ''}
              {t.response === 'declined' ? ` · can’t${t.note ? `: ${t.note}` : ''}` : ''}
            </span>
            <button disabled={busy} onClick={() => call(`/api/iowa/admin/study-team?id=${t.id}`, 'DELETE')} className="text-xs text-[#b0a99e]" title="Remove">
              ✕
            </button>
          </li>
        ))}
      </ul>

      {mine && (
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-amber-800">You’re invited to {roleVerb(mine.role)}.</span>
            <button
              disabled={busy}
              onClick={() => call(`/api/iowa/admin/study-team/${mine.id}/respond`, 'POST', { response: 'accepted' })}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#15803d' }}
            >
              I’m in
            </button>
            <button onClick={() => setDeclining((v) => !v)} className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
              Can’t do it
            </button>
          </div>
          {declining && <DeclineForm endpoint={`/api/iowa/admin/study-team/${mine.id}/respond`} compact onDone={() => router.refresh()} />}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select className={field} value={f.staff_id} onChange={(e) => setF({ ...f, staff_id: e.target.value })}>
          <option value="">Add someone…</option>
          {staff
            .filter((p) => p.active && p.id !== s.point_staff_id)
            .map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
        <select className={field} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as StudyRole })}>
          {STUDY_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        <select className={field} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value as 'once' | 'weekly' })}>
          <option value="once">Just {shortDate}</option>
          <option value="weekly">Every week</option>
        </select>
        <button
          disabled={busy || !f.staff_id}
          onClick={async () => {
            const ok = await call('/api/iowa/admin/study-team', 'POST', {
              study_id: s.id,
              staff_id: f.staff_id,
              role: f.role,
              occurrence: f.scope === 'once' ? date : null,
            });
            if (ok) setF({ ...f, staff_id: '' });
          }}
          className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Invite
        </button>
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { key: StudyStatus; label: string }[] = [
  { key: 'pending_setup', label: 'Pending setup' },
  { key: 'forming', label: 'Forming' },
  { key: 'full', label: 'Full' },
  { key: 'activated', label: 'Activated' },
  { key: 'paused', label: 'Paused' },
  { key: 'ended', label: 'Ended' },
];

// Everything about the study itself, same fields as the Studies page. Saves in
// one PATCH (which re-syncs Google and emails a newly assigned point person).
function DetailsEditor({ s, staff }: { s: StudyWithMembers; staff: StaffOption[] }) {
  const { call, busy, error } = useCall();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const initial = () => ({
    status: s.status,
    point_staff_id: s.point_staff_id ?? '',
    leader_name: s.leader_name ?? '',
    leader_phone: s.leader_phone ?? '',
    leader_email: s.leader_email ?? '',
    day_of_week: s.day_of_week,
    start_time: s.start_time.slice(0, 5),
    location: s.location ?? '',
    online: s.online,
    capacity: s.capacity,
    accepting_signups: s.accepting_signups,
    notes: s.notes ?? '',
  });
  const [f, setF] = useState(initial);
  const set = (p: Partial<ReturnType<typeof initial>>) => setF((c) => ({ ...c, ...p }));
  const field = 'w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
  const label = 'block text-xs font-semibold text-[#8a8378] mb-1';

  async function save() {
    const ok = await call(`/api/iowa/admin/studies/${s.id}`, 'PATCH', {
      ...f,
      point_staff_id: f.point_staff_id || null,
      leader_name: f.leader_name.trim() || null,
      leader_phone: f.leader_phone.trim() || null,
      leader_email: f.leader_email.trim() || null,
      notes: f.notes.trim() || null,
      start_time: f.start_time.length === 5 ? `${f.start_time}:00` : f.start_time,
      capacity: Number(f.capacity) || s.capacity,
    });
    if (ok) {
      setOpen(false);
      setSaved(true);
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { if (!open) setF(initial()); setOpen((v) => !v); setSaved(false); }}
          className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
          style={{ color: 'var(--navy)' }}
        >
          {open ? 'Close edit ▴' : 'Edit details ▾'}
        </button>
        {saved && <span className="text-xs font-semibold text-green-700">Saved ✓</span>}
      </div>
      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-[#FAF8F5] p-3 grid grid-cols-2 gap-3">
          <div>
            <span className={label}>Status</span>
            <select className={field} value={f.status} onChange={(e) => set({ status: e.target.value as StudyStatus })}>
              {STATUS_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>On point</span>
            <select className={field} value={f.point_staff_id} onChange={(e) => set({ point_staff_id: e.target.value })}>
              <option value="">Nobody</option>
              {staff.filter((p) => p.active || p.id === f.point_staff_id).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <span className={label}>Student leader</span>
            <div className="grid sm:grid-cols-3 gap-2">
              <input className={field} placeholder="Name" value={f.leader_name} onChange={(e) => set({ leader_name: e.target.value })} />
              <input className={field} placeholder="Phone" value={f.leader_phone} onChange={(e) => set({ leader_phone: e.target.value })} />
              <input className={field} placeholder="Email" value={f.leader_email} onChange={(e) => set({ leader_email: e.target.value })} />
            </div>
          </div>
          <div>
            <span className={label}>Day</span>
            <select className={field} value={f.day_of_week} onChange={(e) => set({ day_of_week: Number(e.target.value) })}>
              {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Time</span>
            <input type="time" className={field} value={f.start_time} onChange={(e) => set({ start_time: e.target.value })} />
          </div>
          <div className="col-span-2">
            <span className={label}>Location</span>
            <input className={field} placeholder="Where they meet" value={f.location} onChange={(e) => set({ location: e.target.value })} />
          </div>
          <div>
            <span className={label}>Capacity</span>
            <input type="number" min={1} className={field} value={f.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col justify-end gap-1 text-sm text-[#4a4540]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.online} onChange={(e) => set({ online: e.target.checked })} /> Online
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.accepting_signups} onChange={(e) => set({ accepting_signups: e.target.checked })} /> Taking signups
            </label>
          </div>
          <div className="col-span-2">
            <span className={label}>Notes</span>
            <textarea className={field} rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
          {error && <p className="col-span-2 text-sm text-red-700">{error}</p>}
          <div className="col-span-2">
            <button
              disabled={busy}
              onClick={save}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
