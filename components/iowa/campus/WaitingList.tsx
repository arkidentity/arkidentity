'use client';

import { useState } from 'react';
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

function since(iso: string | null) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d < 1 ? 'today' : d === 1 ? '1 day' : `${d} days`;
}

export default function WaitingList({ students, studies }: { students: WaitingStudent[]; studies: OpenStudy[] }) {
  const [placing, setPlacing] = useState<WaitingStudent | null>(null);
  const [profile, setProfile] = useState<WaitingStudent | null>(null);
  const { call, busy, error } = useCall();
  if (!students.length) return null;

  const fitting = placing ? studies.filter((s) => groupFits(s.group_type, placing.gender)) : [];
  const atFree = fitting.filter((s) => placing!.free.includes(s.slot));
  const other = fitting.filter((s) => !placing!.free.includes(s.slot));

  return (
    <section className="mb-6 rounded-xl p-3 sm:p-4" style={{ background: '#fdf6e8', border: '1px solid #E8B562' }}>
      <h2 className="font-bold" style={{ color: 'var(--navy)' }}>Waiting for a study ({students.length})</h2>
      <ul>
        {students.map((p) => (
          <li key={p.contact_id} className="flex items-center justify-between gap-3 py-2.5 border-t border-[#ecdcb8] first:border-t-0">
            <button className="min-w-0 text-left" onClick={() => setProfile(p)}>
              <span className="block font-semibold" style={{ color: 'var(--navy)' }}>{p.name}</span>
              <span className="block text-sm text-[#7d766b]">
                {[p.year, p.free.length ? `free ${p.free.map(slotLabel).join(', ')}` : 'no times picked', p.added_at && `waiting ${since(p.added_at)}`]
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
