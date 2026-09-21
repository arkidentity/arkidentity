// Session + password helpers for the /iowa/admin staff logins. Independent of
// the feed admin (lib/adminAuth.ts) — one can't unlock the other.
//
// Each staff member signs in with their own email + password (iowa_staff,
// migration 011). The session cookie is `<staffId>.<expiresMs>.<hmac>`, signed
// with IOWA_SESSION_SECRET (falls back to IOWA_ADMIN_PASSWORD, which is already
// set in prod). Runs in both the Edge proxy and Node route handlers — Web Crypto
// only, no Node crypto.

import { sha256Hex } from '@/lib/adminAuth';

export { sha256Hex };

export const IOWA_ADMIN_COOKIE = 'iowa_staff_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Constant-time-ish string compare so signature checks don't leak timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sessionSecret(): string | null {
  return process.env.IOWA_SESSION_SECRET || process.env.IOWA_ADMIN_PASSWORD || null;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function signSession(staffId: string): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error('IOWA_SESSION_SECRET (or IOWA_ADMIN_PASSWORD) is not configured.');
  const payload = `${staffId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

// Returns the staff id if the cookie is authentic and unexpired, else null.
// Does NOT check that the staff member is still active — callers do that.
export async function verifySession(token: string | undefined): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [staffId, expires, sig] = parts;
  if (!safeEqual(sig, await hmac(secret, `${staffId}.${expires}`))) return null;
  if (!(Number(expires) > Date.now())) return null;
  return staffId;
}

// ---------------------------------------------------------------------------
// Passwords (PBKDF2-SHA256)
// ---------------------------------------------------------------------------

const ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${toHex(salt.buffer)}$${await pbkdf2(password, salt, ITERATIONS)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, saltHex, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iter || !saltHex || !hash) return false;
  return safeEqual(hash, await pbkdf2(password, fromHex(saltHex), Number(iter)));
}
