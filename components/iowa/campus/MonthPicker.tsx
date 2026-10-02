'use client';

import { useState } from 'react';
import { addDays, formatDate } from '@/lib/campusFormat';
import { formatTime } from '@/lib/bibleStudyFormat';

// The calendar's "look ahead" popup: a month grid with a dot on every day that
// has a one-off event, plus the next events in a list. Tap a day or an event and
// the week grid opens starting that day. Weekly repeats aren't dotted — they'd
// mark every week and bury the special ones.

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  openTasks: number;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const LIST_MAX = 8;

const monthOf = (d: string) => d.slice(0, 7); // YYYY-MM
function shiftMonth(ym: string, by: number): string {
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + by, 1));
  return dt.toISOString().slice(0, 7);
}
// Every cell of a month grid (Sunday-first), null for the padding.
function monthCells(ym: string): (string | null)[] {
  const first = `${ym}-01`;
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = first; monthOf(d) === ym; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function MonthPicker({
  today,
  weekStart,
  upcoming,
  onPick,
  onClose,
}: {
  today: string;
  weekStart: string;
  upcoming: UpcomingEvent[];
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(monthOf(weekStart < today ? today : weekStart));
  const byDay = new Map<string, UpcomingEvent[]>();
  for (const e of upcoming) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T00:00:00Z`)
  );
  const inMonth = upcoming.filter((e) => monthOf(e.date) === month);
  const list = (inMonth.length ? inMonth : upcoming.filter((e) => e.date >= `${month}-01`)).slice(0, LIST_MAX);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/30 p-4 pt-16 sm:pt-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pick a day">
        <div className="flex items-center justify-between mb-3" style={{ color: 'var(--navy)' }}>
          <button onClick={() => setMonth(shiftMonth(month, -1))} className="px-2 py-1 rounded border border-gray-300 font-semibold" aria-label="Previous month">
            ←
          </button>
          <p className="font-bold">{label}</p>
          <button onClick={() => setMonth(shiftMonth(month, 1))} className="px-2 py-1 rounded border border-gray-300 font-semibold" aria-label="Next month">
            →
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#8a8378] mb-1">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthCells(month).map((d, i) => {
            if (!d) return <span key={i} />;
            const evs = byDay.get(d) ?? [];
            const isToday = d === today;
            return (
              <button
                key={d}
                onClick={() => onPick(d)}
                title={evs.map((e) => e.title).join(', ') || undefined}
                className={`relative aspect-square rounded-md text-sm flex flex-col items-center justify-center hover:bg-gray-100 ${
                  d < today ? 'text-[#b0a99e]' : 'text-[#4a4540]'
                } ${isToday ? 'font-bold ring-1 ring-[var(--navy)]' : ''}`}
              >
                {Number(d.slice(8))}
                {evs.length > 0 && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--gold, #c9a227)' }} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-2">Coming up</p>
          {list.length === 0 ? (
            <p className="text-sm text-[#8a8378]">No one-off events on the calendar yet.</p>
          ) : (
            <ul className="space-y-1">
              {list.map((e) => (
                <li key={`${e.id}:${e.date}`}>
                  <button onClick={() => onPick(e.date)} className="w-full text-left rounded-md px-2 py-1.5 hover:bg-gray-50 flex items-baseline gap-2">
                    <span className="text-xs text-[#8a8378] w-20 shrink-0">{formatDate(e.date)}</span>
                    <span className="text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--navy)' }}>
                      {e.title}
                      {e.start_time && <span className="font-normal text-[#8a8378]"> · {formatTime(e.start_time)}</span>}
                    </span>
                    {e.openTasks > 0 && (
                      <span className="text-xs text-[#9d855a] shrink-0">
                        {e.openTasks} task{e.openTasks === 1 ? '' : 's'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <button onClick={() => onPick(today)} className="font-semibold" style={{ color: 'var(--navy)' }}>
            Today
          </button>
          <button onClick={onClose} className="text-[#8a8378]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
