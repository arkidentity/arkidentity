'use client';

import { useState } from 'react';
import SlotGrid from '@/components/iowa/SlotGrid';

type Response = 'yes' | 'no' | 'unsure';

// The semester check-in (migration 038): in / not this time / not sure, then
// the times they're free. Can be answered again to change it.
export default function CheckinForm({
  token,
  semester,
  initial,
}: {
  token: string;
  semester: string;
  initial: { response: Response | null; slots: string[] };
}) {
  const [response, setResponse] = useState<Response | null>(initial.response);
  const [cells, setCells] = useState<Set<string>>(new Set(initial.slots));
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>(initial.response ? 'done' : 'idle');
  const [error, setError] = useState('');

  function toggle(day: number, block: string) {
    const key = `${day}-${block}`;
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    setStatus('saving');
    setError('');
    const r = await fetch(`/api/iowa/checkin/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, slots: [...cells], note }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus('idle');
      return setError(j.error ?? 'Something went wrong. Text (319) 359-7117.');
    }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-bold" style={{ color: 'var(--navy)' }}>
          {response === 'no' ? 'Thanks for letting us know.' : 'Got it, thank you!'}
        </p>
        <p className="text-[#4a4540] mt-1">
          {response === 'no'
            ? `We’ll miss you in ${semester}. You’re always welcome back.`
            : `We’ll let you know your ${semester} group before break.`}
        </p>
        <button onClick={() => setStatus('idle')} className="mt-3 text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
          Change my answer
        </button>
      </div>
    );
  }

  const choice = (r: Response, text: string) => (
    <button
      type="button"
      onClick={() => setResponse(r)}
      className="px-4 py-2.5 rounded-lg font-semibold text-sm border transition"
      style={
        response === r
          ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' }
          : { backgroundColor: 'white', color: 'var(--navy)', borderColor: '#d1d5db' }
      }
    >
      {text}
    </button>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {choice('yes', 'I’m in')}
        {choice('unsure', 'Not sure yet')}
        {choice('no', 'Not this time')}
      </div>

      {response && response !== 'no' && (
        <div>
          <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
            When are you free in {semester}?
          </span>
          <p className="text-sm text-[#8a8378] mb-3">Tap every time you could meet. More is better.</p>
          <SlotGrid cells={cells} onToggle={toggle} />
        </div>
      )}

      {response && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Anything we should know? (optional)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
        />
      )}

      {error && <p className="text-red-800 text-sm">{error}</p>}
      <button
        disabled={!response || status === 'saving'}
        onClick={submit}
        className="w-full px-5 py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {status === 'saving' ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
