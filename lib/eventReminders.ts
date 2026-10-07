import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { IowaStaff } from '@/lib/iowaStaff';
import { dismissedAutoKeys } from '@/lib/campusTasks';
import { addDays, chicagoToday, eventDatesInRange, formatDate } from '@/lib/campusFormat';

// Reminder lists (migration 036): who said yes / maybe / no in person to an
// event, and a "text them" task a few days before each date. One list per
// event — a weekly event's list carries over. See docs/IOWA-CAMPUS-TASKS.md.

export type ReminderResponse = 'yes' | 'maybe' | 'no';
const RESPONSES: ReminderResponse[] = ['yes', 'maybe', 'no'];

export interface ReminderPerson {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  response: ReminderResponse;
  note: string | null;
}

export async function listReminderPeople(eventId: string): Promise<ReminderPerson[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_event_reminder_people')
    .select('contact_id, response, note, contact:contacts(name, phone, email)')
    .eq('event_id', eventId);
  if (error) throw error;
  const rank = (r: ReminderResponse) => RESPONSES.indexOf(r);
  return ((data ?? []) as unknown as {
    contact_id: string;
    response: ReminderResponse;
    note: string | null;
    contact: { name: string; phone: string | null; email: string | null } | null;
  }[])
    .filter((r) => r.contact)
    .map((r) => ({
      contact_id: r.contact_id,
      name: r.contact!.name,
      phone: r.contact!.phone,
      email: r.contact!.email,
      response: r.response,
      note: r.note,
    }))
    .sort((a, b) => rank(a.response) - rank(b.response) || a.name.localeCompare(b.name));
}

export async function setReminderPerson(
  eventId: string,
  contactId: string,
  input: { response?: string; note?: string | null },
  actor: IowaStaff | null
): Promise<void> {
  const response = (input.response ?? 'yes') as ReminderResponse;
  if (!RESPONSES.includes(response)) throw new Error('Yes, maybe or no.');
  const { error } = await getSupabaseAdmin()
    .from('iowa_event_reminder_people')
    .upsert(
      {
        event_id: eventId,
        contact_id: contactId,
        response,
        ...(input.note !== undefined && { note: input.note?.trim() || null }),
        added_by: actor?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,contact_id' }
    );
  if (error) throw error;
}

export async function removeReminderPerson(eventId: string, contactId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('iowa_event_reminder_people')
    .delete()
    .eq('event_id', eventId)
    .eq('contact_id', contactId);
  if (error) throw error;
}

export async function setReminderDays(eventId: string, days: number): Promise<void> {
  if (!Number.isInteger(days) || days < 0 || days > 14) throw new Error('0 to 14 days.');
  const { error } = await getSupabaseAdmin().from('iowa_events').update({ reminder_days_before: days }).eq('id', eventId);
  if (error) throw error;
}

// Morning run: for every event with someone on its list (yes or maybe), make
// "Text the <event> list" once its date is within reminder_days_before. Catches
// up (a Sunday-due task is made Monday), never for a date already past.
// Unowned: whoever's free takes it. Idempotent on reminder:<event>:<date>.
export async function generateReminderTasks(today = chicagoToday()): Promise<number> {
  const db = getSupabaseAdmin();
  const { data: people, error } = await db
    .from('iowa_event_reminder_people')
    .select('event_id')
    .in('response', ['yes', 'maybe']);
  if (error) throw error;
  const eventIds = [...new Set((people ?? []).map((p) => p.event_id as string))];
  if (eventIds.length === 0) return 0;

  const { data: events, error: eErr } = await db
    .from('iowa_events')
    .select('id, title, event_date, start_time, repeat_weekly, repeat_until, skip_dates, reminder_days_before')
    .in('id', eventIds);
  if (eErr) throw eErr;

  const { data: typeRow } = await db.from('iowa_item_types').select('id').eq('kind', 'task').ilike('name', 'Event prep').maybeSingle();
  let made = 0;
  for (const e of events ?? []) {
    const lead = (e.reminder_days_before as number) ?? 2;
    const dates = eventDatesInRange(e as Parameters<typeof eventDatesInRange>[0], today, addDays(today, lead));
    const keys = dates.map((d) => `reminder:${e.id}:${d}`);
    const dismissed = await dismissedAutoKeys(keys);
    for (const occ of dates) {
      const key = `reminder:${e.id}:${occ}`;
      if (dismissed.has(key)) continue;
      const { data, error: tErr } = await db
        .from('iowa_tasks')
        .insert({
          title: `Text the ${e.title} list`,
          description: `${e.title} is ${formatDate(occ)}. Text everyone on the list (yes and maybe) a reminder. Open this task for a Text button per person.`,
          type_id: (typeRow?.id as string) ?? null,
          priority: 'normal',
          due_date: addDays(occ, -lead) < today ? today : addDays(occ, -lead),
          owner_id: null,
          event_id: e.id,
          event_occurrence: occ,
          auto_kind: 'reminder_list',
          auto_key: key,
        })
        .select('id')
        .single();
      if (tErr) {
        if (tErr.code === '23505') continue;
        throw tErr;
      }
      await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: null, action: 'auto-created from the reminder list' });
      made++;
    }
  }
  return made;
}

/** Guest list pop-up: make the list exactly these people. New ones come in as "yes"; anyone already on
 *  the list keeps their answer and note; anyone unchecked comes off. */
export async function setGuestList(eventId: string, contactIds: string[], actor: IowaStaff | null): Promise<void> {
  const db = getSupabaseAdmin();
  const want = new Set(contactIds);
  const { data: have, error } = await db.from('iowa_event_reminder_people').select('contact_id').eq('event_id', eventId);
  if (error) throw error;
  const current = new Set((have ?? []).map((r) => r.contact_id as string));
  const drop = [...current].filter((id) => !want.has(id));
  const add = [...want].filter((id) => !current.has(id));
  if (drop.length) {
    const { error: e } = await db.from('iowa_event_reminder_people').delete().eq('event_id', eventId).in('contact_id', drop);
    if (e) throw e;
  }
  if (add.length) {
    const now = new Date().toISOString();
    const { error: e } = await db.from('iowa_event_reminder_people').insert(
      add.map((contact_id) => ({ event_id: eventId, contact_id, response: 'yes', added_by: actor?.id ?? null, updated_at: now }))
    );
    if (e) throw e;
  }
}
