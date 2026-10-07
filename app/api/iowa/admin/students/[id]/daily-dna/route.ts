import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { linkDailyDna } from '@/lib/dailyDnaLink';

export const dynamic = 'force-dynamic';

// PUT /api/iowa/admin/students/:contactId/daily-dna  { account: { id, name } | null }
// Link (or unlink) a student to their Daily DNA account. Their studies resync right after.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('viewStudents');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { account?: { id?: string; name?: string } | null };
  const account = body.account?.id && /^[0-9a-f-]{36}$/i.test(body.account.id) ? { id: body.account.id, name: (body.account.name ?? '').slice(0, 120) } : null;
  if (body.account && !account) return NextResponse.json({ error: 'Pick an account.' }, { status: 400 });
  try {
    await linkDailyDna(id, account);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
