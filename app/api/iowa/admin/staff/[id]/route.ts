import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { updateStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/staff/:id — { name?, phone?, role?, active?, password?, notify_mode? }
// Anyone signed in can manage staff (full access), but nobody can switch off
// their own account and lock themselves out.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await requirePermission('manageStaff');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const patch = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    role?: string;
    active?: boolean;
    password?: string;
    notify_mode?: string;
  };
  if (me.id === id && patch.active === false) {
    return NextResponse.json({ error: 'You can’t turn off your own login.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ staff: await updateStaff(id, patch) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
