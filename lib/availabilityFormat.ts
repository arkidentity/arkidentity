// Pure helpers for availability (migration 030). No server imports — safe in
// client components. The rest of `lib/availability.ts` talks to the database
// and to Resend, which must never reach the browser bundle.

export interface BusyBlock {
  id: string;
  staff_id: string;
  semester: string;
  day_of_week: number;
  starts_at: string | null; // 'HH:MM:SS', null = all day
  ends_at: string | null;
  label: string | null;
}

export interface ScheduleLink {
  staff_id: string;
  semester: string;
  token: string;
  sent_at: string | null;
  submitted_at: string | null;
}

export const hhmm = (t: string) => (t.length === 5 ? `${t}:00` : t);

// Does this person have something at that day and time? A study is an hour, so
// a block that merely touches the hour counts as a clash.
export function clashAt(
  blocks: BusyBlock[],
  staffId: string,
  dayOfWeek: number,
  startTime: string,
  minutes = 60
): BusyBlock | null {
  const start = hhmm(startTime);
  const end = addMinutes(start, minutes);
  return (
    blocks.find(
      (b) =>
        b.staff_id === staffId &&
        b.day_of_week === dayOfWeek &&
        // All day beats any overlap check.
        (!b.starts_at || !b.ends_at || (b.starts_at < end && b.ends_at > start))
    ) ?? null
  );
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}:00`;
}
