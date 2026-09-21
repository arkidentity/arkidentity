'use client';

import { useState } from 'react';
import type { StudyMember, StudyWithMembers } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import { formatDate } from '@/lib/campusFormat';
import { DROP_REASONS } from '@/lib/campusFormat';
import { Modal, useCall, type CallFn, type StaffOption } from '@/components/iowa/campus/ui';

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
const sms = (p: string) => `sms:${p.replace(/[^\d+]/g, '')}`;

// Tap a Bible study on the calendar: everything you need at a glance — where,
// who's leading, who's on point, and the roster with one-tap call / text /
// email. Editing lives on the Studies page.
export default function StudyCard({
  study: s,
  date,
  staff,
  others = [],
  onClose,
}: {
  study: StudyWithMembers;
  date: string;
  staff: StaffOption[];
  others?: StudyWithMembers[]; // for Move
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

      <a
        href="/iowa/admin/studies"
        className="inline-block px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 bg-white"
        style={{ color: 'var(--navy)' }}
      >
        Edit in Studies →
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
