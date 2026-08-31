'use client';

import { useState } from 'react';
import type { EventWithInvites, InviteStatus } from '@/lib/contacts';

// Who you already asked. Confirmed/declined is optional — Google Calendar has
// the real RSVPs — so the default status stays 'invited' unless you say
// otherwise here.

const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;
const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;

const STATUS_LABEL: Record<InviteStatus, string> = {
  invited: 'Invited',
  confirmed: 'Confirmed',
  declined: 'Declined',
  no_response: 'No response',
};

export function EventDetail({ event }: { event: EventWithInvites }) {
  const [invites, setInvites] = useState(event.invites);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

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

  async function remove(contactId: string, name: string) {
    if (!window.confirm(`Take ${name} off this event's invited list?`)) return;
    const res = await fetch(`/api/admin/contacts/events/${event.id}/invites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    });
    if (res.ok) setInvites((list) => list.filter((i) => i.contact.id !== contactId));
    else setError('Could not remove.');
  }

  async function copyEmails() {
    const emails = invites.map((i) => i.contact.email).filter((e): e is string => !!e);
    await navigator.clipboard.writeText(emails.join(', '));
    setCopied(`${emails.length} emails copied`);
    setTimeout(() => setCopied(''), 2500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <p className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
          {invites.length} invited
        </p>
        {invites.length > 0 && (
          <button onClick={copyEmails} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
            Copy emails
          </button>
        )}
        <a href="/admin/contacts/segments" className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>
          Invite more from a segment
        </a>
        {copied && <span className="text-sm" style={{ color: '#1e5631' }}>{copied}</span>}
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="rounded-xl overflow-hidden" style={card}>
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
              onClick={() => remove(i.contact.id, i.contact.name)}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#f0c8c8', color: '#b91c1c' }}
            >
              Remove
            </button>
          </div>
        ))}
        {invites.length === 0 && (
          <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
            Nobody invited yet. Run a segment and mark that list invited to this event.
          </p>
        )}
      </div>
    </div>
  );
}
