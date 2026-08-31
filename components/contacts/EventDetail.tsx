'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventBoard, InviteStatus, SegmentFilters, Tag } from '@/lib/contacts';

// An event's working board. Two lists, in the order you actually use them:
// who's left to invite, then who you've already asked. Checking someone off the
// first moves them to the second.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

const STATUS_LABEL: Record<InviteStatus, string> = {
  invited: 'Invited',
  confirmed: 'Confirmed',
  declined: 'Declined',
  no_response: 'No response',
};

export function EventDetail({
  event,
  tags,
  states,
  regions,
  churches,
}: {
  event: EventBoard;
  tags: Tag[];
  states: string[];
  regions: string[];
  churches: string[];
}) {
  const router = useRouter();
  const [invites, setInvites] = useState(event.invites);
  const [candidates, setCandidates] = useState(event.candidates);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [editingAudience, setEditingAudience] = useState(!event.filters);
  const [busy, setBusy] = useState(false);

  const f = event.filters ?? {};
  const [selStates, setSelStates] = useState<string[]>(f.states ?? []);
  const [selRegions, setSelRegions] = useState<string[]>(f.regions ?? []);
  const [selChurches, setSelChurches] = useState<string[]>(f.churches ?? []);
  const [selTags, setSelTags] = useState<string[]>(f.tagIds ?? []);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function saveAudience() {
    setBusy(true);
    setError('');
    const filters: SegmentFilters = {
      states: selStates,
      regions: selRegions,
      churches: selChurches,
      tagIds: selTags,
    };
    const res = await fetch(`/api/admin/contacts/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not save who this is for.');
      return;
    }
    setEditingAudience(false);
    router.refresh(); // re-runs the segment server-side for the fresh candidate list
  }

  async function invite(contactIds: string[]) {
    setBusy(true);
    const res = await fetch(`/api/admin/contacts/events/${event.id}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactIds }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not mark them invited.');
      return;
    }
    const moved = candidates.filter((c) => contactIds.includes(c.id));
    setCandidates((list) => list.filter((c) => !contactIds.includes(c.id)));
    setInvites((list) =>
      [
        ...list,
        ...moved.map((c) => ({ contact: c, status: 'invited' as InviteStatus, invited_at: new Date().toISOString() })),
      ].sort((a, b) => a.contact.name.localeCompare(b.contact.name))
    );
  }

  async function setStatus(contactId: string, status: InviteStatus) {
    const res = await fetch(`/api/admin/contacts/events/${event.id}/invites`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, status }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Update failed.');
      return;
    }
    setInvites((list) => list.map((i) => (i.contact.id === contactId ? { ...i, status } : i)));
  }

  // Undo, not a delete: puts them back on the to-invite list if they still match.
  async function uninvite(contactId: string) {
    const res = await fetch(`/api/admin/contacts/events/${event.id}/invites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    });
    if (!res.ok) { setError('Could not undo that.'); return; }
    setInvites((list) => list.filter((i) => i.contact.id !== contactId));
    router.refresh();
  }

  async function copyFrom(list: { email: string | null; phone: string | null }[], what: 'email' | 'phone') {
    const values = list.map((c) => (what === 'email' ? c.email : c.phone)).filter((v): v is string => !!v);
    await navigator.clipboard.writeText(values.join(', '));
    setCopied(`${values.length} ${what === 'email' ? 'emails' : 'numbers'} copied`);
    setTimeout(() => setCopied(''), 2500);
  }

  const hasAudience = !!event.filters;

  return (
    <div>
      {/* Who this event is for */}
      <div className="rounded-xl p-5 mb-6" style={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>Who this is for</h2>
          {hasAudience && (
            <button
              onClick={() => setEditingAudience((e) => !e)}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
            >
              {editingAudience ? 'Cancel' : 'Change'}
            </button>
          )}
        </div>

        {editingAudience ? (
          <>
            <FilterRow label="State" options={states.map((s) => ({ id: s, name: s }))} selected={selStates} onToggle={(v) => toggle(selStates, v, setSelStates)} />
            <FilterRow label="Region" options={regions.map((r) => ({ id: r, name: r }))} selected={selRegions} onToggle={(v) => toggle(selRegions, v, setSelRegions)} />
            <FilterRow label="Church" options={churches.map((c) => ({ id: c, name: c }))} selected={selChurches} onToggle={(v) => toggle(selChurches, v, setSelChurches)} />
            <FilterRow
              label={selTags.length > 1 ? 'Tags (must have all)' : 'Tags'}
              options={tags}
              selected={selTags}
              onToggle={(v) => toggle(selTags, v, setSelTags)}
            />
            <button
              onClick={saveAudience}
              disabled={busy}
              className="mt-2 px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Save audience
            </button>
          </>
        ) : (
          <p className="text-sm" style={{ color: '#8a8378' }}>
            {describe(event.filters, tags) || 'Everyone.'}
          </p>
        )}
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}
      {copied && <p className="mb-4 text-sm" style={{ color: '#1e5631' }}>{copied}</p>}

      {/* Still to invite */}
      <div className="rounded-xl overflow-hidden mb-6" style={card}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
          <p className="font-bold text-lg flex-1" style={{ color: 'var(--navy)' }}>
            Still to invite · {candidates.length}
          </p>
          {candidates.length > 0 && (
            <>
              <SmallButton onClick={() => copyFrom(candidates, 'email')}>Copy emails</SmallButton>
              <SmallButton onClick={() => copyFrom(candidates, 'phone')}>Copy numbers</SmallButton>
              <SmallButton onClick={() => invite(candidates.map((c) => c.id))} disabled={busy}>
                Check off all
              </SmallButton>
            </>
          )}
        </div>

        {candidates.map((c) => (
          <label key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 border-b cursor-pointer" style={{ borderColor: '#f0ede8' }}>
            <input type="checkbox" checked={false} disabled={busy} onChange={() => invite([c.id])} />
            <div className="flex-1 min-w-[180px]">
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>{c.name}</p>
              <p className="text-sm" style={{ color: '#8a8378' }}>
                {[c.email, c.phone, [c.city, c.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
              </p>
            </div>
          </label>
        ))}

        {candidates.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
            {!hasAudience
              ? 'Set who this event is for above, and the list of people to invite shows up here.'
              : invites.length > 0
                ? 'Everyone who matches has been invited.'
                : 'Nobody matches those filters yet.'}
          </p>
        )}
      </div>

      {/* Already invited */}
      <div className="rounded-xl overflow-hidden" style={card}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
          <p className="font-bold text-lg flex-1" style={{ color: 'var(--navy)' }}>
            Invited · {invites.length}
          </p>
          {invites.length > 0 && <SmallButton onClick={() => copyFrom(invites.map((i) => i.contact), 'email')}>Copy emails</SmallButton>}
        </div>

        {invites.map((i) => (
          <div key={i.contact.id} className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#f0ede8' }}>
            <div className="flex-1 min-w-[180px]">
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>{i.contact.name}</p>
              <p className="text-sm" style={{ color: '#8a8378' }}>
                {[i.contact.email, i.contact.phone].filter(Boolean).join(' · ')}
              </p>
            </div>
            <select
              value={i.status}
              onChange={(e) => setStatus(i.contact.id, e.target.value as InviteStatus)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              {(Object.keys(STATUS_LABEL) as InviteStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={() => uninvite(i.contact.id)}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#d1d5db', color: '#8a8378' }}
            >
              Undo
            </button>
          </div>
        ))}

        {invites.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>Nobody invited yet.</p>
        )}
      </div>
    </div>
  );
}

// Plain-English summary of the saved filters, so the event says who it's for
// without you having to open the editor.
function describe(filters: SegmentFilters | null, tags: Tag[]): string {
  if (!filters) return '';
  const parts: string[] = [];
  if (filters.states?.length) parts.push(filters.states.join(' or '));
  if (filters.regions?.length) parts.push(filters.regions.join(' or '));
  if (filters.churches?.length) parts.push(filters.churches.join(' or '));
  if (filters.tagIds?.length) {
    const names = filters.tagIds.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean);
    if (names.length) parts.push(names.join(' + '));
  }
  return parts.join(' · ');
}

function FilterRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className="px-3 py-1.5 rounded-full text-sm font-semibold border"
              style={{
                backgroundColor: on ? 'var(--navy)' : '#FFFFFF',
                color: on ? '#FFFFFF' : '#4a4540',
                borderColor: on ? 'var(--navy)' : '#d1d5db',
              }}
            >
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
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
