// Session helpers for the /admin named logins (admin_users, migration 061).
// Independent of the Iowa admin — one can't unlock the other.
//
// The session cookie is `<userId>.<expiresMs>.<hmac>`, signed with
// ADMIN_SESSION_SECRET (falls back to FEED_ADMIN_PASSWORD, already set in prod).
// Runs in both the Edge proxy and Node route handlers — Web Crypto only.

import { sha256Hex, signToken, verifyToken } from '@/lib/iowaAdminAuth';

export { sha256Hex };

export const ADMIN_COOKIE = 'ark_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // seconds

function adminSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.FEED_ADMIN_PASSWORD || null;
}

export async function signAdminSession(userId: string): Promise<string> {
  const secret = adminSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET (or FEED_ADMIN_PASSWORD) is not configured.');
  return signToken(secret, userId, ADMIN_SESSION_MAX_AGE);
}

// Returns the user id if the cookie is authentic and unexpired, else null.
// Does NOT check that the user is still active — callers do that.
export async function verifyAdminSession(token: string | undefined): Promise<string | null> {
  return verifyToken(adminSecret(), token);
}
