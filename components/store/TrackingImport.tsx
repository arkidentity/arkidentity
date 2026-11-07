'use client';

import { useState } from 'react';
import type { TrackingMatch, TrackingMiss } from '@/lib/tracking';

// /admin/orders: upload Pirate Ship's shipments CSV → preview → save tracking + email buyers (lib/tracking.ts).
export function TrackingImport() {
  const [csv, setCsv] = useState('');
  const [file, setFile] = useState('');
  const [preview, setPreview] = useState<{ matches: TrackingMatch[]; misses: TrackingMiss[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function send(text: string, apply: boolean) {
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/orders/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text, apply }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) return void setError(json.error || 'Something went wrong.');
    return json;
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const text = await f.text();
    setCsv(text);
    setFile(f.name);
    setDone('');
    setPreview(null);
    const json = await send(text, false);
    if (json) setPreview(json);
  }

  async function apply() {
    const json = await send(csv, true);
    if (!json) return;
    const failed: string[] = json.failed ?? [];
    setDone(
      `${json.packages} package${json.packages === 1 ? '' : 's'} saved on ${json.orders} order${json.orders === 1 ? '' : 's'}, ${json.emailed} email${json.emailed === 1 ? '' : 's'} sent.` +
        (failed.length ? ` Problems: ${failed.join('; ')}` : '')
    );
    setPreview(null);
    setCsv('');
    setTimeout(() => window.location.reload(), failed.length ? 6000 : 1500);
  }

  return (
    <div className="mb-8 rounded-xl border p-4" style={{ borderColor: '#e5e1da', background: '#fff' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold" style={{ color: 'var(--navy)' }}>
            Import tracking
          </p>
          <p className="text-sm" style={{ color: '#8a8378' }}>
            After buying labels, export the shipments from Pirate Ship as CSV and upload it here. You&apos;ll see a preview
            before anything is saved or emailed.
          </p>
        </div>
        <label className="text-sm font-semibold rounded-lg px-4 py-2 border cursor-pointer shrink-0" style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}>
          {busy && !preview ? 'Reading…' : 'Choose CSV'}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={pick} disabled={busy} />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {done && <p className="mt-3 text-sm" style={{ color: '#2f6b3a' }}>{done}</p>}

      {preview && (
        <div className="mt-4 text-sm" style={{ color: '#4a4540' }}>
          <p className="mb-2">
            <b>{file}</b>: {preview.matches.length} package{preview.matches.length === 1 ? '' : 's'} matched
            {preview.misses.length ? `, ${preview.misses.length} not matched` : ''}.
          </p>
          {preview.matches.length > 0 && (
            <ul className="mb-3 max-h-64 overflow-auto border rounded-lg divide-y" style={{ borderColor: '#eee' }}>
              {preview.matches.map((m) => (
                <li key={m.ref} className="px-3 py-1.5 flex justify-between gap-3">
                  <span>
                    {m.ref} · {m.name || '(no name)'}
                    {m.gift >= 0 ? ' · gift' : ''}
                  </span>
                  <span style={{ color: '#8a8378' }}>
                    {m.tracking}
                    {m.replaces ? ` (replaces ${m.replaces})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {preview.misses.length > 0 && (
            <>
              <p className="mb-1 font-semibold">Not matched (ship these by hand on the order):</p>
              <ul className="mb-3 max-h-48 overflow-auto border rounded-lg divide-y" style={{ borderColor: '#f3d6d6' }}>
                {preview.misses.map((m) => (
                  <li key={m.line} className="px-3 py-1.5">
                    Row {m.line}: {m.name || '(no name)'} {m.zip} · {m.tracking} · <i>{m.reason}</i>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={apply}
              disabled={busy || !preview.matches.length}
              className="text-sm font-semibold rounded-lg px-4 py-2 text-white disabled:opacity-50"
              style={{ background: 'var(--navy)' }}
            >
              {busy ? 'Saving and emailing…' : `Save ${preview.matches.length} and email buyers`}
            </button>
            <button onClick={() => setPreview(null)} disabled={busy} className="text-sm px-3 py-2" style={{ color: '#8a8378' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
