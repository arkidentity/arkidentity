'use client';

import { useState } from 'react';

const inputClass = 'w-full px-4 py-3 rounded-lg border bg-white text-[#2c2c2a] placeholder:text-[#8a8378] focus:outline-none';

export function PrayerForm({ token, knownName }: { token: string | null; knownName: string | null }) {
  const [f, setF] = useState({ name: '', email: '', request: '', okToShare: false, wantsUpdate: true, hpField: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/pray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, token }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setStatus('done');
    else {
      setStatus('error');
      setMessage(data.error || 'Something went wrong. Reply to any update email instead.');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: '#e5e1da' }}>
        <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
          Thank you. We&apos;re praying.
        </p>
        <p className="mt-1" style={{ color: '#5a5247' }}>
          {f.wantsUpdate ? "We'll let you know when we've prayed for you." : 'We hold this with care.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!knownName && (
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Your name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} style={{ borderColor: '#d1d5db' }} />
          <input type="email" placeholder="Email (so we can follow up)" value={f.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} style={{ borderColor: '#d1d5db' }} />
        </div>
      )}
      <textarea
        required
        rows={6}
        placeholder="What's on your heart? Big or small."
        value={f.request}
        onChange={(e) => set({ request: e.target.value })}
        className={inputClass}
        style={{ borderColor: '#d1d5db' }}
      />
      <div className="space-y-2 text-sm" style={{ color: '#5a5247' }}>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.wantsUpdate} onChange={(e) => set({ wantsUpdate: e.target.checked })} />
          Let me know when you&apos;ve prayed for me
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.okToShare} onChange={(e) => set({ okToShare: e.target.checked })} />
          OK to share with the ARK prayer team
        </label>
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        <input tabIndex={-1} autoComplete="off" value={f.hpField} onChange={(e) => set({ hpField: e.target.value })} />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={status === 'loading'} className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
          {status === 'loading' ? 'Sending…' : 'Send'}
        </button>
      </div>
      {status === 'error' && <p className="text-right text-sm text-red-700">{message}</p>}
    </form>
  );
}
