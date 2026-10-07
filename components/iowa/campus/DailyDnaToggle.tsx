'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// "Show in Daily DNA" on one campus event (migration 041). On = everyone at ARK Iowa (or just the guest list) on
// Daily DNA sees it, with the Join card and reminders. Works on Google-owned events too.
export function DailyDnaToggle({ eventId, on: initial }: { eventId: string; on: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function flip() {
    const next = !on;
    setBusy(true); setNote(null); setOn(next);
    const res = await fetch(`/api/iowa/admin/events/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ show_in_daily_dna: next }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setOn(!next); setNote(body.error ?? 'That didn’t save.'); return; }
    if (body.warning) { setNote(body.warning); setOn(!!body.event?.show_in_daily_dna && !/isn’t showing/.test(body.warning)); }
    router.refresh();
  }

  return (
    <div className="mb-3 rounded-md border border-gray-200 bg-white px-3 py-2">
      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={on} disabled={busy} onChange={() => void flip()} />
        <span><strong>Show in Daily DNA</strong> <span className="text-gray-500">· with a Join button. Everyone at ARK Iowa sees it, or only the guest list if it has one</span></span>
      </label>
      {note && <p className="mt-1 text-xs" style={{ color: '#9d5a1e' }}>{note}</p>}
    </div>
  );
}
