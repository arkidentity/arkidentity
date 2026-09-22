import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getTask, type CampusTask } from '@/lib/campusTasks';
import { getStaff, type IowaStaff } from '@/lib/iowaStaff';
import { formatSlot } from '@/lib/bibleStudyFormat';
import { PRIORITY, formatDate } from '@/lib/campusFormat';
import { sendTaskAssigned, sendTaskComment, sendTaskHelpOffered, type TaskEmailInfo } from '@/lib/email';

// Task emails, sent after the response via `after()` (a bare promise gets
// frozen on Vercel). Failures are logged, never surfaced — the save succeeded.

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

// Email a task's owner now (already inside after() or a cron).
export async function sendTaskAssignedNow(taskId: string, by: IowaStaff | null = null): Promise<void> {
  try {
    const task = await getTask(taskId);
    const owner = task?.owner_id ? await getStaff(task.owner_id) : null;
    if (!task || !owner?.active) return;
    await sendTaskAssigned({ to: owner.email, name: owner.name, by: by?.name ?? null, task: await taskEmailInfo(task) });
  } catch (e) {
    console.error('[iowa tasks] assignment email failed', e);
  }
}

export function notifyTaskAssigned(taskId: string, by: IowaStaff | null) {
  after(() => sendTaskAssignedNow(taskId, by));
}

// Someone was put "also on" a task — tell them (skip the person who did it).
export function notifyAddedToTask(taskId: string, staffIds: string[], by: IowaStaff | null) {
  const ids = staffIds.filter((id) => id !== by?.id);
  if (ids.length === 0) return;
  after(async () => {
    const task = await getTask(taskId).catch(() => null);
    if (!task) return;
    const info = await taskEmailInfo(task);
    for (const id of ids) {
      try {
        const p = await getStaff(id);
        if (p?.active) await sendTaskAssigned({ to: p.email, name: p.name, by: by?.name ?? null, task: info });
      } catch (e) {
        console.error('[iowa tasks] added-to-task email failed', e);
      }
    }
  });
}

export function notifyHelpOffered(taskId: string, helper: IowaStaff) {
  after(async () => {
    try {
      const task = await getTask(taskId);
      const owner = task?.owner_id ? await getStaff(task.owner_id) : null;
      if (!task || !owner?.active) return;
      await sendTaskHelpOffered({ to: owner.email, name: owner.name, helper: helper.name, task: await taskEmailInfo(task) });
    } catch (e) {
      console.error('[iowa tasks] help email failed', e);
    }
  });
}

// A comment goes to the owner and everyone helping, minus whoever wrote it —
// otherwise it sits unread until someone happens to open the task.
export function notifyTaskComment(taskId: string, comment: string, by: IowaStaff | null) {
  after(async () => {
    try {
      const task = await getTask(taskId);
      if (!task) return;
      const ids = [...new Set([task.owner_id, ...task.helper_ids].filter((id): id is string => !!id && id !== by?.id))];
      if (ids.length === 0) return;
      const info = await taskEmailInfo(task);
      for (const id of ids) {
        const p = await getStaff(id);
        if (p?.active) {
          await sendTaskComment({ to: p.email, name: p.name, from: by?.name ?? 'Someone', comment, task: info });
        }
      }
    } catch (e) {
      console.error('[iowa tasks] comment email failed', e);
    }
  });
}
