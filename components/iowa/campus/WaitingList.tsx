'use client';

import { useEffect, useState } from 'react';
import { GROUP_LABEL, groupFits, slotLabel, type GroupType, type StudentGender } from '@/lib/bibleStudyFormat';
import { ContactButtons, ErrorBox, Modal, useCall } from '@/components/iowa/campus/ui';
import StudentPanel from '@/components/iowa/campus/StudentPanel';

// "Waiting for a study": one line per student not in a study yet. Place opens
// the studies with room that fit them, the ones at times they said they're
// free first, each with Put in. Replaces the by-slot grid (WaitingBySlot).

export interface WaitingStudent {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  year: string | null;
  gender: StudentGender | null;
  free: string[]; // this semester's free slots ("1-evening"); empty if they haven't picked
  added_at: string | null;
}
export interface OpenStudy {
  id: string;
  label: string; // "Tue 8:00 PM"
  slot: string; // "1-evening"
  where: string;
  group_type: GroupType;
  spotsLeft: number;
}

const SHOW = 3;
const cap = (y: string | null) => (y ? y[0].toUpperCase() + y.slice(1) : null);

function since(iso: string | null) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d < 1 ? 'today' : d === 1 ? '1 day' : `${d} days`;
}

export default function WaitingList({ students, studies }: { students: WaitingStudent[]; studies: OpenStudy[] }) {
  const [placing, setPlacing] = useState<WaitingStudent | null>(null);
  const [profile, setProfile] = useState<WaitingStudent | null>(null);
  const [all, setAll] = useState(false);
  const [asking, setAsking] = useState(false);
  const noTimes = students.filter((p) => p.free.length === 0);
  const { call, busy, error } = useCall();
  if (!students.length) return null;

  const fitting = placing ? studies.filter((s) => groupFits(s.group_type, placing.gender)) : [];
  const atFree = fitting.filter((s) => placing!.free.includes(s.slot));
  const other = fitting.filter((s) => !placing!.free.includes(s.slot));

  return (
    <section className="mb-6 rounded-xl p-3 sm:p-4" style={{ background: '#fdf6e8', border: '1px solid #E8B562' }}>
      <h2 className="font-bold" style={{ color: 'var(--navy)' }}>
        Waiting for a study <span className="font-normal text-[#7d766b]">{students.length}</span>
      </h2>
      {/* Longest wait first; the rest fold away so the studies stay in view. */}
      <ul>
        {(all ? students : students.slice(0, SHOW)).map((p) => (
          <li key={p.contact_id} className="flex items-center justify-between gap-3 py-2.5 border-t border-[#ecdcb8] first:border-t-0">
            <button className="min-w-0 text-left" onClick={() => setProfile(p)}>
              <span className="block font-semibold" style={{ color: 'var(--navy)' }}>{p.name}</span>
              <span className="block text-sm text-[#7d766b]">
                {[cap(p.year), p.free.length ? `free ${p.free.map(slotLabel).join(', ')}` : 'no times picked', p.added_at && `waiting ${since(p.added_at)}`]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </button>
            <button
              onClick={() => setPlacing(p)}
              className="shrink-0 px-4 min-h-11 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--navy)' }}
            >
              Place
            </button>
          </li>
        ))}
      </ul>
      {noTimes.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-[#ecdcb8]">
          <p className="text-sm text-[#7d766b]">{noTimes.length} haven’t told us when they’re free.</p>
          <button onClick={() => setAsking(true)} className="shrink-0 px-4 min-h-11 rounded-lg text-sm font-bold" style={{ background: '#E8B562', color: '#143348' }}>
            Text them for times
          </button>
        </div>
      )}
      {asking && <AskForTimes students={noTimes} onClose={() => setAsking(false)} />}
      {students.length > SHOW && (
        <button onClick={() => setAll((v) => !v)} className="w-full mt-1 min-h-11 text-sm font-semibold border-t border-[#ecdcb8]" style={{ color: 'var(--navy)' }}>
          {all ? 'Show fewer' : `See all ${students.length}`}
        </button>
      )}

      {placing && (
        <Modal title={`Place ${placing.name}`} sub={[placing.year, placing.gender && (placing.gender === 'guy' ? 'Guys + Co-ed' : 'Girls + Co-ed')].filter(Boolean).join(' · ')} onClose={() => setPlacing(null)}>
          <ErrorBox error={error} />
          {placing.free.length > 0 && (
            <>
              <p className="text-sm text-[#7d766b] mb-2">With room, at times they’re free:</p>
              <Studies list={atFree} busy={busy} onPick={async (s) => (await call('/api/iowa/admin/members', 'POST', { studyId: s.id, contactId: placing.contact_id })) && setPlacing(null)} />
              <p className="text-sm text-[#7d766b] mt-5 mb-2">Other studies with room:</p>
            </>
          )}
          <Studies list={placing.free.length ? other : fitting} busy={busy} onPick={async (s) => (await call('/api/iowa/admin/members', 'POST', { studyId: s.id, contactId: placing.contact_id })) && setPlacing(null)} />
          <div className="flex justify-end gap-2 mt-6">
            <ContactButtons phone={placing.phone} email={placing.email} />
          </div>
        </Modal>
      )}
      {profile && (
        <Modal title={profile.name} onClose={() => setProfile(null)}>
          <StudentPanel contactId={profile.contact_id} fallbackName={profile.name} />
        </Modal>
      )}
    </section>
  );
}

function Studies({ list, busy, onPick }: { list: OpenStudy[]; busy: boolean; onPick: (s: OpenStudy) => void }) {
  if (!list.length) return <p className="text-sm italic text-[#7d766b]">None.</p>;
  return (
    <ul className="rounded-xl overflow-hidden bg-white border border-gray-200">
      {list.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-200 first:border-t-0">
          <span className="min-w-0">
            <span className="block font-semibold" style={{ color: 'var(--navy)' }}>
              {s.label} · {GROUP_LABEL[s.group_type]}
            </span>
            <span className="block text-sm text-[#7d766b] truncate">
              {s.where || 'No place yet'} · {s.spotsLeft} open
            </span>
          </span>
          <button disabled={busy} onClick={() => onPick(s)} className="shrink-0 px-4 min-h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#2f6f5e' }}>
            Put in
          </button>
        </li>
      ))}
    </ul>
  );
}

