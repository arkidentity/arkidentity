// Pure formatting helpers for the ARK Iowa Bible Study system. No server
// imports — safe to use from client components. lib/bibleStudies.ts re-exports
// these so server code has one import site.

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

// Monday-first order for pickers, with the JS day index each maps to.
export const PICKER_DAYS: { label: string; value: number }[] = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
];

export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'late';

export const BLOCKS: { key: TimeBlock; label: string; hint: string }[] = [
  { key: 'morning', label: 'Morning', hint: 'before noon' },
  { key: 'afternoon', label: 'Afternoon', hint: '12–5' },
  { key: 'evening', label: 'Evening', hint: '5–8' },
  { key: 'late', label: 'Late', hint: '8 and after' },
];

export function blockOf(startTime: string): TimeBlock {
  const hour = parseInt(startTime.slice(0, 2), 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'late';
}

export function formatTime(startTime: string): string {
  const [h, m] = startTime.split(':').map((n) => parseInt(n, 10));
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatSlot(study: { day_of_week: number; start_time: string }): string {
  return `${DAY_NAMES[study.day_of_week].slice(0, 3)} ${formatTime(study.start_time)}`;
}

export function formatDayTime(study: { day_of_week: number; start_time: string }): string {
  return `${DAY_NAMES[study.day_of_week]} · ${formatTime(study.start_time)}`;
}

// How a study's openness reads to a student. An empty study says "be the first"
// rather than implying members who aren't there yet.
export function spotsLabel(spotsLeft: number, capacity: number): string {
  if (spotsLeft >= capacity) return 'Open — be the first';
  if (spotsLeft <= 0) return 'Full';
  if (spotsLeft === 1) return '1 spot left';
  return `${spotsLeft} of ${capacity} open · join them`;
}
