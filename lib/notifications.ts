import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getStaff, listStaff, type IowaStaff } from '@/lib/iowaStaff';
import { chicagoToday, dayOfWeek, formatDate } from '@/lib/campusFormat';
import { sendNotification, sendNotificationDigest, siteUrl } from '@/lib/email';
import { pushToStaff } from '@/lib/push';

// One inbox for everything that used to email on its own (migration 026).
// Every event writes a row; how someone hears about it is their setting:
// 'instant' (an email per event), 'digest' (one 6 PM email, the default), or
// 'off'. See docs/IOWA-CAMPUS-TASKS.md → "Email rhythm".
//
// Push (027) is separate from that setting and always immediate: a phone buzz
// is the thing you actually want now, and the email setting is about how much
// mail you get. Someone on 'digest' with push on hears instantly and still
// gets the 6 PM recap; that recap is the record.

export type NotificationKind = 'task_assigned' | 'helper_added' | 'help_offered' | 'task_comment' | 'signup';

export interface NotificationRow {
  id: string;
  staff_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
}

export interface NotifyInput {
  to: string[]; // staff ids; the actor is filtered out by the caller
  kind: NotificationKind;
  title: string;
  body?: string | null;
  link?: string | null;
  taskId?: string | null;
}

const KIND_LABEL: Record<NotificationKind, string> = {
  task_assigned: 'Tasks you were given',
  helper_added: "Tasks you're helping with",
  help_offered: 'Offers to help',
  task_comment: 'Notes on your tasks',
  signup: 'New signups',
};

// Record it, then deliver it the way each person asked for. Delivery runs
// after the response; a failed send never fails the save that caused it.
export async function notify(input: NotifyInput): Promise<void> {
  const ids = [...new Set(input.to.filter(Boolean))];
  if (ids.length === 0) return;
  const rows = ids.map((staff_id) => ({
    staff_id,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    task_id: input.taskId ?? null,
  }));
  const { data, error } = await getSupabaseAdmin().from('iowa_notifications').insert(rows).select('id, staff_id');
  if (error) {
    console.error('[iowa notify] could not record', error);
    return;
  }
  after(() => deliver((data ?? []) as { id: string; staff_id: string }[], input));
}

async function deliver(rows: { id: string; staff_id: string }[], input: NotifyInput) {
  const db = getSupabaseAdmin();
  // One push per person, to every device they've subscribed.
  await pushToStaff(
    rows.map((r) => r.staff_id),
    { title: input.title, body: input.body ?? null, url: input.link ?? '/iowa/admin', tag: input.taskId ?? null }
  ).catch((e) => console.error('[iowa notify] push failed', e));

  for (const row of rows) {
    try {
      const person = await getStaff(row.staff_id);
      // 'digest' rows wait for 6 PM. 'off' is settled now so it never queues.
      if (!person?.active || person.notify_mode === 'digest') continue;
      if (person.notify_mode === 'instant') {
        await sendNotification({
          to: person.email,
          name: person.name,
          title: input.title,
          body: input.body ?? null,
          url: input.link ? `${siteUrl()}${input.link}` : `${siteUrl()}/iowa/admin`,
        });
      }
      await db.from('iowa_notifications').update({ emailed_at: new Date().toISOString() }).eq('id', row.id);
    } catch (e) {
      console.error('[iowa notify] delivery failed', e);
    }
  }
}

// 6 PM Monday–Saturday: one email per person for everything still owed them.
// Empty means no email, like the morning run.
export async function runEveningDigest(): Promise<Record<string, number | string>> {
  const today = chicagoToday();
  if (dayOfWeek(today) === 0) return { skipped: 'Sunday' };

  const db = getSupabaseAdmin();
  const staff = (await listStaff()).filter((s) => s.active && s.notify_mode === 'digest');
  const summary: Record<string, number | string> = { people: 0, notifications: 0 };

  for (const person of staff) {
    const { data, error } = await db
      .from('iowa_notifications')
      .select('id, staff_id, kind, title, body, link, created_at')
      .eq('staff_id', person.id)
      .is('emailed_at', null)
      .order('created_at');
    if (error) {
      console.error('[iowa digest] load failed', error);
      continue;
    }
    const rows = (data ?? []) as NotificationRow[];
    if (rows.length === 0) continue;

    try {
      await sendNotificationDigest({
        to: person.email,
        name: person.name,
        date: formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' }),
        sections: groupForEmail(rows),
        url: `${siteUrl()}/iowa/admin`,
      });
      await db
        .from('iowa_notifications')
        .update({ emailed_at: new Date().toISOString() })
        .in('id', rows.map((r) => r.id));
      summary.people = (summary.people as number) + 1;
      summary.notifications = (summary.notifications as number) + rows.length;
    } catch (e) {
      console.error('[iowa digest] send failed', e);
    }
  }
  return summary;
}

// Grouped by kind, in the order of KIND_LABEL, so the email reads as sections
// rather than a pile.
export function groupForEmail(rows: NotificationRow[]): { heading: string; items: NotificationRow[] }[] {
  return (Object.keys(KIND_LABEL) as NotificationKind[])
    .map((kind) => ({ heading: KIND_LABEL[kind], items: rows.filter((r) => r.kind === kind) }))
    .filter((s) => s.items.length > 0);
}

// Everyone who should hear about a task, minus whoever did the thing.
export function taskAudience(
  task: { owner_id: string | null; helper_ids: string[] },
  actor: IowaStaff | null
): string[] {
  return [...new Set([task.owner_id, ...task.helper_ids].filter((id): id is string => !!id && id !== actor?.id))];
}
