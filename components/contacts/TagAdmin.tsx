'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tag } from '@/lib/contacts';

// Tag CRUD plus a merge. The slug on the server stops new duplicates; merge is
// for the ones that got in before, or that turned out to mean the same thing.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

export function TagAdmin({
  initialTags,
  counts,
}: {
  initialTags: Tag[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true); setError('');
    const res = await fetch('/api/admin/contacts/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not add that tag.');
      return;
    }
    const { tag } = (await res.json()) as { tag: Tag };
    setTags((t) => (t.some((x) => x.id === tag.id) ? t : [...t, tag].sort((a, b) => a.name.localeCompare(b.name))));
    setName(''); setCategory('');
  }

  async function rename(id: string, next: string) {
    const res = await fetch(`/api/admin/contacts/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: next }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Rename failed.');
      return;
    }
    const { tag } = (await res.json()) as { tag: Tag };
    setTags((t) => t.map((x) => (x.id === id ? tag : x)));
  }

  async function merge(fromId: string, intoId: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/contacts/tags/${fromId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mergeIntoId: intoId }),
    });
    setBusy(false);
    setMergeFrom(null);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Merge failed.');
      return;
    }
    setTags((t) => t.filter((x) => x.id !== fromId));
    router.refresh();
  }

  async function remove(tag: Tag) {
    const n = counts[tag.id] ?? 0;
    const warning = n > 0
      ? `Delete "${tag.name}"? It comes off ${n} ${n === 1 ? 'contact' : 'contacts'}. Nobody is deleted.`
      : `Delete "${tag.name}"?`;
    if (!window.confirm(warning)) return;
    const res = await fetch(`/api/admin/contacts/tags/${tag.id}`, { method: 'DELETE' });
    if (res.ok) { setTags((t) => t.filter((x) => x.id !== tag.id)); router.refresh(); }
    else setError('Delete failed.');
  }

  return (
    <div>
      <div className="rounded-xl p-5 mb-6" style={card}>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>Add a tag</h2>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Name (e.g. Worship Night)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border"
            style={inputStyle}
          />
          <input
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border"
            style={inputStyle}
          />
          <button
            onClick={create}
            disabled={busy || !name.trim()}
            className="px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="rounded-xl overflow-hidden" style={card}>
        {tags.map((t) => (
          <div key={t.id} className="px-5 py-3 border-b" style={{ borderColor: '#f0ede8' }}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                defaultValue={t.name}
                onBlur={(e) => { if (e.target.value.trim() && e.target.value !== t.name) rename(t.id, e.target.value); }}
                className="flex-1 min-w-[160px] px-2 py-1.5 rounded-lg border font-semibold"
                style={{ ...inputStyle, color: '#143348' }}
              />
              <span className="text-sm" style={{ color: '#8a8378' }}>
                {counts[t.id] ?? 0} {(counts[t.id] ?? 0) === 1 ? 'contact' : 'contacts'}
                {t.category && ` · ${t.category}`}
              </span>
              <button
                onClick={() => setMergeFrom(mergeFrom === t.id ? null : t.id)}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg border"
                style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
              >
                Merge
              </button>
              <button
                onClick={() => remove(t)}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg border"
                style={{ borderColor: '#f0c8c8', color: '#b91c1c' }}
              >
                Delete
              </button>
            </div>

            {mergeFrom === t.id && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#f0ede8' }}>
                <span className="text-sm" style={{ color: '#8a8378' }}>
                  Move everyone on &ldquo;{t.name}&rdquo; to
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) merge(t.id, e.target.value); }}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                >
                  <option value="">— pick a tag —</option>
                  {tags.filter((x) => x.id !== t.id).map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
                <span className="text-sm" style={{ color: '#8a8378' }}>then delete this one.</span>
              </div>
            )}
          </div>
        ))}
        {tags.length === 0 && <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>No tags yet.</p>}
      </div>
    </div>
  );
}
