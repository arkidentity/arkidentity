'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// "Link Daily DNA" on a student (docs/IOWA-DAILY-DNA-LINK.md). Staff search ARK Iowa's Daily DNA
// accounts by name or email and pick the right person. Once linked, the student's Bible study shows
// up in their Daily DNA as a table with its chat and meetings — nothing for the student to do.

type Account = { id: string; name: string; email: string; lastSeen: string | null };

export function DailyDnaLink({ contactId, linkedName, linked, studentName }: { contactId: string; linkedName: string | null; linked: boolean; studentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(studentName.split(' ')[0] ?? '');
  const [results, setResults] = useState<Account[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    setErr(null); setBusy(true);
    const res = await fetch(`/api/iowa/admin/daily-dna?q=${encodeURIComponent(q)}`);
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(body.error ?? 'Search failed.'); return; }
    setResults(body.accounts ?? []);
  }

  async function save(account: Account | null) {
    setErr(null); setBusy(true);
    const res = await fetch(`/api/iowa/admin/students/${contactId}/daily-dna`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: account ? { id: account.id, name: account.name } : null }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(body.error ?? 'That didn’t save.'); return; }
    setOpen(false); setResults(null);
    router.refresh();
  }

  return (
    <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: '#f0ede8' }}>
      <div className="flex items-center justify-between gap-3">
        <span style={{ color: '#4a4540' }}>
          Daily DNA: {linked ? <strong style={{ color: '#2D6A4F' }}>✓ {linkedName || 'linked'}</strong> : <span style={{ color: '#9d855a' }}>not linked</span>}
        </span>
        {linked
          ? <button disabled={busy} onClick={() => { if (confirm(`Unlink ${studentName} from Daily DNA? Their Bible study table leaves their app.`)) void save(null); }} className="font-semibold" style={{ color: '#8a8378' }}>Unlink</button>
          : <button disabled={busy} onClick={() => { setOpen((v) => !v); if (!results && !open) void search(); }} className="font-semibold" style={{ color: 'var(--navy)' }}>{open ? 'Cancel' : 'Link Daily DNA'}</button>}
      </div>
      {open && !linked && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void search()}
              placeholder="Name or email" className="flex-1 rounded-lg border px-3 py-2" style={{ borderColor: '#e4dfd6' }} />
            <button disabled={busy || q.trim().length < 2} onClick={() => void search()} className="rounded-lg px-3 py-2 font-semibold text-white" style={{ background: 'var(--navy)' }}>Search</button>
          </div>
          {results && results.length === 0 && <p style={{ color: '#8a8378' }}>No ARK Iowa Daily DNA account by that name. Have them sign in at arkiowa.dailydna.app first.</p>}
          {results?.map((a) => (
            <button key={a.id} disabled={busy} onClick={() => void save(a)}
              className="w-full text-left rounded-lg border px-3 py-2 hover:bg-[#faf7f2]" style={{ borderColor: '#e4dfd6' }}>
              <strong>{a.name}</strong> <span style={{ color: '#8a8378' }}>· {a.email}{a.lastSeen ? ` · active ${new Date(a.lastSeen).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      {err && <p className="mt-1" style={{ color: '#b42318' }}>{err}</p>}
    </div>
  );
}
