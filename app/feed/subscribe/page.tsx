'use client';

import { useState } from 'react';

export default function SubscribePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, frequency, company }),
    });
    if (res.ok) {
      setStatus('done');
    } else {
      setStatus('idle');
      setError((await res.json().catch(() => ({}))).error || 'Something went wrong.');
    }
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '70vh' }} className="py-16 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-3 text-center" style={{ color: 'var(--navy)' }}>
          Get ministry updates
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: '#5a5247' }}>
          Stories and photos from the field, straight to your inbox.
        </p>

        {status === 'done' ? (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Check your email</h2>
            <p style={{ color: '#5a5247' }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to finish subscribing.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border mb-4"
              style={{ borderColor: '#d1d5db', color: '#111827' }}
            />

            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border mb-4"
              style={{ borderColor: '#d1d5db', color: '#111827' }}
            />

            {/* Honeypot: hidden from real users */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
              aria-hidden="true"
            />

            <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>How often?</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'weekly' | 'monthly')}
              className="w-full px-4 py-3 rounded-lg border mb-6"
              style={{ borderColor: '#d1d5db', color: '#111827' }}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>

            {error && <p className="text-sm mb-4" style={{ color: '#b91c1c' }}>{error}</p>}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
