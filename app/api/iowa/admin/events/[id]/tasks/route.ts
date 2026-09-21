import { NextResponse } from 'next/server';
import { addEventTask } from '@/lib/eventChecklists';
import { currentStaff } from '@/lib/iowaStaff';

export const dynamic = 'force-dynamic';

// POST /api/iowa/admin/events/:id/tasks — { title, offset_days, owner_id?, priority?, occurrence? }
// A task timed relative to the event; it moves when the event moves.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Parameters<typeof addEventTask>[1];
  try {
    await addEventTask(id, body, await currentStaff());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
