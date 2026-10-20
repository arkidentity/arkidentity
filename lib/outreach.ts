import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Server-only reads/writes for outreach volunteer sign-ups. Config lives in
// lib/outreachFormat.ts so the client can share it.

export interface OutreachSignup {
  id: string;
  outreach: string;
  name: string;
  phone: string;
  email: string;
  slots: string[];
  bringing: number;
  under_18: boolean;
  experience: string | null;
  note: string | null;
  created_at: string;
}

export async function listOutreachSignups(outreach: string): Promise<OutreachSignup[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_outreach_signups')
    .select('*')
    .eq('outreach', outreach)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as OutreachSignup[];
}

// People per slot, counting the friends they're bringing.
export async function slotCounts(outreach: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const s of await listOutreachSignups(outreach)) {
    for (const k of s.slots) counts[k] = (counts[k] ?? 0) + 1 + (s.bringing || 0);
  }
  return counts;
}

export async function addOutreachSignup(row: Omit<OutreachSignup, 'id' | 'created_at'>) {
  const { error } = await getSupabaseAdmin().from('iowa_outreach_signups').insert(row);
  if (error) throw error;
}
