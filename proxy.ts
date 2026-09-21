import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken } from '@/lib/adminAuth';
import { IOWA_ADMIN_COOKIE, verifySession } from '@/lib/iowaAdminAuth';

// Gate admin pages and APIs. Two independent realms:
//   - the ministry-feed admin (/admin): one shared password + cookie
//   - the ARK Iowa admin (/iowa/admin): per-staff logins (iowa_staff)
// Login surfaces are exempt so an unauthenticated user can sign in.

// Is this Iowa staff member still active? Checked on every admin request so
// turning off an intern's account takes effect immediately, not after their
// 30-day cookie expires. Plain REST call — works in the Edge runtime.
async function iowaStaffActive(staffId: string): Promise<boolean> {
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
    loginUrl.searchParams.set('from', pathname);
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
