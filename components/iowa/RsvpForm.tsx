'use client';

import { useState } from 'react';

const field = 'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white';

// Public RSVP: name + phone (or email), I'm in / Can't make it, guests.
export default function RsvpForm({
  token,
  dates,
  going,
}: {
  token: string;
  dates: { date: string; label: string }[];
  going: Record<string, number>;
}) {
  const [f, setF] = useState({ occurrence: dates[0]?.date ?? '', name: '', phone: '', email: '', guests: 0, note: '', hp_field: '' });
  const [status, setStatus] = useState<'idle' | 'busy' | 'yes' | 'no'>('idle');
  const [error, setError] = useState('');

  async function send(response: 'yes' | 'no') {
    setStatus('busy');
    setError('');
    const res = await fetch(`/api/iowa/rsvp/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, response }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus('idle');
      return setError(data.error || 'Something went wrong.');
    }
    setStatus(response);
  }

  if (status === 'yes' || status === 'no') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
          {status === 'yes' ? 'See you there! 🙌' : 'Thanks for letting us know.'}
        </p>
        <p className="text-[#4a4540] mt-1">Change of plans? Come back to this link anytime.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dates.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setF({ ...f, occurrence: d.date })}
              className="px-3 py-2 rounded-lg text-sm font-semibold border"
              style={f.occurrence === d.date ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { color: 'var(--navy)', borderColor: '#d1d5db', backgroundColor: 'white' }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      {(going[f.occurrence] ?? 0) > 0 && (
        <p className="text-sm text-[#8a8378]">{going[f.occurrence]} going so far</p>
      )}
      <input className={field} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={field} placeholder="Phone" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input className={field} placeholder="Email (optional)" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label className="flex items-center gap-3 text-[#4a4540]">
        Bringing anyone?
        <input
          type="number"
          min={0}
          max={10}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
          value={f.guests}
          onChange={(e) => setF({ ...f, guests: Number(e.target.value) })}
        />
      </label>
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        <input tabIndex={-1} autoComplete="off" name="hp_field" value={f.hp_field} onChange={(e) => setF({ ...f, hp_field: e.target.value })} />
      </div>
      {error && <p className="text-red-700 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={status === 'busy'}
          onClick={() => send('yes')}
          className="py-4 rounded-lg font-semibold text-lg disabled:opacity-50"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
        >
          I’m in
        </button>
        <button
          disabled={status === 'busy'}
          onClick={() => send('no')}
          className="py-4 rounded-lg font-semibold text-lg border disabled:opacity-50"
          style={{ borderColor: '#d1d5db', color: 'var(--navy)', backgroundColor: 'white' }}
        >
          Can’t make it
        </button>
      </div>
    </div>
  );
}
