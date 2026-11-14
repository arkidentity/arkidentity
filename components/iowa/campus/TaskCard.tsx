'use client';

// One task card for every screen (Today, Tasks, a task popup), 11/14 Travis:
// "they should look and function the same regardless of the page." The card
// shows what matters at a glance and puts every action that applies right on
// it: Text, Assign (or Take it), Snooze (a week), Done. Tap the card for the full task.

import { useState } from 'react';
import type { CampusTask } from '@/lib/campusTasks';
import { addDays, chicagoToday, formatDate, taskGroupTitle } from '@/lib/campusFormat';
import { AssignSelect, useCall, useCan, type Option, type StaffOption } from '@/components/iowa/campus/ui';

export const INK = '#1a2b3c', MUTED = '#7d766b', LINE = '#e7e2d9', LATE = '#b42318', GOLD = '#E8B562', NAVY = '#143348';

export interface TaskCtx {
  staff: StaffOption[];
  meId: string | null;
  studies: Option[];
  events: Option[];
}

const DAY = 86400000;
export function dueLabel(today: string, d: string | null) {
  if (!d) return '';
  const n = Math.round((Date.parse(d) - Date.parse(today)) / DAY);
  if (n < -1) return `${-n} days late`;
  if (n === -1) return 'Yesterday';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return formatDate(d, { weekday: 'short' });
}

// Auto tasks carry "Name · phone", "met Keilor", a reason and sometimes a
// suggested text in their description. Pull out the short facts.
function details(t: CampusTask, person: boolean, meFirst: string) {
  const facts: string[] = [];
  let note: string | null = null;
  let suggested: string | null = null;
  const desc = t.description ?? '';
  const sIdx = desc.indexOf('Suggested text:\n');
  if (sIdx !== -1) suggested = desc.slice(sIdx + 'Suggested text:\n'.length).trim() || null;
  if (!t.auto_kind) return { facts, note, suggested };
  const lines = desc.slice(0, sIdx === -1 ? undefined : sIdx).split('\n').map((l) => l.trim()).filter(Boolean);
  for (const l of lines) {
    const met = l.match(/^(?:How they came: )?met (\S+)$/);
    if (met) { facts.unshift(met[1] === meFirst ? 'You met them' : `${met[1]} met them`); continue; }
    const other = l.match(/^(?:How they came: )?(a friend invited them|found it on their own)$/);
    if (other) { facts.unshift(other[1][0].toUpperCase() + other[1].slice(1)); continue; }
    if (person) continue;
    let m;
    if ((m = l.match(/^Dropped for being unresponsive(?: \((.*)\))? 30\+ days ago/))) { facts.push('No reply, dropped 30+ days ago'); note = m[1] ?? null; }
    else if ((m = l.match(/^Dropped in (.+?) because their schedule changed(?: \((.*)\))?\./))) { facts.push(`Schedule changed in ${m[1]}`); note = m[2] ?? null; }
    else if (/^Marked dormant/.test(l)) facts.push('Marked dormant');
    else if (/^Met 2\+ weeks ago/.test(l)) facts.push('Met 2+ weeks ago, no study yet');
    else if ((m = l.match(/^Missed (.+?)\./))) facts.push(`Missed ${m[1]}`);
    else if ((m = l.match(/^Study: (.+?)(?: · first one .*)?$/))) facts.push(m[1]);
  }
  return { facts, note, suggested };
}

const smsHref = (phone: string, body?: string | null) =>
  `sms:${phone.replace(/[^\d+]/g, '')}${body ? `?&body=${encodeURIComponent(body)}` : ''}`;

function Act({ children, onClick, kind = 'line', disabled }: { children: React.ReactNode; onClick: () => void; kind?: 'line' | 'solid' | 'quiet'; disabled?: boolean }) {
  const s = kind === 'solid' ? { background: INK, color: '#fff' } : kind === 'quiet' ? { color: MUTED } : { border: `1.5px solid ${NAVY}`, color: NAVY };
  return (
    <button disabled={disabled} className="shrink-0 px-2.5 min-h-9 rounded-lg text-sm font-semibold disabled:opacity-50" style={s} onClick={onClick}>
      {children}
    </button>
  );
}

