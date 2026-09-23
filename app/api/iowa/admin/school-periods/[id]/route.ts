import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { deletePeriod, updatePeriod, type PeriodInput } from '@/lib/schoolCalendar';
import { queueAllStudiesSync } from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PeriodInput;
  try {
    await updatePeriod(id, body);
    queueAllStudiesSync();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  try {
    await deletePeriod(id);
    queueAllStudiesSync();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
