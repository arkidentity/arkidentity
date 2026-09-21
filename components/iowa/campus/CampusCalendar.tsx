'use client';

import { useMemo, useState } from 'react';
import type { StudyWithMembers } from '@/lib/bibleStudies';
import type { CampusEvent, CampusTask } from '@/lib/campusTasks';
import type { HeldEvent } from '@/lib/calendarSync';
import type { Rsvp } from '@/lib/eventInvites';
import EventPeople from '@/components/iowa/campus/EventPeople';
import StudyCard from '@/components/iowa/campus/StudyCard';
import { formatTime } from '@/lib/bibleStudyFormat';
import {
  addDays,
  breakDatesForSeries,
  eventDatesInRange,
  formatDate,
  scheduleWarnings,
  weekDays,
  type SchoolPeriod,
  type Semester,
} from '@/lib/campusFormat';
import WeekView, { MineToggle, WeekLegend, buildWeekItems } from '@/components/iowa/campus/WeekView';
import {
  ErrorBox,
  Field,
  Modal,
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
  periods,
  semesters,
  templates,
  rsvps = [],
  students = [],
}: {
  templates: { id: string; name: string; itemCount: number }[];
  rsvps?: Rsvp[];
  students?: { id: string; label: string }[];
  periods: SchoolPeriod[];
  semesters: Semester[];
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
  // Everyone by default (Travis); Mine is one tap away.
  const [mineOnly, setMineOnly] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [clickedDate, setClickedDate] = useState<string | null>(null); // which week's box was clicked
  const [studyOpen, setStudyOpen] = useState<{ id: string; date: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { call, busy, error } = useCall();
  const days = weekDays(weekStart);
  const items = useMemo(
    () => {
      const going: Record<string, number> = {};
      for (const r of rsvps) if (r.response === 'yes') going[`${r.event_id}:${r.occurrence}`] = (going[`${r.event_id}:${r.occurrence}`] ?? 0) + 1 + r.guests;
      return buildWeekItems({ days, studies, events, tasks, staff, types, meId, mineOnly, periods, semesters, going });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekStart, studies, events, tasks, staff, types, meId, mineOnly, periods, semesters, rsvps]
  );
  const editingEvent = editing && editing !== 'new' ? events.find((e) => e.id === editing) : undefined;

  return (
    <section id="week" className="mb-10 scroll-mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
          {weekRange(days[0], days[6])}
        </h2>
        <button onClick={() => setEditing(editing === 'new' ? null : 'new')} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>
          {editing === 'new' ? 'Close' : '+ New event'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold shrink-0" style={{ color: 'var(--navy)' }}>
          <a href={`?week=${addDays(weekStart, -7)}#week`} className="px-2 py-1 rounded border border-gray-300 bg-white">
            ←
          </a>
          <a href="?#week" className="px-2 py-1 rounded border border-gray-300 bg-white">
            This week
          </a>
          <a href={`?week=${addDays(weekStart, 7)}#week`} className="px-2 py-1 rounded border border-gray-300 bg-white">
            →
          </a>
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
          <EventForm staff={staff} types={types} meId={meId} busy={busy} call={call} onDone={() => setEditing(null)} defaultDate={days[0]} periods={periods} />
        </div>
      )}

      <div className="mb-3">
        <WeekLegend />
      </div>
      <WeekView
        days={days}
        items={items}
        periods={periods}
        onEventClick={(id, date) => {
          setEditing(id);
          setClickedDate(date);
          setEditOpen(false);
        }}
        onStudyClick={(id, date) => setStudyOpen({ id, date })}
      />

      {studyOpen && studies.find((x) => x.id === studyOpen.id) && (
        <StudyCard
          study={studies.find((x) => x.id === studyOpen.id)!}
          date={studyOpen.date}
          staff={staff}
          onClose={() => setStudyOpen(null)}
        />
      )}

      {editingEvent && (
        <Modal
          title={editingEvent.title}
          onClose={() => setEditing(null)}
          sub={
            <>
              {clickedDate ? formatDate(clickedDate, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
              {editingEvent.start_time ? ` · ${formatTime(editingEvent.start_time)}` : ' · All day'}
              {editingEvent.end_time ? `–${formatTime(editingEvent.end_time)}` : ''}
              {editingEvent.location ? ` · ${editingEvent.location}` : ''}
              {editingEvent.repeat_weekly ? ' · weekly' : ''}
            </>
          }
        >
          {editingEvent.meeting_link && (
            <a
              href={editingEvent.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="inline-block mb-3 px-4 py-2 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: '#15803d' }}
            >
              Join meeting ↗
            </a>
          )}
          {editingEvent.notes && editingEvent.source !== 'google' && <p className="text-[15px] md:text-sm text-[#4a4540] whitespace-pre-wrap mb-3">{editingEvent.notes}</p>}
          {editingEvent.source === 'google' && <GoogleEventDetails event={editingEvent} />}

          <EventPeople
            event={editingEvent}
            date={clickedDate}
            staff={staff}
            meId={meId}
            rsvps={rsvps.filter((r) => r.event_id === editingEvent.id)}
            students={students}
          />
          <EventChecklist
            event={editingEvent}
            tasks={tasks.filter((t) => t.event_id === editingEvent.id)}
            templates={templates}
            staff={staff}
            meId={meId}
            busy={busy}
            call={call}
          />

          {(editingEvent.source !== 'google' || editingEvent.repeat_weekly) && (
            <div className="mt-4">
              <button
                onClick={() => setEditOpen((v) => !v)}
                className="text-sm font-semibold px-3 py-1.5 rounded-md border border-gray-300 bg-white"
                style={{ color: 'var(--navy)' }}
              >
                {editOpen ? 'Close edit ▴' : editingEvent.source === 'google' ? 'Skip a week ▾' : 'Edit event ▾'}
              </button>
              {editOpen && (
                <div className="mt-3 space-y-3">
                  {editingEvent.repeat_weekly && (
                    <SkipDates event={editingEvent} clickedDate={clickedDate} busy={busy} call={call} />
                  )}
                  {editingEvent.source !== 'google' && (
                    <EventForm key={editingEvent.id} event={editingEvent} staff={staff} types={types} meId={meId} busy={busy} call={call} onDone={() => setEditing(null)} periods={periods} />
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </section>
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
  periods,
}: {
  periods: SchoolPeriod[];
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
    skip_dates: event?.skip_dates ?? ([] as string[]),
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
      <Field label="Invite (they accept or decline)" className="sm:col-span-2">
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
      <BreakWarnings f={f} periods={periods} onSkip={(dates) => set({ skip_dates: [...new Set([...f.skip_dates, ...dates])].sort() })} />
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
  // Short enough to stay on one line on a phone.
  const when = sync.lastPulledAt
    ? new Date(sync.lastPulledAt).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        ...(new Date(sync.lastPulledAt).toDateString() === new Date().toDateString()
          ? { hour: 'numeric', minute: '2-digit' }
          : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      })
    : 'never';
  return (
    <div className="mb-4 text-xs text-[#8a8378]">
      <span className="whitespace-nowrap">
        Google synced {when} ·{' '}
        <button disabled={busy} onClick={onSync} className="font-semibold underline disabled:opacity-50" style={{ color: 'var(--navy)' }}>
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
      </span>
      {sync.lastError && <span className="block text-red-700 mt-1">Last sync problem: {sync.lastError}</span>}
    </div>
  );
}

// "Sep 21 – 27" in one month, "Sep 28 – Oct 4" across two.
function weekRange(from: string, to: string): string {
  const a = formatDate(from, { month: 'short', day: 'numeric' });
  return from.slice(0, 7) === to.slice(0, 7) ? `${a} – ${Number(to.slice(8))}` : `${a} – ${formatDate(to, { month: 'short', day: 'numeric' })}`;
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

// One week off from a weekly event (finals, a break). Admin events: skip or
// restore here and Google follows. Google events: cancel that week in Google.
function SkipDates({
  event,
  clickedDate,
  busy,
  call,
}: {
  event: CampusEvent;
  clickedDate: string | null;
  busy: boolean;
  call: CallFn;
}) {
  const skipped = event.skip_dates ?? [];
  const save = (dates: string[]) => call(`/api/iowa/admin/events/${event.id}`, 'PATCH', { skip_dates: dates });
  const google = event.source === 'google';

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      {clickedDate && !skipped.includes(clickedDate) && (
        google ? (
          <p className="text-[#4a4540]">
            Not happening on {formatDate(clickedDate)}? Open that week in Google Calendar and delete just
            “This event.” The admin picks it up on the next sync.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[#4a4540]">
              Not happening on <strong>{formatDate(clickedDate)}</strong>? Skip just that week. The rest of the series stays.
            </span>
            <button
              disabled={busy}
              onClick={() => {
                if (confirm(`Skip ${event.title} on ${formatDate(clickedDate)}? It comes off Google Calendar too.`)) {
                  save([...skipped, clickedDate]);
                }
              }}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#b91c1c' }}
            >
              Skip {formatDate(clickedDate, { month: 'short', day: 'numeric' })}
            </button>
          </div>
        )
      )}
      {skipped.length > 0 && (
        <div className={clickedDate && !skipped.includes(clickedDate) ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#8a8378' }}>
            Skipped weeks
          </p>
          <ul className="flex flex-wrap gap-2">
            {skipped.map((d) => (
              <li key={d} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                <span className="line-through text-[#8a8378]">{formatDate(d)}</span>
                {!google && (
                  <button
                    disabled={busy}
                    onClick={() => save(skipped.filter((x) => x !== d))}
                    className="ml-1 font-semibold underline disabled:opacity-50"
                    style={{ color: 'var(--navy)' }}
                  >
                    Restore
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// "Heads up, that's finals week." In-person only — an event with a meeting link
// and no location is online and meant to run through breaks. For a weekly
// event, one click skips every break week in the next year (saved with the form).
function BreakWarnings({
  f,
  periods,
  onSkip,
}: {
  f: { event_date: string; repeat_weekly: boolean; repeat_until: string; location: string; meeting_link: string; skip_dates: string[] };
  periods: SchoolPeriod[];
  onSkip: (dates: string[]) => void;
}) {
  if (!f.event_date) return null;
  const online = !!f.meeting_link.trim() && !f.location.trim();
  const series = { event_date: f.event_date, repeat_weekly: f.repeat_weekly, repeat_until: f.repeat_until || null, skip_dates: f.skip_dates };
  const dates = f.repeat_weekly
    ? eventDatesInRange(series, f.event_date, addDays(f.event_date, 366))
    : [f.event_date];
  const warnings = scheduleWarnings(dates, periods, online);
  const breakWeeks = f.repeat_weekly && !online
    ? breakDatesForSeries(series, periods, f.event_date).filter((d) => !f.skip_dates.includes(d))
    : [];
  if (warnings.length === 0 && breakWeeks.length === 0) return null;
  return (
    <div className="sm:col-span-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold mb-1">Heads up</p>
      <ul className="list-disc pl-5 space-y-0.5">
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {breakWeeks.length > 0 && (
        <button
          type="button"
          onClick={() => onSkip(breakWeeks)}
          className="mt-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-amber-400"
        >
          Skip the {breakWeeks.length} break week{breakWeeks.length === 1 ? '' : 's'} (
          {breakWeeks.slice(0, 4).map((d) => formatDate(d, { month: 'short', day: 'numeric' })).join(', ')}
          {breakWeeks.length > 4 ? ', …' : ''})
        </button>
      )}
      {!online && (
        <p className="mt-2 text-xs">Online instead? Paste a Meet link and leave the location blank; online events run through breaks.</p>
      )}
    </div>
  );
}

// Checklist for one event: apply a template (Mission trip, Taco Night…), see
// its tasks with their timing, and add one-off tasks timed to the event.
function EventChecklist({
  event,
  tasks,
  templates,
  staff,
  meId,
  busy,
  call,
}: {
  event: CampusEvent;
  tasks: CampusTask[];
  templates: { id: string; name: string; itemCount: number }[];
  staff: StaffOption[];
  meId: string | null;
  busy: boolean;
  call: CallFn;
}) {
  const [pick, setPick] = useState(event.checklist_template_id ?? '');
  const [f, setF] = useState({ title: '', days: '7', when: 'before', owner_id: meId ?? '' });
  const current = templates.find((t) => t.id === event.checklist_template_id);
  const when = (n: number | null) =>
    n === null ? '' : n === 0 ? 'day of' : n < 0 ? `${-n}d before` : `${n}d after`;
  const open = tasks.filter((t) => t.status !== 'done').sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''));
  const done = tasks.length - open.length;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>Checklist</p>
          <p className="text-xs text-[#8a8378]">
            {current
              ? `${current.name}${event.repeat_weekly ? ': made fresh for each date, about two weeks ahead' : ''}.`
              : 'Tasks due before or after this event. They move if the event moves.'}
          </p>
        </div>
        <span className="flex gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white">
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.itemCount})</option>
            ))}
          </select>
          <button
            disabled={busy || pick === (event.checklist_template_id ?? '')}
            onClick={() => {
              if (!pick && !confirm('Remove the template? Its tasks nobody has started are removed; others stay.')) return;
              call(`/api/iowa/admin/events/${event.id}/checklist`, 'POST', { templateId: pick || null });
            }}
            className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            {pick ? (current ? 'Switch' : 'Apply') : 'Remove'}
          </button>
        </span>
      </div>

      {open.length === 0 ? (
        <p className="text-sm text-[#8a8378]">No open tasks{done ? ` (${done} done)` : ''}.</p>
      ) : (
        <ul className="text-sm space-y-1">
          {open.map((t) => (
            <li key={t.id} className="flex flex-wrap gap-x-2">
              <span className="w-24 shrink-0 text-[#8a8378]">{t.due_date ? formatDate(t.due_date, { month: 'short', day: 'numeric' }) : ''}</span>
              <a href={`/iowa/admin?task=${t.id}#tasks`} className="hover:underline" style={{ color: 'var(--navy)' }}>
                {t.title}
              </a>
              <span className="text-[#8a8378]">
                · {when(t.offset_days)}
                {event.repeat_weekly && t.event_occurrence ? ` of ${formatDate(t.event_occurrence, { month: 'short', day: 'numeric' })}` : ''}
                {' · '}
                {staff.find((s) => s.id === t.owner_id)?.name.split(' ')[0] ?? 'Unowned'}
              </span>
            </li>
          ))}
          {done > 0 && <li className="text-xs text-[#8a8378]">{done} done</li>}
        </ul>
      )}

      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-sm">
        <input
          className="flex-1 min-w-[12rem] px-2 py-1.5 border border-gray-300 rounded-md bg-white"
          placeholder="Add a task, e.g. Book the vans"
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        {f.when !== 'dayof' && (
          <input
            type="number"
            min={0}
            className="w-16 px-2 py-1.5 border border-gray-300 rounded-md bg-white"
            value={f.days}
            onChange={(e) => setF({ ...f, days: e.target.value })}
          />
        )}
        <select className="px-2 py-1.5 border border-gray-300 rounded-md bg-white" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })}>
          <option value="before">days before</option>
          <option value="after">days after</option>
          <option value="dayof">day of</option>
        </select>
        <select className="px-2 py-1.5 border border-gray-300 rounded-md bg-white" value={f.owner_id} onChange={(e) => setF({ ...f, owner_id: e.target.value })}>
          <option value="">Unowned</option>
          {staff.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button
          disabled={busy || !f.title.trim()}
          onClick={async () => {
            const n = Math.abs(parseInt(f.days, 10) || 0);
            const offset = f.when === 'dayof' ? 0 : f.when === 'before' ? -n : n;
            if (await call(`/api/iowa/admin/events/${event.id}/tasks`, 'POST', { title: f.title, offset_days: offset, owner_id: f.owner_id || null })) {
              setF({ ...f, title: '' });
            }
          }}
          className="px-3 py-1.5 rounded-md font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
