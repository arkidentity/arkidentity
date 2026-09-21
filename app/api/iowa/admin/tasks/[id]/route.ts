import { NextResponse } from 'next/server';
import { deleteTask, setHelper, updateTask, type TaskInput } from '@/lib/campusTasks';
import { currentStaff } from '@/lib/iowaStaff';
import { notifyHelpOffered, notifyTaskAssigned } from '@/lib/taskNotify';

export const dynamic = 'force-dynamic';

// PATCH /api/iowa/admin/tasks/:id
//   { help: true | false }  — the signed-in person offers / withdraws help
//   any task fields         — edit (owner change emails the new owner)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as TaskInput & { help?: boolean };
  try {
    const me = await currentStaff();
    if (typeof body.help === 'boolean') {
      if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
      const task = await setHelper(id, me.id, body.help);
      if (body.help && task.owner_id && task.owner_id !== me.id) notifyHelpOffered(task.id, me);
      return NextResponse.json({ task });
    }
    const { task, before } = await updateTask(id, body, me);
    if (task.owner_id && task.owner_id !== before.owner_id && task.owner_id !== me?.id) {
      notifyTaskAssigned(task.id, me);
    }
    return NextResponse.json({ task });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
