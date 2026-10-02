// Group health from launch attendance (migration 037). Pure — safe in client
// components. See docs/IOWA-CAMPUS-TASKS.md → "Group health".

export type HealthLevel = 'flaky' | 'mid' | 'solid';

export interface AttendanceRow {
  occurrence: string;
  contact_id: string;
  present: boolean;
}

export interface StudyHealth {
  level: HealthLevel | null; // null = too early (fewer than 2 meetings recorded)
  rate: number | null; // 0–1 over the last few recorded meetings
  meetings: number; // meetings with attendance taken, all time
  lastTaken: string | null;
}

export const LAUNCH_MEETINGS = 6; // prompt for attendance this many meetings…
const WINDOW = 4; // …and rate the group on its last this-many
const MIN_MEETINGS = 2;

export const HEALTH: Record<HealthLevel, { label: string; color: string; hint: string }> = {
  flaky: { label: 'Flaky', color: '#b91c1c', hint: 'under half the group shows' },
  mid: { label: 'Mid', color: '#b45309', hint: 'some consistency, not there yet' },
  solid: { label: 'Solid', color: '#15803d', hint: 'most of the group shows most weeks' },
};

export function studyHealth(rows: AttendanceRow[]): StudyHealth {
  const byDate = new Map<string, { here: number; total: number }>();
  for (const r of rows) {
    const d = byDate.get(r.occurrence) ?? { here: 0, total: 0 };
    d.total++;
    if (r.present) d.here++;
    byDate.set(r.occurrence, d);
  }
  const dates = [...byDate.keys()].sort();
  const recent = dates.slice(-WINDOW).map((d) => byDate.get(d)!);
  const here = recent.reduce((n, d) => n + d.here, 0);
  const total = recent.reduce((n, d) => n + d.total, 0);
  const rate = total ? here / total : null;
  const level: HealthLevel | null =
    dates.length < MIN_MEETINGS || rate === null ? null : rate >= 0.8 ? 'solid' : rate >= 0.5 ? 'mid' : 'flaky';
  return { level, rate, meetings: dates.length, lastTaken: dates.at(-1) ?? null };
}

// Still launching: keep asking for attendance until 6 meetings or solid.
export const stillLaunching = (h: StudyHealth) => h.meetings < LAUNCH_MEETINGS && h.level !== 'solid';