export function TaskCard({
  t, ctx, person = false, inGroup, onOpen, onChanged,
}: {
  t: CampusTask;
  ctx: TaskCtx;
  /** Inside a group card: the group says what to do, the card is the student. */
  person?: boolean;
  /** The group's priority + earliest due date, so the card doesn't repeat them. */
  inGroup?: { priority: string; due?: string };
  onOpen: (id: string) => void;
  /** After a change saves (Today uses it to drop the card + toast). */
  onChanged?: (t: CampusTask, body: Record<string, unknown>) => void;
}) {
  const { staff, meId } = ctx;
  const assigns = useCan()('manageTasks');
  const { call, busy, error } = useCall();
  const [finishing, setFinishing] = useState(false);
  const [note, setNote] = useState('');
  const today = chicagoToday();
  const first = (id: string | null) => staff.find((s) => s.id === id)?.name.split(' ')[0] ?? '';
  const me = staff.find((s) => s.id === meId);
  const done = t.status === 'done';
  const late = !done && !!t.due_date && t.due_date < today;
  const mine = t.owner_id === meId || (!!meId && t.helper_ids.includes(meId));
  const d = details(t, person, me?.name.split(' ')[0] ?? '');

  const linked = t.study_id ? ctx.studies.find((s) => s.id === t.study_id)?.label : t.event_id ? ctx.events.find((e) => e.id === t.event_id)?.label : null;
  const helpers = t.helper_ids.filter((h) => h !== meId).map(first).filter(Boolean);
  const nameInTitle = !!t.contact_name && (person || t.title.includes(t.contact_name));
  const extra = [
    !nameInTitle && t.contact_name,
    linked && `for ${linked}`,
    t.owner_id ? t.owner_id !== meId && `${first(t.owner_id)}’s` : 'Nobody’s yet',
    helpers.length > 0 && `with ${helpers.join(', ')}`,
  ].filter(Boolean).join(' · ');
  const facts = extra ? [...d.facts, extra] : d.facts;

  const showPriority = (t.priority === 'urgent' || t.priority === 'high') && (!inGroup || t.priority !== inGroup.priority);
  const showDue = !inGroup || t.due_date !== inGroup.due;

  const url = `/api/iowa/admin/tasks/${t.id}`;
  async function save(body: Record<string, unknown>) {
    if (await call(url, 'PATCH', body)) {
      setFinishing(false);
      setNote('');
      onChanged?.(t, body);
    }
  }

  return (
    <li className="rounded-xl bg-white" style={{ border: `1px solid ${late && !inGroup ? '#f3c4bf' : LINE}` }}>
      <button className="w-full text-left px-4 pt-3 pb-2 flex items-start gap-3" onClick={() => onOpen(t.id)}>
        <span className="flex-1 min-w-0">
          <span className={`block font-semibold leading-snug ${done ? 'line-through' : ''}`} style={{ color: done ? MUTED : INK }}>
            {showPriority && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                style={{ background: t.priority === 'urgent' ? LATE : GOLD }}
                aria-label={t.priority === 'urgent' ? 'Urgent' : 'High priority'}
              />
            )}
            {person ? t.contact_name ?? t.title : t.title}
          </span>
          {facts.length === 1 && <span className="block text-sm mt-0.5" style={{ color: MUTED }}>{facts[0]}</span>}
          {facts.length > 1 && (
            <span className="block text-sm mt-1 space-y-0.5" style={{ color: MUTED }}>
              {facts.map((f) => (
                <span key={f} className="flex gap-2"><span aria-hidden>•</span><span>{f}</span></span>
              ))}
            </span>
          )}
        </span>
        {showDue && (
          <span className="shrink-0 text-sm font-semibold text-right" style={{ color: late ? LATE : MUTED }}>
            {done ? 'Done' : dueLabel(today, t.due_date)}
          </span>
        )}
      </button>

      {error && <p className="px-4 pb-2 text-sm" style={{ color: LATE }}>{error}</p>}

      {finishing ? (
        <div className="px-4 pb-3">
          <label className="block text-sm font-semibold mb-1" htmlFor={`note-${t.id}`}>
            What happened? <span className="font-normal" style={{ color: MUTED }}>(optional{t.contact_id ? ', goes on their history' : ''})</span>
          </label>
          <textarea
            id={`note-${t.id}`}
            rows={2}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-base"
            style={{ border: '1px solid #d6cfc2' }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Act kind="quiet" onClick={() => { setFinishing(false); setNote(''); }}>Cancel</Act>
            <Act kind="solid" disabled={busy} onClick={() => save(note.trim() ? { status: 'done', comment: note.trim() } : { status: 'done' })}>
              {note.trim() ? 'Done + save note' : 'Mark done'}
            </Act>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 flex items-center justify-end gap-2 flex-wrap">
          {done ? (
            <Act disabled={busy} onClick={() => save({ status: 'open' })}>Reopen</Act>
          ) : (
            <>
              {t.contact_phone && (
                <a href={smsHref(t.contact_phone, d.suggested)} className="shrink-0 inline-flex items-center px-2.5 min-h-9 rounded-lg text-sm font-semibold" style={{ border: `1.5px solid ${NAVY}`, color: NAVY }}>
                  Text
                </a>
              )}
              {assigns ? (
                <AssignSelect staff={staff} ownerId={t.owner_id} meId={meId} disabled={busy} onPick={(id) => save({ owner_id: id })} className="!min-h-9 !px-2.5" />
              ) : (
                !mine && meId && <Act disabled={busy} onClick={() => save({ owner_id: meId })}>Take it</Act>
              )}
              {(mine || assigns) && (
                <Act disabled={busy} onClick={() => save({ due_date: addDays(t.due_date && t.due_date > today ? t.due_date : today, 7) })}>Snooze</Act>
              )}
              <Act kind="solid" onClick={() => setFinishing(true)}>Done</Act>
            </>
          )}
        </div>
      )}
    </li>
  );
}

