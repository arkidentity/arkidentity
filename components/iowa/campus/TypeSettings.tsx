'use client';

import { useState } from 'react';
import { ErrorBox, PageShell, Section, btnPrimary, btnSmall, input, useCall, type TypeOption } from '@/components/iowa/campus/ui';
import type { SchoolPeriod } from '@/lib/campusFormat';
import SchoolCalendarSettings from '@/components/iowa/campus/SchoolCalendarSettings';

// Editable task + event type lists. Types are hidden rather than deleted so
// anything already using one keeps its label.
export default function TypeSettings({ types, periods }: { types: TypeOption[]; periods: SchoolPeriod[] }) {
  const { call, busy, error } = useCall();
  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
        Settings
      </h1>
      <p className="text-sm text-[#8a8378] mb-8">The school calendar, and the types you can pick for tasks and events.</p>
      <SchoolCalendarSettings periods={periods} />
      <ErrorBox error={error} />
      <div className="grid md:grid-cols-2 gap-8">
        {(['event', 'task'] as const).map((kind) => (
          <Section key={kind} title={kind === 'event' ? 'Event types' : 'Task types'}>
            <ul className="space-y-2 mb-3">
              {types
                .filter((t) => t.kind === kind)
                .map((t) => (
                  <TypeRow key={t.id} t={t} busy={busy} call={call} />
                ))}
            </ul>
            <NewType kind={kind} busy={busy} call={call} />
          </Section>
        ))}
      </div>
    </PageShell>
  );
}

function TypeRow({
  t,
  busy,
  call,
}: {
  t: TypeOption;
  busy: boolean;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const [name, setName] = useState(t.name);
  return (
    <li className="flex items-center gap-2">
      <input
        className={input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={t.active ? undefined : { color: '#b0a99e' }}
      />
      {name.trim() !== t.name && (
        <button disabled={busy || !name.trim()} onClick={() => call(`/api/iowa/admin/types/${t.id}`, 'PATCH', { name })} className={btnSmall}>
          Save
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => call(`/api/iowa/admin/types/${t.id}`, 'PATCH', { active: !t.active })}
        className={`${btnSmall} shrink-0`}
        style={{ color: t.active ? '#b91c1c' : '#15803d' }}
      >
        {t.active ? 'Hide' : 'Show'}
      </button>
    </li>
  );
}

function NewType({
  kind,
  busy,
  call,
}: {
  kind: 'task' | 'event';
  busy: boolean;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  return (
    <div className="flex gap-2">
      <input className={input} placeholder={`New ${kind} type`} value={name} onChange={(e) => setName(e.target.value)} />
      <button
        disabled={busy || !name.trim()}
        onClick={async () => {
          if (await call('/api/iowa/admin/types', 'POST', { kind, name })) setName('');
        }}
        className={btnPrimary}
        style={{ backgroundColor: 'var(--navy)' }}
      >
        Add
      </button>
    </div>
  );
}
