import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getTask, type CampusTask } from '@/lib/campusTasks';
import { getStaff, type IowaStaff } from '@/lib/iowaStaff';
import { formatSlot } from '@/lib/bibleStudyFormat';
import { PRIORITY, formatDate } from '@/lib/campusFormat';
import { sendTaskAssigned, type TaskEmailInfo } from '@/lib/email';
import { notify, taskAudience } from '@/lib/notifications';

// Task notifications. Since migration 026 these write to the notification
// inbox (`notify`), which emails instantly or holds for the 6 PM digest
// depending on each person's setting — instead of one email per event.
// `sendTaskAssignedNow` stays direct: the automation uses it for tasks it
// creates itself, where the owner needs the full task in front of them.

// "Wed 8 PM study" / event title / student name — whichever the task links to.
export async function taskLinkLabel(t: Pick<CampusTask, 'study_id' | 'event_id' | 'contact_name'>): Promise<string | null> {
  const db = getSupabaseAdmin();
  if (t.study_id) {
    const { data } = await db.from('bible_studies').select('day_of_week, start_time').eq('id', t.study_id).maybeSingle();
    if (data) return `${formatSlot(data)} study`;
  }
  if (t.event_id) {
    const { data } = await db.from('iowa_events').select('title').eq('id', t.event_id).maybeSingle();
    if (data) return data.title as string;
  }
  return t.contact_name;
}

export async function taskEmailInfo(t: CampusTask): Promise<TaskEmailInfo> {
  return {
    id: t.id,
    title: t.title,
    priority: PRIORITY[t.priority].label,
    due: t.due_date ? formatDate(t.due_date) : null,
    description: t.description,
    linkedTo: await taskLinkLabel(t),
  };
}

// Email a task's owner now (already inside after() or a cron). Used by the
// automation for the tasks it creates, where the whole task is the message.
export async function sendTaskAssignedNow(taskId: string, by: IowaStaff | null = null): Promise<void> {
  try {
    const task = await getTask(taskId);
    const owner = task?.owner_id ? await getStaff(task.owner_id) : null;
    if (!task || !owner?.active || owner.notify_mode === 'off') return;
    await sendTaskAssigned({ to: owner.email, name: owner.name, by: by?.name ?? null, task: await taskEmailInfo(task) });
  } catch (e) {
    console.error('[iowa tasks] assignment email failed', e);
  }
}

const taskLink = (id: string) => `/iowa/admin?task=${id}#tasks`;

export async function notifyTaskAssigned(taskId: string, by: IowaStaff | null) {
  const task = await getTask(taskId).catch(() => null);
  if (!task?.owner_id || task.owner_id === by?.id) return;
  await notify({
    to: [task.owner_id],
    kind: 'task_assigned',
    title: `${by?.name?.split(' ')[0] ?? 'Someone'} gave you: ${task.title}`,
    body: task.due_date ? `Due ${formatDate(task.due_date)}` : null,
    link: taskLink(task.id),
    taskId: task.id,
  });
}

// Someone was put "also on" a task — tell them (skip the person who did it).
export async function notifyAddedToTask(taskId: string, staffIds: string[], by: IowaStaff | null) {
  const ids = staffIds.filter((id) => id !== by?.id);
  if (ids.length === 0) return;
  const task = await getTask(taskId).catch(() => null);
  if (!task) return;
  await notify({
    to: ids,
    kind: 'helper_added',
    title: `You're helping with: ${task.title}`,
    body: task.due_date ? `Due ${formatDate(task.due_date)}` : null,
    link: taskLink(task.id),
    taskId: task.id,
  });
}

export async function notifyHelpOffered(taskId: string, helper: IowaStaff) {
  const task = await getTask(taskId).catch(() => null);
  if (!task?.owner_id || task.owner_id === helper.id) return;
  await notify({
    to: [task.owner_id],
    kind: 'help_offered',
    title: `${helper.name.split(' ')[0]} can help with: ${task.title}`,
    link: taskLink(task.id),
    taskId: task.id,
  });
}

// A comment goes to the owner and everyone helping, minus whoever wrote it.
export async function notifyTaskComment(taskId: string, comment: string, by: IowaStaff | null) {
  const task = await getTask(taskId).catch(() => null);
  if (!task) return;
  await notify({
    to: taskAudience(task, by),
    kind: 'task_comment',
    title: `${by?.name?.split(' ')[0] ?? 'Someone'} on: ${task.title}`,
    body: comment,
    link: taskLink(task.id),
    taskId: task.id,
  });
}

// A file landing on someone's task is worth the same nudge a note is.
export async function notifyTaskFile(taskId: string, filename: string, by: IowaStaff | null) {
  const task = await getTask(taskId).catch(() => null);
  if (!task) return;
  await notify({
    to: taskAudience(task, by),
    kind: 'task_comment',
    title: `${by?.name?.split(' ')[0] ?? 'Someone'} attached a file to: ${task.title}`,
    body: filename,
    link: taskLink(task.id),
    taskId: task.id,
  });
}
