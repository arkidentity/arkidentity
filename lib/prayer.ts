import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Partner prayer requests (migration 049). Server-only.

export interface PrayerRequest {
  id: string;
  contact_id: string | null;
  name: string;
  email: string | null;
  request: string;
  ok_to_share: boolean;
  wants_update: boolean;
  status: 'open' | 'prayed' | 'answered' | 'archived';
  prayed_at: string | null;
  prayed_note: string | null;
  follow_up_on: string | null;
  created_at: string;
}

/** Who an email link belongs to. Their unsubscribe token already identifies them in every digest. */
export async function contactForToken(token: string): Promise<{ id: string; name: string; email: string } | null> {
  if (!/^[0-9a-f-]{36}$/.test(token)) return null;
  const { data } = await getSupabaseAdmin().from('contacts').select('id, name, email').eq('unsubscribe_token', token).maybeSingle();
  return data ?? null;
}

export async function addPrayerRequest(row: {
  contact_id: string | null;
  name: string;
  email: string | null;
  request: string;
  ok_to_share: boolean;
  wants_update: boolean;
}) {
  const { error } = await getSupabaseAdmin().from('prayer_requests').insert(row);
  if (error) throw error;
}

/** Open first, then the rest newest first. Archived stay out of the list. */
export async function listPrayerRequests(): Promise<PrayerRequest[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('prayer_requests')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  const rows = (data ?? []) as PrayerRequest[];
  return [...rows.filter((r) => r.status === 'open'), ...rows.filter((r) => r.status !== 'open')];
}

export async function getPrayerRequest(id: string): Promise<PrayerRequest | null> {
  const { data } = await getSupabaseAdmin().from('prayer_requests').select('*').eq('id', id).maybeSingle();
  return (data as PrayerRequest) ?? null;
}

export async function updatePrayerRequest(id: string, patch: Partial<Pick<PrayerRequest, 'status' | 'prayed_at' | 'prayed_note' | 'follow_up_on'>>) {
  const { error } = await getSupabaseAdmin().from('prayer_requests').update(patch).eq('id', id);
  if (error) throw error;
}
