import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, expectedAdminToken, sha256Hex } from '@/lib/adminAuth';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };

  const expected = await expectedAdminToken();
  if (!expected) {
    return NextResponse.json(
      { error: 'Admin password is not configured on the server.' },
      { status: 500 }
    );
  }

  if (!password || (await sha256Hex(password)) !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
