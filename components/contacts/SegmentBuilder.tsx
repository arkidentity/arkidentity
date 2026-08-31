'use client';

import { useState } from 'react';
import type { ContactWithTags, Tag, ContactEvent } from '@/lib/contacts';

// The compound filter Google Contacts labels can't express: state AND tag AND
// tag AND "not already invited to this event". Tags are ANDed, not ORed — the
// whole point is narrowing.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;

type EventOption = ContactEvent & { invitedCount: number };

export function SegmentBuilder({
  tags,
  states,
  regions,
  churches,
  events,
}: {
  tags: Tag[];
  states: string[];
  regions: string[];
  churches: string[];
  events: EventOption[];
}) {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludeEventId, setExcludeEventId] = useState('');
  const [subscribedOnly, setSubscribedOnly] = useState(false);
  const [search, setSearch] = useState('');

  const [results, setResults] = useState<ContactWithTags[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [markEventId, setMarkEventId] = useState('');
  const [notice, setNotice] = useState('');

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function run() {
    setBusy(true);
    setError('');
    setNotice('');
    const res = await fetch('/api/admin/contacts/segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        states: selectedStates,
        regions: selectedRegions,
        churches: selectedChurches,
        tagIds: selectedTags,
        excludeEventId: excludeEventId || undefined,
        subscribedOnly,
        search,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not run that segment.');
      return;
    }
    const { contacts } = (await res.json()) as { contacts: ContactWithTags[] };
    setResults(contacts);
  }

  async function copy(what: 'emails' | 'phones' | 'names', label: string) {
    if (!results) return;
    const values = results
      .map((c) => (what === 'emails' ? c.email : what === 'phones' ? c.phone : c.name))
      .filter((v): v is string => !!v);
    await navigator.clipboard.writeText(values.join(what === 'names' ? '\n' : ', '));
    setCopied(`${values.length} ${label} copied`);
    setTimeout(() => setCopied(''), 2500);
  }

  function downloadCsv() {
    if (!results) return;
    const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      'Name,Email,Phone,City,State,Region,Church',
      ...results.map((c) => [c.name, c.email, c.phone, c.city, c.state, c.region, c.church].map(escape).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segment.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function markInvited() {
    if (!results || !markEventId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/contacts/events/${markEventId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds: results.map((c) => c.id) }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not mark them invited.');
      return;
    }
    const { count } = (await res.json()) as { count: number };
    setNotice(`Marked ${count} ${count === 1 ? 'person' : 'people'} invited.`);
  }

  const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

  return (
    <div>
      <div className="rounded-xl p-5 mb-6" style={card}>
        {states.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>State</p>
            <div className="flex flex-wrap gap-2">
              {states.map((s) => (
                <Chip key={s} on={selectedStates.includes(s)} onClick={() => toggle(selectedStates, s, setSelectedStates)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {regions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>Region</p>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <Chip key={r} on={selectedRegions.includes(r)} onClick={() => toggle(selectedRegions, r, setSelectedRegions)}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {churches.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>Church</p>
            <div className="flex flex-wrap gap-2">
              {churches.map((c) => (
                <Chip key={c} on={selectedChurches.includes(c)} onClick={() => toggle(selectedChurches, c, setSelectedChurches)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            Tags {selectedTags.length > 1 && <span className="font-normal" style={{ color: '#8a8378' }}>(must have all)</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Chip key={t.id} on={selectedTags.includes(t.id)} onClick={() => toggle(selectedTags, t.id, setSelectedTags)}>
                {t.name}
              </Chip>
            ))}
            {tags.length === 0 && <p className="text-sm" style={{ color: '#8a8378' }}>No tags yet.</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>Skip anyone already invited to</p>
            <select
              value={excludeEventId}
              onChange={(e) => setExcludeEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <option value="">— nothing —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.invitedCount} invited)</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>Search</p>
            <input
              placeholder="Name, email, phone, city, church"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm mb-4" style={{ color: '#4a4540' }}>
          <input type="checkbox" checked={subscribedOnly} onChange={(e) => setSubscribedOnly(e.target.checked)} />
          Only people on the update list
        </label>

        <button
          onClick={run}
          disabled={busy}
          className="px-5 py-2.5 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)', color: 'white' }}
        >
          {busy ? 'Running…' : 'Run segment'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      {results && (
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
            <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
              {results.length} {results.length === 1 ? 'person' : 'people'}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <SmallButton onClick={() => copy('emails', 'emails')}>Copy emails</SmallButton>
              <SmallButton onClick={() => copy('phones', 'numbers')}>Copy phone numbers</SmallButton>
              <SmallButton onClick={() => copy('names', 'names')}>Copy names</SmallButton>
              <SmallButton onClick={downloadCsv}>Download CSV</SmallButton>
            </div>
            {copied && <p className="text-sm mt-2" style={{ color: '#1e5631' }}>{copied}</p>}

            {events.length > 0 && results.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#f0ede8' }}>
                <span className="text-sm" style={{ color: '#8a8378' }}>Mark all as invited to</span>
                <select
                  value={markEventId}
                  onChange={(e) => setMarkEventId(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                >
                  <option value="">— pick an event —</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <SmallButton onClick={markInvited} disabled={!markEventId || busy}>Mark invited</SmallButton>
                {notice && <span className="text-sm" style={{ color: '#1e5631' }}>{notice}</span>}
              </div>
            )}
          </div>

          {results.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#f0ede8' }}>
              <div className="flex-1 min-w-[180px]">
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>{c.name}</p>
                <p className="text-sm" style={{ color: '#8a8378' }}>
                  {[c.email, c.phone].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="text-sm" style={{ color: '#8a8378' }}>
                {[[c.city, c.state].filter(Boolean).join(', '), c.church].filter(Boolean).join(' · ')}
              </p>
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#4a4540' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
              Nobody matches all of those filters. Loosen one — tags have to all match.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold border transition"
      style={{
        backgroundColor: on ? 'var(--navy)' : '#FFFFFF',
        color: on ? '#FFFFFF' : '#4a4540',
        borderColor: on ? 'var(--navy)' : '#d1d5db',
      }}
    >
      {children}
    </button>
  );
}

function SmallButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-40"
      style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
    >
      {children}
    </button>
  );
}
