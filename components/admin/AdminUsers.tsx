'use client';

import { useState } from 'react';
import type { AdminUser } from '@/lib/adminUsers';

const input = 'w-full px-3 py-2 rounded-lg border text-sm';
const inputStyle = { borderColor: '#d1d5db', color: '#111827' };

export function AdminUsers({ initialUsers, meId }: { initialUsers: AdminUser[]; meId: string | null }) {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not add.');
    setUsers((u) => [...u, data.user]);
    setForm({ name: '', email: '', password: '' });
  }

  async function patch(id: string, body: { active?: boolean; password?: string }) {
    setError('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Could not save.');
    setUsers((u) => u.map((x) => (x.id === id ? data.user : x)));
    if (body.password) alert('Password changed.');
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <ul className="divide-y rounded-xl bg-white border" style={{ borderColor: '#e5e1da' }}>
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-48">
              <div className="font-semibold" style={{ color: 'var(--navy)', opacity: u.active ? 1 : 0.5 }}>
                {u.name} {u.id === meId && <span className="text-xs font-normal" style={{ color: '#8a8378' }}>(you)</span>}
              </div>
              <div className="text-sm" style={{ color: '#8a8378' }}>
                {u.email}
                {!u.active && ' · turned off'}
              </div>
            </div>
            <button
              type="button"
              className="text-sm hover:underline"
              style={{ color: 'var(--navy)' }}
              onClick={() => {
                const pw = prompt(`New password for ${u.name} (at least 8 characters):`);
                if (pw) patch(u.id, { password: pw });
              }}
            >
              Reset password
            </button>
            {u.id !== meId && (
              <button
                type="button"
                className="text-sm hover:underline"
                style={{ color: u.active ? '#b91c1c' : 'var(--navy)' }}
                onClick={() => patch(u.id, { active: !u.active })}
              >
                {u.active ? 'Turn off' : 'Turn on'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="rounded-xl bg-white border p-4 space-y-3" style={{ borderColor: '#e5e1da' }}>
        <h2 className="font-semibold" style={{ color: 'var(--navy)' }}>Add someone</h2>
        <input className={input} style={inputStyle} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={input} style={inputStyle} type="text" placeholder="Starting password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)', color: 'white' }}
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  );
}
