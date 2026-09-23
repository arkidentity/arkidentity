'use client';

import { useState } from 'react';
import { Disclosure, ErrorBox, PageShell, Section, btnPrimary, btnSmall, input, useCall, type TypeOption } from '@/components/iowa/campus/ui';
import PushToggle from '@/components/iowa/campus/PushToggle';
import CalendarBusy from '@/components/iowa/campus/CalendarBusy';
import type { SchoolPeriod, Semester } from '@/lib/campusFormat';
import SemesterSettings from '@/components/iowa/campus/SemesterSettings';
import ChecklistSettings from '@/components/iowa/campus/ChecklistSettings';
import type { ChecklistTemplate } from '@/lib/eventChecklists';
import SchoolCalendarSettings from '@/components/iowa/campus/SchoolCalendarSettings';

// The settings screen. Ordered by how often you touch it: this device first
// (notifications, install), then the lists the rest of the admin picks from —
// named and closed, because you set them once a semester at most. Types are
// hidden rather than deleted so anything already using one keeps its label.
// The admin has its own manifest (/iowa/admin.webmanifest), so adding it to a
// home screen installs THIS, not the public ARK app. Static instructions —
// iOS gives no install prompt to trigger.
function InstallCard() {
  return (
    <Section title="Put this on your home screen">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-[#4a4540] space-y-2">
        <p>It opens straight to the dashboard, full screen, with its own icon — separate from the ARK Identity app.</p>
        <p>
          <strong style={{ color: 'var(--navy)' }}>iPhone:</strong> in Safari, tap Share → Add to Home Screen.
        </p>
        <p>
          <strong style={{ color: 'var(--navy)' }}>Android:</strong> in Chrome, tap ⋮ → Add to home screen / Install app.
        </p>
        <p className="text-xs text-[#8a8378]">Do it from any ARK Iowa admin screen. You stay signed in.</p>
      </div>
    </Section>
  );
}

export default function TypeSettings({
  vapidPublicKey = null,
  busyStaff = null,
  allStaff = [],
  types,
  periods,
  semesters,
  templates,
  staff,
}: {
  types: TypeOption[];
  periods: SchoolPeriod[];
  semesters: Semester[];
  templates: ChecklistTemplate[];
  staff: { id: string; name: string }[];
  vapidPublicKey?: string | null; // null = push not configured on the server
  busyStaff?: string | null; // whose booking slots synced events block
  allStaff?: { id: string; name: string; active: boolean }[];
}) {
  const { call, busy, error } = useCall();
  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
        Settings
      </h1>
      <p className="text-sm text-[#8a8378] mb-8">
        Notifications on this phone or laptop, then the lists the rest of the admin picks from.
      </p>

      {/* What you came here to change on a new device, open and first. */}
      <PushToggle vapidPublicKey={vapidPublicKey} />
      <InstallCard />

      {/* Everything else is set-and-forget: named, closed, in the order you'd
          reach for them across a year. */}
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>
        Lists the admin uses
      </h2>
      <ErrorBox error={error} />

      <Disclosure title="Google Calendar" hint="Whether a synced study blocks your booking slots">
        <CalendarBusy staff={allStaff} current={busyStaff} />
      </Disclosure>

      <Disclosure title="Semesters" hint="Term dates, and when signup opens for the next one">
        <SemesterSettings semesters={semesters} embedded />
      </Disclosure>

      <Disclosure title="School calendar" hint="Breaks and finals — the weeks in-person studies pause">
        <SchoolCalendarSettings periods={periods} embedded />
      </Disclosure>

      <Disclosure
        title="Event checklists"
        hint={`Reusable prep lists for events${templates.length ? ` · ${templates.length} saved` : ''}`}
      >
        <ChecklistSettings
          templates={templates}
          staff={staff}
          eventTypes={types.filter((t) => t.kind === 'event' && t.active).map((t) => ({ id: t.id, name: t.name }))}
          embedded
        />
      </Disclosure>

      <Disclosure
        title="Task and event types"
        hint={`The labels you pick from when making one · ${types.filter((t) => t.active).length} in use`}
      >
        <div className="grid md:grid-cols-2 gap-8">
          {(['event', 'task'] as const).map((kind) => (
            <div key={kind}>
              <p className="text-sm font-bold mb-2" style={{ color: 'var(--navy)' }}>
                {kind === 'event' ? 'Event types' : 'Task types'}
              </p>
              <ul className="space-y-2 mb-3">
                {types
                  .filter((t) => t.kind === kind)
                  .map((t) => (
                    <TypeRow key={t.id} t={t} busy={busy} call={call} />
                  ))}
              </ul>
              <NewType kind={kind} busy={busy} call={call} />
            </div>
          ))}
        </div>
      </Disclosure>
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
