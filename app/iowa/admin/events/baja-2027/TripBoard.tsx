'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TRIP_CHECKS, type Interested, type TripRegistration } from '@/lib/trips';
import { ContactButtons, Modal } from '@/components/iowa/campus/ui';

// Trip board for phones (11/13): one line per person going with their checklist as
// dots; tap a person for details, checks, money raised and Not going. Interested
// below with Move to Going. Same API as before (/api/iowa/admin/trip).

const navy = { color: 'var(--navy)' };
const muted = 'text-[#8a8378]';
const GO = '#2f6f5e';

export default function TripBoard({ trip, title, page, deposit, goal, interested, going, migrationMissing }: {
  trip: string; title: string; page: string; deposit: number; goal: number;
  interested: Interested[]; going: TripRegistration[] | null; migrationMissing: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = (going ?? []).filter(g => g.status === 'going');
  const goingIds = new Set((going ?? []).map(g => g.contact_id));
  const waiting = interested.filter(i => !goingIds.has(i.id));
  const url = `https://arkidentity.com${page}`;
  const open = list.find(g => g.id === openId) ?? null;

  const call = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError('');
    const res = await fetch('/api/iowa/admin/trip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(null);
    if (res.ok) router.refresh(); else setError('Couldn’t save that. Try again.');
    return res.ok;
  };
  const count = (k: string) => list.filter(g => g.checks?.[k]).length;
  const share = async () => {
    const text = `${title} with ARK Iowa: ${url}`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } } catch { /* closed */ }
  };

  return (
    <div style={{ background: '#FAF8F5', color: '#4a4540', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-10 space-y-5">
        <div>
          <Link href="/iowa/admin/events" className="inline-flex min-h-11 items-center font-semibold" style={navy}>‹ Events</Link>
          <h1 className="text-2xl font-bold" style={navy}>{title}</h1>
          <p className={`text-sm ${muted}`}>{list.length} going · {waiting.length} interested · ${deposit} deposit · ${goal.toLocaleString()} to raise each</p>
          <div className="flex gap-2 mt-3">
            <a href={page} className="px-4 min-h-11 inline-flex items-center rounded-lg text-sm font-semibold border border-gray-300 bg-white" style={navy}>Trip page</a>
            <button onClick={share} className="px-4 min-h-11 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--navy)' }}>{copied ? 'Copied' : 'Share the link'}</button>
          </div>
        </div>

        {migrationMissing && <p className="rounded-lg bg-[#fff4e5] p-4 text-sm">Run migration 047 (trip registrations) in Supabase to turn on the Going list and the “I’m in” form.</p>}
        {error && !open && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</p>}

        <section>
          <h2 className="font-bold" style={navy}>Going ({list.length})</h2>
          {list.length > 0 && <p className={`text-xs ${muted} mb-2`}>{TRIP_CHECKS.map(([k, l]) => `${l} ${count(k)}/${list.length}`).join(' · ')}</p>}
          {list.length === 0 ? <p className={`text-sm ${muted}`}>Nobody yet. Students register with “I’m in” on the trip page, or move someone from Interested below.</p> : (
            <ul className="rounded-xl bg-white border border-gray-200 overflow-hidden">
              {list.map((g, i) => {
                const done = TRIP_CHECKS.filter(([k]) => g.checks?.[k]).length;
                return (
                  <li key={g.id} className={i ? 'border-t border-gray-100' : ''}>
                    <button onClick={() => setOpenId(g.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-semibold" style={navy}>{g.name}</span>
                        <span className={`block text-sm ${muted}`}>
                          {[g.year, `$${Number(g.raised ?? 0).toLocaleString()} raised`, done < TRIP_CHECKS.length && `needs ${TRIP_CHECKS.filter(([k]) => !g.checks?.[k]).map(([, l]) => l.toLowerCase()).join(', ')}`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="inline-flex gap-1 shrink-0" aria-label={`${done} of ${TRIP_CHECKS.length} done`}>
                        {TRIP_CHECKS.map(([k]) => <span key={k} className="w-2.5 h-2.5 rounded-full" style={g.checks?.[k] ? { background: GO } : { border: `1.5px solid ${GO}` }} />)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-bold mb-2" style={navy}>Interested ({waiting.length})</h2>
          {waiting.length === 0 ? <p className={`text-sm ${muted}`}>Everyone who raised a hand is already going, or nobody yet.</p> : (
            <ul className="rounded-xl bg-white border border-gray-200 overflow-hidden">
              {waiting.map((p, i) => (
                <li key={p.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 ${i ? 'border-t border-gray-100' : ''}`}>
                  <span className="min-w-0">
                    <span className="block font-semibold" style={navy}>{p.name}</span>
                    <span className="block mt-1"><ContactButtons phone={p.phone} email={p.email} size="xs" /></span>
                  </span>
                  {!migrationMissing && (
                    <button disabled={busy === p.id} onClick={() => void call(p.id, { action: 'move', trip, contact_id: p.id })}
                      className="shrink-0 px-3 min-h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: GO }}>
                      {busy === p.id ? 'Moving…' : 'Move to Going'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {open && <Person g={open} goal={goal} busy={busy} error={error} call={call} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Person({ g, goal, busy, error, call, onClose }: {
  g: TripRegistration; goal: number; busy: string | null; error: string;
  call: (key: string, body: Record<string, unknown>) => Promise<boolean>; onClose: () => void;
}) {
  const [raised, setRaised] = useState(String(g.raised ?? 0));
  const [leaving, setLeaving] = useState(false);
  const rows: [string, string | null][] = [
    ['School', [g.school, g.year].filter(Boolean).join(' · ') || null],
    ['Birthday', g.birthday],
    ['Passport', g.passport ? `${g.passport}${g.passport_expires ? ` (expires ${g.passport_expires})` : ''}` : null],
    ['Emergency', g.emergency_name ? `${g.emergency_name} ${g.emergency_phone ?? ''}` : null],
    ['Medical / diet', g.medical],
    ['Shirt', g.shirt],
    ['Note', g.note],
  ];
  const saveRaised = () => {
    const n = Number(raised.replace(/[$,]/g, ''));
    if (Number.isFinite(n) && n >= 0 && n !== Number(g.raised ?? 0)) void call(`${g.id}:raised`, { action: 'update', id: g.id, raised: n });
  };
  return (
    <Modal title={g.name} sub={<ContactButtons phone={g.phone} email={g.email} />} onClose={onClose}>
      {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</p>}
      <h3 className="font-bold mb-2" style={navy}>Checklist</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {TRIP_CHECKS.map(([k, l]) => (
          <button key={k} disabled={busy === `${g.id}:${k}`} onClick={() => void call(`${g.id}:${k}`, { action: 'update', id: g.id, checks: { ...g.checks, [k]: !g.checks?.[k] } })}
            className="px-4 min-h-11 rounded-full text-sm font-semibold border disabled:opacity-50"
            style={g.checks?.[k] ? { background: GO, color: '#fff', borderColor: GO } : { borderColor: '#d8d2c8', color: '#4a4540', background: '#fff' }}>
            {g.checks?.[k] ? '✓ ' : ''}{l}
          </button>
        ))}
      </div>
      <label className="block mb-5">
        <span className="block font-bold mb-1" style={navy}>Raised so far (of ${goal.toLocaleString()})</span>
        <span className="flex gap-2">
          <input inputMode="decimal" value={raised} onChange={(e) => setRaised(e.target.value)} onBlur={saveRaised}
            className="w-36 px-3 min-h-11 border border-gray-300 rounded-md text-base bg-white" />
          <button onClick={saveRaised} disabled={busy === `${g.id}:raised`} className="px-4 min-h-11 rounded-lg text-sm font-semibold border border-gray-300 bg-white" style={navy}>Save</button>
        </span>
      </label>
      <dl className="rounded-xl bg-white border border-gray-200 px-4 py-1 mb-6">
        {rows.filter(([, v]) => v).map(([k, v], i) => (
          <div key={k} className={`flex justify-between gap-4 py-2.5 text-sm ${i ? 'border-t border-gray-100' : ''}`}>
            <dt className={muted}>{k}</dt><dd className="text-right font-semibold" style={navy}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end gap-2">
        {leaving ? (
          <>
            <button onClick={() => setLeaving(false)} className={`px-4 min-h-11 rounded-lg text-sm font-semibold ${muted}`}>Cancel</button>
            <button onClick={async () => (await call(`${g.id}:w`, { action: 'update', id: g.id, status: 'withdrawn' })) && onClose()}
              className="px-4 min-h-11 rounded-lg text-sm font-semibold text-white bg-red-700">Yes, not going</button>
          </>
        ) : (
          <button onClick={() => setLeaving(true)} className="px-4 min-h-11 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-red-700">Not going</button>
        )}
      </div>
    </Modal>
  );
}
