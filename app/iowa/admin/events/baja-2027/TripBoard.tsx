'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TRIP_CHECKS, type Interested, type TripRegistration } from '@/lib/trips';

const navy = { color: 'var(--navy)' };
const muted = 'text-[#8a8378]';

export default function TripBoard({ trip, title, page, deposit, goal, interested, going, migrationMissing }: {
  trip: string; title: string; page: string; deposit: number; goal: number;
  interested: Interested[]; going: TripRegistration[] | null; migrationMissing: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const list = (going ?? []).filter(g => g.status === 'going');
  const goingIds = new Set((going ?? []).map(g => g.contact_id));
  const waiting = interested.filter(i => !goingIds.has(i.id));
  const url = `https://arkidentity.com${page}`;

  const call = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    const res = await fetch('/api/iowa/admin/trip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(null);
    if (res.ok) router.refresh(); else window.alert('Couldn’t save that. Try again.');
  };
  const toggle = (g: TripRegistration, k: string) => call(`${g.id}:${k}`, { action: 'update', id: g.id, checks: { ...g.checks, [k]: !g.checks?.[k] } });
  const setRaised = (g: TripRegistration) => {
    const v = window.prompt(`How much has ${g.name.split(' ')[0]} raised so far? (dollars)`, String(g.raised ?? 0));
    if (v === null) return;
    const n = Number(v.replace(/[$,]/g, ''));
    if (Number.isFinite(n) && n >= 0) void call(`${g.id}:raised`, { action: 'update', id: g.id, raised: n });
  };
  const withdraw = (g: TripRegistration) => { if (window.confirm(`Mark ${g.name} as no longer going?`)) void call(`${g.id}:w`, { action: 'update', id: g.id, status: 'withdrawn' }); };
  const count = (k: string) => list.filter(g => g.checks?.[k]).length;
  const share = async () => {
    const text = `Baja 2027 with ARK Iowa: ${url}`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } } catch { /* closed */ }
  };

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <a href="/iowa/admin/events" className={`text-sm ${muted} underline`}>Events</a>
          <h1 className="text-2xl font-bold mt-1" style={navy}>{title}</h1>
          <p className={muted}>
            {list.length} going · {waiting.length} interested · ${deposit} deposit · ${goal.toLocaleString()} goal ·{' '}
            <a className="underline" href={page}>public page</a> · <button className="underline" onClick={share}>{copied ? 'Copied' : 'Share the link'}</button>
          </p>
        </div>

        {migrationMissing && (
          <p className="rounded-lg bg-[#fff4e5] p-4 text-sm">Run migration 047 (trip registrations) in Supabase to turn on the Going list and the “I’m in” form.</p>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="font-bold" style={navy}>Going ({list.length})</h2>
            <p className={`text-xs ${muted}`}>{TRIP_CHECKS.map(([k, l]) => `${l} ${count(k)}`).join(' · ')}</p>
          </div>
          {list.length === 0 ? <p className={`text-sm ${muted}`}>Nobody yet. Students register with “I’m in” on the trip page, or move someone from Interested below.</p> : (
            <ul className="divide-y divide-gray-100">
              {list.map(g => (
                <li key={g.id} className="py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p><strong style={navy}>{g.name}</strong>{g.year ? ` · ${g.year}` : ''}{g.school ? ` · ${g.school}` : ''}</p>
                      <p className={muted}>
                        {g.phone && <a className="underline" href={`sms:${g.phone}`}>{g.phone}</a>}{g.email ? ` · ${g.email}` : ''}
                        {g.passport ? ` · passport: ${g.passport}${g.passport_expires ? ` (exp ${g.passport_expires})` : ''}` : ''}
                      </p>
                      {(g.emergency_name || g.medical || g.shirt) && (
                        <p className={muted}>
                          {g.emergency_name ? `Emergency: ${g.emergency_name} ${g.emergency_phone ?? ''}` : ''}
                          {g.medical ? ` · Medical/diet: ${g.medical}` : ''}{g.shirt ? ` · Shirt ${g.shirt}` : ''}
                        </p>
                      )}
                      {g.note && <p className={muted}>“{g.note}”</p>}
                    </div>
                    <button className={`text-xs ${muted} underline shrink-0`} onClick={() => withdraw(g)}>Not going</button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TRIP_CHECKS.map(([k, l]) => (
                      <button key={k} disabled={busy === `${g.id}:${k}`} onClick={() => void toggle(g, k)}
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={g.checks?.[k] ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : { borderColor: '#d8d2c8', color: '#4a4540' }}>
                        {g.checks?.[k] ? '✓ ' : ''}{l}
                      </button>
                    ))}
                    <button onClick={() => setRaised(g)} className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ borderColor: '#d8d2c8', color: '#4a4540' }}>
                      Raised ${Number(g.raised ?? 0).toLocaleString()} / ${goal.toLocaleString()}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3" style={navy}>Interested ({waiting.length})</h2>
          {waiting.length === 0 ? <p className={`text-sm ${muted}`}>Everyone who raised a hand is already going, or nobody yet.</p> : (
            <ul className="divide-y divide-gray-100">
              {waiting.map(i => (
                <li key={i.id} className="py-2 text-sm flex items-start justify-between gap-3">
                  <div>
                    <p><strong style={navy}>{i.name}</strong></p>
                    <p className={muted}>{i.phone && <a className="underline" href={`sms:${i.phone}`}>{i.phone}</a>}{i.email ? ` · ${i.email}` : ''}</p>
                  </div>
                  {!migrationMissing && (
                    <button disabled={busy === i.id} onClick={() => void call(i.id, { action: 'move', trip, contact_id: i.id })}
                      className="text-xs font-semibold underline shrink-0" style={navy}>{busy === i.id ? 'Moving…' : 'Move to Going'}</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
