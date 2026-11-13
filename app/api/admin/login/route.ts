import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, signAdminSession } from '@/lib/adminAuth';
import { verifyPassword } from '@/lib/iowaAdminAuth';
import { adminUserCount, createAdminUser, getAdminUserByEmailWithHash } from '@/lib/adminUsers';

// POST /api/admin/login — { email, password, name? }
//
// First-run bootstrap: while admin_users is empty, the old shared
// FEED_ADMIN_PASSWORD creates the first account (with the email + name given)
// and signs them in. After that, only named logins work.
export async function POST(req: Request) {
  const { email, password, name } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  try {
    let userId: string | null = null;

    const user = await getAdminUserByEmailWithHash(email);
    if (user) {
      if (user.active && (await verifyPassword(password, user.password_hash))) userId = user.id;
    } else if (
      process.env.FEED_ADMIN_PASSWORD &&
      password === process.env.FEED_ADMIN_PASSWORD &&
      (await adminUserCount()) === 0
    ) {
      const created = await createAdminUser({ name: name?.trim() || email.split('@')[0], email, password });
      userId = created.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, await signAdminSession(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    res.cookies.set('feed_admin', '', { path: '/', maxAge: 0 }); // old shared-password cookie
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
