'use client';

import { useMemo, useState } from 'react';
import {
  CHECKIN_OUTCOMES,
  QUIET_REASONS,
  daysSince,
  outcomeLabel,
  type CheckinOutcome,
  type CheckinRow,
  type QuietReason,
  type SocialEventOption,
} from '@/lib/checkinFormat';

// The check-in report: students who've gone quiet, opened from the Students
// tab. Built for a phone — tap to text or call, log how it went, move on.
// Not always about getting them back in a study; sometimes just "how's school?"

const input = 'px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';

type Window = '30' | '60' | '90' | 'any';
type Touched = 'due' | 'never' | 'all';

const reasonLabel = (k: QuietReason) => QUIET_REASONS.find((r) => r.key === k)!.label;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const digits = (p: string) => p.replace(/[^\d+]/g, '');

function csv(rows: CheckinRow[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Name', 'Phone', 'Email', 'Year', 'Reason', 'Detail', 'Study', 'Quiet since', 'Days quiet', 'Last check-in', 'By', 'Outcome', 'Note'];
  const body = rows.map((r) => [
    r.name, r.phone, r.email, r.year, reasonLabel(r.reason), r.detail, r.study,
    shortDate(r.quiet_since), daysSince(r.quiet_since),
    r.last_checkin ? shortDate(r.last_checkin.at) : '', r.last_checkin?.by,
    r.last_checkin ? outcomeLabel(r.last_checkin.outcome) : '', r.last_checkin?.note,
  ]);
  return [head, ...body].map((line) => line.map(esc).join(',')).join('\n');
}

function LogForm({ onSave, busy }: { onSave: (o: CheckinOutcome, note: string) => Promise<void>; busy: boolean }) {
  const [outcome, setOutcome] = useState<CheckinOutcome | ''>('');
  const [note, setNote] = useState('');
  return (
    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="flex flex-wrap gap-2 mb-2">
        {CHECKIN_OUTCOMES.map((o) => (
          <button
            key={o.key}
            onClick={() => setOutcome(o.key)}
            className="px-3 py-2 rounded-md text-sm font-semibold border"
            style={outcome === o.key
              ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' }
              : { borderColor: '#d1d5db', color: 'var(--navy)', backgroundColor: 'white' }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional) — how are they doing?"
        className={`${input} w-full mb-2`}
      />
      <button
        onClick={() => outcome && onSave(outcome, note)}
        disabled={busy || !outcome}
        className="px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)', color: 'white' }}
      >
        Save check-in
      </button>
    </div>
  );
}

export function CheckinReport({
  initial,
  events,
  onClose,
}: {
  initial: CheckinRow[];
  events: SocialEventOption[];
  onClose: () => void;
}) {
  const [rows, setRows] = useState(initial);
  const [win, setWin] = useState<Window>('any');
  const [reason, setReason] = useState<QuietReason | ''>('');
  const [touched, setTouched] = useState<Touched>('due');
  const [logging, setLogging] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [eventId, setEventId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ name: string; phone: string | null; url?: string; emailed?: boolean; error?: string }[] | null>(null);

  const visible = useMemo(() => rows.filter((r) => {
    if (win !== 'any' && daysSince(r.quiet_since) > Number(win)) return false;
    if (reason && r.reason !== reason) return false;
    if (touched === 'never' && r.last_checkin) return false;
    if (touched === 'due' && r.last_checkin && daysSince(r.last_checkin.at) < 30) return false;
    return true;
  }), [rows, win, reason, touched]);

  async function save(contactId: string, outcome: CheckinOutcome, note: string) {
    setBusy(true);
    setError('');
    const res = await fetch('/api/iowa/admin/students/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, outcome, note }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Could not save.'); return; }
    setRows((list) => list.map((r) =>
      r.contact_id === contactId ? { ...r, last_checkin: json.checkin, checkin_count: r.checkin_count + 1 } : r
    ));
    setLogging(null);
  }

  async function invite() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/iowa/admin/students/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, contactIds: [...picked] }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Could not send invites.'); return; }
    const byId = new Map(rows.map((r) => [r.contact_id, r]));
    setSent((json.results as { contactId: string; url?: string; emailed?: boolean; error?: string }[]).map((x) => ({
      name: byId.get(x.contactId)?.name ?? 'Unknown',
      phone: byId.get(x.contactId)?.phone ?? null,
      ...x,
    })));
    setPicked(new Set());
  }

  function download() {
    const blob = new Blob([csv(visible)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `check-in-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const toggle = (id: string) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const eventTitle = events.find((e) => e.id === eventId)?.title ?? 'this';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#FAF8F5' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--navy)' }}>Check-in report</h1>
          <button
            onClick={onClose}
            className="text-sm font-semibold px-3 py-2 rounded-md border"
            style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
          >
            Close
          </button>
        </div>
        <p className="mb-5 text-sm" style={{ color: '#8a8378' }}>
          Students who&apos;ve gone quiet. Reach out to see how they&apos;re doing, not only to get them back in a study.
        </p>

        <div className="rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <select value={win} onChange={(e) => setWin(e.target.value as Window)} className={input}>
            <option value="30">Went quiet in the last 30 days</option>
            <option value="60">Went quiet in the last 60 days</option>
            <option value="90">Went quiet in the last 90 days</option>
            <option value="any">Went quiet any time</option>
          </select>
          <select value={reason} onChange={(e) => setReason(e.target.value as QuietReason | '')} className={input}>
            <option value="">Any reason</option>
            {QUIET_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select value={touched} onChange={(e) => setTouched(e.target.value as Touched)} className={input}>
            <option value="due">Not checked on in 30 days</option>
            <option value="never">Never checked on</option>
            <option value="all">Everyone</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm" style={{ color: '#8a8378' }}>{visible.length} students</p>
          <button onClick={download} disabled={visible.length === 0} className="text-sm font-semibold disabled:opacity-50" style={{ color: 'var(--navy)' }}>
            Download CSV
          </button>
        </div>

        {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

        {sent && (
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex justify-between mb-2">
              <p className="font-semibold" style={{ color: 'var(--navy)' }}>Invites ready</p>
              <button onClick={() => setSent(null)} className="text-sm" style={{ color: '#8a8378' }}>Dismiss</button>
            </div>
            <p className="text-xs mb-2" style={{ color: '#8a8378' }}>
              Anyone with an email got it by email. A text from you lands better, so tap Text to send them their link.
            </p>
            {sent.map((s) => (
              <div key={s.name + s.url} className="flex flex-wrap items-center gap-2 text-sm py-1">
                <span className="flex-1" style={{ color: '#4a4540' }}>
                  {s.name}{s.emailed ? ' · emailed' : ''}{s.error ? ` · ${s.error}` : ''}
                </span>
                {s.url && s.phone && (
                  <a
                    href={`sms:${digits(s.phone)}?&body=${encodeURIComponent(`Hey ${s.name.split(' ')[0]}! Would love to have you at ${eventTitle}: ${s.url}`)}`}
                    className="font-semibold" style={{ color: 'var(--navy)' }}
                  >
                    Text
                  </a>
                )}
                {s.url && (
                  <button onClick={() => navigator.clipboard?.writeText(s.url!)} className="font-semibold" style={{ color: 'var(--navy)' }}>
                    Copy link
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {visible.map((r) => (
            <div key={r.contact_id} className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={picked.has(r.contact_id)}
                  onChange={() => toggle(r.contact_id)}
                  className="mt-1 h-5 w-5 shrink-0"
                  aria-label={`Select ${r.name}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                      {r.name}{r.year && <span className="font-normal text-sm" style={{ color: '#8a8378' }}> · {r.year}</span>}
                    </p>
                    <p className="text-xs" style={{ color: '#9d855a' }}>
                      quiet {daysSince(r.quiet_since)} days
                    </p>
                  </div>

                  <p className="text-sm mt-1" style={{ color: '#4a4540' }}>
                    {reasonLabel(r.reason)}
                    {r.study && <> · {r.study}</>}
                    {' · '}{shortDate(r.quiet_since)}
                  </p>
                  {r.detail && <p className="text-sm" style={{ color: '#8a8378' }}>{r.detail}</p>}

                  <p className="text-xs mt-1" style={{ color: '#8a8378' }}>
                    {r.last_checkin
                      ? <>Last check-in {shortDate(r.last_checkin.at)}{r.last_checkin.by && ` by ${r.last_checkin.by.split(' ')[0]}`}: {outcomeLabel(r.last_checkin.outcome)}{r.last_checkin.note && ` — “${r.last_checkin.note}”`}{r.checkin_count > 1 && ` (${r.checkin_count} total)`}</>
                      : 'Never checked on'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.phone ? (
                      <>
                        <a href={`sms:${digits(r.phone)}`} className="px-3 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>Text</a>
                        <a href={`tel:${digits(r.phone)}`} className="px-3 py-2 rounded-md text-sm font-semibold border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>Call</a>
                      </>
                    ) : r.email ? (
                      <a href={`mailto:${r.email}`} className="px-3 py-2 rounded-md text-sm font-semibold border" style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}>Email</a>
                    ) : (
                      <span className="text-sm py-2" style={{ color: '#8a8378' }}>No contact details</span>
                    )}
                    <button
                      onClick={() => setLogging(logging === r.contact_id ? null : r.contact_id)}
                      className="px-3 py-2 rounded-md text-sm font-semibold border"
                      style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
                    >
                      {logging === r.contact_id ? 'Cancel' : 'Log check-in'}
                    </button>
                  </div>

                  {logging === r.contact_id && (
                    <LogForm busy={busy} onSave={(o, n) => save(r.contact_id, o, n)} />
                  )}
                </div>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
              {rows.length === 0 ? 'Nobody has gone quiet. 🎉' : 'Nobody matches those filters.'}
            </p>
          )}
        </div>
      </div>

      {/* Invite bar — shows once someone's selected. */}
      {picked.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 border-t p-3" style={{ backgroundColor: '#FFFFFF', borderColor: '#e5e1da' }}>
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>{picked.size} selected</span>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={`${input} flex-1 min-w-[180px]`}>
              <option value="">Invite to…</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.social ? '★ ' : ''}{e.title} · {e.when}</option>
              ))}
            </select>
            <button
              onClick={invite}
              disabled={busy || !eventId}
              className="px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              Send invites
            </button>
            <button onClick={() => setPicked(new Set())} className="text-sm" style={{ color: '#8a8378' }}>Clear</button>
          </div>
          {events.length === 0 && (
            <p className="max-w-4xl mx-auto text-xs mt-2" style={{ color: '#8a8378' }}>
              No upcoming events. Add one on the Calendar first (type “Social” for outings).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
