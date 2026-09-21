'use client';

import { useState } from 'react';

// Decline an invite (whole series) or one date, with an optional note.
export default function DeclineForm({
  eventId,
  endpoint,
  occurrence,
  onDone,
  compact,
}: {
  eventId?: string;
  endpoint?: string; // defaults to the event respond endpoint
  occurrence?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setBusy(true);
    setError('');
    const res = await fetch(endpoint ?? `/api/iowa/admin/events/${eventId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(occurrence ? { occurrence, away: true, note } : { response: 'declined', note }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setDone(true);
    onDone?.();
  }

  if (done && !onDone) return <p className="font-semibold text-[#4a4540]">Got it, thanks for letting us know.</p>;
  return (
    <div className={compact ? 'flex flex-wrap gap-2 items-center' : 'space-y-3'}>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Why? (optional) e.g. exam that week"
        className="flex-1 min-w-[12rem] w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
      />
      <button
        disabled={busy}
        onClick={send}
        className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: '#b91c1c' }}
      >
        {busy ? 'Sending…' : occurrence ? 'Can’t make it' : 'Can’t do it'}
      </button>
      {error && <p className="text-sm text-red-700 w-full">{error}</p>}
    </div>
  );
}
