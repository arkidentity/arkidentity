import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { updateType } from '@/lib/campusTasks';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/types/:id — { name?, active? }. Types are hidden, never
// deleted, so tasks and events already using one keep their label.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: string; active?: boolean };
  try {
    return NextResponse.json({ type: await updateType(id, body) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
