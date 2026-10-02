'use client';

import { slotLabel } from '@/lib/bibleStudyFormat';
import { StudentLink } from '@/components/iowa/campus/StudentLink';
import { ContactButtons } from '@/components/iowa/campus/ui';

// "Who's waiting": students not in a study yet, grouped by the times they told
// us they're free (migration 034). A slot with three names and no study is a
// study waiting to be started; a slot with an open study is a text to send.

export interface WaitingSlot {
  slot: string;
  open: { id: string; label: string; spotsLeft: number }[]; // live studies in that slot with room
  students: { contact_id: string; name: string; phone: string | null; email: string | null }[];
}

export default function WaitingBySlot({ slots, unplacedNoTimes, semester }: { slots: WaitingSlot[]; unplacedNoTimes: number; semester: string }) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>
        Who’s waiting
      </h2>
      <p className="text-sm text-[#8a8378] mb-4">
        Students not in a study yet, by the times they said they’re free for {semester} on the signup page.
        {unplacedNoTimes > 0 && ` ${unplacedNoTimes} more aren’t placed but haven’t picked {semester} times.`}
      </p>
      {slots.length === 0 ? (
        <p className="text-sm text-[#8a8378]">Nobody waiting with times picked.</p>
      ) : (
        <ul className="space-y-3">
          {slots.map((s) => (
            <li key={s.slot} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <p className="font-bold" style={{ color: 'var(--navy)' }}>
                  {slotLabel(s.slot)} · {s.students.length} waiting
                </p>
                <p className="text-sm" style={{ color: s.open.length ? '#15803d' : '#9d855a' }}>
                  {s.open.length
                    ? `Open: ${s.open.map((o) => `${o.label} (${o.spotsLeft} spot${o.spotsLeft === 1 ? '' : 's'})`).join(', ')}`
                    : s.students.length >= 3
                      ? 'No study here yet: enough to start one'
                      : 'No study here yet'}
                </p>
              </div>
              <ul className="space-y-1.5">
                {s.students.map((p) => (
                  <li key={p.contact_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <StudentLink contactId={p.contact_id} name={p.name} className="text-[#4a4540]" />
                    <ContactButtons phone={p.phone} email={p.email} size="xs" />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
