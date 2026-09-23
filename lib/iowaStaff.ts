import { cookies } from 'next/headers';
import type { NotifyMode } from '@/lib/campusFormat';
import { NOTIFY_MODES } from '@/lib/campusFormat';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { IOWA_ADMIN_COOKIE, hashPassword, verifySession } from '@/lib/iowaAdminAuth';

// Data layer for ARK Iowa staff logins (migration 011). Server-only.
// Every staff member has full admin access in Phase 1; `role` labels who is
// staff / intern / student leader for when permissions arrive (migration 013).

export type StaffRole = 'staff' | 'intern' | 'leader';
// NOTIFY_MODES lives in campusFormat (client-safe); this module can't be
// imported from a client component — it reads cookies.
export type { NotifyMode } from '@/lib/campusFormat';
export const STAFF_ROLES: StaffRole[] = ['staff', 'intern', 'leader'];

export interface IowaStaff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: StaffRole; // migration 013 — all roles have full access in Phase 1
  notify_mode: NotifyMode; // migration 026 — how they hear about task activity
  active: boolean;
  created_at: string;
}

const PUBLIC_COLS = 'id, name, email, phone, role, active, notify_mode, created_at';
export const MIN_PASSWORD = 8;

export async function listStaff(): Promise<IowaStaff[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .select(PUBLIC_COLS)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as IowaStaff[];
}

export async function staffCount(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getStaff(id: string): Promise<IowaStaff | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .select(PUBLIC_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as IowaStaff) ?? null;
}

// For login only — includes the hash.
export async function getStaffByEmailWithHash(
  email: string
): Promise<(IowaStaff & { password_hash: string }) | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .select(`${PUBLIC_COLS}, password_hash`)
    .ilike('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  return (data as IowaStaff & { password_hash: string }) ?? null;
}

export async function createStaff(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}): Promise<IowaStaff> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new Error('Name is required.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email is required.');
  if (input.password.length < MIN_PASSWORD) {
    throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
  }
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .insert({
      name,
      email,
      phone: input.phone?.trim() || null,
      role: STAFF_ROLES.includes(input.role as StaffRole) ? input.role : 'staff',
      password_hash: await hashPassword(input.password),
    })
    .select(PUBLIC_COLS)
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Someone already has that email.');
    throw error;
  }
  return data as IowaStaff;
}

export async function updateStaff(
  id: string,
  patch: { name?: string; phone?: string; role?: string; active?: boolean; password?: string; notify_mode?: string }
): Promise<IowaStaff> {
  const update: Record<string, unknown> = {};
  if (typeof patch.name === 'string' && patch.name.trim()) update.name = patch.name.trim();
  if (typeof patch.phone === 'string') update.phone = patch.phone.trim() || null;
  if (typeof patch.active === 'boolean') update.active = patch.active;
  if (patch.role !== undefined) {
    if (!STAFF_ROLES.includes(patch.role as StaffRole)) throw new Error('Unknown role.');
    update.role = patch.role;
  }
  if (patch.notify_mode !== undefined) {
    if (!NOTIFY_MODES.some((m) => m.key === patch.notify_mode)) throw new Error('Unknown email setting.');
    update.notify_mode = patch.notify_mode;
  }
  if (typeof patch.password === 'string') {
    if (patch.password.length < MIN_PASSWORD) {
      throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
    }
    update.password_hash = await hashPassword(patch.password);
  }
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_staff')
    .update(update)
    .eq('id', id)
    .select(PUBLIC_COLS)
    .single();
  if (error) throw error;
  return data as IowaStaff;
}

// The signed-in staff member, from the session cookie. The proxy has already
// rejected bad or inactive sessions before any admin page/API runs, so null here
// only happens outside the admin realm.
export async function currentStaff(): Promise<IowaStaff | null> {
  const jar = await cookies();
  const id = await verifySession(jar.get(IOWA_ADMIN_COOKIE)?.value);
  if (!id) return null;
  const staff = await getStaff(id);
  return staff?.active ? staff : null;
}
