'use client';

import { useState } from 'react';
import type { BusyBlock, ScheduleLink } from '@/lib/availabilityFormat';
import { Section, useCall, type StaffOption } from '@/components/iowa/campus/ui';
import ScheduleEditor from '@/components/iowa/ScheduleEditor';

// Who's told us their semester, and who still owes it. The link is theirs to
// fill in, or staff can paint it in for them from here.

export default function Schedules({
  staff,
  semester,
  links,
  blocks,
}: {
  staff: StaffOption[];
  semester: string;
  links: ScheduleLink[];
  blocks: BusyBlock[];
}) {
  const { error } = useCall();
  const [copied, setCopied] = useState('');
  // Open calendar: the same week the person sees on their link, live — so staff
  // can check it works, see what they've put in, and fill it in for them.
  const [editing, setEditing] = useState<{ staffId: string; token: string } | null>(null);
  const people = staff.filter((p) => p.active);

  async function copyLink(staffId: string) {
    const res = await fetch('/api/iowa/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, semester }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return;
    await navigator.clipboard?.writeText(json.url).catch(() => {});
    setCopied(staffId);
    setTimeout(() => setCopied(''), 2000);
  }

  async function edit(staffId: string) {
    if (editing?.staffId === staffId) return setEditing(null);
    const res = await fetch('/api/iowa/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, semester }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setEditing({ staffId, token: String(json.url).split('/').pop() ?? '' });
  }

  return (
    <Section title={`Schedules · ${semester}`}>
      <p className="text-sm text-[#8a8378] mb-3">
        Send each person their own link and they block out class, work and practice on a week view — or use Open
        calendar to see what they&apos;ve entered or fill it in for them. Used to flag a clash before you hand someone a study. It resets every semester on purpose — a schedule nobody re-confirmed isn&apos;t worth
        trusting.
      </p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {people.map((p) => {
          const theirs = links.find((l) => l.staff_id === p.id);
          const mine = blocks.filter((b) => b.staff_id === p.id);
          return (
            <li key={p.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold" style={{ color: 'var(--navy)' }}>
                  {p.name}
                </span>
                {mine.length > 0 ? (
                  <span className="text-xs font-semibold text-green-700">
                    {mine.length} block{mine.length === 1 ? '' : 's'}
                    {theirs?.submitted_at ? ' · confirmed' : ''}
                  </span>
                ) : (
                  <span className="text-xs text-[#8a8378]">nothing yet</span>
                )}
                <span className="ml-auto flex gap-3">
                  <button onClick={() => edit(p.id)} className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>
                    {editing?.staffId === p.id ? 'Close calendar' : 'Open calendar'}
                  </button>
                  <button onClick={() => copyLink(p.id)} className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>
                    {copied === p.id ? 'Copied' : 'Copy link'}
                  </button>
                </span>
              </div>

              {editing?.staffId === p.id && (
                <div className="mt-3">
                  <ScheduleEditor token={editing.token} initial={mine} />
                </div>
              )}

            </li>
          );
        })}
      </ul>
    </Section>
  );
}
