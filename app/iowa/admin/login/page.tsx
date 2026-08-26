'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function IowaAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/iowa/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get('from') || '/iowa/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed.');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--navy)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl p-8"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
          ARK Iowa
        </h1>
        <p className="text-sm mb-6" style={{ color: '#8a8378' }}>
          Bible study admin
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 rounded-lg border mb-4"
          style={{ borderColor: '#d1d5db', color: '#111827' }}
        />
        {error && (
          <p className="text-sm mb-4" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)', color: 'white' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
