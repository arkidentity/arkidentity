'use client';

import { useEffect, useRef, useState } from 'react';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import type { BusyBlock } from '@/lib/availabilityFormat';

// A week you paint busy time onto, like a calendar. Drag (mouse) or tap a
// start then an end (phone) to block out a stretch, say what it is, and pick
// the other days it repeats on. Tap a block to change or remove it. Used on a
// leader's private link and, with the same token, by staff filling one in for
// someone.

const START_HOUR = 6;
const END_HOUR = 24;
const SLOT_MIN = 30;
const ROW_H = 20;
const SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN;
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first — that's how a week reads for class schedules
const PRESETS = ['Class', 'Work', 'Practice', 'Church', 'Gym'];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00`;
const slotMin = (slot: number) => START_HOUR * 60 + slot * SLOT_MIN;
const input = 'px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white';

interface Draft {
  id?: string; // present = editing that block
  days: number[];
  start: number; // minutes from midnight
  end: number;
  allDay: boolean;
  label: string;
  ranged: boolean; // "only part of the semester"
  startsOn: string;
  endsOn: string;
}

const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

export default function ScheduleEditor({
  token,
  initial,
  onChange,
}: {
  token: string;
  initial: BusyBlock[];
  onChange?: (blocks: BusyBlock[]) => void;
}) {
  const [blocks, setBlocks] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<{ day: number; a: number; b: number } | null>(null);
  const [pending, setPending] = useState<{ day: number; slot: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const url = `/api/iowa/schedule/${token}`;

  useEffect(() => { onChange?.(blocks); }, [blocks]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (draft) cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [draft?.id, !!draft]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const slotAt = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(SLOTS - 1, Math.floor((e.clientY - rect.top) / ROW_H)));
  };

  const open = (day: number, aSlot: number, bSlot: number) => {
    const lo = Math.min(aSlot, bSlot);
    const hi = Math.max(aSlot, bSlot);
    setDraft({
      days: [day], start: slotMin(lo), end: slotMin(hi + 1), allDay: false,
      label: '', ranged: false, startsOn: '', endsOn: '',
    });
  };

  function edit(b: BusyBlock) {
    setPending(null);
    setDraft({
      id: b.id,
      days: [b.day_of_week],
      start: b.starts_at ? toMin(b.starts_at) : 9 * 60,
      end: b.ends_at ? toMin(b.ends_at) : 10 * 60,
      allDay: !b.starts_at,
      label: b.label ?? '',
      ranged: !!(b.starts_on || b.ends_on),
      startsOn: b.starts_on ?? '',
      endsOn: b.ends_on ?? '',
    });
  }

  async function save() {
    if (!draft) return;
    const times = draft.allDay ? { startsAt: null, endsAt: null } : { startsAt: toTime(draft.start), endsAt: toTime(draft.end) };
    const dates = { startsOn: draft.ranged ? draft.startsOn || null : null, endsOn: draft.ranged ? draft.endsOn || null : null };
    if (draft.id) {
      const json = await post({ update: { id: draft.id, dayOfWeek: draft.days[0], label: draft.label, ...times, ...dates } });
      if (json?.block) setBlocks((l) => l.map((b) => (b.id === draft.id ? (json.block as BusyBlock) : b)));
      else return;
    } else {
      const json = await post({ days: draft.days, label: draft.label, ...times, ...dates });
      if (json?.blocks) setBlocks((l) => [...l, ...(json.blocks as BusyBlock[])]);
      else return;
    }
    setDraft(null);
  }

  async function remove() {
    if (!draft?.id) return;
    if (await post({ remove: draft.id })) {
      setBlocks((l) => l.filter((b) => b.id !== draft.id));
      setDraft(null);
    }
  }

  const gridHeight = SLOTS * ROW_H;
  const timed = blocks.filter((b) => b.starts_at && b.ends_at);
  const allDay = blocks.filter((b) => !b.starts_at);

  return (
    <div>
      {/* The card that says what a block is. Above the grid so it's on screen
          when you finish dragging, however far down the day you were. */}
      {draft && (
        <div ref={cardRef} className="rounded-xl bg-white border-2 p-4 mb-3 space-y-3" style={{ borderColor: 'var(--navy)' }}>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setDraft({ ...draft, label: p })}
                className="px-3 py-1 rounded-full text-sm border"
                style={draft.label === p ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { borderColor: '#d1d5db', color: '#4a4540' }}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            className={`${input} w-full`}
            placeholder="What is it? e.g. Organic Chem"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />

          {!draft.allDay && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#8a8378]">
                From
                <input
                  type="time" step={900} className={`${input} w-full mt-0.5`}
                  value={toTime(draft.start).slice(0, 5)}
                  onChange={(e) => e.target.value && setDraft({ ...draft, start: toMin(e.target.value) })}
                />
              </label>
              <label className="text-xs text-[#8a8378]">
                To
                <input
                  type="time" step={900} className={`${input} w-full mt-0.5`}
                  value={toTime(draft.end).slice(0, 5)}
                  onChange={(e) => e.target.value && setDraft({ ...draft, end: toMin(e.target.value) })}
                />
              </label>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-[#4a4540]">
            <input type="checkbox" checked={draft.allDay} onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })} />
            All day
          </label>

          {/* Repeat: a Mon/Wed/Fri class is one block, not three. */}
          {!draft.id && (
            <div>
              <p className="text-xs text-[#8a8378] mb-1">Repeats on</p>
              <div className="flex flex-wrap gap-1.5">
                {ORDER.map((d) => {
                  const on = draft.days.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => setDraft({ ...draft, days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d] })}
                      className="w-11 py-1 rounded-md text-sm font-semibold border"
                      style={on ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { borderColor: '#d1d5db', color: '#4a4540' }}
                    >
                      {DAY_NAMES[d].slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm text-[#4a4540]">
              <input type="checkbox" checked={draft.ranged} onChange={(e) => setDraft({ ...draft, ranged: e.target.checked })} />
              Only part of the semester
            </label>
            {draft.ranged && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="text-xs text-[#8a8378]">
                  Starts (blank = from the beginning)
                  <input type="date" className={`${input} w-full mt-0.5`} value={draft.startsOn} onChange={(e) => setDraft({ ...draft, startsOn: e.target.value })} />
                </label>
                <label className="text-xs text-[#8a8378]">
                  Ends (blank = to the end)
                  <input type="date" className={`${input} w-full mt-0.5`} value={draft.endsOn} onChange={(e) => setDraft({ ...draft, endsOn: e.target.value })} />
                </label>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={busy || draft.days.length === 0 || (!draft.allDay && draft.end <= draft.start)}
              onClick={save}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              {draft.id ? 'Save changes' : draft.days.length > 1 ? `Add to ${draft.days.length} days` : 'Add'}
            </button>
            <button onClick={() => { setDraft(null); setError(''); }} className="px-3 py-2.5 text-sm text-[#8a8378]">
              Cancel
            </button>
            {draft.id && (
              <button disabled={busy} onClick={remove} className="ml-auto px-3 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {!draft && (
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs text-[#8a8378]">
            {pending
              ? 'Now tap where it ends.'
              : 'Drag on the week to block out time — or tap where it starts, then where it ends. Tap a block to change it.'}
          </p>
          <button
            onClick={() => setDraft({ days: [1], start: 9 * 60, end: 10 * 60, allDay: true, label: '', ranged: false, startsOn: '', endsOn: '' })}
            className="shrink-0 text-xs font-semibold underline"
            style={{ color: 'var(--navy)' }}
          >
            + All-day block
          </button>
        </div>
      )}
      {error && !draft && <p className="text-sm text-red-700 mb-2">{error}</p>}

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden select-none">
        {/* Day headers + all-day chips */}
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '2.25rem repeat(7, minmax(0, 1fr))' }}>
          <div />
          {ORDER.map((d) => (
            <div key={d} className="text-center py-1.5 border-l border-gray-100">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wide" style={{ color: '#8a8378' }}>{DAY_NAMES[d].slice(0, 3)}</p>
              {allDay.filter((b) => b.day_of_week === d).map((b) => (
                <button
                  key={b.id}
                  onClick={() => edit(b)}
                  className="block w-[calc(100%-4px)] mx-0.5 mt-0.5 truncate rounded px-1 text-[10px] font-semibold"
                  style={{ backgroundColor: '#dbe4ec', color: 'var(--navy)' }}
                  title={`${b.label || 'All day'} · all day`}
                >
                  {b.label || 'All day'}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: '2.25rem repeat(7, minmax(0, 1fr))' }}>
          {/* Hour labels */}
          <div className="relative" style={{ height: gridHeight }}>
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <span
                key={i}
                className="absolute right-1 text-[10px] text-[#8a8378] -translate-y-1/2"
                style={{ top: i * 2 * ROW_H, display: i === 0 ? 'none' : undefined }}
              >
                {formatTime(toTime((START_HOUR + i) * 60)).replace(':00', '').replace(' ', '').toLowerCase()}
              </span>
            ))}
          </div>

          {ORDER.map((d) => {
            const mine = timed.filter((b) => b.day_of_week === d);
            const sel = drag?.day === d ? { lo: Math.min(drag.a, drag.b), hi: Math.max(drag.a, drag.b) } : null;
            return (
              <div
                key={d}
                className="relative border-l border-gray-100 cursor-crosshair"
                style={{
                  height: gridHeight,
                  // Hour lines, with a fainter half-hour line between.
                  backgroundImage: `linear-gradient(#eee 1px, transparent 1px), linear-gradient(#f6f6f6 1px, transparent 1px)`,
                  backgroundSize: `100% ${ROW_H * 2}px, 100% ${ROW_H}px`,
                }}
                onPointerDown={(e) => {
                  if (e.pointerType !== 'mouse' || e.button !== 0) return;
                  const slot = slotAt(e);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDrag({ day: d, a: slot, b: slot });
                }}
                onPointerMove={(e) => {
                  if (drag?.day === d && e.pointerType === 'mouse') setDrag({ ...drag, b: slotAt(e) });
                }}
                onPointerUp={(e) => {
                  const slot = slotAt(e);
                  if (e.pointerType === 'mouse') {
                    if (!drag) return;
                    const { a } = drag;
                    setDrag(null);
                    // A plain click on the grid = an hour from there.
                    if (a === slot) open(d, slot, Math.min(SLOTS - 1, slot + 1));
                    else open(d, a, slot);
                    return;
                  }
                  // Touch: tap a start, then tap an end in the same day.
                  if (pending && pending.day === d && pending.slot !== slot) {
                    open(d, pending.slot, slot);
                    setPending(null);
                  } else {
                    setPending({ day: d, slot });
                  }
                }}
              >
                {sel && (
                  <div
                    className="absolute inset-x-0.5 rounded pointer-events-none"
                    style={{ top: sel.lo * ROW_H, height: (sel.hi - sel.lo + 1) * ROW_H, backgroundColor: 'rgba(20,51,72,0.18)', border: '1px dashed var(--navy)' }}
                  />
                )}
                {pending?.day === d && (
                  <div
                    className="absolute inset-x-0.5 rounded pointer-events-none"
                    style={{ top: pending.slot * ROW_H, height: ROW_H, backgroundColor: 'rgba(20,51,72,0.25)', border: '1px dashed var(--navy)' }}
                  />
                )}
                {mine.map((b) => {
                  const s = Math.max(START_HOUR * 60, toMin(b.starts_at!));
                  const e = Math.min(END_HOUR * 60, toMin(b.ends_at!));
                  if (e <= s) return null;
                  const range = b.starts_on || b.ends_on ? ` · ${b.starts_on ? shortDate(b.starts_on) : ''}–${b.ends_on ? shortDate(b.ends_on) : ''}` : '';
                  return (
                    <button
                      key={b.id}
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onPointerUp={(ev) => ev.stopPropagation()}
                      onClick={() => edit(b)}
                      className="absolute inset-x-0.5 overflow-hidden rounded px-1 text-left leading-tight"
                      style={{
                        top: ((s - START_HOUR * 60) / SLOT_MIN) * ROW_H,
                        height: ((e - s) / SLOT_MIN) * ROW_H - 1,
                        backgroundColor: '#dbe4ec',
                        borderLeft: '3px solid var(--navy)',
                        color: 'var(--navy)',
                      }}
                      title={`${b.label || 'Busy'} · ${formatTime(b.starts_at!)}–${formatTime(b.ends_at!)}${range}`}
                    >
                      <span className="block text-[10px] sm:text-[11px] font-semibold truncate">{b.label || 'Busy'}</span>
                      {(e - s) >= 60 && (
                        <span className="block text-[9px] sm:text-[10px] opacity-70 truncate">
                          {formatTime(b.starts_at!).replace(':00', '')}{range && ' ↔'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
