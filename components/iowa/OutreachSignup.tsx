'use client';

import { useState } from 'react';
import { EXPERIENCE, OUTREACH_DAYS, OUTREACH_TIMES } from '@/lib/outreachFormat';

const chip = (on: boolean) => ({
  backgroundColor: on ? 'var(--gold)' : '#f1ede7',
  color: on ? 'var(--navy)' : '#8a8378',
  border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
});

export default function OutreachSignup({ initialCounts }: { initialCounts: Record<string, number> }) {
  const [counts, setCounts] = useState(initialCounts);
  const [slots, setSlots] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', phone: '', email: '', bringing: 0, under18: false, experience: '', note: '', hpField: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function toggle(key: string) {
    setSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slots.size) {
      setStatus('error');
      setMessage('Pick at least one time.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/iowa/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slots: [...slots] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Text (319) 359-7117.');
        return;
      }
      setStatus('success');
      fetch('/api/iowa/outreach', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => d.counts && setCounts(d.counts))
        .catch(() => {});
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Text (319) 359-7117.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
          You’re on the team.
        </p>
        <p className="text-[#4a4540] mt-1">
          Check your email for your times. We’ll text you where to go before you head out.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-6">
      <div>
        <span className="block text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
          Pick your times
        </span>
        <div className="grid grid-cols-3 gap-2">
          {OUTREACH_DAYS.map((d) => (
            <div key={d.key} className="text-center">
              <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                {d.label}
              </p>
              <p className="text-xs text-[#8a8378] mb-2">{d.date}</p>
              <div className="space-y-2">
                {OUTREACH_TIMES.map((t) => {
                  const key = `${d.key}-${t.key}`;
                  const on = slots.has(key);
                  const n = counts[key] ?? 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      aria-pressed={on}
                      className="w-full rounded-lg px-1 py-2 text-sm font-semibold transition"
                      style={chip(on)}
                    >
                      {t.label}
                      <span className="block text-[11px] font-normal">{n ? `${n} going` : 'Be first'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input type="text" required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        <input type="tel" required placeholder="A number we can text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
      </div>

      <div>
        <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
          Have you talked about Jesus with a stranger before?
        </span>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setForm({ ...form, experience: form.experience === x.key ? '' : x.key })}
              className="px-3 py-1.5 rounded-md text-sm font-semibold transition"
              style={chip(form.experience === x.key)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-[#4a4540]">
          Bringing anyone?
          <select
            value={form.bringing}
            onChange={(e) => setForm({ ...form, bringing: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-900"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Just me' : `+${n}`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[#4a4540]">
          <input type="checkbox" checked={form.under18} onChange={(e) => setForm({ ...form, under18: e.target.checked })} />
          I’m under 18
        </label>
      </div>

      <input type="text" placeholder="Anything we should know? (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputClass} />

      {/* honeypot */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        <label htmlFor="hp-outreach">Leave this field empty</label>
        <input id="hp-outreach" type="text" name="hp_field" tabIndex={-1} autoComplete="off" value={form.hpField} onChange={(e) => setForm({ ...form, hpField: e.target.value })} />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
        >
          {status === 'loading' ? 'Saving…' : 'Save my spot'}
        </button>
      </div>
      {status === 'error' && <p className="text-red-800 text-sm text-right">{message}</p>}
    </form>
  );
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent';
