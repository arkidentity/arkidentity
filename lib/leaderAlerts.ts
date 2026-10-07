import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendStudyRosterAlerts } from '@/lib/email';
import { formatSlot } from '@/lib/bibleStudyFormat';

// When STAFF put a student in a study (add by hand, "+ Add a student", or a move), email the
// study's leader the same "new student — send a welcome text" note a self-signup sends
// (Travis, 2026-10-07). Leader only; other members aren't emailed. Skipped when the new
// student is the leader. Runs after the response; a failed send is logged, never fatal.
export function queueLeaderNewMember(memberId: string) {
  after(async () => {
    try {
      const db = getSupabaseAdmin();
      const { data: m } = await db.from('bible_study_members')
        .select('study_id, contacts(name, phone, email)').eq('id', memberId).maybeSingle();
      const person = (m as unknown as { contacts: { name: string; phone: string | null; email: string | null } | null } | null)?.contacts;
      if (!m || !person) return;
      const { data: s } = await db.from('bible_studies')
        .select('id, day_of_week, start_time, location, leader_email, leader_phone').eq('id', m.study_id).maybeSingle();
      if (!s?.leader_email) return;
      const digits = (p: string | null) => (p ?? '').replace(/\D/g, '').slice(-10);
      const sameEmail = !!person.email && person.email.trim().toLowerCase() === s.leader_email.trim().toLowerCase();
      const samePhone = !!person.phone && digits(person.phone) !== '' && digits(person.phone) === digits(s.leader_phone);
      if (sameEmail || samePhone) return;
      await sendStudyRosterAlerts({
        study: { id: s.id, slot: formatSlot(s), location: s.location },
        newMemberName: person.name,
        newMemberPhone: person.phone ?? '',
        existing: [],
        leaderEmail: s.leader_email,
        how: 'staff',
      });
    } catch (e) {
      console.error('[leader new-member email]', e);
    }
  });
}
