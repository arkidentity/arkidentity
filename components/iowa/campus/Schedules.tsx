'use client';

import { useState } from 'react';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import type { BusyBlock, ScheduleLink } from '@/lib/availabilityFormat';
import { Section, useCall, type StaffOption } from '@/components/iowa/campus/ui';

// Who's told us their semester, and who still owes it. The link is theirs to
// fill in — nobody types someone else's class schedule.

const timeLabel = (b: BusyBlock) =>
  b.starts_at && b.ends_at ? `${formatTime(b.starts_at)}–${formatTime(b.ends_at)}` : 'all day';

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
  const { call, busy, error } = useCall();
  const [copied, setCopied] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const people = staff.filter((p) => p.active);

  async function link(staffId: string, send: boolean) {
    const res = await fetch('/api/iowa/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, semester, send }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (send) {
      await call('/api/iowa/admin/schedules', 'POST', { staffId, semester }); // refresh the row
      return;
    }
    await navigator.clipboard?.writeText(json.url).catch(() => {});
    setCopied(staffId);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <Section title={`Schedules · ${semester}`}>
      <p className="text-sm text-[#8a8378] mb-3">
        Send each person their own link and they block out class, work and practice. Used to flag a clash before you
        hand someone a study. It resets every semester on purpose — a schedule nobody re-confirmed isn&apos;t worth
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
                {theirs?.submitted_at ? (
                  <span className="text-xs font-semibold text-green-700">
                    ✓ {mine.length} block{mine.length === 1 ? '' : 's'}
                  </span>
                ) : theirs?.sent_at ? (
                  <span className="text-xs" style={{ color: '#9d855a' }}>
                    sent, no answer yet
                  </span>
                ) : (
                  <span className="text-xs text-[#8a8378]">not asked</span>
                )}
                <span className="ml-auto flex gap-3">
                  {mine.length > 0 && (
                    <button
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--navy)' }}
                    >
                      {open === p.id ? 'Hide' : 'View'}
                    </button>
                  )}
                  <button onClick={() => link(p.id, false)} className="text-xs font-semibold" style={{ color: 'var(--navy)' }}>
                    {copied === p.id ? 'Copied' : 'Copy link'}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => link(p.id, true)}
                    className="text-xs font-semibold disabled:opacity-50"
                    style={{ color: 'var(--navy)' }}
                  >
                    {theirs?.sent_at ? 'Send again' : 'Email it'}
                  </button>
                </span>
              </div>

              {open === p.id && (
                <div className="mt-2 pl-1 text-xs text-[#4a4540] space-y-0.5">
                  {DAY_NAMES.map((day, i) => {
                    const dayBlocks = mine
                      .filter((b) => b.day_of_week === i)
                      .sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''));
                    if (dayBlocks.length === 0) return null;
                    return (
                      <p key={day}>
                        <span className="font-semibold">{day.slice(0, 3)}</span>{' '}
                        {dayBlocks.map((b) => `${timeLabel(b)}${b.label ? ` ${b.label}` : ''}`).join(' · ')}
                      </p>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
