import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { authUrl, disconnect, googleConfigured } from '@/lib/googleContacts';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'google_oauth_state';

// GET /api/admin/google/connect — send Travis to Google to allow contact access.
// DELETE — forget the connection (Google keeps its contacts; ARK keeps its own).
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/admin/contacts/google?error=not-configured`);
  }
  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(authUrl(origin, state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 });
  return res;
}

export async function DELETE() {
  await disconnect();
  return NextResponse.json({ ok: true });
}