// Same-kind tasks folded into one card ("Help 3 students find a Bible study").
// The header carries priority + due once; open it to act on each student.
export function TaskGroupCard({
  title, sub, tasks, ctx, startOpen = false, followUp = false, onOpen, onChanged,
}: {
  title?: string;
  sub?: string | null;
  tasks: CampusTask[];
  ctx: TaskCtx;
  groupKey?: string;
  startOpen?: boolean;
  followUp?: boolean;
  onOpen: (id: string) => void;
  onChanged?: (t: CampusTask, body: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const today = chicagoToday();
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as Record<string, number>;
  const top = [...tasks].sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9))[0];
  const due = tasks.map((t) => t.due_date).filter(Boolean).sort()[0] as string | undefined;
  const late = !!due && due < today;
  const names = tasks.map((t) => (t.contact_name ?? '').split(' ')[0]).filter(Boolean);
  const subLine = sub ?? `${names.slice(0, 4).join(', ')}${names.length > 4 ? ` +${names.length - 4}` : ''}`;

  return (
    <li className="rounded-xl bg-white" style={{ border: `1px solid ${late ? '#f3c4bf' : LINE}` }}>
      <button className="w-full text-left px-4 py-3 flex items-start gap-3" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-snug" style={{ color: INK }}>
            {(top.priority === 'urgent' || top.priority === 'high') && (
              <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: top.priority === 'urgent' ? LATE : GOLD }} aria-label={top.priority === 'urgent' ? 'Urgent' : 'High priority'} />
            )}
            {title ?? taskGroupTitle('', tasks.length)}
          </span>
          {subLine && <span className="block text-sm mt-0.5" style={{ color: MUTED }}>{subLine}</span>}
        </span>
        <span className="shrink-0 text-sm font-semibold text-right" style={{ color: late ? LATE : MUTED }}>{dueLabel(today, due ?? null)}</span>
        <span className="shrink-0 text-lg leading-none" style={{ color: MUTED, transform: open ? 'rotate(90deg)' : undefined }} aria-hidden>›</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {followUp && (
            <div className="mb-3 px-1">
              <a href="/iowa/admin/students?report=1" className="inline-block px-3 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: NAVY, color: 'white' }}>
                Open check-in report →
              </a>
              <p className="text-xs mt-2" style={{ color: MUTED }}>Logging a check-in on the report marks that student&apos;s task done.</p>
            </div>
          )}
          <ul className="space-y-2">
            {tasks.map((t) => (
              <TaskCard key={t.id} t={t} ctx={ctx} person={!!t.contact_id} inGroup={{ priority: top.priority, due }} onOpen={onOpen} onChanged={onChanged} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
