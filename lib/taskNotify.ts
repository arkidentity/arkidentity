import { after } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getTask, type CampusTask } from '@/lib/campusTasks';
import { getStaff, type IowaStaff } from '@/lib/iowaStaff';
import { formatSlot } from '@/lib/bibleStudyFormat';
import { PRIORITY, formatDate } from '@/lib/campusFormat';
import { sendTaskAssigned, sendTaskHelpOffered, type TaskEmailInfo } from '@/lib/email';

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

export function notifyTaskAssigned(taskId: string, by: IowaStaff | null) {
  after(async () => {
    try {
      const task = await getTask(taskId);
      const owner = task?.owner_id ? await getStaff(task.owner_id) : null;
      if (!task || !owner?.active) return;
      await sendTaskAssigned({ to: owner.email, name: owner.name, by: by?.name ?? null, task: await taskEmailInfo(task) });
    } catch (e) {
      console.error('[iowa tasks] assignment email failed', e);
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
