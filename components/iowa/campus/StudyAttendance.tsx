'use client';

import { useEffect, useState } from 'react';
import type { StudyMember } from '@/lib/bibleStudies';
import { chicagoToday, formatDate } from '@/lib/campusFormat';
import { HEALTH, LAUNCH_MEETINGS, stillLaunching, type AttendanceRow, type StudyHealth } from '@/lib/studyHealthFormat';

// Group health badge: Flaky / Mid / Solid, or "too early".
export function HealthBadge({ health, compact = false }: { health: StudyHealth | undefined; compact?: boolean }) {
  if (!health || health.meetings === 0) return compact ? null : <span className="text-xs text-[#8a8378]">No attendance yet</span>;
  if (!health.level) return <span className="text-xs text-[#8a8378]">Too early ({health.meetings} meeting)</span>;
  const h = HEALTH[health.level];
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{ color: h.color, backgroundColor: `${h.color}14` }}
      title={`${Math.round((health.rate ?? 0) * 100)}% showing over the last few meetings · ${h.hint}`}
    >
      {h.label}
      {!compact && ` · ${Math.round((health.rate ?? 0) * 100)}%`}
    </span>
  );
}

// In the calendar's study popup: who came on this date. Asked for while the
// group launches (first 6 meetings, or until solid); tucked away after that.
export default function StudyAttendance({ studyId, date, members }: { studyId: string; date: string; members: StudyMember[] }) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [health, setHealth] = useState<StudyHealth | null>(null);
  const [here, setHere] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const future = date > chicagoToday();

  useEffect(() => {
    let live = true;
    fetch(`/api/iowa/admin/studies/${studyId}/attendance`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        const rs = (j.rows ?? []) as AttendanceRow[];
        setRows(rs);
        setHealth(j.health ?? null);
        const today = rs.filter((r) => r.occurrence === date);
        setHere(new Set(today.filter((r) => r.present).map((r) => r.contact_id)));
        setOpen(today.length === 0 && !future && (!j.health || stillLaunching(j.health)));
      })
      .catch(() => live && setError('Couldn’t load attendance.'));
    return () => {
      live = false;
    };
  }, [studyId, date, future]);

  const taken = rows?.some((r) => r.occurrence === date) ?? false;

  async function save() {
    setBusy(true);
    setError('');
    const r = await fetch(`/api/iowa/admin/studies/${studyId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occurrence: date, marks: members.map((m) => ({ contact_id: m.contact_id, present: here.has(m.contact_id) })) }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? 'Couldn’t save.');
    setRows(j.rows);
    setHealth(j.health);
    setSaved(true);
    setOpen(false);
  }

  if (!rows) return null;
  const launching = !health || stillLaunching(health);

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-[#FAF8F5] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
          Attendance <HealthBadge health={health ?? undefined} />
        </p>
        {!open && !future && members.length > 0 && (
          <button onClick={() => setOpen(true)} className="text-xs font-semibold underline" style={{ color: 'var(--navy)' }}>
            {taken ? `Edit ${formatDate(date, { month: 'short', day: 'numeric' })}` : `Take ${formatDate(date, { month: 'short', day: 'numeric' })}`}
          </button>
        )}
      </div>
      <p className="text-xs text-[#8a8378] mt-1">
        {launching
          ? `Launching: ${health?.meetings ?? 0} of ${LAUNCH_MEETINGS} meetings taken. Once it’s solid, you can stop.`
          : 'Solid group. Attendance is optional now.'}
        {saved && <span className="ml-1 font-semibold text-green-700">Saved ✓</span>}
      </p>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
      {open && (
        <div className="mt-2">
          <p className="text-xs text-[#4a4540] mb-1">Who came {formatDate(date)}?</p>
          <ul className="space-y-1 mb-2">
            {members.map((m) => (
              <li key={m.contact_id}>
                <label className="flex items-center gap-2 text-sm text-[#4a4540]">
                  <input
                    type="checkbox"
                    checked={here.has(m.contact_id)}
                    onChange={(e) =>
                      setHere((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(m.contact_id);
                        else next.delete(m.contact_id);
                        return next;
                      })
                    }
                  />
                  {m.name}
                </label>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button disabled={busy} onClick={save} className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--navy)' }}>
              Save attendance
            </button>
            <button onClick={() => setOpen(false)} className="text-sm text-[#8a8378]">
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
