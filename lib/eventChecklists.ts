import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { IowaStaff } from '@/lib/iowaStaff';
import { addDays, chicagoToday, eventDatesInRange, formatDate, isValidDate } from '@/lib/campusFormat';

// Event checklists (migration 019): tasks due N days before/after an event.
// Templates are reusable lists; applying one to an event makes real tasks.
// Repeating events get a fresh set per occurrence, a couple of weeks ahead.
// Every checklist task stores event_occurrence + offset_days, so moving the
// event moves the due dates. See docs/IOWA-CAMPUS-TASKS.md → Event checklists.

export interface ChecklistItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  offset_days: number;
  default_owner_id: string | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  sort: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  event_type_id: string | null;
  items: ChecklistItem[];
}

const PRIORITIES = ['urgent', 'high', 'normal', 'low'];
// Repeating events: make an occurrence's tasks once its earliest one is due
// within this many days (and never more than a few occurrences ahead).
const LEAD_DAYS = 14;
const MAX_AHEAD = 3;

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listTemplates(): Promise<ChecklistTemplate[]> {
  const db = getSupabaseAdmin();
  const [{ data: t, error }, { data: items, error: iErr }] = await Promise.all([
    db.from('iowa_checklist_templates').select('id, name, event_type_id').order('name'),
    db.from('iowa_checklist_items').select('*').order('offset_days').order('sort'),
  ]);
  if (error) throw error;
  if (iErr) throw iErr;
  return (t ?? []).map((x) => ({
    ...(x as Omit<ChecklistTemplate, 'items'>),
    items: ((items ?? []) as ChecklistItem[]).filter((i) => i.template_id === x.id),
  }));
}

export async function saveTemplate(input: { id?: string; name?: string; event_type_id?: string | null }): Promise<string> {
  const db = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error('Name the checklist.');
    row.name = input.name.trim();
  }
  if (input.event_type_id !== undefined) row.event_type_id = input.event_type_id || null;
  if (input.id) {
    const { error } = await db.from('iowa_checklist_templates').update(row).eq('id', input.id);
    if (error) throw error;
    return input.id;
  }
  if (!row.name) throw new Error('Name the checklist.');
  const { data, error } = await db.from('iowa_checklist_templates').insert(row).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_checklist_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function saveItem(input: Partial<ChecklistItem> & { template_id?: string }): Promise<void> {
  const db = getSupabaseAdmin();
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) {
    if (!input.title.trim()) throw new Error('Give the task a title.');
    row.title = input.title.trim();
  }
  if (input.description !== undefined) row.description = input.description?.trim() || null;
  if (input.offset_days !== undefined) {
    if (!Number.isInteger(input.offset_days) || Math.abs(input.offset_days) > 400) throw new Error('Days must be a whole number.');
    row.offset_days = input.offset_days;
  }
  if (input.default_owner_id !== undefined) row.default_owner_id = input.default_owner_id || null;
  if (input.priority !== undefined) {
    if (!PRIORITIES.includes(input.priority)) throw new Error('Unknown priority.');
    row.priority = input.priority;
  }
  if (input.id) {
    const { error } = await db.from('iowa_checklist_items').update(row).eq('id', input.id);
    if (error) throw error;
    return;
  }
  if (!input.template_id || !row.title) throw new Error('Give the task a title.');
  const { error } = await db.from('iowa_checklist_items').insert({ ...row, template_id: input.template_id, sort: 50 });
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from('iowa_checklist_items').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Events ↔ tasks
// ---------------------------------------------------------------------------

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  repeat_weekly: boolean;
  repeat_until: string | null;
  skip_dates: string[] | null;
  checklist_template_id: string | null;
  staff: { staff_id: string }[] | null;
}

async function loadEvent(id: string): Promise<EventRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_events')
    .select('id, title, event_date, repeat_weekly, repeat_until, skip_dates, checklist_template_id, staff:iowa_event_staff(staff_id)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as EventRow | null;
}

// Dates of an event that still count (past dates only for a one-off within
// the last couple of weeks, so "day after" follow-ups can still be made).
function occurrences(e: EventRow, today: string, horizonDays = 366): string[] {
  if (!e.repeat_weekly) return e.event_date >= addDays(today, -14) ? [e.event_date] : [];
  return eventDatesInRange(e, today, addDays(today, horizonDays));
}

const whenLabel = (offset: number) =>
  offset === 0 ? 'day of' : offset < 0 ? `${-offset} day${offset === -1 ? '' : 's'} before` : `${offset} day${offset === 1 ? '' : 's'} after`;

let taskTypeCache: string | null | undefined;
async function eventPrepType(): Promise<string | null> {
  if (taskTypeCache !== undefined) return taskTypeCache;
  const { data } = await getSupabaseAdmin().from('iowa_item_types').select('id').eq('kind', 'task').ilike('name', 'Event prep').maybeSingle();
  taskTypeCache = (data?.id as string) ?? null;
  return taskTypeCache;
}

