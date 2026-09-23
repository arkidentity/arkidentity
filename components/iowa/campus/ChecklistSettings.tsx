'use client';

import { useState } from 'react';
import type { ChecklistItem, ChecklistTemplate } from '@/lib/eventChecklists';
import { ErrorBox, Section, btnSmall, input, useCall, type CallFn } from '@/components/iowa/campus/ui';

// Reusable event checklists ("Mission trip", "Taco Night"). Each task is due N
// days before/after the event. Tie a checklist to an event type and every new
// event of that type gets it automatically.
export default function ChecklistSettings({
  templates,
  staff,
  eventTypes,
  embedded = false,
}: {
  templates: ChecklistTemplate[];
  staff: { id: string; name: string }[];
  eventTypes: { id: string; name: string }[];
  embedded?: boolean; // inside a Disclosure that already shows the heading
}) {
  const { call, busy, error } = useCall();
  const [name, setName] = useState('');
  return (
    <Section title={embedded ? '' : "Event checklists"}>
      <p className="text-sm text-[#8a8378] mb-3">
        Apply one to any event on the Calendar, and its tasks land in the task list, due on the right dates.
        If the event moves, the dates move too.
      </p>
      <ErrorBox error={error} />
      <div className="space-y-4 mb-4">
        {templates.map((t) => (
          <TemplateCard key={t.id} t={t} staff={staff} eventTypes={eventTypes} busy={busy} call={call} />
        ))}
      </div>
      <div className="flex gap-2">
        <input className={input} placeholder="New checklist, e.g. Retreat" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          disabled={busy || !name.trim()}
          onClick={async () => { if (await call('/api/iowa/admin/checklists', 'POST', { name })) setName(''); }}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50 shrink-0"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add checklist
        </button>
      </div>
    </Section>
  );
}

function TemplateCard({
  t,
  staff,
  eventTypes,
  busy,
  call,
}: {
  t: ChecklistTemplate;
  staff: { id: string; name: string }[];
  eventTypes: { id: string; name: string }[];
  busy: boolean;
  call: CallFn;
}) {
  const [name, setName] = useState(t.name);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input className={`${input} flex-1 min-w-[10rem] font-semibold`} value={name} onChange={(e) => setName(e.target.value)} />
        {name.trim() !== t.name && (
          <button disabled={busy} onClick={() => call('/api/iowa/admin/checklists', 'POST', { id: t.id, name })} className={btnSmall}>Save name</button>
        )}
        <select
          className="px-2 py-2 border border-gray-300 rounded-md text-sm bg-white"
          value={t.event_type_id ?? ''}
          onChange={(e) => call('/api/iowa/admin/checklists', 'POST', { id: t.id, event_type_id: e.target.value || null })}
          title="Apply automatically to new events of this type"
        >
          <option value="">Apply by hand</option>
          {eventTypes.map((et) => <option key={et.id} value={et.id}>Auto for “{et.name}” events</option>)}
        </select>
        <button
          disabled={busy}
          onClick={() => { if (confirm(`Delete the ${t.name} checklist? Tasks already made stay.`)) call(`/api/iowa/admin/checklists?id=${t.id}`, 'DELETE'); }}
          className="text-sm font-semibold px-2"
          style={{ color: '#b91c1c' }}
        >
          Delete
        </button>
      </div>
      <ul className="space-y-1.5 mb-2">
        {t.items.map((i) => <ItemRow key={i.id} i={i} staff={staff} busy={busy} call={call} />)}
      </ul>
      <ItemRow templateId={t.id} staff={staff} busy={busy} call={call} />
    </div>
  );
}

function ItemRow({
  i,
  templateId,
  staff,
  busy,
  call,
}: {
  i?: ChecklistItem;
  templateId?: string;
  staff: { id: string; name: string }[];
  busy: boolean;
  call: CallFn;
}) {
  const start = i?.offset_days ?? -7;
  const [f, setF] = useState({
    title: i?.title ?? '',
    days: String(Math.abs(start)),
    when: start === 0 ? 'dayof' : start < 0 ? 'before' : 'after',
    owner: i?.default_owner_id ?? '',
    priority: i?.priority ?? 'normal',
  });
  const offset = () => {
    const n = Math.abs(parseInt(f.days, 10) || 0);
    return f.when === 'dayof' ? 0 : f.when === 'before' ? -n : n;
  };
  const dirty =
    !i ||
    f.title !== i.title ||
    offset() !== i.offset_days ||
    (f.owner || null) !== i.default_owner_id ||
    f.priority !== i.priority;
  const cell = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white';

  return (
    <li className="flex flex-wrap items-center gap-2 list-none">
      <input className={`${cell} flex-1 min-w-[12rem]`} placeholder={i ? '' : 'Add a task'} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      {f.when !== 'dayof' && (
        <input type="number" min={0} className={`${cell} w-16`} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} />
      )}
      <select className={cell} value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })}>
        <option value="before">days before</option>
        <option value="after">days after</option>
        <option value="dayof">day of</option>
      </select>
      <select className={cell} value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} title="Default owner (otherwise: first person going)">
        <option value="">Whoever’s going</option>
        {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select className={cell} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as ChecklistItem['priority'] })}>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>
      {dirty && f.title.trim() && (
        <button
          disabled={busy}
          onClick={async () => {
            const ok = await call('/api/iowa/admin/checklists/items', 'POST', {
              ...(i ? { id: i.id } : { template_id: templateId }),
              title: f.title,
              offset_days: offset(),
              default_owner_id: f.owner || null,
              priority: f.priority,
            });
            if (ok && !i) setF({ ...f, title: '' });
          }}
          className={btnSmall}
        >
          {i ? 'Save' : 'Add'}
        </button>
      )}
      {i && (
        <button disabled={busy} onClick={() => call(`/api/iowa/admin/checklists/items?id=${i.id}`, 'DELETE')} className="text-xs px-1" style={{ color: '#b91c1c' }} title="Remove">
          ✕
        </button>
      )}
    </li>
  );
}
