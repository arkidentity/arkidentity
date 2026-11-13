import { NextResponse } from 'next/server';
import { currentAdminUser, updateAdminUser } from '@/lib/adminUsers';

// PATCH /api/admin/users/:id — { name?, active?, password? }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: string; active?: boolean; password?: string };
  try {
    const me = await currentAdminUser();
    if (body.active === false && me?.id === id) {
      return NextResponse.json({ error: "You can't turn off your own login." }, { status: 400 });
    }
    return NextResponse.json({ user: await updateAdminUser(id, body) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
