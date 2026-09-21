import { NextResponse } from 'next/server';
import { IOWA_ADMIN_COOKIE, SESSION_MAX_AGE, signSession, verifyPassword } from '@/lib/iowaAdminAuth';
import { createStaff, getStaffByEmailWithHash, staffCount } from '@/lib/iowaStaff';

// POST /api/iowa/admin/login — { email, password, name? }
//
// First-run bootstrap: while iowa_staff is empty, the old shared
// IOWA_ADMIN_PASSWORD creates the first staff account (with the email + name
// given) and signs them in. After that, only individual logins work.
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
    let staffId: string | null = null;

    const staff = await getStaffByEmailWithHash(email);
    if (staff) {
      if (staff.active && (await verifyPassword(password, staff.password_hash))) staffId = staff.id;
    } else if (
      process.env.IOWA_ADMIN_PASSWORD &&
      password === process.env.IOWA_ADMIN_PASSWORD &&
      (await staffCount()) === 0
    ) {
      const created = await createStaff({
        name: name?.trim() || email.split('@')[0],
        email,
        password,
      });
      staffId = created.id;
    }

    if (!staffId) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(IOWA_ADMIN_COOKIE, await signSession(staffId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
