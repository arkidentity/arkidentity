import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken } from '@/lib/adminAuth';
import { IOWA_ADMIN_COOKIE, verifySession } from '@/lib/iowaAdminAuth';

// Gate admin pages and APIs. Two independent realms:
//   - the ministry-feed admin (/admin): one shared password + cookie
//   - the ARK Iowa admin (/iowa/admin): per-staff logins (iowa_staff)
// Login surfaces are exempt so an unauthenticated user can sign in.

// Is this Iowa staff member still active? Every admin request used to pay this
// round trip — twice per save (the save, then the refresh). Cached for a minute
// instead: turning off an intern's account takes effect within 60 seconds
// rather than instantly, which is worth the latency everywhere else.
const ACTIVE_TTL_MS = 60_000;
const activeCache = new Map<string, { ok: boolean; at: number }>();

async function iowaStaffActive(staffId: string): Promise<boolean> {
  const hit = activeCache.get(staffId);
  if (hit && Date.now() - hit.at < ACTIVE_TTL_MS) return hit.ok;
  const ok = await checkStaffActive(staffId);
  // Only a positive answer is cached: a locked-out person retries against the
  // database, and a transient fetch failure doesn't stick for a minute.
  if (ok) activeCache.set(staffId, { ok, at: Date.now() });
  else activeCache.delete(staffId);
  return ok;
}

async function checkStaffActive(staffId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^[0-9a-f-]{36}$/i.test(staffId)) return false;
  const res = await fetch(
    `${url}/rest/v1/iowa_staff?id=eq.${staffId}&active=eq.true&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
  );
  if (!res.ok) return false;
  const rows = (await res.json()) as unknown[];
  return rows.length === 1;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const iowa = pathname.startsWith('/iowa/admin') || pathname.startsWith('/api/iowa/admin');

  const loginPage = iowa ? '/iowa/admin/login' : '/admin/login';
  const loginApi = iowa ? '/api/iowa/admin/login' : '/api/admin/login';

  // Exempt the login surfaces.
  if (pathname === loginPage || pathname === loginApi) {
    return NextResponse.next();
  }

  let authed: boolean;
  if (iowa) {
    const staffId = await verifySession(req.cookies.get(IOWA_ADMIN_COOKIE)?.value);
    authed = !!staffId && (await iowaStaffActive(staffId));
  } else {
    const expected = await expectedAdminToken();
    authed = !!expected && req.cookies.get(ADMIN_COOKIE)?.value === expected;
  }

  if (!authed) {
    // API calls get a clean 401; page requests redirect to the login screen.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL(loginPage, req.url);
    // Keep the query too, so a one-tap email link (?v=yes) survives the login.
    loginUrl.searchParams.set('from', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/iowa/admin/:path*',
    '/api/iowa/admin/:path*',
  ],
};
