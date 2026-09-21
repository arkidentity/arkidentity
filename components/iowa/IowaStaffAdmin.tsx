'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IowaStaff } from '@/lib/iowaStaff';

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';

// Staff logins for the Iowa admin. Everyone here has full access; this page is
// only for adding people, resetting passwords, and turning a login off when an
// internship ends (history and study assignments are kept).
export default function IowaStaffAdmin({ initial, meId }: { initial: IowaStaff[]; meId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });

  async function call(url: string, method: string, body: unknown) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', color: '#1f2937' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            Staff
          </h1>
          <a href="/iowa/admin" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Bible studies
          </a>
        </div>
        <p className="text-sm text-[#8a8378] mb-8">
          Everyone here can sign in to the Iowa admin with full access, and can be put on point for a study.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
        )}
        {notice && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            {notice}
          </div>
        )}

        <ul className="space-y-2 mb-10">
          {initial.map((p) => (
            <StaffRow key={p.id} p={p} isMe={p.id === meId} busy={busy} call={call} onNotice={setNotice} />
          ))}
        </ul>

        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>
          Add someone
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4 grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Email (their login)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className={input} placeholder="Phone (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input
            className={input}
            placeholder="Starting password (8+ characters)"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          <div className="sm:col-span-2">
            <button
              disabled={busy}
              onClick={async () => {
                if (await call('/api/iowa/admin/staff', 'POST', f)) {
                  setNotice(`${f.name} can now sign in at /iowa/admin with ${f.email}. Send them the password yourself.`);
                  setF({ name: '', email: '', phone: '', password: '' });
                }
              }}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              Add staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffRow({
  p,
  isMe,
  busy,
  call,
  onNotice,
}: {
  p: IowaStaff;
  isMe: boolean;
  busy: boolean;
  call: (url: string, method: string, body: unknown) => Promise<boolean>;
  onNotice: (s: string) => void;
}) {
  const [resetting, setResetting] = useState(false);
  const [pw, setPw] = useState('');

  return (
    <li className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={p.active ? 'text-[#4a4540]' : 'text-[#b0a99e]'}>
          <span className="font-semibold" style={{ color: p.active ? 'var(--navy)' : undefined }}>
            {p.name}
          </span>
          {isMe && ' (you)'}
          <span className="text-[#8a8378]"> · {[p.email, p.phone].filter(Boolean).join(' · ')}</span>
          {!p.active && ' · login off'}
        </span>
        <span className="flex gap-1 shrink-0">
          <button
            onClick={() => setResetting((v) => !v)}
            disabled={busy}
            className="text-xs font-semibold px-2 py-1 rounded border transition hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#d1d5db', color: '#143348' }}
          >
            {resetting ? 'Cancel' : 'Set password'}
          </button>
          {!isMe && (
            <button
              onClick={() => call(`/api/iowa/admin/staff/${p.id}`, 'PATCH', { active: !p.active })}
              disabled={busy}
              className="text-xs font-semibold px-2 py-1 rounded border transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#d1d5db', color: p.active ? '#b91c1c' : '#15803d' }}
            >
              {p.active ? 'Turn off login' : 'Turn on login'}
            </button>
          )}
        </span>
      </div>
      {resetting && (
        <div className="mt-2 flex gap-2">
          <input
            className={input}
            placeholder="New password (8+ characters)"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={async () => {
              if (await call(`/api/iowa/admin/staff/${p.id}`, 'PATCH', { password: pw })) {
                setPw('');
                setResetting(false);
                onNotice(`Password updated for ${p.name}.`);
              }
            }}
            className="shrink-0 px-3 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Save
          </button>
        </div>
      )}
    </li>
  );
}
