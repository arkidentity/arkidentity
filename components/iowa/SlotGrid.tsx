'use client';

import { BLOCKS, PICKER_DAYS } from '@/lib/bibleStudyFormat';

// The "When are you free?" grid: days × morning / afternoon / evening / late.
// Cells are "<js day>-<block>" (see cleanFreeSlots). Used by the public studies
// page and the semester check-in.
export default function SlotGrid({ cells, onToggle }: { cells: Set<string>; onToggle: (day: number, block: string) => void }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
        <thead>
          <tr>
            <th className="w-20"></th>
            {BLOCKS.map((b) => (
              <th key={b.key} className="pb-1 text-center">
                <span className="block text-xs font-bold" style={{ color: 'var(--navy)' }}>
                  {b.label}
                </span>
                <span className="block text-[10px] text-[#8a8378]">{b.hint}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PICKER_DAYS.map((day) => (
            <tr key={day.value}>
              <th
                className="text-left text-xs font-bold pr-1"
                style={{ color: 'var(--navy)' }}
              >
                {day.label.slice(0, 3)}
              </th>
              {BLOCKS.map((b) => {
                const on = cells.has(`${day.value}-${b.key}`);
                return (
                  <td key={b.key}>
                    <button
                      type="button"
                      onClick={() => onToggle(day.value, b.key)}
                      aria-pressed={on}
                      aria-label={`${day.label} ${b.label}`}
                      className="w-full h-10 rounded-md text-xs font-semibold transition"
                      style={{
                        backgroundColor: on ? 'var(--gold)' : '#f1ede7',
                        color: on ? 'var(--navy)' : '#8a8378',
                        border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
                      }}
                    >
                      {on ? '✓' : ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
