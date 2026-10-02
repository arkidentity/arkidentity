'use client';

import type { StudyMember, StudyWithMembers } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';
import type { CallFn } from '@/components/iowa/campus/ui';

// Put a student in another study as well — they keep the seat they have. Lists
// live studies they aren't already in; full ones show but can't be picked.
export function AlsoAddSelect({
  m,
  studyId,
  others,
  busy,
  call,
  onDone,
  className,
}: {
  m: StudyMember;
  studyId: string;
  others: StudyWithMembers[];
  busy: boolean;
  call: CallFn;
  onDone: () => void;
  className: string;
}) {
  const options = others.filter(
    (o) =>
      o.id !== studyId &&
      ['pending_setup', 'forming', 'full', 'activated'].includes(o.status) &&
      !o.members.some((x) => x.status === 'active' && x.contact_id === m.contact_id)
  );
  return (
    <select
      defaultValue=""
      disabled={busy}
      onChange={async (e) => {
        if (e.target.value && (await call('/api/iowa/admin/members', 'POST', { studyId: e.target.value, contactId: m.contact_id }))) onDone();
      }}
      className={className}
    >
      <option value="">{options.length ? `Also add ${m.name.split(' ')[0]} to…` : 'No other open studies'}</option>
      {options.map((o) => {
        const full = o.activeCount >= o.capacity;
        return (
          <option key={o.id} value={o.id} disabled={full}>
            {DAY_NAMES[o.day_of_week]} {formatTime(o.start_time)}
            {o.location ? ` · ${o.location}` : ''} ({o.activeCount}/{o.capacity}){full ? ' · full' : ''}
          </option>
        );
      })}
    </select>
  );
}
