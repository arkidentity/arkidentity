'use client';

import { useState } from 'react';
import { OUTREACH_SLOTS } from '@/lib/outreachFormat';

const FIRE = '#FF5A1F';
const chip = (on: boolean) => ({
  backgroundColor: on ? FIRE : '#17171a',
  color: on ? '#0A0A0B' : '#c9c9cf',
  border: on ? `1px solid ${FIRE}` : '1px solid #2a2a2f',
});
const inputClass =
  'w-full px-4 py-3 border border-[#2a2a2f] rounded-lg text-[#FAF8F5] placeholder:text-[#6b6b72] bg-[#17171a] focus:outline-none focus:border-[#FF5A1F]';
const LOCATIONS = ['Ped Mall', 'Old Brick', 'Pentacrest', 'Walking around'];
const COUNTS: [key: 'conversations' | 'readVerse' | 'signedUp' | 'prayed', label: string][] = [
  ['conversations', 'Conversations you had'],
  ['readVerse', 'People who read a verse out loud'],
  ['signedUp', 'People who scanned the QR or gave contact info'],
  ['prayed', 'People you prayed with'],
];

export default function OutreachDebriefForm() {
  const [f, setF] = useState({
    name: '',
    slot: '',
    location: '',
    conversations: '',
    readVerse: '',
    signedUp: '',
    prayed: '',
    story: '',
    learned: '',
    again: '',
    okToShare: true,
    hpField: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/iowa/outreach/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus('success');
      else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Text (319) 359-7117.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Text (319) 359-7117.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-[#2a2a2f] bg-[#111113] p-6">
        <p className="font-bold text-lg">Thank you.</p>
        <p className="mt-1 text-[#c9c9cf]">Your story is part of what God did this Halloween. Get some rest.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <input type="text" required placeholder="Your name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />

      <Field label="When did you serve?">
        <div className="grid grid-cols-3 gap-2">
          {OUTREACH_SLOTS.map((s) => (
            <button key={s.key} type="button" onClick={() => set({ slot: f.slot === s.key ? '' : s.key })} className="rounded-lg px-1 py-2 text-xs font-semibold" style={chip(f.slot === s.key)}>
              {s.label.replace(/, /, '\n').split('\n').map((line) => (
                <span key={line} className="block">
                  {line.replace(/ Oct \d+/, '')}
                </span>
              ))}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Where?">
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <button key={l} type="button" onClick={() => set({ location: f.location === l ? '' : l })} className="px-3 py-1.5 rounded-md text-sm font-semibold" style={chip(f.location === l)}>
              {l}
            </button>
          ))}
        </div>
      </Field>

      <Field label="About how many?">
        <div className="space-y-2">
          {COUNTS.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 text-[#c9c9cf]">
              <span>{label}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={f[key]}
                onChange={(e) => set({ [key]: e.target.value })}
                className="w-20 px-3 py-2 border border-[#2a2a2f] rounded-lg text-[#FAF8F5] bg-[#17171a] text-center focus:outline-none focus:border-[#FF5A1F]"
              />
            </label>
          ))}
        </div>
      </Field>

      <Field label="Best story from tonight">
        <textarea rows={5} placeholder="Who did you talk to? What happened? What did they say?" value={f.story} onChange={(e) => set({ story: e.target.value })} className={inputClass} />
        <label className="mt-2 flex items-center gap-2 text-sm text-[#c9c9cf]">
          <input type="checkbox" className="accent-[#FF5A1F]" checked={f.okToShare} onChange={(e) => set({ okToShare: e.target.checked })} />
          OK to share this story (no last names)
        </label>
      </Field>

      <Field label="What would you tell the next person doing this?">
        <textarea rows={3} placeholder="What worked, what didn’t" value={f.learned} onChange={(e) => set({ learned: e.target.value })} className={inputClass} />
      </Field>

      <Field label="Would you do this again?">
        <div className="flex gap-2">
          {(['yes', 'maybe', 'no'] as const).map((v) => (
            <button key={v} type="button" onClick={() => set({ again: f.again === v ? '' : v })} className="px-4 py-1.5 rounded-md text-sm font-semibold capitalize" style={chip(f.again === v)}>
              {v}
            </button>
          ))}
        </div>
      </Field>

      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        <input tabIndex={-1} autoComplete="off" value={f.hpField} onChange={(e) => set({ hpField: e.target.value })} />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={status === 'loading'} className="px-6 py-3 rounded-lg font-bold uppercase tracking-wide disabled:opacity-50" style={{ backgroundColor: FIRE, color: '#0A0A0B' }}>
          {status === 'loading' ? 'Sending…' : 'Send debrief'}
        </button>
      </div>
      {status === 'error' && <p className="text-right text-sm text-[#ff8a65]">{message}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-sm font-semibold mb-2">{label}</span>
      {children}
    </div>
  );
}
