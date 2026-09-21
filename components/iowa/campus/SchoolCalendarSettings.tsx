'use client';

import { useState } from 'react';
import { formatDate, chicagoToday, type SchoolPeriod } from '@/lib/campusFormat';
import { Field, Section, btnPrimary, btnSmall, input, useCall, ErrorBox } from '@/components/iowa/campus/ui';

const KINDS: { key: SchoolPeriod['kind']; label: string }[] = [
  { key: 'break', label: 'Break' },
  { key: 'finals', label: 'Finals' },
  { key: 'between_semesters', label: 'Between semesters' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'other', label: 'Other' },
];

// The University of Iowa calendar the admin works around. "Pauses in-person
// studies" = no reminders, confirms or first-study checks those dates, and the
// weeks come off Google. Online studies ignore it. Every period drives the
// scheduling heads-up on the Calendar.
export default function SchoolCalendarSettings({ periods }: { periods: SchoolPeriod[] }) {
  const { call, busy, error } = useCall();
  const [showPast, setShowPast] = useState(false);
  const today = chicagoToday();
  const shown = periods.filter((p) => showPast || p.ends_on >= today);

  return (
    <Section
      title="School calendar"
      action={
        <button onClick={() => setShowPast((v) => !v)} className="text-sm text-[#8a8378] underline">
          {showPast ? 'Hide past' : 'Show past'}
        </button>
      }
    >
      <p className="text-sm text-[#8a8378] mb-3">
        University of Iowa breaks, finals and summer, from the{' '}
        <a href="https://catalog.registrar.uiowa.edu/calendar/" target="_blank" rel="noreferrer" className="underline">
          registrar’s calendar
        </a>
        . In-person studies pause on these dates; online studies keep going. Add next year’s dates when the registrar posts them.
      </p>
      <ErrorBox error={error} />
      <ul className="space-y-2 mb-4">
        {shown.map((p) => (
          <PeriodRow key={p.id} p={p} busy={busy} call={call} />
        ))}
      </ul>
      <NewPeriod busy={busy} call={call} />
    </Section>
  );
}

type CallFn = (url: string, method: string, body?: unknown) => Promise<boolean>;

function PeriodRow({ p, busy, call }: { p: SchoolPeriod; busy: boolean; call: CallFn }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(p);
  const url = `/api/iowa/admin/school-periods/${p.id}`;
  const range = p.starts_on === p.ends_on ? formatDate(p.starts_on) : `${formatDate(p.starts_on)} – ${formatDate(p.ends_on)}`;

  if (!editing) {
    return (
      <li className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="font-semibold" style={{ color: 'var(--navy)' }}>{p.name}</span>
          <span className="text-[#8a8378]"> · {range}</span>
          {p.pauses_in_person ? (
            <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">pauses studies</span>
          ) : (
            <span className="ml-2 text-xs text-[#8a8378]">heads-up only</span>
          )}
          {p.note && <span className="block text-xs text-[#8a8378]">{p.note}</span>}
        </span>
        <button onClick={() => setEditing(true)} className={btnSmall}>Edit</button>
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3">
      <PeriodFields f={f} set={(patch) => setF({ ...f, ...patch })} />
      <div className="flex gap-2 mt-2">
        <button
          disabled={busy}
          onClick={async () => { if (await call(url, 'PATCH', f)) setEditing(false); }}
          className={btnPrimary}
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Save
        </button>
        <button onClick={() => { setF(p); setEditing(false); }} className="px-3 py-2 text-sm text-[#8a8378]">Cancel</button>
        <button
          disabled={busy}
          onClick={() => { if (confirm(`Delete ${p.name}?`)) call(url, 'DELETE'); }}
          className="ml-auto px-3 py-2 text-sm font-semibold"
          style={{ color: '#b91c1c' }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function NewPeriod({ busy, call }: { busy: boolean; call: CallFn }) {
  const blank = { name: '', kind: 'break' as SchoolPeriod['kind'], starts_on: '', ends_on: '', pauses_in_person: true, note: '' as string | null };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
        + Add a break or date
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <PeriodFields f={f} set={(patch) => setF({ ...f, ...patch })} />
      <div className="flex gap-2 mt-2">
        <button
          disabled={busy}
          onClick={async () => {
            if (await call('/api/iowa/admin/school-periods', 'POST', { ...f, ends_on: f.ends_on || f.starts_on })) {
              setF(blank);
              setOpen(false);
            }
          }}
          className={btnPrimary}
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add
        </button>
        <button onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-[#8a8378]">Cancel</button>
      </div>
    </div>
  );
}

function PeriodFields({
  f,
  set,
}: {
  f: { name: string; kind: SchoolPeriod['kind']; starts_on: string; ends_on: string; pauses_in_person: boolean; note: string | null };
  set: (patch: Partial<typeof f>) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <Field label="Name">
        <input className={input} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Spring break" />
      </Field>
      <Field label="Kind">
        <select className={input} value={f.kind} onChange={(e) => set({ kind: e.target.value as SchoolPeriod['kind'] })}>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
      </Field>
      <Field label="Starts">
        <input type="date" className={input} value={f.starts_on} onChange={(e) => set({ starts_on: e.target.value })} />
      </Field>
      <Field label="Ends">
        <input type="date" className={input} value={f.ends_on} onChange={(e) => set({ ends_on: e.target.value })} />
      </Field>
      <Field label="Studies" className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={f.pauses_in_person} onChange={(e) => set({ pauses_in_person: e.target.checked })} />
          Pause in-person Bible studies (online ones keep going)
        </label>
      </Field>
      <Field label="Note" className="sm:col-span-2">
        <input className={input} value={f.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
      </Field>
    </div>
  );
}
