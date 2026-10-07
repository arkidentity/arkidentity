import { NextResponse } from 'next/server';
import { can } from '@/lib/iowaPerms';
import { currentStaff } from '@/lib/iowaStaff';
import { linkStaffDailyDna, staffDailyDna } from '@/lib/dailyDnaLink';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/staff/:id/daily-dna → { linked, suggestion }
// PUT { account: { id, name } | null } — link or unlink. Staff can do anyone; others only themselves.
async function allowed(id: string) {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (!can(me, 'manageStaff') && me.id !== id) return NextResponse.json({ error: 'Only staff can link someone else.' }, { status: 403 });
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const no = await allowed(id);
  if (no) return no;
  try {
    return NextResponse.json(await staffDailyDna(id));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const no = await allowed(id);
  if (no) return no;
  const body = (await req.json().catch(() => ({}))) as { account?: { id?: string; name?: string } | null };
  const account = body.account?.id && /^[0-9a-f-]{36}$/i.test(body.account.id) ? { id: body.account.id, name: (body.account.name ?? '').slice(0, 120) } : null;
  if (body.account && !account) return NextResponse.json({ error: 'Pick an account.' }, { status: 400 });
  try {
    await linkStaffDailyDna(id, account);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
