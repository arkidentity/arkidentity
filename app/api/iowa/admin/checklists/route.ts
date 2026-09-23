import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/iowaPerms';
import { deleteTemplate, saveTemplate } from '@/lib/eventChecklists';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/checklists — { id?, name?, event_type_id? } create or update a template.
export async function POST(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const body = (await req.json().catch(() => ({}))) as { id?: string; name?: string; event_type_id?: string | null };
  try {
    return NextResponse.json({ id: await saveTemplate(body) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// DELETE /api/iowa/admin/checklists?id= — tasks already made stay.
export async function DELETE(req: Request) {
  const me = await requirePermission('manageSettings');
  if (me instanceof NextResponse) return me;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Which checklist?' }, { status: 400 });
  try {
    await deleteTemplate(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
