import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken } from '@/lib/adminAuth';
import { IOWA_ADMIN_COOKIE, expectedIowaAdminToken } from '@/lib/iowaAdminAuth';

// Gate admin pages and APIs behind their shared password. Two independent
// realms: the ministry-feed admin (/admin) and the ARK Iowa admin (/iowa/admin).
// Each has its own password + cookie; login surfaces are exempt so an
// unauthenticated user can sign in.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const realm =
    pathname.startsWith('/iowa/admin') || pathname.startsWith('/api/iowa/admin')
      ? {
          loginPage: '/iowa/admin/login',
          loginApi: '/api/iowa/admin/login',
          cookie: IOWA_ADMIN_COOKIE,
          expected: expectedIowaAdminToken,
        }
      : {
          loginPage: '/admin/login',
          loginApi: '/api/admin/login',
          cookie: ADMIN_COOKIE,
          expected: expectedAdminToken,
        };

  // Exempt the login surfaces.
  if (pathname === realm.loginPage || pathname === realm.loginApi) {
    return NextResponse.next();
  }

  const expected = await realm.expected();
  const token = req.cookies.get(realm.cookie)?.value;

  if (!expected || token !== expected) {
    // API calls get a clean 401; page requests redirect to the login screen.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL(realm.loginPage, req.url);
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
