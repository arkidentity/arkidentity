'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PendingInvite } from '@/lib/eventInvites';
import DeclineForm from '@/components/iowa/DeclineForm';

// Top of the dashboard: invites waiting on the signed-in person.
export default function PendingInvites({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [declining, setDeclining] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (invites.length === 0) return null;

  async function accept(api: string) {
    setBusy(true);
    await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'accepted' }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="font-bold text-amber-900 mb-2">Needs your answer ({invites.length})</p>
      <ul className="space-y-3">
        {invites.map((i) => (
          <li key={i.key} className="rounded-md bg-white border border-amber-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold" style={{ color: 'var(--navy)' }}>{i.title}</span>
                <span className="block text-sm text-[#8a8378]">
                  {i.when}
                  {i.where ? ` · ${i.where}` : ''}
                  {i.invited_by ? ` · from ${i.invited_by.split(' ')[0]}` : ''}
                </span>
              </span>
              <span className="flex gap-2">
                <button disabled={busy} onClick={() => accept(i.respond_api)} className="px-3 py-1.5 rounded-md text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#15803d' }}>
                  I’m in
                </button>
                <button onClick={() => setDeclining(declining === i.key ? null : i.key)} className="px-3 py-1.5 rounded-md text-sm font-semibold border border-gray-300" style={{ color: '#b91c1c' }}>
                  Can’t do it
                </button>
              </span>
            </div>
            {declining === i.key && (
              <div className="mt-2">
                <DeclineForm endpoint={i.respond_api} compact onDone={() => router.refresh()} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
