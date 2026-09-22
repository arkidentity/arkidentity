// Pure labels for the check-in report (migration 023). No server imports —
// safe in client components. See docs/IOWA-CAMPUS-TASKS.md → "Check-in report".

// Why someone shows up on the report at all.
export type QuietReason = 'never_showed' | 'dropped' | 'dormant' | 'never_placed';

export const QUIET_REASONS: { key: QuietReason; label: string }[] = [
  { key: 'never_showed', label: 'Never made it to their first study' },
  { key: 'dropped', label: 'Dropped from a study' },
  { key: 'dormant', label: 'Marked dormant' },
  { key: 'never_placed', label: 'Never placed in a study' },
];

export type DormantReason =
  | 'unresponsive' | 'schedule_changed' | 'not_interested' | 'lost_touch' | 'hard_season' | 'other';

export const DORMANT_REASONS: { key: DormantReason; label: string }[] = [
  { key: 'unresponsive', label: 'Unresponsive' },
  { key: 'schedule_changed', label: 'Schedule changed' },
  { key: 'not_interested', label: 'Not interested' },
  { key: 'lost_touch', label: 'Lost touch' },
  { key: 'hard_season', label: 'Going through something' },
  { key: 'other', label: 'Other' },
];

export type CheckinOutcome = 'talked' | 'replied' | 'no_reply';

export const CHECKIN_OUTCOMES: { key: CheckinOutcome; label: string }[] = [
  { key: 'talked', label: 'Talked' },
  { key: 'replied', label: 'Texted — they replied' },
  { key: 'no_reply', label: 'Texted — no reply' },
];

export const outcomeLabel = (k: CheckinOutcome) => CHECKIN_OUTCOMES.find((o) => o.key === k)?.label ?? k;

export interface CheckinRow {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  year: string | null;
  reason: QuietReason;
  detail: string | null;     // e.g. "Schedule changed — has clinicals Tuesdays"
  study: string | null;      // the study they were last in
  quiet_since: string;       // ISO timestamp / date
  last_checkin: { at: string; by: string | null; outcome: CheckinOutcome; note: string | null } | null;
  checkin_count: number;
}

export interface SocialEventOption {
  id: string;
  title: string;
  when: string;
  social: boolean;
}

// Days between an ISO date/timestamp and now.
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
