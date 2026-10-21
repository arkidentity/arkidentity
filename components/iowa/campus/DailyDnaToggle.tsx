'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// "Show in Daily DNA" on one campus event (migration 041). On = everyone at ARK Iowa (or just the guest list) on
// Daily DNA sees it, with the Join card and reminders. Works on Google-owned events too.
// Migration 045: an optional sign-up link goes with it ("Sign up" in Daily DNA, opened inside the app).
// Migration 046: a short description students read there (Notes stay for the team).
export function DailyDnaToggle({ eventId, on: initial, signupUrl, description }: { eventId: string; on: boolean; signupUrl?: string | null; description?: string | null }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [signup, setSignup] = useState(signupUrl ?? '');
  const [savedSignup, setSavedSignup] = useState(signupUrl ?? '');
  const [desc, setDesc] = useState(description ?? '');
  const [savedDesc, setSavedDesc] = useState(description ?? '');
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

  async function saveSignup() {
    if (signup.trim() === savedSignup.trim()) return;
    setBusy(true); setNote(null);
    const res = await fetch(`/api/iowa/admin/events/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signup_url: signup }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setNote(body.error ?? 'That didn’t save.'); return; }
    const url = body.event?.signup_url ?? '';
    setSignup(url); setSavedSignup(url);
    setNote(body.warning ?? (url ? 'Sign-up link saved.' : 'Sign-up link removed.'));
    router.refresh();
  }

  async function saveDesc() {
    if (desc.trim() === savedDesc.trim()) return;
    setBusy(true); setNote(null);
    const res = await fetch(`/api/iowa/admin/events/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily_dna_description: desc }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setNote(body.error ?? 'That didn’t save.'); return; }
    const v = body.event?.daily_dna_description ?? '';
    setDesc(v); setSavedDesc(v);
    setNote(body.warning ?? 'Description saved.');
    router.refresh();
  }

  return (
    <div className="mb-3 rounded-md border border-gray-200 bg-white px-3 py-2">
      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={on} disabled={busy} onChange={() => void flip()} />
        <span><strong>Show in Daily DNA</strong> <span className="text-gray-500">· with a Join button. Everyone at ARK Iowa sees it, or only the guest list if it has one</span></span>
      </label>
      {on && (
        <label className="mt-2 block text-xs text-gray-600">
          Description <span className="text-gray-400">(what students read in Daily DNA · Notes stay for the team)</span>
          <textarea
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
            rows={3} maxLength={600} value={desc} disabled={busy}
            placeholder="Two boxes, one question, real conversations about Jesus. Come for a 2-hour slot; no experience needed."
            onChange={(e) => setDesc(e.target.value)} onBlur={() => void saveDesc()}
          />
        </label>
      )}
      {on && (
        <label className="mt-2 block text-xs text-gray-600">
          Sign-up link <span className="text-gray-400">(optional · shows a Sign up button that opens inside Daily DNA)</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-800"
            value={signup} disabled={busy} inputMode="url" placeholder="https://arkidentity.com/iowa/trick-or-truth"
            onChange={(e) => setSignup(e.target.value)} onBlur={() => void saveSignup()}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        </label>
      )}
      {note && <p className="mt-1 text-xs" style={{ color: '#9d5a1e' }}>{note}</p>}
    </div>
  );
}
