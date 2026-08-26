'use client';

import { useState } from 'react';
import { spotsLabel } from '@/lib/bibleStudyFormat';

interface Contact {
  name: string;
  phone: string;
  role: 'leader' | 'member';
}

interface Props {
  studyId: string;
  slotLabel: string;
  location: string | null;
  spotsLeft: number;
  capacity: number;
  onJoined?: () => void;
}

const YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Grad', 'Other'];

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent';
const labelClass = 'block text-sm font-semibold mb-2';

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function JoinForm({
  studyId,
  slotLabel,
  location,
  spotsLeft,
  capacity,
  onJoined,
}: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', year: '', company: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [roster, setRoster] = useState<Contact[]>([]);
  const [calendar, setCalendar] = useState<{ icsUrl: string; googleUrl: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/iowa/studies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoster(data.roster || []);
        setCalendar(data.calendar || null);
        setStatus('success');
        onJoined?.();
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Text (319) 359-7117 and we’ll sort it out.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Text (319) 359-7117 and we’ll sort it out.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
          You’re in.
        </h3>
        <p className="text-[#4a4540] mb-6">
          You’re set for the <strong>{slotLabel}</strong> Bible study{location ? ` at ${location}` : ''}.
          Someone from the study will text you this week.
        </p>

        {calendar && (
          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href={calendar.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Add to Google Calendar
            </a>
            <a
              href={calendar.icsUrl}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-80"
              style={{ border: '1px solid var(--navy)', color: 'var(--navy)' }}
            >
              Add to any other calendar
            </a>
          </div>
        )}

        {roster.length > 0 && (
          <div>
            <p className="font-semibold mb-2" style={{ color: 'var(--navy)' }}>
              Your study
            </p>
            <ul className="space-y-1 text-[#4a4540]">
              {roster.map((c) => (
                <li key={c.phone}>
                  {c.name}
                  {c.role === 'leader' && <span className="text-[#8a8378]"> (leader)</span>} —{' '}
                  <a href={telHref(c.phone)} className="underline" style={{ color: 'var(--navy)' }}>
                    {c.phone}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#8a8378] mt-3">Reach out — say hi before the first week.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
      <p className="text-sm text-[#8a8378]">
        {spotsLabel(spotsLeft, capacity)} · {slotLabel}
        {location ? ` · ${location}` : ''}
      </p>

      <div>
        <label htmlFor={`name-${studyId}`} className={labelClass} style={{ color: 'var(--navy)' }}>
          Your name
        </label>
        <input
          id={`name-${studyId}`}
          type="text"
          required
          placeholder="First and last"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`phone-${studyId}`} className={labelClass} style={{ color: 'var(--navy)' }}>
          A number we can text
        </label>
        <input
          id={`phone-${studyId}`}
          type="tel"
          required
          placeholder="(555) 555-5555"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`email-${studyId}`} className={labelClass} style={{ color: 'var(--navy)' }}>
          Email
        </label>
        <input
          id={`email-${studyId}`}
          type="email"
          required
          placeholder="you@uiowa.edu"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass} style={{ color: 'var(--navy)' }}>
          Year <span className="font-normal text-[#8a8378]">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {YEARS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setForm({ ...form, year: form.year === y ? '' : y })}
              className="px-3 py-1.5 rounded-md text-sm font-semibold transition"
              style={{
                backgroundColor: form.year === y ? 'var(--gold)' : '#f1ede7',
                color: form.year === y ? 'var(--navy)' : '#8a8378',
                border: form.year === y ? '1px solid var(--gold)' : '1px solid #e2ddd5',
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
        style={{ position: 'absolute', left: '-9999px' }}
        aria-hidden="true"
      />

      <p className="text-sm text-[#8a8378]">
        Your name and number are shared with the others in your study so you can coordinate.
      </p>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-8 py-4 rounded-lg font-semibold text-lg transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {status === 'loading' ? 'Joining…' : 'Join this study'}
      </button>

      {status === 'error' && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-800 text-center text-sm">{message}</p>
        </div>
      )}
    </form>
  );
}
