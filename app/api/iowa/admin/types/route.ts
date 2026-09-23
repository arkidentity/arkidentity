import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { createType } from '@/lib/campusTasks';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/types — { kind: 'task' | 'event', name }
export async function POST(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const { kind, name } = (await req.json().catch(() => ({}))) as { kind?: string; name?: string };
  try {
    return NextResponse.json({ type: await createType(kind ?? '', name ?? '') }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
