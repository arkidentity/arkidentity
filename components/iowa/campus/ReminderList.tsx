'use client';

import { useEffect, useState } from 'react';
import { ContactButtons } from '@/components/iowa/campus/ui';
import { StudentLink } from '@/components/iowa/campus/StudentLink';

// Guest list (the reminder list, migration 036): who's invited to an event, with yes / maybe / no.
// Edit on the event panel: the Guest list button opens every student with a search and a checkbox.
// When the event shows in Daily DNA, only guests (linked to Daily DNA) see it there. The
// "Text the … list" task shows the same list read-only with a Text button per person.

interface Person {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  response: 'yes' | 'maybe' | 'no';
  note: string | null;
}

const LABEL = { yes: 'Yes', maybe: 'Maybe', no: 'No' } as const;
const COLOR = { yes: '#15803d', maybe: '#9d855a', no: '#b91c1c' } as const;
const field = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';

function useReminderList(eventId: string) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/api/iowa/admin/events/${eventId}/reminders`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        if (r.ok) setPeople(j.people);
        else setError(j.error ?? 'Couldn’t load the list.');
      })
      .catch(() => live && setError('Couldn’t load the list.'));
    return () => {
      live = false;
    };
  }, [eventId]);
  async function post(body: object) {
    setBusy(true);
    setError('');
    const r = await fetch(`/api/iowa/admin/events/${eventId}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? 'Couldn’t save.');
    setPeople(j.people);
  }
  return { people, error, busy, post };
}

// On the event panel: the guest list, yes/maybe/no, the Guest list pop-up, and the lead time.
export function ReminderListEditor({
  eventId,
  days,
  students,
  weekly,
}: {
  eventId: string;
  days: number;
  students: { id: string; label: string }[];
  weekly: boolean;
}) {
  const { people, error, busy, post } = useReminderList(eventId);
  const [lead, setLead] = useState(days);
  const [picking, setPicking] = useState(false);
  const on = new Set((people ?? []).map((p) => p.contact_id));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
          Guest list{people && people.length > 0 ? ` · ${people.length}` : ''}
        </p>
        <button
          onClick={() => setPicking(true)}
          className="px-3 py-1.5 rounded-md text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Guest list
        </button>
      </div>
      <p className="text-xs text-[#8a8378] mb-2">
        {people && people.length > 0
          ? `Only these students see it in Daily DNA (when Show in Daily DNA is on)${weekly ? ', every week' : ''}. `
          : 'No guest list: everyone at ARK Iowa sees it in Daily DNA (when Show in Daily DNA is on). '}
        {lead === 0 ? 'The day of' : `${lead} day${lead === 1 ? '' : 's'} before`}
        {weekly ? ' each week' : ''}, a “Text the list” task shows up for whoever’s free.
      </p>
      {picking && people && (
        <GuestPicker
          students={students}
          initial={on}
          busy={busy}
          onClose={() => setPicking(false)}
          onSave={async (ids) => { await post({ set: ids }); setPicking(false); }}
        />
      )}
      {error && <p className="text-xs text-red-700 mb-2">{error}</p>}
      {!people ? (
        <p className="text-xs text-[#8a8378]">Loading…</p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {people.map((p) => (
            <li key={p.contact_id} className="flex flex-wrap items-center gap-2 text-sm">
              <StudentLink contactId={p.contact_id} name={p.name} className="text-[#4a4540] flex-1 min-w-[8rem]" />
              <select
                value={p.response}
                disabled={busy}
                onChange={(e) => post({ contactId: p.contact_id, response: e.target.value })}
                className={field}
                style={{ color: COLOR[p.response] }}
              >
                {(['yes', 'maybe', 'no'] as const).map((r) => (
                  <option key={r} value={r}>
                    {LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                disabled={busy}
                onClick={() => post({ contactId: p.contact_id, remove: true })}
                className="text-xs text-[#8a8378] hover:text-red-700"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
          {people.length === 0 && <li className="text-xs text-[#8a8378]">No guest list yet.</li>}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-xs text-[#8a8378] flex items-center gap-1">
          Task
          <input
            type="number"
            min={0}
            max={14}
            value={lead}
            onChange={(e) => setLead(Number(e.target.value))}
            onBlur={() => lead !== days && post({ days: lead })}
            className={`${field} w-14`}
          />
          days before
        </label>
      </div>
    </div>
  );
}

/** Every student, a search, a checkbox each. Save makes the guest list exactly the checked people. */
function GuestPicker({
  students,
  initial,
  busy,
  onClose,
  onSave,
}: {
  students: { id: string; label: string }[];
  initial: Set<string>;
  busy: boolean;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(initial));
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  // Guests first, then everyone else; both alphabetical
  const list = students
    .filter((s) => !query || s.label.toLowerCase().includes(query))
    .sort((a, b) => Number(initial.has(b.id)) - Number(initial.has(a.id)) || a.label.localeCompare(b.label));
  const toggle = (id: string) =>
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const changed = checked.size !== initial.size || [...checked].some((id) => !initial.has(id));
  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/30 p-4 pt-12 sm:pt-4" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Guest list">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-base font-bold" style={{ color: 'var(--navy)' }}>Guest list</p>
            <span className="text-sm text-[#8a8378]">{checked.size} checked</span>
          </div>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className={`${field} w-full`} />
        </div>
        <ul className="flex-1 overflow-y-auto px-2 py-1">
          {list.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#FAF8F5] text-sm text-[#4a4540] cursor-pointer">
                <input type="checkbox" className="h-4 w-4" checked={checked.has(s.id)} onChange={() => toggle(s.id)} />
                <span>{s.label}</span>
              </label>
            </li>
          ))}
          {list.length === 0 && <li className="px-2 py-3 text-sm text-[#8a8378]">No student by that name.</li>}
        </ul>
        <div className="p-3 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="text-sm text-[#8a8378]">Cancel</button>
          <button
            disabled={busy || !changed}
            onClick={() => onSave([...checked])}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            {busy ? 'Saving…' : 'Save guest list'}
          </button>
        </div>
      </div>
    </div>
  );
}

// In the "Text the … list" task: yes + maybe, a Text button each.
export function ReminderListTexts({ eventId }: { eventId: string }) {
  const { people, error } = useReminderList(eventId);
  if (error) return <p className="text-xs text-red-700">{error}</p>;
  if (!people) return <p className="text-xs text-[#8a8378]">Loading the list…</p>;
  const toText = people.filter((p) => p.response !== 'no');
  return (
    <div className="rounded-lg border border-gray-200 bg-[#FAF8F5] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-2">Text these people ({toText.length})</p>
      {toText.length === 0 ? (
        <p className="text-sm text-[#8a8378]">Nobody on the list said yes or maybe.</p>
      ) : (
        <ul className="space-y-1.5">
          {toText.map((p) => (
            <li key={p.contact_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <StudentLink contactId={p.contact_id} name={p.name} className="text-[#4a4540]" />
                {p.response === 'maybe' && <span className="ml-1.5 text-xs" style={{ color: COLOR.maybe }}>maybe</span>}
              </span>
              {p.phone || p.email ? <ContactButtons phone={p.phone} email={p.email} size="xs" /> : <span className="text-xs text-[#8a8378]">no number</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
