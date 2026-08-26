// Shared helpers for the single-password /iowa/admin gate. Mirrors
// lib/adminAuth.ts but with its own password and cookie so the feed admin and
// the Iowa admin are independent — one can't unlock the other.
//
// The cookie stores a SHA-256 of the configured password, so the plaintext
// never rides in the cookie and the value can't be forged without it. Runs in
// both the Edge proxy and Node route handlers (Web Crypto only).

import { sha256Hex } from '@/lib/adminAuth';

export { sha256Hex };

export const IOWA_ADMIN_COOKIE = 'iowa_admin';

// Expected cookie value for the configured Iowa admin password.
// Returns null when no password is set (admin stays locked).
export async function expectedIowaAdminToken(): Promise<string | null> {
  const password = process.env.IOWA_ADMIN_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}
