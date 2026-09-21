import { NextResponse } from 'next/server';
import { createStaff, listStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/staff — every staff login (no password hashes).
export async function GET() {
  try {
    return NextResponse.json({ staff: await listStaff() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/iowa/admin/staff — { name, email, phone?, password }
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
  };
  try {
    const staff = await createStaff({
      name: body.name ?? '',
      email: body.email ?? '',
      phone: body.phone,
      password: body.password ?? '',
      role: body.role,
    });
    return NextResponse.json({ staff }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
