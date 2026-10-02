'use client';

import { useEffect, useState } from 'react';
import { ContactButtons } from '@/components/iowa/campus/ui';
import { StudentLink } from '@/components/iowa/campus/StudentLink';

// Reminder list (migration 036): students who said yes / maybe / no in person.
// Edit mode lives on the event panel; the "Text the … list" task shows the
// same list read-only with a Text button per person.

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

// On the event panel: add students, mark yes/maybe/no, set the lead time.
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
  const [pick, setPick] = useState('');
  const on = new Set((people ?? []).map((p) => p.contact_id));

  return (
    <div>
      <p className="text-sm font-bold mb-1" style={{ color: 'var(--navy)' }}>
        Reminder list
      </p>
      <p className="text-xs text-[#8a8378] mb-2">
        Who said yes in person. {lead === 0 ? 'The day of' : `${lead} day${lead === 1 ? '' : 's'} before`}
        {weekly ? ' each week' : ''}, a “Text the list” task shows up for whoever’s free.
      </p>
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
          {people.length === 0 && <li className="text-xs text-[#8a8378]">Nobody yet.</li>}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${field} flex-1 min-w-[10rem]`}>
          <option value="">Add a student…</option>
          {students
            .filter((s) => !on.has(s.id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
        </select>
        <button
          disabled={busy || !pick}
          onClick={async () => {
            await post({ contactId: pick, response: 'yes' });
            setPick('');
          }}
          className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add
        </button>
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
