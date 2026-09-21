import { NextResponse } from 'next/server';
import { deleteItem, saveItem, type ChecklistItem } from '@/lib/eventChecklists';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/checklists/items — create (with template_id) or update (with id).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<ChecklistItem>;
  try {
    await saveItem(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Which item?' }, { status: 400 });
  try {
    await deleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
