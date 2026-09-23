'use client';

import { useState } from 'react';
import { Section, useCall, type StaffOption } from '@/components/iowa/campus/ui';

// Whose booking slots the synced events block (migration 028). Google's
// free/busy flag belongs to the event, not the viewer, and the ARK Campus
// calendar is shared — so this is one person, not a per-person setting.
export default function CalendarBusy({
  staff,
  current,
}: {
  staff: StaffOption[];
  current: string | null;
}) {
  const { call, busy, error } = useCall();
  const [value, setValue] = useState(current ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <Section title="Whose time do these block?">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-[#4a4540] space-y-3">
        <p>
          Studies and events the admin puts on the shared calendar are marked <strong>busy</strong> for this person —
          but only the ones that are actually theirs: a study they&apos;re on point for, an event they&apos;ve accepted.
          Everything else shows up without blocking time, so a booking link stays open during a study someone else leads.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
          >
            <option value="">Nobody — everything shows as free</option>
            {staff
              .filter((p) => p.active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <button
            disabled={busy || value === (current ?? '')}
            onClick={async () => {
              if (await call('/api/iowa/admin/calendar-sync', 'POST', { busyStaffId: value || null })) setSaved(true);
            }}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Save
          </button>
          {saved && <span className="text-xs font-semibold text-green-700">Saved — rewriting the calendar now.</span>}
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <p className="text-xs text-[#8a8378]">
          Changing this rewrites every event the app owns, which takes a minute. Events created in Google keep whatever
          you set there.
        </p>
      </div>
    </Section>
  );
}
