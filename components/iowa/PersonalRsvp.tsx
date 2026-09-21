'use client';

import { useState } from 'react';

export default function PersonalRsvp({ token, current }: { token: string; current: 'invited' | 'yes' | 'no' }) {
  const [answer, setAnswer] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(response: 'yes' | 'no') {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/iowa/rsvp/p/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setAnswer(response);
  }

  return (
    <div className="space-y-4">
      {answer !== 'invited' && (
        <p className="font-semibold" style={{ color: 'var(--navy)' }}>
          {answer === 'yes' ? 'You’re in. See you there! 🙌' : 'Got it, thanks for letting us know.'}{' '}
          <span className="font-normal text-[#8a8378]">You can change it below.</span>
        </p>
      )}
      {error && <p className="text-red-700 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={busy}
          onClick={() => send('yes')}
          className="py-4 rounded-lg font-semibold text-lg disabled:opacity-50"
          style={answer === 'yes' ? { backgroundColor: 'var(--navy)', color: 'white' } : { backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
        >
          I’m in
        </button>
        <button
          disabled={busy}
          onClick={() => send('no')}
          className="py-4 rounded-lg font-semibold text-lg border disabled:opacity-50"
          style={answer === 'no' ? { backgroundColor: '#4a4540', color: 'white', borderColor: '#4a4540' } : { borderColor: '#d1d5db', color: 'var(--navy)', backgroundColor: 'white' }}
        >
          Can’t make it
        </button>
      </div>
    </div>
  );
}
