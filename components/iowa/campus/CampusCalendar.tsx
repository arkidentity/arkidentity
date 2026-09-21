'use client';

import { useMemo, useState } from 'react';
import type { StudyWithMembers } from '@/lib/bibleStudies';
import type { CampusEvent, CampusTask } from '@/lib/campusTasks';
import type { HeldEvent } from '@/lib/calendarSync';
import { formatTime } from '@/lib/bibleStudyFormat';
import { addDays, formatDate, weekDays } from '@/lib/campusFormat';
import WeekView, { MineToggle, WeekLegend, buildWeekItems } from '@/components/iowa/campus/WeekView';
import {
  ErrorBox,
  Field,
  PageShell,
  btnPrimary,
  input,
  useCall,
  type CallFn,
  type StaffOption,
  type TypeOption,
} from '@/components/iowa/campus/ui';

export default function CampusCalendar({
  weekStart,
  studies,
  events,
  tasks,
  staff,
  types,
  meId,
  held,
  sync,
}: {
  held: HeldEvent[];
  sync: { configured: boolean; lastPulledAt: string | null; lastError: string | null };
  weekStart: string;
  studies: StudyWithMembers[];
  events: CampusEvent[];
  tasks: CampusTask[];
  staff: StaffOption[];
  types: TypeOption[];
  meId: string | null;
}) {
  const [mineOnly, setMineOnly] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const { call, busy, error } = useCall();
  const days = weekDays(weekStart);
  const items = useMemo(
    () => buildWeekItems({ days, studies, events, tasks, staff, types, meId, mineOnly }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart, studies, events, tasks, staff, types, meId, mineOnly]
  );
  const editingEvent = editing && editing !== 'new' ? events.find((e) => e.id === editing) : undefined;
  const linkedTasks = editingEvent ? tasks.filter((t) => t.event_id === editingEvent.id && t.status !== 'done') : [];

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
          Calendar
        </h1>
        <button onClick={() => setEditing(editing === 'new' ? null : 'new')} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
          {editing === 'new' ? 'Close' : '+ New event'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          <a href={`?week=${addDays(weekStart, -7)}`} className="px-2 py-1 rounded border border-gray-300 bg-white">
            ←
          </a>
          <a href="?" className="px-2 py-1 rounded border border-gray-300 bg-white">
            This week
          </a>
          <a href={`?week=${addDays(weekStart, 7)}`} className="px-2 py-1 rounded border border-gray-300 bg-white">
            →
          </a>
          <span className="ml-2">
            {formatDate(days[0], { month: 'short', day: 'numeric' })} – {formatDate(days[6], { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <MineToggle mineOnly={mineOnly} onChange={setMineOnly} />
      </div>

      <ErrorBox error={error} />

      <SyncBar sync={sync} busy={busy} onSync={() => call('/api/iowa/admin/calendar-sync', 'POST', {})} />

      {held.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-bold text-amber-900 mb-1">Looks like a duplicate ({held.length})</p>
          <p className="text-sm text-amber-900 mb-3">
            These Google events land on the same day and time as a Bible study the admin already puts on the
            calendar for you, so they weren’t imported. Delete them in Google Calendar and they’ll drop off
            this list, or decide here.
          </p>
          <ul className="space-y-2">
            {held.map((h) => (
              <li key={h.google_event_id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-md border border-amber-200 px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{h.summary}</span>
                  <span className="text-[#8a8378]"> · {h.starts_label}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => call('/api/iowa/admin/calendar-sync', 'POST', { heldId: h.google_event_id, decision: 'import' })}
                    className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Not a duplicate, import it
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => call('/api/iowa/admin/calendar-sync', 'POST', { heldId: h.google_event_id, decision: 'ignore' })}
                    className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Keep it out of the admin
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing === 'new' && (
        <div className="mb-6">
          <EventForm staff={staff} types={types} meId={meId} busy={busy} call={call} onDone={() => setEditing(null)} defaultDate={days[0]} />
        </div>
      )}

      <div className="mb-3">
        <WeekLegend />
      </div>
      <WeekView days={days} items={items} onEventClick={(id) => setEditing(id)} />

      {editingEvent && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
              {editingEvent.title}
            </h2>
            <button onClick={() => setEditing(null)} className="text-sm text-[#8a8378]">
              Close
            </button>
          </div>
          {editingEvent.meeting_link && (
            <p className="mb-3 text-sm">
              <a href={editingEvent.meeting_link} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--navy)' }}>
                Join meeting ↗
              </a>
            </p>
          )}
          {editingEvent.source === 'google' ? (
            <GoogleEventDetails event={editingEvent} />
          ) : (
            <EventForm key={editingEvent.id} event={editingEvent} staff={staff} types={types} meId={meId} busy={busy} call={call} onDone={() => setEditing(null)} />
          )}
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
                Tasks for this event
              </p>
              <a href={`/iowa/admin/tasks?new=1&event=${editingEvent.id}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
                + Add a task
              </a>
            </div>
            {linkedTasks.length === 0 ? (
              <p className="text-sm text-[#8a8378]">No open tasks.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {linkedTasks.map((t) => (
                  <li key={t.id}>
                    <a href={`/iowa/admin/tasks?task=${t.id}`} className="hover:underline" style={{ color: 'var(--navy)' }}>
                      {t.title}
                    </a>
                    <span className="text-[#8a8378]">
                      {' · '}
                      {staff.find((s) => s.id === t.owner_id)?.name ?? 'Unowned'}
                      {t.due_date ? ` · due ${formatDate(t.due_date)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function EventForm({
  event,
  staff,
  types,
  meId,
  busy,
  call,
  onDone,
  defaultDate,
}: {
  event?: CampusEvent;
  staff: StaffOption[];
  types: TypeOption[];
  meId: string | null;
  busy: boolean;
  call: CallFn;
  onDone: () => void;
  defaultDate?: string;
}) {
  const [f, setF] = useState({
    title: event?.title ?? '',
    type_id: event?.type_id ?? '',
    event_date: event?.event_date ?? defaultDate ?? '',
    start_time: event?.start_time?.slice(0, 5) ?? '',
    end_time: event?.end_time?.slice(0, 5) ?? '',
    location: event?.location ?? '',
    meeting_link: event?.meeting_link ?? '',
    notes: event?.notes ?? '',
    repeat_weekly: event?.repeat_weekly ?? false,
    repeat_until: event?.repeat_until ?? '',
    staff_ids: event?.staff_ids ?? (meId ? [meId] : []),
  });
  const set = (patch: Partial<typeof f>) => setF((cur) => ({ ...cur, ...patch }));
  const eventTypes = types.filter((t) => t.kind === 'event' && (t.active || t.id === f.type_id));

  async function save() {
    const ok = event
      ? await call(`/api/iowa/admin/events/${event.id}`, 'PATCH', f)
      : await call('/api/iowa/admin/events', 'POST', f);
    if (ok) onDone();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 grid sm:grid-cols-2 gap-3">
      <Field label="Event">
        <input className={input} value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Tuesday check-in" />
      </Field>
      <Field label="Type">
        <select className={input} value={f.type_id} onChange={(e) => set({ type_id: e.target.value })}>
          <option value="">No type</option>
          {eventTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={f.repeat_weekly ? 'First date' : 'Date'}>
        <input type="date" className={input} value={f.event_date} onChange={(e) => set({ event_date: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Start">
          <input type="time" className={input} value={f.start_time} onChange={(e) => set({ start_time: e.target.value })} />
        </Field>
        <Field label="End">
          <input type="time" className={input} value={f.end_time} onChange={(e) => set({ end_time: e.target.value })} />
        </Field>
      </div>
      <Field label="Location">
        <input className={input} value={f.location} onChange={(e) => set({ location: e.target.value })} placeholder="IMU room 204" />
      </Field>
      <Field label="Meeting link">
        <input className={input} value={f.meeting_link} onChange={(e) => set({ meeting_link: e.target.value })} placeholder="Paste a Google Meet link" />
      </Field>
      <Field label="Repeats">
        <label className="flex items-center gap-2 text-sm py-2 text-gray-700">
          <input type="checkbox" checked={f.repeat_weekly} onChange={(e) => set({ repeat_weekly: e.target.checked })} />
          Every week
        </label>
      </Field>
      {f.repeat_weekly && (
        <Field label="Until (optional)">
          <input type="date" className={input} value={f.repeat_until} onChange={(e) => set({ repeat_until: e.target.value })} />
        </Field>
      )}
      <Field label="Who's going" className="sm:col-span-2">
        <div className="flex flex-wrap gap-3 py-1">
          {staff
            .filter((p) => p.active || f.staff_ids.includes(p.id))
            .map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={f.staff_ids.includes(p.id)}
                  onChange={(e) =>
                    set({ staff_ids: e.target.checked ? [...f.staff_ids, p.id] : f.staff_ids.filter((x) => x !== p.id) })
                  }
                />
                {p.name}
              </label>
            ))}
        </div>
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea rows={2} className={input} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={busy || !f.title.trim() || !f.event_date} onClick={save} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
          {event ? 'Save event' : 'Create event'}
        </button>
        {event && (
          <button
            disabled={busy}
            onClick={async () => {
              const what = event.repeat_weekly ? 'this event and every repeat' : 'this event';
              if (confirm(`Delete ${what}? Linked tasks stay, just unlinked.`) && (await call(`/api/iowa/admin/events/${event.id}`, 'DELETE'))) onDone();
            }}
            className="px-3 py-2 rounded-md text-sm font-semibold"
            style={{ color: '#b91c1c' }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function SyncBar({
  sync,
  busy,
  onSync,
}: {
  sync: { configured: boolean; lastPulledAt: string | null; lastError: string | null };
  busy: boolean;
  onSync: () => void;
}) {
  if (!sync.configured) {
    return <p className="mb-4 text-xs text-[#8a8378]">Google Calendar isn’t connected yet.</p>;
  }
  const when = sync.lastPulledAt
    ? new Date(sync.lastPulledAt).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'never';
  return (
    <div className="mb-4 text-xs text-[#8a8378] flex flex-wrap items-center gap-2">
      <span>Synced with the ARK Campus Google calendar · last pulled {when}</span>
      <button disabled={busy} onClick={onSync} className="font-semibold underline disabled:opacity-50" style={{ color: 'var(--navy)' }}>
        {busy ? 'Syncing…' : 'Sync now'}
      </button>
      {sync.lastError && <span className="w-full text-red-700">Last sync problem: {sync.lastError}</span>}
    </div>
  );
}

// Events that came from Google are owned by Google: show them, link out to edit.
function GoogleEventDetails({ event }: { event: CampusEvent }) {
  const when = [
    event.repeat_weekly ? `Weekly from ${formatDate(event.event_date)}` : formatDate(event.event_date),
    event.start_time ? `${formatTime(event.start_time)}${event.end_time ? `–${formatTime(event.end_time)}` : ''}` : 'All day',
    event.repeat_until ? `until ${formatDate(event.repeat_until)}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm space-y-2">
      <p className="text-[#4a4540]">{when}</p>
      {event.location && <p className="text-[#4a4540]">{event.location}</p>}
      {event.notes && <p className="text-[#8a8378] whitespace-pre-wrap">{event.notes}</p>}
      <p className="text-xs text-[#8a8378]">
        This event lives in Google Calendar. Change it there and the admin picks it up.
        {event.google_html_link && (
          <>
            {' '}
            <a href={event.google_html_link} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--navy)' }}>
              Open in Google Calendar ↗
            </a>
          </>
        )}
      </p>
    </div>
  );
}
