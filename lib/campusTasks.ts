import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { listStaff, type IowaStaff } from '@/lib/iowaStaff';
import {
  PRIORITY,
  TASK_STATUSES,
  isValidDate,
  addDays,
  chicagoToday,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/campusFormat';

// Data layer for ARK Iowa campus tasks, events and their type lists (migration
// 013). Server-only — service-role client. See docs/IOWA-CAMPUS-TASKS.md.

export interface ItemType {
  id: string;
  kind: 'task' | 'event';
  name: string;
  sort: number;
  active: boolean;
}

export interface CampusTask {
  id: string;
  title: string;
  description: string | null;
  type_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  owner_id: string | null;
  study_id: string | null;
  event_id: string | null;
  contact_id: string | null;
  contact_name: string | null; // flattened from contacts
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  helper_ids: string[];
}

export interface TaskActivity {
  id: string;
  task_id: string;
  staff_id: string | null;
  action: string;
  created_at: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  type_id: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  repeat_weekly: boolean;
  repeat_until: string | null;
  created_by: string | null;
  created_at: string;
  staff_ids: string[];
  source: 'app' | 'google'; // 'google' = owned by Google Calendar, read-only here (migration 014)
  google_event_id: string | null;
  google_html_link: string | null;
}

const PRIORITY_KEYS = Object.keys(PRIORITY) as TaskPriority[];
const STATUS_KEYS = TASK_STATUSES.map((s) => s.key);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export async function listTypes(): Promise<ItemType[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_item_types')
    .select('id, kind, name, sort, active')
    .order('sort', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ItemType[];
}

export async function createType(kind: string, name: string): Promise<ItemType> {
  if (kind !== 'task' && kind !== 'event') throw new Error('Kind must be task or event.');
  if (!name.trim()) throw new Error('Give the type a name.');
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_item_types')
    .insert({ kind, name: name.trim(), sort: 50 })
    .select('id, kind, name, sort, active')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That type already exists.');
    throw error;
  }
  return data as ItemType;
}

export async function updateType(id: string, patch: { name?: string; active?: boolean }): Promise<ItemType> {
  const update: Record<string, unknown> = {};
  if (typeof patch.name === 'string' && patch.name.trim()) update.name = patch.name.trim();
  if (typeof patch.active === 'boolean') update.active = patch.active;
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_item_types')
    .update(update)
    .eq('id', id)
    .select('id, kind, name, sort, active')
    .single();
  if (error) throw error;
  return data as ItemType;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const TASK_SELECT = '*, contact:contacts(name), helpers:iowa_task_helpers(staff_id)';

interface TaskRow extends Omit<CampusTask, 'contact_name' | 'helper_ids'> {
  contact: { name: string | null } | null;
  helpers: { staff_id: string }[] | null;
}

function flattenTask(r: TaskRow): CampusTask {
  const { contact, helpers, ...rest } = r;
  return {
    ...rest,
    contact_name: contact?.name ?? null,
    helper_ids: (helpers ?? []).map((h) => h.staff_id),
  };
}

// Every open task, plus anything finished in the last 30 days.
export async function listTasks(): Promise<CampusTask[]> {
  const since = addDays(chicagoToday(), -30);
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_tasks')
    .select(TASK_SELECT)
    .or(`status.neq.done,completed_at.gte.${since}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as TaskRow[]).map(flattenTask);
}

export async function getTask(id: string): Promise<CampusTask | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? flattenTask(data as unknown as TaskRow) : null;
}

export async function listTaskActivity(taskIds?: string[]): Promise<TaskActivity[]> {
  let q = getSupabaseAdmin()
    .from('iowa_task_activity')
    .select('id, task_id, staff_id, action, created_at')
    .order('created_at', { ascending: true });
  if (taskIds) {
    if (taskIds.length === 0) return [];
    q = q.in('task_id', taskIds);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TaskActivity[];
}

async function logActivity(taskId: string, actorId: string | null, actions: string[]) {
  if (actions.length === 0) return;
  const { error } = await getSupabaseAdmin()
    .from('iowa_task_activity')
    .insert(actions.map((action) => ({ task_id: taskId, staff_id: actorId, action })));
  if (error) console.error('[iowa tasks] activity log failed', error);
}

export interface TaskInput {
  title?: string;
  description?: string | null;
  type_id?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  owner_id?: string | null;
  study_id?: string | null;
  event_id?: string | null;
  contact_id?: string | null;
}

// Validate + normalise whatever subset of fields came in.
function cleanTaskInput(input: TaskInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ('title' in input) {
    const t = (input.title ?? '').trim();
    if (!t) throw new Error('A task needs a title.');
    out.title = t;
  }
  if ('description' in input) out.description = input.description?.trim() || null;
  if ('status' in input) {
    if (!STATUS_KEYS.includes(input.status as TaskStatus)) throw new Error('Unknown status.');
    out.status = input.status;
  }
  if ('priority' in input) {
    if (!PRIORITY_KEYS.includes(input.priority as TaskPriority)) throw new Error('Unknown priority.');
    out.priority = input.priority;
  }
  if ('due_date' in input) {
    if (input.due_date && !isValidDate(input.due_date)) throw new Error('Due date must be YYYY-MM-DD.');
    out.due_date = input.due_date || null;
  }
  for (const key of ['type_id', 'owner_id', 'study_id', 'event_id', 'contact_id'] as const) {
    if (key in input) out[key] = input[key] || null;
  }
  return out;
}

export async function createTask(input: TaskInput, actor: IowaStaff | null): Promise<CampusTask> {
  const row = cleanTaskInput({ priority: 'normal', ...input, title: input.title ?? '' });
  // New tasks default to whoever made them (Travis's call). Pass owner_id: null
  // explicitly to leave one unowned.
  if (!('owner_id' in input)) row.owner_id = actor?.id ?? null;
  row.created_by = actor?.id ?? null;
  if (row.status === 'done') row.completed_at = new Date().toISOString();

  const { data, error } = await getSupabaseAdmin().from('iowa_tasks').insert(row).select('id').single();
  if (error) throw error;
  await logActivity(data.id, actor?.id ?? null, ['created this task']);
  return (await getTask(data.id))!;
}

export async function updateTask(
  id: string,
  input: TaskInput,
  actor: IowaStaff | null
): Promise<{ task: CampusTask; before: CampusTask }> {
  const before = await getTask(id);
  if (!before) throw new Error('Task not found.');
  const update = cleanTaskInput(input);

  const staff = await listStaff();
  const nameOf = (sid: string | null) => (sid ? staff.find((s) => s.id === sid)?.name ?? 'someone' : 'nobody');
  const actions: string[] = [];
  if ('status' in update && update.status !== before.status) {
    actions.push(`set status to ${TASK_STATUSES.find((s) => s.key === update.status)!.label.toLowerCase()}`);
    update.completed_at = update.status === 'done' ? new Date().toISOString() : null;
  }
  if ('priority' in update && update.priority !== before.priority) {
    actions.push(`set priority to ${PRIORITY[update.priority as TaskPriority].label.toLowerCase()}`);
  }
  if ('owner_id' in update && update.owner_id !== before.owner_id) {
    actions.push(
      update.owner_id === actor?.id
        ? 'took this task'
        : update.owner_id
          ? `assigned it to ${nameOf(update.owner_id as string)}`
          : 'left it unowned'
    );
  }
  if ('due_date' in update && update.due_date !== before.due_date) {
    actions.push(update.due_date ? `set due date to ${update.due_date}` : 'cleared the due date');
  }
  if (
    ('title' in update && update.title !== before.title) ||
    ('description' in update && update.description !== before.description)
  ) {
    actions.push('edited the details');
  }
  update.updated_at = new Date().toISOString();

  const { error } = await getSupabaseAdmin().from('iowa_tasks').update(update).eq('id', id);
  if (error) throw error;
  await logActivity(id, actor?.id ?? null, actions);
  return { task: (await getTask(id))!, before };
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function setHelper(taskId: string, staffId: string, helping: boolean): Promise<CampusTask> {
  const db = getSupabaseAdmin();
  if (helping) {
    const { error } = await db
      .from('iowa_task_helpers')
      .upsert({ task_id: taskId, staff_id: staffId }, { onConflict: 'task_id,staff_id', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await db.from('iowa_task_helpers').delete().eq('task_id', taskId).eq('staff_id', staffId);
    if (error) throw error;
  }
  await logActivity(taskId, staffId, [helping ? 'offered to help' : 'stopped helping']);
  const task = await getTask(taskId);
  if (!task) throw new Error('Task not found.');
  return task;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const EVENT_SELECT = '*, staff:iowa_event_staff(staff_id)';

interface EventRow extends Omit<CampusEvent, 'staff_ids'> {
  staff: { staff_id: string }[] | null;
}

function flattenEvent(r: EventRow): CampusEvent {
  const { staff, ...rest } = r;
  return { ...rest, staff_ids: (staff ?? []).map((s) => s.staff_id) };
}

// Every event that could land in [from, to]: one-offs in range, plus repeating
// events that started on or before `to` and haven't ended before `from`.
export async function listEvents(from: string, to: string): Promise<CampusEvent[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_events')
    .select(EVENT_SELECT)
    .lte('event_date', to)
    .or(`event_date.gte.${from},and(repeat_weekly.eq.true,or(repeat_until.is.null,repeat_until.gte.${from}))`)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as EventRow[]).map(flattenEvent);
}

// Upcoming + recent events for pickers (link a task to an event).
export async function listEventOptions(): Promise<CampusEvent[]> {
  const today = chicagoToday();
  return listEvents(addDays(today, -30), addDays(today, 120));
}

export interface EventInput {
  title?: string;
  type_id?: string | null;
  event_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  notes?: string | null;
  repeat_weekly?: boolean;
  repeat_until?: string | null;
  staff_ids?: string[];
}

function cleanEventInput(input: EventInput, creating: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (creating || 'title' in input) {
    const t = (input.title ?? '').trim();
    if (!t) throw new Error('An event needs a title.');
    out.title = t;
  }
  if (creating || 'event_date' in input) {
    if (!isValidDate(input.event_date)) throw new Error('Pick a date.');
    out.event_date = input.event_date;
  }
  for (const key of ['start_time', 'end_time'] as const) {
    if (key in input) {
      const v = input[key];
      if (v && !/^\d{2}:\d{2}(:\d{2})?$/.test(v)) throw new Error('Times must be HH:MM.');
      out[key] = v || null;
    }
  }
  for (const key of ['location', 'meeting_link', 'notes'] as const) {
    if (key in input) out[key] = input[key]?.trim() || null;
  }
  if (typeof out.meeting_link === 'string' && !/^https?:\/\//i.test(out.meeting_link)) {
    out.meeting_link = `https://${out.meeting_link}`;
  }
  if ('type_id' in input) out.type_id = input.type_id || null;
  if ('repeat_weekly' in input) out.repeat_weekly = !!input.repeat_weekly;
  if ('repeat_until' in input) {
    if (input.repeat_until && !isValidDate(input.repeat_until)) throw new Error('Repeat-until must be a date.');
    out.repeat_until = input.repeat_until || null;
  }
  return out;
}

async function setEventStaff(eventId: string, staffIds: string[]) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('iowa_event_staff').delete().eq('event_id', eventId);
  if (error) throw error;
  const unique = [...new Set(staffIds.filter(Boolean))];
  if (unique.length === 0) return;
  const { error: insErr } = await db
    .from('iowa_event_staff')
    .insert(unique.map((staff_id) => ({ event_id: eventId, staff_id })));
  if (insErr) throw insErr;
}

async function getEvent(id: string): Promise<CampusEvent> {
  const { data, error } = await getSupabaseAdmin().from('iowa_events').select(EVENT_SELECT).eq('id', id).single();
  if (error) throw error;
  return flattenEvent(data as unknown as EventRow);
}

export async function createEvent(input: EventInput, actor: IowaStaff | null): Promise<CampusEvent> {
  const row = cleanEventInput(input, true);
  row.created_by = actor?.id ?? null;
  const { data, error } = await getSupabaseAdmin().from('iowa_events').insert(row).select('id').single();
  if (error) throw error;
  await setEventStaff(data.id, input.staff_ids ?? (actor ? [actor.id] : []));
  return getEvent(data.id);
}

async function assertAppOwned(id: string) {
  const { data, error } = await getSupabaseAdmin().from('iowa_events').select('source').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Event not found.');
  if (data.source === 'google') throw new Error('This event comes from Google Calendar. Edit it there.');
}

export async function updateEvent(id: string, input: EventInput): Promise<CampusEvent> {
  await assertAppOwned(id);
  const update = cleanEventInput(input, false);
  if (Object.keys(update).length > 0) {
    const { error } = await getSupabaseAdmin().from('iowa_events').update(update).eq('id', id);
    if (error) throw error;
  }
  if (Array.isArray(input.staff_ids)) await setEventStaff(id, input.staff_ids);
  return getEvent(id);
}

// Returns the Google event id so the caller can remove it from Google too.
export async function deleteEvent(id: string): Promise<string | null> {
  await assertAppOwned(id);
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_events')
    .delete()
    .eq('id', id)
    .select('google_event_id')
    .maybeSingle();
  if (error) throw error;
  return (data?.google_event_id as string | null) ?? null;
}
