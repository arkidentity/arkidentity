'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampusEvent } from '@/lib/campusTasks';
import type { Rsvp } from '@/lib/eventInvites';
import { chicagoToday, formatDate } from '@/lib/campusFormat';
import DeclineForm from '@/components/iowa/DeclineForm';
import { useCall, type StaffOption } from '@/components/iowa/campus/ui';

// Who's coming to an event:
//   Team — staff invites (✓ in / ✗ can't / ? waiting), your own answer, and
//          "can't make this one" for the date you clicked.
//   RSVPs — the public link (Taco Night), head count for the date, and
//           personal invites for one person (a one-on-one).
export default function EventPeople({
  event,
  date,
  staff,
  meId,
  rsvps,
  students,
}: {
  event: CampusEvent;
  date: string | null;
  staff: StaffOption[];
  meId: string | null;
  rsvps: Rsvp[];
  students: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { call, busy, error } = useCall();
  const occ = date ?? event.event_date;
  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? 'Someone';
  const mine = event.invites.find((i) => i.staff_id === meId);
  const myAbsence = event.absences.find((a) => a.staff_id === meId && a.occurrence === occ);
  const awayOn = (id: string) => event.absences.find((a) => a.staff_id === id && a.occurrence === occ);
  const respond = (body: object) => call(`/api/iowa/admin/events/${event.id}/respond`, 'POST', body);
  const past = occ < chicagoToday();

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 space-y-5">
      {error && <p className="text-sm text-red-700">{error}</p>}

      {/* ---- Team ---- */}
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--navy)' }}>
          Team{event.repeat_weekly ? ` · ${formatDate(occ, { month: 'short', day: 'numeric' })}` : ''}
        </p>
        {/* Invite from here on any event (Google ones too — their form is read-only). */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {staff
            .filter((p) => p.active)
            .map((p) => {
              const on = event.invites.some((i) => i.staff_id === p.id);
              return (
                <button
                  key={p.id}
                  disabled={busy}
                  onClick={() =>
                    call(`/api/iowa/admin/events/${event.id}`, 'PATCH', {
                      staff_ids: on
                        ? event.invites.map((i) => i.staff_id).filter((id) => id !== p.id)
                        : [...event.invites.map((i) => i.staff_id), p.id],
                    })
                  }
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border disabled:opacity-50"
                  style={on ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { color: 'var(--navy)', borderColor: '#d1d5db', backgroundColor: 'white' }}
                  title={on ? 'Remove from this event' : 'Invite (they accept or decline)'}
                >
                  {on ? '✓ ' : '+ '}
                  {p.name.split(' ')[0]}
                </button>
              );
            })}
        </div>
        {event.invites.length === 0 ? (
          <p className="text-sm text-[#8a8378]">Nobody invited yet. Tap a name to invite them.</p>
        ) : (
          <ul className="text-[15px] md:text-sm space-y-1">
            {event.invites.map((i) => {
              const away = awayOn(i.staff_id);
              const mark =
                i.response === 'declined' ? '✗' : i.response === 'pending' ? '?' : away ? '✗' : '✓';
              const color = mark === '✓' ? '#15803d' : mark === '?' ? '#b45309' : '#b91c1c';
              return (
                <li key={i.staff_id}>
                  <span className="font-bold mr-1.5" style={{ color }}>{mark}</span>
                  <span className="text-[#4a4540]">{nameOf(i.staff_id)}</span>
                  <span className="text-[#8a8378]">
                    {i.response === 'pending'
                      ? ' · hasn’t answered'
                      : i.response === 'declined'
                        ? ` · can’t do it${i.note ? `: ${i.note}` : ''}`
                        : away
                          ? ` · can’t make this one${away.note ? `: ${away.note}` : ''}`
                          : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {mine && (
          <div className="mt-3 space-y-2">
            {mine.response === 'pending' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-amber-800">You’re invited.</span>
                <button disabled={busy} onClick={() => respond({ response: 'accepted' })} className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#15803d' }}>
                  I’m in
                </button>
              </div>
            )}
            {mine.response === 'pending' && <DeclineForm eventId={event.id} compact onDone={() => router.refresh()} />}
            {mine.response === 'declined' && (
              <button disabled={busy} onClick={() => respond({ response: 'accepted' })} className="text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
                Changed my mind, I’m in
              </button>
            )}
            {mine.response === 'accepted' && event.repeat_weekly && !past && (
              myAbsence ? (
                <button disabled={busy} onClick={() => respond({ occurrence: occ, away: false })} className="text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
                  I can make {formatDate(occ, { month: 'short', day: 'numeric' })} after all
                </button>
              ) : (
                <details>
                  <summary className="text-sm font-semibold cursor-pointer" style={{ color: '#b91c1c' }}>
                    Can’t make {formatDate(occ, { month: 'short', day: 'numeric' })}?
                  </summary>
                  <div className="mt-2">
                    <DeclineForm eventId={event.id} occurrence={occ} compact onDone={() => router.refresh()} />
                  </div>
                </details>
              )
            )}
          </div>
        )}
      </div>

      <Rsvps event={event} occ={occ} rsvps={rsvps} students={students} />
    </div>
  );
}

function Rsvps({
  event,
  occ,
  rsvps,
  students,
}: {
  event: CampusEvent;
  occ: string;
  rsvps: Rsvp[];
  students: { id: string; label: string }[];
}) {
  const router = useRouter();
  const { call, busy, error } = useCall();
  const [link, setLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [who, setWho] = useState({ contact_id: '', name: '', phone: '', email: '' });
  const [sent, setSent] = useState<{ url: string; emailed: boolean } | null>(null);
  const forDate = rsvps.filter((r) => r.occurrence === occ);
  const yes = forDate.filter((r) => r.response === 'yes');
  const headcount = yes.reduce((n, r) => n + 1 + r.guests, 0);
  const url = link ?? (event.rsvp_token ? `${location.origin}/iowa/rsvp/${event.rsvp_token}` : null);

  async function toggle(open: boolean) {
    const res = await fetch(`/api/iowa/admin/events/${event.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ open }),
    });
    const data = await res.json().catch(() => ({}));
    setLink(data.url ?? null);
    if (res.ok) router.refresh();
  }

  async function invite() {
    const res = await fetch(`/api/iowa/admin/events/${event.id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite: { ...who, contact_id: who.contact_id || undefined, occurrence: occ } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || 'Something went wrong.');
    setSent(data);
    await navigator.clipboard?.writeText(data.url).catch(() => {});
    setWho({ contact_id: '', name: '', phone: '', email: '' });
    router.refresh();
  }

  const field = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900';
  return (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <p className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
          RSVPs · {formatDate(occ, { month: 'short', day: 'numeric' })}
          {headcount > 0 && <span className="ml-2 font-semibold text-green-700">{headcount} going</span>}
        </p>
        {url ? (
          <span className="flex gap-3 text-sm">
            <button onClick={() => navigator.clipboard?.writeText(url)} className="font-semibold underline" style={{ color: 'var(--navy)' }}>
              Copy RSVP link
            </button>
            <button onClick={() => toggle(false)} className="text-[#8a8378] underline">Close</button>
          </span>
        ) : (
          <button onClick={() => toggle(true)} className="text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
            Open an RSVP link
          </button>
        )}
      </div>
      {url && <p className="text-xs text-[#8a8378] break-all mb-2">{url}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {forDate.length === 0 ? (
        <p className="text-sm text-[#8a8378]">No RSVPs for this date yet.</p>
      ) : (
        <ul className="text-[15px] md:text-sm space-y-1">
          {forDate.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-2">
              <span className="font-bold" style={{ color: r.response === 'yes' ? '#15803d' : r.response === 'no' ? '#b91c1c' : '#b45309' }}>
                {r.response === 'yes' ? '✓' : r.response === 'no' ? '✗' : '?'}
              </span>
              <span className="text-[#4a4540]">{r.name}</span>
              <span className="text-[#8a8378]">
                {r.guests ? ` +${r.guests}` : ''}
                {r.phone ? ` · ${r.phone}` : ''}
                {r.response === 'invited' ? ' · invited, no answer yet' : ''}
                {r.note ? ` · ${r.note}` : ''}
              </span>
              <button disabled={busy} onClick={() => call(`/api/iowa/admin/events/${event.id}/rsvp`, 'POST', { remove: r.id })} className="text-xs text-[#b0a99e]" title="Remove">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {!inviting ? (
          <button onClick={() => setInviting(true)} className="text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
            + Invite one person (gets their own link)
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <select className={field} value={who.contact_id} onChange={(e) => setWho({ ...who, contact_id: e.target.value })}>
                <option value="">Pick a student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {!who.contact_id && (
                <>
                  <input className={field} placeholder="or a name" value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} />
                  <input className={field} placeholder="Phone" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} />
                  <input className={field} placeholder="Email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} />
                </>
              )}
              <button onClick={invite} className="px-3 py-1.5 rounded-md text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>
                Create invite
              </button>
              <button onClick={() => { setInviting(false); setSent(null); }} className="text-sm text-[#8a8378]">Done</button>
            </div>
            {sent && (
              <p className="text-xs text-[#4a4540] break-all">
                {sent.emailed ? 'Emailed them, and copied' : 'Copied'} their link. Text it to them: {sent.url}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
