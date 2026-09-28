'use client';

import { useEffect, useState } from 'react';
import type { HistoryEntry, HistoryKind } from '@/lib/studentHistory';

// One student's dated story: seats, check-ins, status changes, notes. Loads
// when mounted, so callers mount it only once someone asks to see it (History
// on the Students page) or where it's the whole point (a follow-up task).

const DOT: Record<HistoryKind, string> = {
  added: '#8a8378',
  joined: '#15803d',
  left: '#b45309',
  no_show: '#b45309',
  status: '#9d855a',
  checkin: '#143348',
  note: '#2563eb',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });

export function StudentHistory({
  contactId,
  compact = false,
  onLoaded,
}: {
  contactId: string;
  compact?: boolean; // task view: newest few first, "show all" for the rest
  onLoaded?: (n: number) => void;
}) {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState('');
  const [all, setAll] = useState(!compact);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const res = await fetch(`/api/iowa/admin/students/${contactId}/history`);
      const json = await res.json().catch(() => ({}));
      if (!live) return;
      if (res.status === 403) return setDenied(true); // student leaders don't see the directory
      if (!res.ok) return setError(json.error || 'Could not load their history.');
      setItems(json.history);
      onLoaded?.(json.history.length);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/iowa/admin/students/${contactId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: note }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error || 'Could not save the note.');
    setItems((list) => [...(list ?? []), json.entry]);
    setNote('');
  }

  if (denied) return null;
  if (error && !items) return <p className="text-xs" style={{ color: '#b91c1c' }}>{error}</p>;
  if (!items) return <p className="text-xs text-[#8a8378]">Loading history…</p>;

  // Newest first reads best when you're deciding what to do next.
  const newest = [...items].reverse();
  const shown = all ? newest : newest.slice(0, 4);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
          placeholder="Add a note about this student…"
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
        />
        <button
          disabled={busy || !note.trim()}
          onClick={addNote}
          className="px-3 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add note
        </button>
      </div>
      {error && <p className="text-xs mb-2" style={{ color: '#b91c1c' }}>{error}</p>}
      <ol className="space-y-2">
        {shown.map((h, i) => (
          <li key={`${h.at}-${i}`} className="flex gap-3 text-sm">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: DOT[h.kind] }} />
            <div className="min-w-0">
              <p className="text-[#1f2937]">
                <span className="text-xs text-[#8a8378] mr-2">{fmt(h.at)}</span>
                <span className={h.kind === 'note' ? 'whitespace-pre-wrap' : ''}>{h.text}</span>
              </p>
              {(h.detail || h.by) && (
                <p className="text-xs text-[#8a8378]">
                  {[h.detail && `“${h.detail}”`, h.by && `— ${h.by.split(' ')[0]}`].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {!all && newest.length > shown.length && (
        <button onClick={() => setAll(true)} className="mt-2 text-xs font-semibold underline" style={{ color: '#8a8378' }}>
          Show all {newest.length}
        </button>
      )}
    </div>
  );
}
