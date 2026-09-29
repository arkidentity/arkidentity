'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BusyBlock } from '@/lib/availabilityFormat';
import ScheduleEditor from '@/components/iowa/ScheduleEditor';

// What a leader sees on their private link: block out what you've got, leave
// the rest open. Phrased as "when are you busy" rather than "when are you
// free", because people can list their classes from memory but can't list
// every free hour.

export default function ScheduleForm({
  token,
  name,
  semester,
  initial,
  submittedAt,
}: {
  token: string;
  name: string;
  semester: string;
  initial: BusyBlock[];
  submittedAt: string | null;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initial.length);
  const [done, setDone] = useState(!!submittedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/iowa/schedule/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    });
    setBusy(false);
    if (!res.ok) return setError('Something went wrong. Try again.');
    setDone(true);
    router.refresh();
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 px-1" style={{ color: 'var(--navy)' }}>
          {name.split(' ')[0]}, when are you tied up?
        </h1>
        <p className="text-[#4a4540] mb-5 px-1">
          Block out class, work, practice, anything standing for <strong>{semester}</strong>. We&apos;ll use it to
          avoid handing you a Bible study you can&apos;t make — so everything you don&apos;t list, we&apos;ll treat
          as open. Something ends early or starts late? Set dates on it, or remove it later from this same link.
        </p>

        <ScheduleEditor
          token={token}
          initial={initial}
          onChange={(b) => { setCount(b.length); if (b.length !== count) setDone(false); }}
        />

        <div className="mt-6 px-1">
          {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
          {done ? (
            <p className="text-sm font-semibold text-green-700">
              Sent — thanks. You can keep changing it on this link whenever something moves.
            </p>
          ) : (
            <button
              disabled={busy || count === 0}
              onClick={finish}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              That&apos;s my semester
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
