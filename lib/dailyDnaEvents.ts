import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { removeEventFromDailyDna, syncEventToDailyDna } from '@/lib/dailyDnaLink';
import type { CampusEvent } from '@/lib/campusTasks';

const LIMIT_MSG = 'Saved, but Daily DNA already has 3 weekly church events for ARK Iowa, so this one isn’t showing there. Uncheck one of the others first, or make this a one-time event.';

/**
 * After an event is saved: mirror it to Daily DNA if it's checked, or take it off if it was
 * unchecked. Awaited so a refusal (3 weekly church events) can be shown to the person saving;
 * in that case the box is turned back off so the admin matches what students see.
 */
export async function afterEventSaved(event: CampusEvent, body: { show_in_daily_dna?: boolean }): Promise<string | null> {
  if (event.show_in_daily_dna) {
    const r = await syncEventToDailyDna(event);
    if (!r.ok && r.reason === 'church_limit') {
      await getSupabaseAdmin().from('iowa_events').update({ show_in_daily_dna: false }).eq('id', event.id);
      return LIMIT_MSG;
    }
    if (!r.ok) return 'Saved, but Daily DNA didn’t answer. It will try again within the hour.';
  } else if (body.show_in_daily_dna === false) {
    await removeEventFromDailyDna(event.id);
  }
  return null;
}
