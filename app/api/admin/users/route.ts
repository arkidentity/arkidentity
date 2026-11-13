import { NextResponse } from 'next/server';
import { createAdminUser, listAdminUsers } from '@/lib/adminUsers';

// GET  /api/admin/users — everyone with an /admin login.
// POST /api/admin/users — { name, email, password } adds a login.
// The proxy has already checked the caller is a signed-in, active admin.
export async function GET() {
  try {
    return NextResponse.json({ users: await listAdminUsers() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  try {
    const user = await createAdminUser({ name: body.name ?? '', email: body.email ?? '', password: body.password ?? '' });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
