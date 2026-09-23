'use client';

import { useState } from 'react';
import { chicagoToday, formatDate, type Semester } from '@/lib/campusFormat';
import { ErrorBox, Section, btnPrimary, btnSmall, input, useCall } from '@/components/iowa/campus/ui';

// Semesters drive everything about turnover: which studies meet when, when a
// group can plan the next one, and when next semester's signup goes public.
export default function SemesterSettings({ semesters, embedded = false }: { semesters: Semester[]; embedded?: boolean }) {
  const { call, busy, error } = useCall();
  const today = chicagoToday();
  const [adding, setAdding] = useState(false);
  return (
    <Section title={embedded ? '' : "Semesters"}>
      <p className="text-sm text-[#8a8378] mb-3">
        Classes start → last day of finals. “Signup opens” is when groups get their plan-next-semester link and
        students can sign up for that semester (spring: the Monday after Thanksgiving, once registration’s done).
      </p>
      <ErrorBox error={error} />
      <ul className="space-y-2 mb-3">
        {semesters
          .filter((s) => s.ends_on >= today)
          .map((s) => (
            <SemesterRow key={s.name} s={s} busy={busy} call={call} />
          ))}
      </ul>
      {adding ? (
        <SemesterFields
          initial={{ name: '', starts_on: '', ends_on: '', signup_opens: '', note: '' }}
          withName
          busy={busy}
          onSave={async (f) => { if (await call('/api/iowa/admin/semesters', 'POST', f)) setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button onClick={() => setAdding(true)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
          + Add a semester
        </button>
      )}
    </Section>
  );
}

type CallFn = (url: string, method: string, body?: unknown) => Promise<boolean>;

function SemesterRow({ s, busy, call }: { s: Semester; busy: boolean; call: CallFn }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li>
        <SemesterFields
          initial={{ ...s, note: s.note ?? '' }}
          busy={busy}
          onSave={async (f) => { if (await call('/api/iowa/admin/semesters', 'PATCH', { ...f, name: s.name })) setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
      <span>
        <span className="font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</span>
        <span className="text-[#8a8378]"> · {formatDate(s.starts_on)} – {formatDate(s.ends_on)} · signup opens {formatDate(s.signup_opens)}</span>
        {s.note && <span className="block text-xs text-[#8a8378]">{s.note}</span>}
      </span>
      <button onClick={() => setEditing(true)} className={btnSmall}>Edit</button>
    </li>
  );
}

function SemesterFields({
  initial,
  withName,
  busy,
  onSave,
  onCancel,
}: {
  initial: { name: string; starts_on: string; ends_on: string; signup_opens: string; note: string };
  withName?: boolean;
  busy: boolean;
  onSave: (f: typeof initial) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const lbl = 'block text-xs font-semibold mb-1 uppercase tracking-wide text-[#8a8378]';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 grid sm:grid-cols-4 gap-2">
      {withName && (
        <label className="sm:col-span-4">
          <span className={lbl}>Name</span>
          <input className={input} value={f.name} placeholder="Spring 2028" onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
      )}
      <label><span className={lbl}>Classes start</span><input type="date" className={input} value={f.starts_on} onChange={(e) => setF({ ...f, starts_on: e.target.value })} /></label>
      <label><span className={lbl}>Finals end</span><input type="date" className={input} value={f.ends_on} onChange={(e) => setF({ ...f, ends_on: e.target.value })} /></label>
      <label><span className={lbl}>Signup opens</span><input type="date" className={input} value={f.signup_opens} onChange={(e) => setF({ ...f, signup_opens: e.target.value })} /></label>
      <label><span className={lbl}>Note</span><input className={input} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      <div className="sm:col-span-4 flex gap-2">
        <button disabled={busy} onClick={() => onSave(f)} className={btnPrimary} style={{ backgroundColor: 'var(--navy)' }}>Save</button>
        <button onClick={onCancel} className="px-3 py-2 text-sm text-[#8a8378]">Cancel</button>
      </div>
    </div>
  );
}
