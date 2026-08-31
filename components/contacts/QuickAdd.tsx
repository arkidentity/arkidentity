'use client';

import { useState } from 'react';
import type { Tag } from '@/lib/contacts';

// Fast capture, built for a phone in a lobby. Design rules, in priority order:
//  1. One screen, one save. No navigation, no tabs, no confirm dialog.
//  2. The form clears itself and stays put — the next person is usually right
//     behind the first, and the city/state you just typed is probably theirs too.
//  3. A duplicate warns, it never blocks. A lost name costs more than a dupe.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const inputClass = 'w-full px-4 py-3 rounded-lg border text-base';

interface Duplicate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export function QuickAdd({ tags: initialTags }: { tags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [selected, setSelected] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [subscribed, setSubscribed] = useState(true);

  const [newTag, setNewTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<{ name: string; duplicates: Duplicate[] } | null>(null);

  const canSave = name.trim().length > 0 && (phone.trim().length > 0 || email.trim().length > 0);

  function toggleTag(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((t) => t !== id) : [...s, id]));
  }

  async function addTag() {
    const label = newTag.trim();
    if (!label) return;
    setBusy(true);
    const res = await fetch('/api/admin/contacts/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: label }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not add that tag.');
      return;
    }
    const { tag } = (await res.json()) as { tag: Tag };
    // ensureTag is idempotent, so this may be a tag that already existed.
    setTags((t) => (t.some((x) => x.id === tag.id) ? t : [...t, tag].sort((a, b) => a.name.localeCompare(b.name))));
    setSelected((s) => (s.includes(tag.id) ? s : [...s, tag.id]));
    setNewTag('');
  }

  async function save() {
    if (!canSave || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, email, city, state,
        relationship_notes: notes,
        source: 'Quick Add',
        subscribed,
        tagIds: selected,
      }),
    });
    setBusy(false);

    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not save.');
      return;
    }
    const { duplicates } = (await res.json()) as { duplicates: Duplicate[] };
    setSaved({ name: name.trim(), duplicates: duplicates ?? [] });

    // Keep city/state and the tag selection — the next person in this lobby is
    // almost certainly from the same place and the same event.
    setName(''); setPhone(''); setEmail(''); setNotes('');
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>Quick Add</h1>
          <a href="/admin/contacts" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            All contacts →
          </a>
        </div>

        {saved && (
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#eaf3ec', border: '1px solid #cfe3d4' }}>
            <p className="font-semibold" style={{ color: '#1e5631' }}>Saved {saved.name}.</p>
            {saved.duplicates.length > 0 && (
              <p className="text-sm mt-1" style={{ color: '#8a6d00' }}>
                Heads up — {saved.duplicates.length === 1 ? 'a contact' : `${saved.duplicates.length} contacts`} with
                the same email or number already existed ({saved.duplicates.map((d) => d.name).join(', ')}). Saved
                anyway; merge them later if you want.
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="space-y-3">
            <input
              autoFocus
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              placeholder="Phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              type="email"
              inputMode="email"
              autoCapitalize="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <div className="flex gap-3">
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`${inputClass} flex-1`}
                style={inputStyle}
              />
              <input
                placeholder="ST"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className={`${inputClass} w-20 text-center uppercase`}
                style={inputStyle}
              />
            </div>
            <input
              placeholder="How you know them (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Tags */}
          <div className="mt-5">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>Tags</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className="px-3 py-2 rounded-full text-sm font-semibold border transition"
                    style={{
                      backgroundColor: on ? 'var(--navy)' : '#FFFFFF',
                      color: on ? '#FFFFFF' : '#4a4540',
                      borderColor: on ? 'var(--navy)' : '#d1d5db',
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
              {tags.length === 0 && (
                <p className="text-sm" style={{ color: '#8a8378' }}>No tags yet — add the first one below.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="New tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={busy || !newTag.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold border disabled:opacity-50"
                style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
              >
                Add
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-5 text-sm" style={{ color: '#4a4540' }}>
            <input type="checkbox" checked={subscribed} onChange={(e) => setSubscribed(e.target.checked)} />
            Send them ministry updates
          </label>

          {error && <p className="mt-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

          <button
            onClick={save}
            disabled={!canSave || busy}
            className="w-full mt-5 py-4 rounded-lg font-bold text-lg transition hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            {busy ? 'Saving…' : 'Save contact'}
          </button>
          {!canSave && (
            <p className="text-xs mt-2 text-center" style={{ color: '#8a8378' }}>
              Needs a name and either a phone or an email.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
