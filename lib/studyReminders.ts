import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { CURRENT_SEMESTER, formatSlot } from '@/lib/bibleStudies';
import { DAY_NAMES } from '@/lib/bibleStudyFormat';
import { sendStudyReminderBatch } from '@/lib/email';

// One reminder the evening before. Invoked by the daily Vercel cron
// (/api/cron/iowa-reminders). See docs/IOWA-BIBLE-STUDY-SYSTEM.md §13.

// Tomorrow's weekday (0=Sun) in America/Chicago. The cron fires at ~6pm CT, so
// "now + 24h" lands squarely on tomorrow's local date — no DST-edge ambiguity
// that matters for a weekday lookup.
function chicagoTomorrowDow(): number {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
  }).format(tomorrow);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
}

export interface ReminderSummary {
  day: string;
  studies: number;
  recipients: number;
  sent: number;
  failed: number;
}

export async function sendStudyReminders(): Promise<ReminderSummary> {
  const db = getSupabaseAdmin();
  const dow = chicagoTomorrowDow();

  const { data: studies, error } = await db
    .from('bible_studies')
    .select('id, day_of_week, start_time, location, status')
    .eq('semester', CURRENT_SEMESTER)
    .eq('day_of_week', dow)
    .in('status', ['forming', 'full', 'activated']);
  if (error) throw error;

  const list = studies ?? [];
  if (list.length === 0) {
    return { day: DAY_NAMES[dow], studies: 0, recipients: 0, sent: 0, failed: 0 };
  }

  const ids = list.map((s) => s.id);
  const { data: members, error: mErr } = await db
    .from('bible_study_members')
    .select('study_id, name, email')
    .in('study_id', ids)
    .eq('status', 'active');
  if (mErr) throw mErr;

  const byStudy = new Map(list.map((s) => [s.id, s]));
  const items = (members ?? [])
    .filter((m) => m.email)
    .map((m) => {
      const s = byStudy.get(m.study_id)!;
      return {
        to: m.email as string,
        name: m.name as string,
        slot: formatSlot(s),
        location: s.location as string | null,
      };
    });

  const { sent, failed } = await sendStudyReminderBatch(items);
  return { day: DAY_NAMES[dow], studies: list.length, recipients: items.length, sent, failed };
}
