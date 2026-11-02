'use client';

import { useState } from 'react';
import type { PrayerRequest } from '@/lib/prayer';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);

export function PrayerList({ initial }: { initial: PrayerRequest[] }) {
  const [rows, setRows] = useState(initial);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function act(r: PrayerRequest, action: 'prayed' | 'answered' | 'archive' | 'reopen', withNote?: string) {
    setBusy(r.id);
    setError('');
    const res = await fetch(`/api/admin/prayer/${r.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note: withNote }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError((res && (await res.json().catch(() => ({}))).error) || 'Something went wrong.');
      return;
    }
    setNoteFor(null);
    setNote('');
    setRows((list) =>
      action === 'archive'
        ? list.filter((x) => x.id !== r.id)
        : list.map((x) =>
            x.id === r.id
              ? {
                  ...x,
                  status: action === 'prayed' ? 'prayed' : action === 'answered' ? 'answered' : 'open',
                  prayed_at: action === 'prayed' ? new Date().toISOString() : x.prayed_at,
                  prayed_note: action === 'prayed' ? withNote || null : x.prayed_note,
                }
              : x
          )
    );
  }

  const open = rows.filter((r) => r.status === 'open');
  const due = rows.filter((r) => r.status === 'prayed' && r.follow_up_on && r.follow_up_on <= today());
  const rest = rows.filter((r) => r.status !== 'open' && !due.includes(r));

  const card = (r: PrayerRequest) => (
    <li key={r.id} className="rounded-xl border bg-white p-4" style={{ borderColor: '#e5e1da' }}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold" style={{ color: 'var(--navy)' }}>
          {r.name}
          <span className="ml-2 text-xs font-normal" style={{ color: '#8a8378' }}>
            {fmt(r.created_at)}
            {r.contact_id ? ' · partner' : ''}
            {r.ok_to_share ? ' · OK to share' : ' · private'}
            {r.wants_update && r.email ? ' · wants to hear back' : ''}
          </span>
        </p>
        <span className="text-xs font-semibold capitalize" style={{ color: r.status === 'open' ? '#b45309' : '#15803d' }}>
          {r.status}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-line" style={{ color: '#4a4540' }}>
        {r.request}
      </p>
      {r.prayed_note && (
        <p className="mt-2 text-sm" style={{ color: '#8a8378' }}>
          Sent: {r.prayed_note}
        </p>
      )}

      {noteFor === r.id ? (
        <div className="mt-3">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={r.wants_update && r.email ? 'A short note to them (sent by email). Leave empty to just mark it.' : 'Optional note for yourself'}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: '#d1d5db' }}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setNoteFor(null)} className="px-3 py-1.5 text-sm" style={{ color: '#8a8378' }}>
              Cancel
            </button>
            <button
              onClick={() => act(r, 'prayed', note)}
              disabled={busy === r.id}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              {note.trim() && r.wants_update && r.email ? 'Send and mark prayed' : 'Mark prayed'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap justify-end gap-2 text-sm">
          <button onClick={() => act(r, 'archive')} disabled={busy === r.id} className="px-3 py-1.5" style={{ color: '#8a8378' }}>
            Archive
          </button>
          {r.status !== 'open' && (
            <button onClick={() => act(r, 'reopen')} disabled={busy === r.id} className="px-3 py-1.5 rounded-lg border" style={{ borderColor: '#d1d5db' }}>
              Reopen
            </button>
          )}
          {r.status === 'prayed' && (
            <button onClick={() => act(r, 'answered')} disabled={busy === r.id} className="px-3 py-1.5 rounded-lg border" style={{ borderColor: '#d1d5db' }}>
              Answered
            </button>
          )}
          {r.status === 'open' && (
            <button
              onClick={() => {
                setNoteFor(r.id);
                setNote(`We prayed for you today. ${r.request.length < 80 ? `Asking God for ${r.request.replace(/\.$/, '')}.` : ''}`.trim());
              }}
              className="px-4 py-1.5 rounded-lg font-semibold"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Prayed
            </button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {due.length > 0 && (
        <section>
          <h2 className="font-bold mb-3" style={{ color: 'var(--navy)' }}>
            Ask how it went ({due.length})
          </h2>
          <ul className="space-y-3">{due.map(card)}</ul>
        </section>
      )}
      <section>
        <h2 className="font-bold mb-3" style={{ color: 'var(--navy)' }}>
          Open ({open.length})
        </h2>
        {open.length === 0 ? <p style={{ color: '#8a8378' }}>No open requests.</p> : <ul className="space-y-3">{open.map(card)}</ul>}
      </section>
      {rest.length > 0 && (
        <section>
          <h2 className="font-bold mb-3" style={{ color: 'var(--navy)' }}>
            Prayed and answered
          </h2>
          <ul className="space-y-3">{rest.map(card)}</ul>
        </section>
      )}
    </div>
  );
}
