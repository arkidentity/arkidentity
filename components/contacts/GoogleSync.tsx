'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GoogleConnection, SyncSummary } from '@/lib/googleContacts';

// Connect, preview, then sync. Every sync is previewed first: the preview reads
// both sides and lists what would change, and nothing is written until Sync.

const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

const ERRORS: Record<string, string> = {
  'not-configured': 'The Google keys are not in Vercel yet.',
  declined: 'Google access was not allowed.',
  state: 'That sign-in link expired. Try Connect again.',
  exchange: 'Google sign-in did not finish. Try Connect again.',
};

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never';
}

function NameList({ title, names }: { title: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--navy)' }}>
        {title} ({names.length})
      </summary>
      <p className="mt-1 text-sm" style={{ color: '#5f5a52' }}>{names.join(', ')}</p>
    </details>
  );
}

export function GoogleSync({
  configured,
  connection,
  justConnected,
  error: initialError,
}: {
  configured: boolean;
  connection: GoogleConnection | null;
  justConnected: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'preview' | 'sync' | null>(null);
  const [error, setError] = useState(initialError ? ERRORS[initialError] ?? initialError : '');
  const [preview, setPreview] = useState<SyncSummary | null>(null);
  const [done, setDone] = useState<SyncSummary | null>(null);

  async function run(dryRun: boolean) {
    setBusy(dryRun ? 'preview' : 'sync');
    setError('');
    const res = await fetch('/api/admin/google/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'Sync failed.'); return; }
    if (dryRun) { setPreview(data.summary); setDone(null); }
    else { setDone(data.summary); setPreview(null); router.refresh(); }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Contacts? Nothing is deleted on either side.')) return;
    await fetch('/api/admin/google/connect', { method: 'DELETE' });
    router.refresh();
  }

  const s = preview ?? done;

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fdecea', color: '#9b2c2c' }}>{error}</p>}

      <section className="rounded-xl p-5" style={card}>
        {!configured ? (
          <p style={{ color: '#5f5a52' }}>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.</p>
        ) : connection ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                Connected{connection.google_email ? ` to ${connection.google_email}` : ''}
              </p>
              <p className="text-sm" style={{ color: '#8a8378' }}>Last sync: {when(connection.last_sync_at)}</p>
              {justConnected && <p className="text-sm mt-1" style={{ color: '#2f6b3a' }}>Connected. Preview the first sync below.</p>}
            </div>
            <div className="flex gap-3 text-sm">
              <a href="/api/admin/google/connect" className="hover:underline" style={{ color: '#8a8378' }}>Reconnect</a>
              <button onClick={disconnect} className="hover:underline" style={{ color: '#8a8378' }}>Disconnect</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p style={{ color: '#5f5a52' }}>Sign in with the thearkidentity Gmail and allow contact access.</p>
            <a
              href="/api/admin/google/connect"
              className="rounded-lg px-4 py-2 font-semibold text-white"
              style={{ background: 'var(--navy)' }}
            >
              Connect Google Contacts
            </a>
          </div>
        )}
      </section>

      {connection && (
        <section className="rounded-xl p-5" style={card}>
          <p className="text-sm" style={{ color: '#5f5a52' }}>
            ARK people switched to <b>Add to phone</b> on the Contacts list are added to Google at the next sync.
          </p>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => run(true)}
              disabled={!!busy}
              className="rounded-lg border px-4 py-2 font-semibold"
              style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
            >
              {busy === 'preview' ? 'Reading both sides…' : 'Preview'}
            </button>
            {preview && (
              <button
                onClick={() => run(false)}
                disabled={!!busy}
                className="rounded-lg px-4 py-2 font-semibold text-white"
                style={{ background: 'var(--navy)' }}
              >
                {busy === 'sync' ? 'Syncing…' : 'Sync now'}
              </button>
            )}
          </div>

          {s && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: '#eee7dc' }}>
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                {s.dryRun ? 'Preview: nothing has changed yet' : 'Sync finished'}
              </p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: '#5f5a52' }}>
                <li><b>{s.googlePeople}</b> people in Google</li>
                <li><b>{s.linked.length}</b> matched to someone already in ARK</li>
                <li><b>{s.imported.length}</b> new to ARK (not added to the newsletter)</li>
                <li><b>{s.pushed.length}</b> ARK people added to Google</li>
                <li><b>{s.filled}</b> ARK contacts get details from Google</li>
                <li><b>{s.arkLabelChanges}</b> tag changes in ARK, <b>{s.googleLabelChanges}</b> label changes in Google</li>
                {s.skipped > 0 && <li><b>{s.skipped}</b> blank Google entries skipped</li>}
              </ul>
              <NameList title="Matched" names={s.linked} />
              <NameList title="New to ARK" names={s.imported} />
              <NameList title="Added to Google" names={s.pushed} />
              <NameList title="Google labels that become ARK tags" names={s.tagsCreated} />
              <NameList title="ARK tags that become Google labels" names={s.groupsCreated} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
