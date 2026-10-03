'use client';

import { useState } from 'react';
import type { PlanView } from '@/lib/semesterPlan';
import { PICKER_DAYS } from '@/lib/bibleStudyFormat';

// Plan a group's next semester: continue as one group, multiply into two or
// three (choose who goes where), or not continuing. Used in the admin (with a
// staff-on-point picker) and on the student leader's private link.
type Mode = 'continue' | 'multiply' | 'stop';

interface GroupDraft {
  day_of_week: string;
  start_time: string;
  location: string;
  online: boolean;
  point_staff_id: string;
  leader_name: string;
  leader_phone: string;
  leader_email: string;
}

const field = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';
const label = 'block text-xs font-semibold mb-1 uppercase tracking-wide text-[#8a8378]';

export default function PlanForm({
  view,
  submitUrl,
  staff,
  onDone,
}: {
  view: PlanView;
  submitUrl: string;
  staff?: { id: string; name: string }[]; // admin only
  onDone?: () => void;
}) {
  const { study, members, semesters } = view;
  const [semester, setSemester] = useState(semesters[0]?.name ?? '');
  const [mode, setMode] = useState<Mode>('continue');
  const blank = (i: number): GroupDraft => ({
    day_of_week: '',
    start_time: '',
    location: i === 0 ? study.location ?? '' : '',
    online: study.online,
    point_staff_id: study.point_staff_id ?? '',
    leader_name: i === 0 ? study.leader_name ?? '' : '',
    leader_phone: i === 0 ? study.leader_phone ?? '' : '',
    leader_email: i === 0 ? study.leader_email ?? '' : '',
  });
  const [groups, setGroups] = useState<GroupDraft[]>([blank(0), blank(1)]);
  // member id → group index, or -1 = not continuing
  const [where, setWhere] = useState<Record<string, number>>(Object.fromEntries(members.map((m) => [m.id, 0])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const count = mode === 'multiply' ? groups.length : 1;
  const setGroup = (i: number, patch: Partial<GroupDraft>) =>
    setGroups((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  if (semesters.length === 0) {
    return <p className="text-sm text-[#8a8378]">Next semester isn’t open for planning yet.</p>;
  }
  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
        <p className="font-semibold">{done}</p>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    setError('');
    const body =
      mode === 'stop'
        ? { semester, notContinuing: true, groups: [] }
        : {
            semester,
            groups: groups.slice(0, count).map((g, i) => ({
              day_of_week: Number(g.day_of_week === '' ? NaN : g.day_of_week),
              start_time: g.start_time,
              location: g.location,
              online: g.online,
              ...(staff ? { point_staff_id: g.point_staff_id || null } : {}),
              leader_name: g.leader_name,
              leader_phone: g.leader_phone,
              leader_email: g.leader_email,
              member_ids: members.filter((m) => where[m.id] === i).map((m) => m.id),
            })),
          };
    try {
      const res = await fetch(submitUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setDone(
        mode === 'stop'
          ? 'Got it. This group won’t continue. Everyone will get a follow-up.'
          : `${semester} is set. Everyone placed just got an email with the time and a calendar link.`
      );
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {semesters.length > 1 && (
        <div>
          <span className={label}>Semester</span>
          <select className={field} value={semester} onChange={(e) => setSemester(e.target.value)}>
            {semesters.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['continue', 'Keep the group together'],
            ['multiply', 'Multiply into more groups'],
            ['stop', 'Not continuing'],
          ] as [Mode, string][]
        ).map(([m, text]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === 'continue') setWhere(Object.fromEntries(members.map((x) => [x.id, where[x.id] === -1 ? -1 : 0])));
            }}
            className="px-3 py-2 rounded-md text-sm font-semibold border transition"
            style={
              mode === m
                ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' }
                : { backgroundColor: 'white', color: 'var(--navy)', borderColor: '#d1d5db' }
            }
          >
            {text}
          </button>
        ))}
      </div>

      {mode !== 'stop' && (
        <>
          <div className={count > 1 ? 'grid md:grid-cols-2 gap-4' : ''}>
            {groups.slice(0, count).map((g, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                {count > 1 && <p className="font-bold" style={{ color: 'var(--navy)' }}>Group {i + 1}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={label}>Day</span>
                    <select className={field} value={g.day_of_week} onChange={(e) => setGroup(i, { day_of_week: e.target.value })}>
                      <option value="">Pick</option>
                      {PICKER_DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className={label}>Time</span>
                    <input type="time" className={field} value={g.start_time} onChange={(e) => setGroup(i, { start_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <span className={label}>Where</span>
                  <input className={field} value={g.location} placeholder="Dorm lounge, library room, or Google Meet" onChange={(e) => setGroup(i, { location: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={g.online} onChange={(e) => setGroup(i, { online: e.target.checked })} />
                  Online (Google Meet)
                </label>
                {staff && (
                  <div>
                    <span className={label}>Staff on point</span>
                    <select className={field} value={g.point_staff_id} onChange={(e) => setGroup(i, { point_staff_id: e.target.value })}>
                      <option value="">Nobody</option>
                      {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <span className={label}>Student leader {i > 0 ? '(optional)' : ''}</span>
                  <div className="grid gap-2">
                    <input className={field} placeholder="Name" value={g.leader_name} onChange={(e) => setGroup(i, { leader_name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={field} placeholder="Phone" value={g.leader_phone} onChange={(e) => setGroup(i, { leader_phone: e.target.value })} />
                      <input className={field} placeholder="Email" value={g.leader_email} onChange={(e) => setGroup(i, { leader_email: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {mode === 'multiply' && groups.length < 3 && (
            <button type="button" onClick={() => setGroups((gs) => [...gs, blank(gs.length)])} className="text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
              + A third group
            </button>
          )}
        </>
      )}

      {members.length > 0 && (
        <div>
          <span className={label}>{mode === 'stop' ? 'Your group' : 'Who’s in?'}</span>
          {mode === 'stop' ? (
            <p className="text-sm text-[#4a4540]">{members.map((m) => m.name).join(', ')}. Each will get a follow-up.</p>
          ) : (
            <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {members.map((m) => (
                <li key={m.id} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-[#4a4540]">{m.name}</span>
                  <span className="flex gap-1">
                    {[...Array(count).keys()].map((i) => (
                      <Choice key={i} active={where[m.id] === i} onClick={() => setWhere({ ...where, [m.id]: i })}>
                        {count > 1 ? `Group ${i + 1}` : 'Coming'}
                      </Choice>
                    ))}
                    <Choice active={where[m.id] === -1} onClick={() => setWhere({ ...where, [m.id]: -1 })}>
                      Not sure / not coming
                    </Choice>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {mode !== 'stop' && (
            <p className="text-xs text-[#8a8378] mt-1">
              Anyone not placed can still sign up on the website, and we’ll follow up with them.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        disabled={busy || !semester}
        onClick={submit}
        className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-50"
        style={{ backgroundColor: mode === 'stop' ? '#b91c1c' : 'var(--navy)' }}
      >
        {busy ? 'Saving…' : mode === 'stop' ? 'Confirm: not continuing' : `Set ${semester}`}
      </button>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 rounded text-xs font-semibold border"
      style={active ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { color: '#8a8378', borderColor: '#d1d5db' }}
    >
      {children}
    </button>
  );
}
