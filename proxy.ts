import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken } from '@/lib/adminAuth';

// Gate every /admin page and /api/admin route behind the shared password.
// The login page and login API are exempt so an unauthenticated user can sign in.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Exempt the login surfaces.
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const expected = await expectedAdminToken();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;

  if (!expected || token !== expected) {
    // API calls get a clean 401; page requests redirect to the login screen.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
