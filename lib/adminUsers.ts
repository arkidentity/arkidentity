import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/iowaAdminAuth';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/adminAuth';

// Data layer for /admin named logins (migration 061). Server-only.

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
}

const PUBLIC_COLS = 'id, name, email, active, created_at';
export const MIN_PASSWORD = 8;

const db = () => getSupabaseAdmin().from('admin_users');

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await db().select(PUBLIC_COLS).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function adminUserCount(): Promise<number> {
  const { count, error } = await db().select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getAdminUser(id: string): Promise<AdminUser | null> {
  const { data, error } = await db().select(PUBLIC_COLS).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as AdminUser) ?? null;
}

// For login only — includes the hash.
export async function getAdminUserByEmailWithHash(
  email: string
): Promise<(AdminUser & { password_hash: string }) | null> {
  const { data, error } = await db()
    .select(`${PUBLIC_COLS}, password_hash`)
    .ilike('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  return (data as AdminUser & { password_hash: string }) ?? null;
}

function checkPassword(password: string) {
  if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
}

export async function createAdminUser(input: { name: string; email: string; password: string }): Promise<AdminUser> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new Error('Name is required.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email is required.');
  checkPassword(input.password);
  const { data, error } = await db()
    .insert({ name, email, password_hash: await hashPassword(input.password) })
    .select(PUBLIC_COLS)
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Someone already has that email.');
    throw error;
  }
  return data as AdminUser;
}

export async function updateAdminUser(
  id: string,
  patch: { name?: string; active?: boolean; password?: string }
): Promise<AdminUser> {
  const update: Record<string, unknown> = {};
  if (typeof patch.name === 'string' && patch.name.trim()) update.name = patch.name.trim();
  if (typeof patch.active === 'boolean') update.active = patch.active;
  if (typeof patch.password === 'string') {
    checkPassword(patch.password);
    update.password_hash = await hashPassword(patch.password);
  }
  const { data, error } = await db().update(update).eq('id', id).select(PUBLIC_COLS).single();
  if (error) throw error;
  return data as AdminUser;
}

// The signed-in admin user, from the session cookie. The proxy has already
// rejected bad or inactive sessions before any /admin page or API runs.
export async function currentAdminUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const id = await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value);
  if (!id) return null;
  const user = await getAdminUser(id);
  return user?.active ? user : null;
}
