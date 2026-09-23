import webpush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Web push (migration 027). A notification is the same thing the 6 PM digest
// would email — this just gets it to a phone now. On iPhone it only works from
// the installed admin app; on Android and desktop, any browser that subscribed.

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function pushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure(): boolean {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:travis@arkidentity.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

export async function saveSubscription(
  staffId: string,
  sub: PushSubscriptionInput,
  userAgent: string | null
): Promise<void> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error('That subscription looks wrong.');
  const { error } = await getSupabaseAdmin()
    .from('iowa_push_subscriptions')
    .upsert(
      {
        staff_id: staffId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent?.slice(0, 200) ?? null,
      },
      { onConflict: 'endpoint' } // re-subscribing the same device moves it to this person
    );
  if (error) throw error;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) throw error;
}

export async function deviceCount(staffId: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('iowa_push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('staff_id', staffId);
  if (error) throw error;
  return count ?? 0;
}

export interface PushPayload {
  title: string;
  body?: string | null;
  url?: string | null;
  tag?: string | null; // same tag replaces an earlier notification instead of stacking
}

// Every device a person has. A device that's been uninstalled or reset answers
// 404/410 — drop it rather than retrying it forever.
export async function pushToStaff(staffIds: string[], payload: PushPayload): Promise<number> {
  const ids = [...new Set(staffIds.filter(Boolean))];
  if (ids.length === 0 || !configure()) return 0;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('staff_id', ids);
  if (error) {
    console.error('[iowa push] load failed', error);
    return 0;
  }

  let sent = 0;
  const dead: string[] = [];
  for (const s of (data ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 }
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) dead.push(s.id);
      else console.error('[iowa push] send failed', status, (e as Error).message);
    }
  }
  if (dead.length) await db.from('iowa_push_subscriptions').delete().in('id', dead);
  if (sent) {
    await db
      .from('iowa_push_subscriptions')
      .update({ last_sent_at: new Date().toISOString() })
      .in('staff_id', ids);
  }
  return sent;
}
