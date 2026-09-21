import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidDate, type SchoolPeriod } from '@/lib/campusFormat';

// University of Iowa school calendar (migration 017). Server-only. Seeded from
// the registrar's General Catalog; edited in Settings. See campusFormat.ts for
// the pure helpers (studyPausedBy, scheduleWarnings, …).

const COLS = 'id, name, kind, starts_on, ends_on, pauses_in_person, note';
const KINDS = ['break', 'finals', 'holiday', 'between_semesters', 'other'];

export async function listPeriods(): Promise<SchoolPeriod[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_school_periods')
    .select(COLS)
    .order('starts_on', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SchoolPeriod[];
}

export interface PeriodInput {
  name?: string;
  kind?: string;
  starts_on?: string;
  ends_on?: string;
  pauses_in_person?: boolean;
  note?: string | null;
}

function clean(input: PeriodInput, creating: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (creating || 'name' in input) {
    if (!input.name?.trim()) throw new Error('Give it a name.');
    out.name = input.name.trim();
  }
  if ('kind' in input) {
    if (!KINDS.includes(input.kind ?? '')) throw new Error('Unknown kind.');
    out.kind = input.kind;
  }
  for (const k of ['starts_on', 'ends_on'] as const) {
    if (creating || k in input) {
      if (!isValidDate(input[k])) throw new Error('Pick start and end dates.');
      out[k] = input[k];
    }
  }
  if (out.starts_on && out.ends_on && (out.ends_on as string) < (out.starts_on as string)) {
    throw new Error('The end date is before the start date.');
  }
  if ('pauses_in_person' in input) out.pauses_in_person = !!input.pauses_in_person;
  if ('note' in input) out.note = input.note?.trim() || null;
  return out;
}

export async function createPeriod(input: PeriodInput): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_school_periods').insert(clean(input, true));
  if (error) throw error;
}

export async function updatePeriod(id: string, input: PeriodInput): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_school_periods').update(clean(input, false)).eq('id', id);
  if (error) throw error;
}

export async function deletePeriod(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_school_periods').delete().eq('id', id);
  if (error) throw error;
}
