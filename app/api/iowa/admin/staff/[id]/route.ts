import { NextResponse } from 'next/server';
import { can } from '@/lib/iowaPerms';
import { currentStaff, updateStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/staff/:id — { name?, phone?, role?, active?, password?, notify_mode? }
// Staff can edit anyone. Anyone else (interns, leaders) can edit only
// themselves, and only their own details: name, phone, password, emails —
// never their role or whether their login is on. Nobody can switch off their
// own account and lock themselves out.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  const { id } = await params;
  const admin = can(me, 'manageStaff');
  if (!admin && me.id !== id) return NextResponse.json({ error: 'Only staff can manage logins.' }, { status: 403 });
  const patch = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    role?: string;
    active?: boolean;
    password?: string;
    notify_mode?: string;
  };
  if (!admin && (patch.role !== undefined || patch.active !== undefined)) {
    return NextResponse.json({ error: 'Only staff can change roles or logins.' }, { status: 403 });
  }
  if (me.id === id && patch.active === false) {
    return NextResponse.json({ error: 'You can’t turn off your own login.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ staff: await updateStaff(id, patch) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
