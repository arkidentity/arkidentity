'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import type { BusyBlock } from '@/lib/availability';

// What a leader sees on their private link: block out what you've got, leave
// the rest open. Phrased as "when are you busy" rather than "when are you
// free", because people can list their classes from memory but can't list
// every free hour.

const input = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white';

const timeLabel = (b: BusyBlock) =>
  b.starts_at && b.ends_at ? `${formatTime(b.starts_at)} – ${formatTime(b.ends_at)}` : 'All day';

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
  const [blocks, setBlocks] = useState(initial);
  const [f, setF] = useState({ dayOfWeek: '', startsAt: '', endsAt: '', label: '', allDay: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(!!submittedAt);
  const url = `/api/iowa/schedule/${token}`;

  async function post(body: unknown) {
    setBusy(true);
    setError('');
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Something went wrong.');
      return null;
    }
    return json;
  }

  async function add() {
    const json = await post({
      dayOfWeek: Number(f.dayOfWeek),
      startsAt: f.allDay ? null : f.startsAt,
      endsAt: f.allDay ? null : f.endsAt,
      label: f.label,
    });
    if (json?.block) {
      setBlocks((list) => [...list, json.block as BusyBlock]);
      // Day and label usually repeat down a column; times don't.
      setF({ ...f, startsAt: '', endsAt: '' });
      setDone(false);
    }
  }

  async function remove(id: string) {
    if (await post({ remove: id })) setBlocks((list) => list.filter((b) => b.id !== id));
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
          {name.split(' ')[0]}, when are you tied up?
        </h1>
        <p className="text-[#4a4540] mb-6">
          Block out class, work, practice, anything standing for <strong>{semester}</strong>. We&apos;ll use it to
          avoid handing you a Bible study you can&apos;t make — so everything you don&apos;t list, we&apos;ll treat
          as open.
        </p>

        {blocks.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100 mb-5">
            {DAY_NAMES.map((day, i) => {
              const mine = blocks.filter((b) => b.day_of_week === i).sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''));
              if (mine.length === 0) return null;
              return (
                <div key={day} className="px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#8a8378' }}>
                    {day}
                  </p>
                  <ul className="space-y-1">
                    {mine.map((b) => (
                      <li key={b.id} className="flex items-center gap-2 text-sm">
                        <span className="font-semibold" style={{ color: 'var(--navy)' }}>
                          {timeLabel(b)}
                        </span>
                        <span className="text-[#4a4540]">{b.label}</span>
                        <button
                          disabled={busy}
                          onClick={() => remove(b.id)}
                          className="ml-auto text-xs text-[#b0a99e]"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={f.dayOfWeek} onChange={(e) => setF({ ...f, dayOfWeek: e.target.value })}>
              <option value="">Day</option>
              {DAY_NAMES.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input
              className={input}
              placeholder="What is it? e.g. Class"
              value={f.label}
              onChange={(e) => setF({ ...f, label: e.target.value })}
            />
          </div>
          {!f.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <input type="time" className={input} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} />
              <input type="time" className={input} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-[#4a4540]">
            <input type="checkbox" checked={f.allDay} onChange={(e) => setF({ ...f, allDay: e.target.checked })} />
            All day
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            disabled={busy || !f.dayOfWeek || (!f.allDay && (!f.startsAt || !f.endsAt))}
            onClick={add}
            className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
          >
            Add to my schedule
          </button>
        </div>

        <div className="mt-6">
          {done ? (
            <p className="text-sm font-semibold text-green-700">
              Sent — thanks. You can keep changing it on this link whenever something moves.
            </p>
          ) : (
            <button
              disabled={busy || blocks.length === 0}
              onClick={async () => {
                if (await post({ done: true })) {
                  setDone(true);
                  router.refresh();
                }
              }}
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
