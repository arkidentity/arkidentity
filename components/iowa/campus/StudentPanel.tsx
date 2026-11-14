'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentHistory } from '@/components/iowa/StudentHistory';
import { STATUS_COLOR, STATUS_LABEL, YEARS, statusChoices } from '@/components/iowa/studentStatus';
import { slotLabel, sortSlots } from '@/lib/bibleStudyFormat';
import { DORMANT_REASONS } from '@/lib/checkinFormat';
import { DROP_REASONS } from '@/lib/campusFormat';
import { useCan } from '@/components/iowa/campus/ui';
import { DailyDnaLink } from '@/components/iowa/DailyDnaLink';
import type { CampusStudent, StudentStatus } from '@/lib/bibleStudies';

// One student, editable, anywhere in the admin (11/13, Travis: "everything we
// could change on a student from their profile we should be able to change from
// a task"). Used inside a task and in the popup a student's name opens.
// Same endpoints as the Students tab, so a change here is a change there.

type StudyPick = { id: string; label: string; open: number };

const field = 'w-full min-h-11 px-3 py-2 border border-gray-300 rounded-lg text-[15px] text-gray-900 bg-white';
const chip = 'inline-flex items-center px-3 min-h-9 rounded-lg text-sm font-semibold border border-gray-300';
const small = 'text-sm font-semibold underline underline-offset-2';

