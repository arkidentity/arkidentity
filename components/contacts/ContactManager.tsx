'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contact, ContactWithTags, Tag } from '@/lib/contacts';

// The everyone-list: partners on the update list, people met at events, ARK
// Iowa students. Filtering here is client-side on purpose — the whole list is
// already loaded, and a few hundred rows filter faster in the browser than they
// round-trip. The Segment Builder is where server-side filtering earns its keep.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

export function ContactManager({
  initialContacts,
  tags,
}: {
  initialContacts: ContactWithTags[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [churchFilter, setChurchFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTagId, setBulkTagId] = useState('');

  // A CSV import refreshes the server data; pick it up (see EventDetail).
  useEffect(() => { setContacts(initialContacts); }, [initialContacts]);

  const states = useMemo(
    () => [...new Set(contacts.map((c) => c.state).filter((s): s is string => !!s))].sort(),
    [contacts]
  );
  const churches = useMemo(
    () => [...new Set(contacts.map((c) => c.church).filter((s): s is string => !!s))].sort(),
    [contacts]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (stateFilter && c.state !== stateFilter) return false;
      if (tagFilter && !c.tags.some((t) => t.id === tagFilter)) return false;
      if (churchFilter && c.church !== churchFilter) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.city, c.church].some((v) => v?.toLowerCase().includes(q));
    });
  }, [contacts, search, stateFilter, tagFilter, churchFilter]);

  // Selection is by id and survives filter changes on purpose: filter to
  // Colorado, select those, filter to Iowa, add those too, then tag the lot.
  const visibleIds = visible.map((c) => c.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggleOne(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleAllVisible() {
    setSelected((s) =>
      allVisibleSelected ? s.filter((id) => !visibleIds.includes(id)) : [...new Set([...s, ...visibleIds])]
    );
  }

  async function bulkTag(action: 'add' | 'remove') {
    if (!bulkTagId || selected.length === 0) return;
    setBusy(true);
    setError('');
    setNotice('');
    const res = await fetch(`/api/admin/contacts/tags/${bulkTagId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds: selected, action }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not update those tags.');
      return;
    }
    const tag = tags.find((t) => t.id === bulkTagId);
    const { count } = (await res.json()) as { count: number };

    // Reflect it locally rather than refetching the whole list.
    setContacts((list) =>
      list.map((c) => {
        if (!selected.includes(c.id) || !tag) return c;
        const has = c.tags.some((t) => t.id === tag.id);
        if (action === 'add') return has ? c : { ...c, tags: [...c.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) };
        return { ...c, tags: c.tags.filter((t) => t.id !== tag.id) };
      })
    );
    setNotice(
      `${action === 'add' ? 'Tagged' : 'Untagged'} ${count} ${count === 1 ? 'person' : 'people'}${tag ? ` · ${tag.name}` : ''}.`
    );
    setSelected([]);
  }

  async function patch(id: string, body: Partial<Contact> & { tagIds?: string[] }) {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Update failed.');
      return;
    }
    const { contact } = (await res.json()) as { contact: Contact };
    setContacts((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, ...contact, tags: body.tagIds ? tags.filter((t) => body.tagIds!.includes(t.id)) : c.tags }
          : c
      )
    );
  }

  async function archive(id: string, name: string) {
    if (!window.confirm(`Archive ${name}? They stay in the database and on any roster — they just stop showing up here.`)) return;
    const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) setContacts((list) => list.filter((c) => c.id !== id));
    else setError('Could not archive.');
  }

  async function importCsv(file: File) {
    setBusy(true); setError(''); setNotice('');
    const csv = await file.text();
    const res = await fetch('/api/admin/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Import failed.');
      return;
    }
    const { imported, skipped } = (await res.json()) as { imported: number; skipped: number };
    setNotice(`Imported ${imported}. Skipped ${skipped} (already on file or missing a name).`);
    router.refresh();
  }

  function exportCsv() {
    const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      'Name,Email,Phone,City,State,Region,Church',
      ...visible.map((c) => [c.name, c.email, c.phone, c.city, c.state, c.region, c.church].map(escape).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Filters */}
      <div className="rounded-xl p-4 mb-5" style={card}>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search name, email, phone, city, church"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-sm"
            style={inputStyle}
          />
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
            <option value="">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
            <option value="">All tags</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {churches.length > 0 && (
            <select value={churchFilter} onChange={(e) => setChurchFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
              <option value="">All churches</option>
              {churches.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button onClick={() => setShowAdd((s) => !s)} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
            {showAdd ? 'Cancel' : 'Add a contact'}
          </button>
          <button onClick={exportCsv} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
            Export CSV
          </button>
          <label className="text-sm font-semibold px-3 py-2 rounded-lg border cursor-pointer" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }}
            />
          </label>
          <span className="text-sm" style={{ color: '#8a8378' }}>
            {visible.length} of {contacts.length}
          </span>
        </div>
        {notice && <p className="text-sm mt-2" style={{ color: '#1e5631' }}>{notice}</p>}
        <p className="text-xs mt-2" style={{ color: '#8a8378' }}>
          CSV columns: name, email, phone, city, state, region, church, channel, frequency. Existing emails are skipped.
        </p>
      </div>

      {/* Bulk actions — only in the way when something is selected. */}
      {selected.length > 0 && (
        <div className="rounded-xl p-4 mb-5 flex flex-wrap items-center gap-3" style={{ backgroundColor: '#eef3f7', border: '1px solid #cfe0ea' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
            {selected.length} selected
          </span>
          <select value={bulkTagId} onChange={(e) => setBulkTagId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={inputStyle}>
            <option value="">— pick a tag —</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={() => bulkTag('add')}
            disabled={busy || !bulkTagId}
            className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
            style={{ backgroundColor: 'var(--navy)', color: 'white' }}
          >
            Add tag
          </button>
          <button
            onClick={() => bulkTag('remove')}
            disabled={busy || !bulkTagId}
            className="text-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-40"
            style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
          >
            Remove tag
          </button>
          <button onClick={() => setSelected([])} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#8a8378' }}>
            Clear
          </button>
        </div>
      )}

      {showAdd && <AddForm tags={tags} onAdded={(c) => { setContacts((l) => [c, ...l]); setShowAdd(false); }} onError={setError} />}

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="rounded-xl overflow-hidden" style={card}>
        {visible.length > 0 && (
          <label className="flex items-center gap-3 px-5 py-3 border-b cursor-pointer" style={{ borderColor: '#f0ede8', backgroundColor: '#fbfaf8' }}>
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
            <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
              Select all {visible.length} shown
            </span>
          </label>
        )}
        {visible.map((c) => (
          <div key={c.id} className="px-5 py-3 border-b" style={{ borderColor: '#f0ede8' }}>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggleOne(c.id)}
                className="shrink-0"
              />
              <div className="flex-1 min-w-[180px]">
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                  {c.name}
                  {!c.subscribed && <span className="text-xs font-normal" style={{ color: '#8a8378' }}> · not on updates</span>}
                </p>
                <p className="text-sm" style={{ color: '#8a8378' }}>
                  {[c.email, c.phone, [c.city, c.state].filter(Boolean).join(', '), c.church].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#4a4540' }}>
                    {t.name}
                  </span>
                ))}
              </div>
              <button onClick={() => patch(c.id, { subscribed: !c.subscribed })} className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
                {c.subscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
              <button onClick={() => setEditing(editing === c.id ? null : c.id)} className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
                {editing === c.id ? 'Close' : 'Edit'}
              </button>
              <button onClick={() => archive(c.id, c.name)} className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#f0c8c8', color: '#b91c1c' }}>
                Archive
              </button>
            </div>

            {editing === c.id && (
              <EditRow
                contact={c}
                tags={tags}
                onSave={async (patchBody) => { await patch(c.id, patchBody); setEditing(null); }}
              />
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
            {contacts.length === 0 ? 'No contacts yet. Add one, or import a CSV.' : 'Nothing matches those filters.'}
          </p>
        )}
      </div>
    </div>
  );
}

function AddForm({
  tags,
  onAdded,
  onError,
}: {
  tags: Tag[];
  onAdded: (c: ContactWithTags) => void;
  onError: (e: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [region, setRegion] = useState('');
  const [church, setChurch] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch('/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, city, state, region, church, tagIds, source: 'Added by hand' }),
    });
    setBusy(false);
    if (!res.ok) {
      onError((await res.json().catch(() => ({}))).error || 'Could not add.');
      return;
    }
    const { contact } = (await res.json()) as { contact: Contact };
    onAdded({ ...contact, tags: tags.filter((t) => tagIds.includes(t.id)) });
  }

  return (
    <div className="rounded-xl p-5 mb-5" style={card}>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
        <div className="flex gap-3">
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border" style={inputStyle} />
          <input placeholder="ST" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="w-20 px-3 py-2 rounded-lg border text-center" style={inputStyle} />
        </div>
        <input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
        <input placeholder="Church" value={church} onChange={(e) => setChurch(e.target.value)} className="px-3 py-2 rounded-lg border" style={inputStyle} />
      </div>
      <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
      <button
        onClick={submit}
        disabled={busy || !name.trim() || (!email.trim() && !phone.trim())}
        className="mt-4 px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)', color: 'white' }}
      >
        Add contact
      </button>
    </div>
  );
}

function EditRow({
  contact,
  tags,
  onSave,
}: {
  contact: ContactWithTags;
  tags: Tag[];
  onSave: (patch: Partial<Contact> & { tagIds?: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email ?? '');
  const [phone, setPhone] = useState(contact.phone ?? '');
  const [city, setCity] = useState(contact.city ?? '');
  const [state, setState] = useState(contact.state ?? '');
  const [region, setRegion] = useState(contact.region ?? '');
  const [church, setChurch] = useState(contact.church ?? '');
  const [notes, setNotes] = useState(contact.relationship_notes ?? '');
  const [tagIds, setTagIds] = useState<string[]>(contact.tags.map((t) => t.id));
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f0ede8' }}>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
        <div className="flex gap-3">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="flex-1 px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
          <input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="ST" className="w-16 px-3 py-2 rounded-lg border text-sm text-center" style={inputStyle} />
        </div>
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region" className="px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
        <input value={church} onChange={(e) => setChurch(e.target.value)} placeholder="Church" className="px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How you know them" className="sm:col-span-2 px-3 py-2 rounded-lg border text-sm" style={inputStyle} />
      </div>
      <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
      <button
        onClick={async () => {
          setBusy(true);
          await onSave({ name, email, phone, city, state, region, church, relationship_notes: notes, tagIds });
          setBusy(false);
        }}
        disabled={busy}
        className="mt-3 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)', color: 'white' }}
      >
        Save changes
      </button>
    </div>
  );
}

function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const on = selected.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(on ? selected.filter((id) => id !== t.id) : [...selected, t.id])}
            className="px-3 py-1.5 rounded-full text-sm font-semibold border"
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
      {tags.length === 0 && <p className="text-sm" style={{ color: '#8a8378' }}>No tags yet.</p>}
    </div>
  );
}
