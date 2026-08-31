'use client';

import { useState } from 'react';
import type { ContactEvent, EventStatus } from '@/lib/contacts';

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

type Row = ContactEvent & { invitedCount: number };

const STATUS_LABEL: Record<EventStatus, string> = {
  planning: 'Planning',
  invites_sent: 'Invites sent',
  complete: 'Complete',
};

export function EventList({ initialEvents }: { initialEvents: Row[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true); setError('');
    const res = await fetch('/api/admin/contacts/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, event_date: date || null, location }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not create that event.');
      return;
    }
    const { event } = (await res.json()) as { event: ContactEvent };
    setEvents((e) => [{ ...event, invitedCount: 0 }, ...e]);
    setName(''); setDate(''); setLocation('');
  }

  async function patch(id: string, body: Partial<ContactEvent>) {
    const res = await fetch(`/api/admin/contacts/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Update failed.');
      return;
    }
    const { event } = (await res.json()) as { event: ContactEvent };
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...event } : e)));
  }

  return (
    <div>
      <div className="rounded-xl p-5 mb-6" style={card}>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>New event</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input placeholder="Name (e.g. Worship Night — Iowa, Sept)" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
          <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="sm:col-span-2 px-3 py-2 rounded-lg border" style={inputStyle} />
        </div>
        <button onClick={create} disabled={busy || !name.trim()} className="px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
          Create event
        </button>
        <p className="text-sm mt-3" style={{ color: '#8a8378' }}>
          Then run a segment and mark that list invited.
        </p>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="rounded-xl overflow-hidden" style={card}>
        {events.map((e) => (
          <div key={e.id} className="px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <a href={`/admin/contacts/events/${e.id}`} className="font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
                  {e.name}
                </a>
                <p className="text-sm" style={{ color: '#8a8378' }}>
                  {[e.event_date, e.location].filter(Boolean).join(' · ') || 'No date set'}
                  {' · '}
                  {e.invitedCount} invited
                </p>
              </div>
              <select
                value={e.status}
                onChange={(ev) => patch(e.id, { status: ev.target.value as EventStatus })}
                className="px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              >
                {(Object.keys(STATUS_LABEL) as EventStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <input
              defaultValue={e.calendar_link ?? ''}
              placeholder="Paste the Google Calendar link once it exists"
              onBlur={(ev) => { if (ev.target.value !== (e.calendar_link ?? '')) patch(e.id, { calendar_link: ev.target.value }); }}
              className="w-full mt-3 px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
            {e.calendar_link && (
              <a href={e.calendar_link} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:underline inline-block mt-2" style={{ color: 'var(--navy)' }}>
                Open in Calendar →
              </a>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>No events yet.</p>}
      </div>
    </div>
  );
}