export default function StudentPanel({
  contactId,
  fallbackName,
  staff,
}: {
  contactId: string;
  fallbackName?: string;
  staff?: { id: string; name: string }[]; // shows "Who met them" (People tab has the list)
}) {
  const router = useRouter();
  const can = useCan();
  const seats = can('viewAllStudies');
  const [s, setS] = useState<CampusStudent | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<'add' | string | null>(null); // 'add' or a member_id being moved
  const [studies, setStudies] = useState<StudyPick[] | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch(`/api/iowa/admin/students/${contactId}`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) setError(r.status === 403 ? 'Student profiles aren’t open to your login.' : j.error ?? 'Couldn’t load.');
    else setS(j.student);
  }, [contactId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!placing || studies) return;
    fetch('/api/iowa/admin/studies')
      .then((r) => r.json())
      .then((j: { studies?: { id: string; day_of_week: number; start_time: string; location: string | null; capacity: number; status: string; activeCount: number }[] }) =>
        setStudies(
          (j.studies ?? [])
            .filter((x) => ['forming', 'full', 'activated'].includes(x.status))
            .map((x) => {
              const n = x.activeCount;
              const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x.day_of_week];
              const [h, m] = x.start_time.split(':').map(Number);
              const time = `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
              return { id: x.id, label: `${day} ${time}${x.location ? ` · ${x.location}` : ''} (${n}/${x.capacity})`, open: x.capacity - n };
            })
        )
      )
      .catch(() => setStudies([]));
  }, [placing, studies]);

  async function send(url: string, method: string, body: unknown, msg: string) {
    setBusy(true);
    setError('');
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) {
      setError((await r.json().catch(() => ({}))).error ?? 'That didn’t save.');
      return false;
    }
    setSaved(msg);
    setTimeout(() => setSaved(''), 1800);
    await load();
    setHistoryKey((k) => k + 1);
    router.refresh();
    return true;
  }
  const patch = (body: Record<string, unknown>, msg = 'Saved') => send(`/api/iowa/admin/students/${contactId}`, 'PATCH', body, msg);

  if (error && !s) return <p className="text-sm text-red-700">{error}</p>;
  if (!s) return <p className="text-sm text-[#8a8378]">Loading {fallbackName ?? 'student'}…</p>;

  const inStudy = s.studies.length > 0;
  const metName = s.met_by_staff_id ? staff?.find((p) => p.id === s.met_by_staff_id)?.name?.split(' ')[0] : s.met_by_other === 'friend' ? 'a friend' : s.met_by_other === 'self' ? 'on their own' : null;
  const subline = [
    metName && (s.met_by_staff_id ? `Met by ${metName}` : `Came via ${metName}`),
    s.added_at && `Added ${new Date(s.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' })}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4 text-[#1a2b3c]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-bold">
            {s.name}
            <select
              aria-label="Year"
              className="ml-2 align-middle bg-transparent text-sm font-normal text-[#7d766b] underline decoration-dotted underline-offset-2 cursor-pointer"
              value={s.year ?? ''}
              disabled={busy}
              onChange={(e) => patch({ year: e.target.value || null })}
            >
              <option value="">add year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </p>
          <button className={small} onClick={() => setEditing((v) => !v)}>{editing ? 'Close' : 'Edit'}</button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <select
            aria-label="Status"
            className="rounded-lg px-2 py-0.5 text-sm font-semibold border border-gray-200 bg-white cursor-pointer"
            style={{ color: STATUS_COLOR[s.status] }}
            value={s.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value as StudentStatus }, `Now: ${STATUS_LABEL[e.target.value as StudentStatus]}`)}
          >
            {statusChoices(inStudy).map((st) => (
              <option key={st} value={st}>{STATUS_LABEL[st]}</option>
            ))}
          </select>
          {subline && <span className="text-sm text-[#7d766b]">{subline}</span>}
        </div>
        {!editing && (s.phone || s.email) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {s.phone && <a href={`sms:${s.phone.replace(/[^d+]/g, '')}`} className={chip}>Text</a>}
            {s.phone && <a href={`tel:${s.phone.replace(/[^d+]/g, '')}`} className={chip}>Call</a>}
            {s.email && <a href={`mailto:${s.email}`} className={chip}>Email</a>}
          </div>
        )}
        {editing && <ContactEdit s={s} busy={busy} onSave={async (b) => { if (await patch(b)) setEditing(false); }} />}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <p className="text-sm text-[#7d766b] mb-1">Bible study</p>
        {!inStudy && s.status === 'elsewhere' && <p className="text-[15px]">In a study with another group.</p>}
        <ul className="space-y-1.5">
          {s.studies.map((st) => (
            <li key={st.member_id} className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
              <span className="font-semibold">{st.label}</span>
              {seats && (
                <span className="flex gap-3">
                  <button className={small} onClick={() => setPlacing(placing === st.member_id ? null : st.member_id)}>Move</button>
                  <DropButton busy={busy} onDrop={(reason) => send(`/api/iowa/admin/members/${st.member_id}`, 'PATCH', { status: 'dropped', dropReason: reason }, 'Dropped from the study')} />
                </span>
              )}
            </li>
          ))}
        </ul>
        {seats && !placing && (
          <button className={`${small} ${inStudy ? 'mt-2' : ''}`} onClick={() => setPlacing('add')}>{inStudy ? 'Add to another study' : 'Find a study for them'}</button>
        )}
        {placing && (
          <div className="mt-2 flex gap-2">
            <select
              className={field}
              defaultValue=""
              disabled={busy || !studies}
              onChange={async (e) => {
                const id = e.target.value;
                if (!id) return;
                const ok =
                  placing === 'add'
                    ? await send('/api/iowa/admin/members', 'POST', { studyId: id, contactId }, 'Added to the study')
                    : await send(`/api/iowa/admin/members/${placing}`, 'PATCH', { studyId: id }, 'Moved');
                if (ok) setPlacing(null);
              }}
            >
              <option value="">{studies ? 'Pick a study' : 'Loading studies…'}</option>
              {(studies ?? [])
                .filter((x) => !s.studies.some((y) => y.id === x.id))
                .map((x) => (
                  <option key={x.id} value={x.id} disabled={x.open <= 0}>{x.label}</option>
                ))}
            </select>
            <button className="text-sm text-[#7d766b] px-2" onClick={() => setPlacing(null)}>Cancel</button>
          </div>
        )}
        {(s.free_slots?.length ?? 0) > 0 && (
          <p className="mt-2 text-sm text-[#7d766b]">
            Free{s.free_slots_semester ? ` for ${s.free_slots_semester}` : ''}: {sortSlots(s.free_slots).map(slotLabel).join(', ')}
            {s.gender && ` · ${s.gender === 'guy' ? 'Guys + Co-ed' : 'Girls + Co-ed'}`}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && <p className="text-sm font-semibold text-green-700">{saved}</p>}

      <div className="border-t border-gray-200 pt-3">
        <p className="text-sm text-[#7d766b] mb-1">History</p>
        <StudentHistory key={historyKey} contactId={contactId} compact />
      </div>

      <details open={s.status === 'dormant'} className="border-t border-gray-200 pt-3">
        <summary className="text-sm text-[#7d766b] cursor-pointer">Details <span className="text-xs">who met them, Daily DNA</span></summary>
        <div className="mt-3 space-y-4">
          {staff && (
            <label className="block">
              <span className="block text-sm text-[#7d766b] mb-1">Who met them</span>
              <select className={field} value={s.met_by_staff_id ?? s.met_by_other ?? ''} disabled={busy} onChange={(e) => patch({ metBy: e.target.value })}>
                <option value="">Not sure</option>
                {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="friend">A friend invited them</option>
                <option value="self">Found it on their own</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}
          {s.status === 'dormant' && (
            <div className="grid gap-2">
              <select className={field} value={s.dormant_reason ?? ''} disabled={busy} onChange={(e) => patch({ dormantReason: e.target.value || null })}>
                <option value="">Why dormant? Pick a reason</option>
                {DORMANT_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <input
                key={s.dormant_note ?? ''}
                className={field}
                defaultValue={s.dormant_note ?? ''}
                placeholder="Note (optional)"
                onBlur={(e) => e.target.value !== (s.dormant_note ?? '') && patch({ dormantNote: e.target.value })}
              />
            </div>
          )}
          <DailyDnaLink contactId={s.contact_id} linked={!!s.daily_dna_account_id} linkedName={s.daily_dna_name} studentName={s.name} />
        </div>
      </details>
    </div>
  );
}

function ContactEdit({ s, busy, onSave }: { s: CampusStudent; busy: boolean; onSave: (b: { name: string; phone: string | null; email: string | null }) => void }) {
  const [name, setName] = useState(s.name);
  const [phone, setPhone] = useState(s.phone ?? '');
  const [email, setEmail] = useState(s.email ?? '');
  return (
    <div className="grid gap-2 mt-2">
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input className={field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <div className="flex justify-end">
        <button
          disabled={busy}
          className="px-4 min-h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#1a2b3c' }}
          onClick={() => onSave({ name, phone: phone || null, email: email || null })}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function DropButton({ busy, onDrop }: { busy: boolean; onDrop: (reason: string) => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button className={small} style={{ color: '#b42318' }} onClick={() => setAsking(true)}>Drop</button>;
  return (
    <select
      className="min-h-11 px-2 border border-gray-300 rounded-lg text-sm bg-white"
      defaultValue=""
      disabled={busy}
      autoFocus
      onBlur={() => setAsking(false)}
      onChange={(e) => e.target.value && onDrop(e.target.value)}
    >
      <option value="">Why are they leaving?</option>
      {DROP_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
    </select>
  );
}
