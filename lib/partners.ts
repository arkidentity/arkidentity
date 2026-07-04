import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Server-only data access for ministry partners (the newsletter list).

export type PartnerChannel = 'email' | 'text' | 'both';
export type PartnerFrequency = 'weekly' | 'monthly';

export interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channel: PartnerChannel;
  frequency: PartnerFrequency;
  active: boolean;
  confirmed: boolean;
  confirm_token: string | null;
  unsubscribe_token: string;
  confirmed_at: string | null;
  created_at: string;
}

export async function listPartners(): Promise<Partner[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Partner[]) ?? [];
}

// Admin-added partner: trusted, so confirmed immediately.
export async function createPartner(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  channel?: PartnerChannel;
  frequency?: PartnerFrequency;
}): Promise<Partner> {
  const { data, error } = await getSupabaseAdmin()
    .from('partners')
    .insert({
      name: input.name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      channel: input.channel ?? 'email',
      frequency: input.frequency ?? 'monthly',
      active: true,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Partner;
}

export async function updatePartner(
  id: string,
  patch: Partial<Pick<Partner, 'name' | 'email' | 'phone' | 'channel' | 'frequency' | 'active'>>
): Promise<Partner> {
  const { data, error } = await getSupabaseAdmin()
    .from('partners')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Partner;
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('partners').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface ImportRow {
  name: string;
  email?: string;
  phone?: string;
  channel?: PartnerChannel;
  frequency?: PartnerFrequency;
}

// Bulk import trusted partners (confirmed). Upsert on email so re-importing a
// list doesn't create duplicates; phone-only rows are inserted directly.
export async function importPartners(rows: ImportRow[]): Promise<{ imported: number }> {
  const supabase = getSupabaseAdmin();
  let imported = 0;

  for (const row of rows) {
    if (!row.name?.trim()) continue;
    const record = {
      name: row.name.trim(),
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      channel: row.channel ?? (row.email ? 'email' : 'text'),
      frequency: row.frequency ?? 'monthly',
      active: true,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    };

    if (record.email) {
      // Skip if this email already exists; otherwise insert.
      const { data: existing } = await supabase
        .from('partners')
        .select('id')
        .ilike('email', record.email)
        .maybeSingle();
      if (existing) continue;
    }

    const { error } = await supabase.from('partners').insert(record);
    if (!error) imported++;
  }

  return { imported };
}

// Public subscribe (double opt-in). Creates/refreshes a pending partner and
// returns the confirmation token to email them. Never reveals whether the email
// already existed.
export async function createPendingSubscriber(input: {
  name: string;
  email: string;
  frequency: PartnerFrequency;
}): Promise<{ token: string; alreadyConfirmed: boolean }> {
  const supabase = getSupabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('partners')
    .select('id, confirmed')
    .ilike('email', email)
    .maybeSingle();

  if (existing?.confirmed) {
    return { token: '', alreadyConfirmed: true };
  }

  const token = randomUUID();

  if (existing) {
    await supabase
      .from('partners')
      .update({ name: input.name.trim(), frequency: input.frequency, confirm_token: token })
      .eq('id', existing.id);
  } else {
    await supabase.from('partners').insert({
      name: input.name.trim(),
      email,
      channel: 'email',
      frequency: input.frequency,
      active: true,
      confirmed: false,
      confirm_token: token,
    });
  }

  return { token, alreadyConfirmed: false };
}

export async function confirmSubscriber(token: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('partners')
    .update({ confirmed: true, confirmed_at: new Date().toISOString(), confirm_token: null })
    .eq('confirm_token', token)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('partners')
    .update({ active: false })
    .eq('unsubscribe_token', token)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
