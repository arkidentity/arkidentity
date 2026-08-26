import { NextResponse } from 'next/server';
import { IOWA_ADMIN_COOKIE, expectedIowaAdminToken, sha256Hex } from '@/lib/iowaAdminAuth';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };

  const expected = await expectedIowaAdminToken();
  if (!expected) {
    return NextResponse.json(
      { error: 'IOWA_ADMIN_PASSWORD is not configured on the server.' },
      { status: 500 }
    );
  }

  if (!password || (await sha256Hex(password)) !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(IOWA_ADMIN_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
