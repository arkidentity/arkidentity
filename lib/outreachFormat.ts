// Client-safe outreach config. Trick or Truth 2026: Thu-Sat, 2-hour slots 3-9 PM.

export const TRICK_OR_TRUTH = 'trick-or-truth-2026';

export const OUTREACH_DAYS = [
  { key: 'thu', label: 'Thu', date: 'Oct 29' },
  { key: 'fri', label: 'Fri', date: 'Oct 30' },
  { key: 'sat', label: 'Sat', date: 'Oct 31' },
];

export const OUTREACH_TIMES = [
  { key: '3', label: '3–5 PM' },
  { key: '5', label: '5–7 PM' },
  { key: '7', label: '7–9 PM' },
];

export const OUTREACH_SLOTS = OUTREACH_DAYS.flatMap((d) =>
  OUTREACH_TIMES.map((t) => ({ key: `${d.key}-${t.key}`, label: `${d.label} ${d.date}, ${t.label}` }))
);

export function slotLabel(key: string): string {
  return OUTREACH_SLOTS.find((s) => s.key === key)?.label ?? key;
}

export const EXPERIENCE = [
  { key: 'new', label: 'Not yet, I’d like to learn' },
  { key: 'some', label: 'A few times' },
  { key: 'lead', label: 'Often, I could lead a team' },
] as const;

export function experienceLabel(key: string | null): string {
  return EXPERIENCE.find((e) => e.key === key)?.label ?? '—';
}
