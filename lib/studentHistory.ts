import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { DAY_NAMES as DAYS, formatTime as fmtTime } from '@/lib/bibleStudyFormat';
import { DROP_REASONS } from '@/lib/campusFormat';
import { DORMANT_REASONS, outcomeLabel, type CheckinOutcome } from '@/lib/checkinFormat';
import type { IowaStaff } from '@/lib/iowaStaff';

// One student's story, oldest to newest, built from what's already recorded
// (seats, check-ins, status changes, notes). Server-only. Nothing here is a
// stored summary — it's derived on read so it can't drift from the source rows.

export type HistoryKind = 'added' | 'joined' | 'left' | 'no_show' | 'status' | 'checkin' | 'note';

export interface HistoryEntry {
  at: string; // ISO timestamp
  kind: HistoryKind;
  text: string;
  detail?: string | null;
  by?: string | null;
}

const label = (list: { key: string; label: string }[], k: string | null) => (k ? list.find((x) => x.key === k)?.label ?? k : null);
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', dormant: 'Dormant', graduated: 'Graduated', transferred: 'Transferred', left_school: 'Left school',
};

type Staffed = { iowa_staff: { name: string } | null };

export async function getStudentHistory(contactId: string): Promise<HistoryEntry[]> {
  const db = getSupabaseAdmin();
  const [campus, seats, checkins, events, notes] = await Promise.all([
    db.from('campus_students').select('created_at, met_by_staff_id, met_by_other, dormant_at, dormant_reason, dormant_note, status').eq('contact_id', contactId).maybeSingle(),
    db
      .from('bible_study_members')
      .select('joined_at, left_at, status, drop_reason, drop_note, first_showed, first_show_asked_on, bible_studies(semester, day_of_week, start_time, location)')
      .eq('contact_id', contactId),
    db.from('campus_checkins').select('created_at, outcome, note, iowa_staff(name)').eq('contact_id', contactId),
    db.from('campus_student_events').select('created_at, from_status, to_status, iowa_staff(name)').eq('contact_id', contactId),
    db.from('campus_student_notes').select('created_at, body, iowa_staff(name)').eq('contact_id', contactId),
  ]);
  for (const r of [campus, seats, checkins, events, notes]) if (r.error) throw r.error;

  const out: HistoryEntry[] = [];
  const c = campus.data as { created_at: string; status: string; dormant_at: string | null; dormant_reason: string | null; dormant_note: string | null } | null;
  if (c) out.push({ at: c.created_at, kind: 'added', text: 'Added to the student list' });

  type Seat = {
    joined_at: string; left_at: string | null; status: string; drop_reason: string | null; drop_note: string | null;
    first_showed: boolean | null; first_show_asked_on: string | null;
    bible_studies: { semester: string; day_of_week: number; start_time: string; location: string | null } | null;
  };
  for (const s of (seats.data ?? []) as unknown as Seat[]) {
    const b = s.bible_studies;
    const where = b ? `${DAYS[b.day_of_week]} ${fmtTime(b.start_time)}${b.location ? ` · ${b.location}` : ''} (${b.semester})` : 'a Bible study';
    out.push({ at: s.joined_at, kind: 'joined', text: `Joined ${where}` });
    if (s.first_showed === false) {
      out.push({ at: s.first_show_asked_on ? `${s.first_show_asked_on}T12:00:00Z` : s.joined_at, kind: 'no_show', text: 'Missed their first study' });
    }
    if (s.status === 'dropped' && s.left_at) {
      const why = [label(DROP_REASONS, s.drop_reason), s.drop_note].filter(Boolean).join(' — ');
      out.push({ at: s.left_at, kind: 'left', text: `Left ${where}`, detail: why || null });
    }
  }

  const events_ = (events.data ?? []) as unknown as ({ created_at: string; from_status: string | null; to_status: string } & Staffed)[];
  for (const e of events_) {
    out.push({
      at: e.created_at,
      kind: 'status',
      text: `${STATUS_LABEL[e.from_status ?? ''] ?? 'Status'} → ${STATUS_LABEL[e.to_status] ?? e.to_status}`,
      by: e.iowa_staff?.name ?? null,
    });
  }
  // Dormant before the change log existed: keep the date we do have.
  if (c?.dormant_at && !events_.some((e) => e.to_status === 'dormant')) {
    const why = [label(DORMANT_REASONS, c.dormant_reason), c.dormant_note].filter(Boolean).join(' — ');
    out.push({ at: c.dormant_at, kind: 'status', text: 'Marked dormant', detail: why || null });
  }

  for (const k of (checkins.data ?? []) as unknown as ({ created_at: string; outcome: CheckinOutcome; note: string | null } & Staffed)[]) {
    out.push({ at: k.created_at, kind: 'checkin', text: `Check-in: ${outcomeLabel(k.outcome)}`, detail: k.note, by: k.iowa_staff?.name ?? null });
  }
  for (const n of (notes.data ?? []) as unknown as ({ created_at: string; body: string } & Staffed)[]) {
    out.push({ at: n.created_at, kind: 'note', text: n.body, by: n.iowa_staff?.name ?? null });
  }

  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export async function addStudentNote(contactId: string, body: string, by: IowaStaff | null): Promise<HistoryEntry> {
  const text = body.trim();
  if (!text) throw new Error('Write something first.');
  const { data, error } = await getSupabaseAdmin()
    .from('campus_student_notes')
    .insert({ contact_id: contactId, body: text, staff_id: by?.id ?? null })
    .select('created_at')
    .single();
  if (error) throw error;
  return { at: data.created_at, kind: 'note', text, by: by?.name ?? null };
}

// The one-line "where do we stand" a follow-up task shows above the timeline.
export function summarize(history: HistoryEntry[]): { lastTouch: HistoryEntry | null; lastNote: HistoryEntry | null } {
  const rev = [...history].reverse();
  return { lastTouch: rev.find((h) => h.kind === 'checkin') ?? null, lastNote: rev.find((h) => h.kind === 'note') ?? null };
}