// One text per student, each with their own link to tap free times (the semester
// check-in page, for this semester). Your phone sends it; nothing goes out from here.
// "Texted" is remembered on this phone for a week so you can work down the list.
const SENT_KEY = 'iowa-asked-times';
function readSent(): Record<string, number> {
  try {
    const all = JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}') as Record<string, number>;
    const weekAgo = Date.now() - 7 * 86400000;
    return Object.fromEntries(Object.entries(all).filter(([, t]) => t > weekAgo));
  } catch {
    return {};
  }
}

function rememberSent(id: string): Record<string, number> {
  const next = { ...readSent(), [id]: Date.now() };
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode: still mark it for this visit */
  }
  return next;
}

function AskForTimes({ students, onClose }: { students: WaitingStudent[]; onClose: () => void }) {
  const [links, setLinks] = useState<Record<string, string> | null>(null);
  const [from, setFrom] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState<Record<string, number>>(readSent); // opens on a tap, so this runs in the browser

  useEffect(() => {
    let live = true;
    fetch('/api/iowa/admin/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: true, contactIds: students.map((p) => p.contact_id) }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        if (!r.ok) return setError(j.error ?? 'Couldn’t make the links.');
        setFrom(j.from ?? '');
        setLinks(Object.fromEntries((j.links as { contactId: string; url: string }[]).map((l) => [l.contactId, l.url])));
      })
      .catch(() => live && setError('Couldn’t make the links.'));
    return () => {
      live = false;
    };
  }, [students]);

  const message = (p: WaitingStudent) =>
    `Hey ${p.name.split(' ')[0]}, it’s ${from || 'us'} from ARK Iowa! We want to get you into a Bible study. Tap here and pick the times you’re free, and we’ll find you a group: ${links?.[p.contact_id] ?? ''}`;
  const markSent = (id: string) => setSent(rememberSent(id));
  const left = students.filter((p) => !sent[p.contact_id]).length;

  return (
    <Modal title="Text them for times" sub={`${left} of ${students.length} still to text`} onClose={onClose}>
      <ErrorBox error={error} />
      <p className="text-sm text-[#7d766b] mb-3">
        Each Text opens Messages with their own link filled in. Their answers show up here as free times, and Place puts
        studies at those times first.
      </p>
      {!links && !error && <p className="text-sm text-[#7d766b]">Making links…</p>}
      {links && (
        <ul className="rounded-xl overflow-hidden bg-white border border-gray-200">
          {students.map((p) => {
            const done = !!sent[p.contact_id];
            return (
              <li key={p.contact_id} className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 first:border-t-0">
                <span className="min-w-0">
                  <span className="block font-semibold" style={{ color: done ? '#9a938a' : 'var(--navy)' }}>{p.name}</span>
                  <span className="block text-sm text-[#7d766b]">{done ? 'Texted' : p.phone ?? 'No phone'}</span>
                </span>
                {p.phone && (
                  <a
                    href={`sms:${p.phone.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(message(p))}`}
                    onClick={() => markSent(p.contact_id)}
                    className="shrink-0 px-4 min-h-11 inline-flex items-center rounded-lg text-sm font-semibold"
                    style={done ? { border: '1px solid rgba(20,51,72,0.4)', color: '#143348' } : { background: '#143348', color: '#fff' }}
                  >
                    {done ? 'Again' : 'Text'}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
