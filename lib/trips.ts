import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Trips (Baja 2027 first, Travis 10/24): Interested = contacts tagged with the trip's tag (the interest form);
// Going = iowa_trip_registrations (Mig 047), from "I'm in" on the trip page or staff "Move to Going".

export const TRIPS = {
  'baja-2027': { title: 'Baja 2027', tag: 'baja-2027', page: '/iowa/baja', deposit: 200, goal: 1500 },
} as const;
export type TripKey = keyof typeof TRIPS;

export const TRIP_CHECKS: [string, string][] = [
  ['deposit', 'Deposit'], ['passport', 'Passport'], ['forms', 'uReach forms'], ['flight', 'Flight'], ['paid', 'Paid in full'],
];

export interface TripRegistration {
  id: string; trip: string; contact_id: string | null; name: string; email: string | null; phone: string | null;
  school: string | null; year: string | null; birthday: string | null; passport: string | null; passport_expires: string | null;
  emergency_name: string | null; emergency_phone: string | null; medical: string | null; shirt: string | null; note: string | null;
  checks: Record<string, boolean>; raised: number; status: string; created_at: string;
}
export interface Interested { id: string; name: string; email: string | null; phone: string | null; created_at: string }

/** People who raised a hand (tagged with the trip), newest first */
export async function listInterested(trip: TripKey): Promise<Interested[]> {
  const db = getSupabaseAdmin();
  const { data: tag } = await db.from('contact_tags').select('id').eq('slug', TRIPS[trip].tag).maybeSingle();
  if (!tag) return [];
  const { data: links } = await db.from('contact_tag_links').select('contact_id').eq('tag_id', tag.id);
  const ids = (links ?? []).map(l => l.contact_id as string);
  if (!ids.length) return [];
  const { data, error } = await db.from('contacts').select('id, name, email, phone, created_at').in('id', ids).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Interested[];
}

export async function listRegistrations(trip: TripKey): Promise<TripRegistration[]> {
  const { data, error } = await getSupabaseAdmin().from('iowa_trip_registrations').select('*').eq('trip', trip).order('created_at');
  if (error) throw error;
  return (data ?? []) as TripRegistration[];
}

/** "I'm in" (public form) or "Move to Going" (staff). Same person registering twice updates their row. */
export async function upsertRegistration(row: Partial<TripRegistration> & { trip: TripKey; name: string }) {
  const db = getSupabaseAdmin();
  if (row.contact_id) {
    const { data: had } = await db.from('iowa_trip_registrations').select('id').eq('trip', row.trip).eq('contact_id', row.contact_id).maybeSingle();
    if (had) {
      const { error } = await db.from('iowa_trip_registrations').update({ ...row, status: 'going', updated_at: new Date().toISOString() }).eq('id', had.id);
      if (error) throw error;
      return;
    }
  }
  const { error } = await db.from('iowa_trip_registrations').insert(row);
  if (error) throw error;
}

export async function updateRegistration(id: string, patch: { checks?: Record<string, boolean>; raised?: number; status?: string }) {
  const { error } = await getSupabaseAdmin().from('iowa_trip_registrations').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
