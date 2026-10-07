'use client';

import { useCallback, useEffect, useState } from 'react';
import { DailyDnaLink } from '@/components/iowa/DailyDnaLink';

// "Link Daily DNA" on a staff member (migration 042). Linked staff see guest-list events they're on the
// team for. A student who became an intern gets their student record's account offered as one tap.
type State = { linked: { id: string; name: string | null } | null; suggestion: { id: string; name: string } | null };

export function StaffDailyDnaLink({ staffId, name }: { staffId: string; name: string }) {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    const res = await fetch(`/api/iowa/admin/staff/${staffId}/daily-dna`);
    const body = await res.json().catch(() => ({}));
    if (res.ok) setS(body as State); else setErr(body.error ?? null);
  }, [staffId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state is set after the await
  useEffect(() => { void load(); }, [load]);
  if (err) return <p className="mt-2 text-xs text-[#8a8378]">Daily DNA: {err}</p>;
  if (!s) return null;
  return (
    <DailyDnaLink
      linked={!!s.linked}
      linkedName={s.linked?.name ?? null}
      studentName={name}
      saveUrl={`/api/iowa/admin/staff/${staffId}/daily-dna`}
      suggestion={s.suggestion}
      onSaved={() => void load()}
      unlinkNote={`Unlink ${name} from Daily DNA? Events they're on the team for leave their app (unless they're also a guest).`}
    />
  );
}
