import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { StudyWithMembers } from '@/lib/bibleStudies';

// Who leads a study, as a roster seat and as a Daily DNA account. Study leaders
// are contact details on the study (leader_name/phone/email), not staff rows,
// so the seat is matched by phone (last 10 digits) or email — the same match
// the calendar's study popup uses for its ★ Leader tag.

const digits = (p: string | null | undefined) => (p ?? '').replace(/\D/g, '').slice(-10);

export function isStudyLeader(
  s: { leader_phone: string | null; leader_email: string | null },
  m: { phone: string | null; email: string | null }
): boolean {
  return (
    (!!s.leader_phone && digits(m.phone) !== '' && digits(m.phone) === digits(s.leader_phone)) ||
    (!!s.leader_email && !!m.email && m.email.trim().toLowerCase() === s.leader_email.trim().toLowerCase())
  );
}

/** The leader's active roster seat, if they sit in their own study. */
export function leaderSeat(s: StudyWithMembers) {
  return s.members.find((m) => m.status === 'active' && isStudyLeader(s, m)) ?? null;
}

/** The leader's linked Daily DNA account (campus_students.daily_dna_account_id), or null. */
export async function leaderAccountId(s: StudyWithMembers): Promise<string | null> {
  const seat = leaderSeat(s);
  if (!seat) return null;
  const { data } = await getSupabaseAdmin()
    .from('campus_students')
    .select('daily_dna_account_id')
    .eq('contact_id', seat.contact_id)
    .maybeSingle();
  return (data?.daily_dna_account_id as string | null) ?? null;
}