// Make any checklist tasks this event is due for. Idempotent (auto_key).
export async function generateForEvent(eventId: string, today = chicagoToday()): Promise<number> {
  const e = await loadEvent(eventId);
  if (!e?.checklist_template_id) return 0;
  const template = (await listTemplates()).find((t) => t.id === e.checklist_template_id);
  if (!template || template.items.length === 0) return 0;

  const earliest = Math.min(...template.items.map((i) => i.offset_days));
  let dates = occurrences(e, today);
  if (e.repeat_weekly) {
    dates = dates.filter((d) => addDays(d, earliest) <= addDays(today, LEAD_DAYS)).slice(0, MAX_AHEAD);
  }

  const db = getSupabaseAdmin();
  const typeId = await eventPrepType();
  const goingFirst = e.staff?.[0]?.staff_id ?? null;
  let made = 0;
  for (const occ of dates) {
    for (const item of template.items) {
      const realDue = addDays(occ, item.offset_days);
      if (realDue < addDays(today, -1) && occ < today) continue; // long past — don't backfill
      const due = realDue < today ? today : realDue; // applied late: due now, not already overdue
      const { data, error } = await db
        .from('iowa_tasks')
        .insert({
          title: item.title,
          description: [
            `For ${e.title} on ${formatDate(occ)} (${whenLabel(item.offset_days)}).`,
            realDue < today ? `Was due ${formatDate(realDue)}; the checklist was added late.` : null,
            item.description,
          ].filter(Boolean).join('\n'),
          type_id: typeId,
          priority: item.priority,
          due_date: due,
          owner_id: item.default_owner_id ?? goingFirst,
          event_id: e.id,
          event_occurrence: occ,
          offset_days: item.offset_days,
          checklist_item_id: item.id,
          auto_kind: 'checklist',
          auto_key: `checklist:${e.id}:${occ}:${item.id}`,
        })
        .select('id')
        .single();
      if (error) {
        if (error.code === '23505') continue;
        throw error;
      }
      await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: null, action: `auto-created from the ${template.name} checklist` });
      made++;
    }
  }
  return made;
}

// Set (or clear) an event's checklist template, then make its tasks. Clearing
// removes checklist tasks nobody has started yet; anything in progress stays.
export async function applyTemplate(eventId: string, templateId: string | null): Promise<number> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('iowa_events').update({ checklist_template_id: templateId }).eq('id', eventId);
  if (error) throw error;
  if (!templateId) {
    await db
      .from('iowa_tasks')
      .delete()
      .eq('event_id', eventId)
      .eq('auto_kind', 'checklist')
      .eq('status', 'open')
      .gte('event_occurrence', chicagoToday());
    return 0;
  }
  return generateForEvent(eventId);
}

// A one-off task on an event, timed relative to it ("3 days before").
export async function addEventTask(
  eventId: string,
  input: { title?: string; offset_days?: number; owner_id?: string | null; priority?: string; occurrence?: string },
  actor: IowaStaff | null
): Promise<void> {
  const e = await loadEvent(eventId);
  if (!e) throw new Error('Event not found.');
  if (!input.title?.trim()) throw new Error('Give the task a title.');
  const offset = Number(input.offset_days ?? 0);
  if (!Number.isInteger(offset)) throw new Error('Days must be a whole number.');
  const today = chicagoToday();
  const occ =
    input.occurrence && isValidDate(input.occurrence) ? input.occurrence : occurrences(e, today)[0] ?? e.event_date;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('iowa_tasks')
    .insert({
      title: input.title.trim(),
      description: `For ${e.title} on ${formatDate(occ)} (${whenLabel(offset)}).`,
      type_id: await eventPrepType(),
      priority: PRIORITIES.includes(input.priority ?? '') ? input.priority : 'normal',
      due_date: addDays(occ, offset),
      owner_id: input.owner_id === undefined ? actor?.id ?? null : input.owner_id || null,
      event_id: e.id,
      event_occurrence: occ,
      offset_days: offset,
      created_by: actor?.id ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  await db.from('iowa_task_activity').insert({ task_id: data.id, staff_id: actor?.id ?? null, action: 'created this task' });
}

// The event moved (date, repeat, skipped week, or edited in Google): re-time
// its open tasks. One-offs follow the new date. For a repeating event, a task
// whose date is no longer an occurrence moves to the next real one (checklist
// tasks for it are simply dropped and regenerated). Then fill in anything new.
export async function realignEvent(eventId: string): Promise<void> {
  const e = await loadEvent(eventId);
  if (!e) return;
  const db = getSupabaseAdmin();
  const { data: tasks, error } = await db
    .from('iowa_tasks')
    .select('id, event_occurrence, offset_days, auto_kind, status, title')
    .eq('event_id', eventId)
    .not('offset_days', 'is', null)
    .neq('status', 'done');
  if (error) throw error;

  const today = chicagoToday();
  const valid = new Set(e.repeat_weekly ? eventDatesInRange(e, addDays(today, -14), addDays(today, 400)) : [e.event_date]);
  for (const t of tasks ?? []) {
    let occ = t.event_occurrence as string | null;
    if (!e.repeat_weekly) occ = e.event_date;
    else if (!occ || !valid.has(occ)) {
      if (t.auto_kind === 'checklist' && t.status === 'open') {
        await db.from('iowa_tasks').delete().eq('id', t.id);
        continue;
      }
      occ = [...valid].sort().find((d) => d >= (t.event_occurrence ?? today)) ?? null;
      if (!occ) continue;
    }
    await db
      .from('iowa_tasks')
      .update({ event_occurrence: occ, due_date: addDays(occ, t.offset_days as number), updated_at: new Date().toISOString() })
      .eq('id', t.id);
  }
  await generateForEvent(eventId, today);
}

// New event: if a checklist template is tied to its type, apply it.
export async function autoApplyForType(eventId: string, typeId: string | null): Promise<void> {
  if (!typeId) return;
  const { data } = await getSupabaseAdmin().from('iowa_checklist_templates').select('id').eq('event_type_id', typeId).limit(1).maybeSingle();
  if (data?.id) await applyTemplate(eventId, data.id as string);
}

// Morning run: top up repeating events' upcoming checklists.
export async function generateAllChecklists(): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from('iowa_events')
    .select('id')
    .not('checklist_template_id', 'is', null);
  if (error) throw error;
  let made = 0;
  for (const r of data ?? []) {
    try {
      made += await generateForEvent(r.id as string);
    } catch (e) {
      console.error('[iowa checklists] generate failed', r.id, e);
    }
  }
  return made;
}
