import { NextResponse } from 'next/server';
import { IOWA_ADMIN_COOKIE } from '@/lib/iowaAdminAuth';

// POST /api/iowa/admin/logout — clears the staff session cookie.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(IOWA_ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
