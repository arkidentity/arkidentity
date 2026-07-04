// Shared helpers for the single-password /admin gate.
// The auth cookie stores a SHA-256 of the configured password, so the plaintext
// never rides in the cookie and the value can't be forged without the password.
// Runs in both the Edge middleware and Node route handlers (Web Crypto only).

export const ADMIN_COOKIE = 'feed_admin';

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The expected cookie value for the currently configured admin password.
// Returns null when no password is configured (admin stays locked).
export async function expectedAdminToken(): Promise<string | null> {
  const password = process.env.FEED_ADMIN_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}
