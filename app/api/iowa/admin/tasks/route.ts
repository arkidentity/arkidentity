import { NextResponse } from 'next/server';
import { createTask, listTasks, setHelpers, type TaskInput } from '@/lib/campusTasks';
import { currentStaff } from '@/lib/iowaStaff';
import { notifyAddedToTask, notifyTaskAssigned } from '@/lib/taskNotify';

export const dynamic = 'force-dynamic';

// GET /api/iowa/admin/tasks — open tasks + anything done in the last 30 days.
export async function GET() {
  try {
    return NextResponse.json({ tasks: await listTasks() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/iowa/admin/tasks — create. Owner defaults to the creator; send
// owner_id: null for an unowned task. Emails the owner if it isn't the creator.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as TaskInput & { helper_ids?: string[] };
  try {
    const me = await currentStaff();
    const task = await createTask(body, me);
    if (task.owner_id && task.owner_id !== me?.id) notifyTaskAssigned(task.id, me);
    if (body.helper_ids?.length) notifyAddedToTask(task.id, await setHelpers(task.id, body.helper_ids, me), me);
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
